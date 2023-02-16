$("#btnUpgradeCheck").click(function () {
    const self = $(this)
    self.find(".bi-repeat").hide()
    self.find(".spinner-border").show()
    const repoName = self.data("repo")
    $("#btnUpgrade span").text("Checking...")
    $("#btnUpgrade .icon").removeClass("bi-arrow-up bi-pencil").addClass("bi-hourglass-split")
    $.post("/api/helm/repositories/" + repoName).fail(function (xhr) {
        reportError("Failed to update chart repo", xhr)
    }).done(function () {
        self.find(".spinner-border").hide()
        self.find(".bi-repeat").show()

        checkUpgradeable(self.data("chart"))
        $("#btnUpgradeCheck").prop("disabled", true)
    })
})

function checkUpgradeable(name) {
    $.getJSON("/api/helm/repositories/latestver?name=" + name).fail(function (xhr) {
        reportError("Failed to find chart in repo", xhr)
    }).done(function (data) {
        let elm = {name: "", version: "0"}
        const btnUpgradeCheck = $("#btnUpgradeCheck");
        if (!data || !data.length) {
            btnUpgradeCheck.prop("disabled", true)
            btnUpgradeCheck.text("")
            $("#btnAddRepository").text("Add repository for it")
        } else {
            $("#btnAddRepository").text("")
            btnUpgradeCheck.text("Check for new version")
            elm = data[0]
        }

        $("#btnUpgrade .icon").removeClass("bi-arrow-up bi-pencil").addClass("bi-hourglass-split")
        const verCur = $("#specRev").data("last-chart-ver");
        btnUpgradeCheck.data("repo", elm.repository)
        btnUpgradeCheck.data("chart", elm.name)

        const canUpgrade = isNewerVersion(verCur, elm.version);
        btnUpgradeCheck.prop("disabled", false)
        if (canUpgrade) {
            $("#btnUpgrade span").text("Upgrade to " + elm.version)
            $("#btnUpgrade .icon").removeClass("bi-hourglass-split").addClass("bi-arrow-up")
        } else {
            $("#btnUpgrade span").text("Reconfigure")
            $("#btnUpgrade .icon").removeClass("bi-hourglass-split").addClass("bi-pencil")
        }

        $("#btnUpgrade").off("click").click(function () {
            popUpUpgrade(elm, getHashParam("namespace"), getHashParam("chart"), verCur, $("#specRev").data("last-rev"))
        })
    })
}

function popUpUpgrade(elm, ns, name, verCur, lastRev) {
    $("#upgradeModal .btn-confirm").prop("disabled", true)

    $('#upgradeModal').data("initial", !verCur)
    $('#upgradeModal').data("newManifest", "")

    $("#upgradeModalLabel .name").text(elm.name)

    $("#upgradeModal .rel-cluster").text(getHashParam("context"))

    if (verCur) {
        $("#upgradeModalLabel .type").text("Upgrade")
        $("#upgradeModal .ver-old").show().find("span").text(verCur)
        $("#upgradeModal .rel-name").prop("disabled", true).val(name)
        $("#upgradeModal .rel-ns").prop("disabled", true).val(ns)

        $.get("/api/helm/releases/" + ns + "/" + name + "/manifests").fail(function (xhr) {
            reportError("Failed to get current manifest", xhr)
        }).done(function (text) {
            $('#upgradeModal').data("curManifest", text)
        })

    } else {
        $("#upgradeModalLabel .type").text("Install")
        $("#upgradeModal .ver-old").hide()
        $("#upgradeModal .rel-name").prop("disabled", false).val(elm.name.split("/").pop())
        $("#upgradeModal .rel-ns").prop("disabled", false).val(ns)
        $('#upgradeModal').data("curManifest", "")
    }

    if (elm.name) {
        $.getJSON("/api/helm/repositories/versions?name=" + elm.name).fail(function (xhr) {
            reportError("Failed to find chart in repo", xhr)
        }).done(function (vers) {
            vers.sort((b, a) => (a.version > b.version) - (a.version < b.version))

            // fill versions
            $('#upgradeModal select').empty()
            for (let i = 0; i < vers.length; i++) {
                const opt = $("<option value='" + vers[i].version + "'></option>").data("ver", vers[i]);
                const label = vers[i].repository + " @ " + vers[i].version;
                if (vers[i].version === verCur) {
                    opt.html(label + " ✓")
                } else {
                    opt.html(label)
                }
                $('#upgradeModal select').append(opt)
            }

            $('#upgradeModal select').val(elm.version).trigger("change").parent().show()
            upgrPopUpCommon(verCur, ns, lastRev, name)
        })
    } else { // chart without repo reconfigure
        $('#upgradeModal select').empty().trigger("change").parent().hide()
        upgrPopUpCommon(verCur, ns, lastRev, name)
    }
}

function upgrPopUpCommon(verCur, ns, lastRev, name) {
    const myModal = new bootstrap.Modal(document.getElementById('upgradeModal'), {});
    myModal.show()

    if (verCur) {
        // fill current values
        $.get("/api/helm/releases/" + ns + "/" + name + "/values?userDefined=true&revision=" + lastRev).fail(function (xhr) {
            reportError("Failed to get charts values info", xhr)
        }).done(function (data) {
            $("#upgradeModal textarea").val(data).data("dirty", false)
        })
    } else {
        $("#upgradeModal textarea").val("").data("dirty", true)
    }
}

$("#upgradeModal .btn-confirm").click(function () {
    const btnConfirm = $("#upgradeModal .btn-confirm")
    btnConfirm.prop("disabled", true).prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $('#upgradeModal form .preview-mode').val("false")
    $.ajax({
        type: 'POST',
        url: upgradeModalURL(),
        data: $("#upgradeModal form").serialize(),
    }).fail(function (xhr) {
        reportError("Failed to upgrade the chart", xhr)
    }).done(function (data) {
        if (data.version) {
            setHashParam("section", null)
            const ns = $("#upgradeModal .rel-ns").val();
            setHashParam("namespace", ns ? ns : "default") // TODO: relaets issue #51
            setHashParam("chart", $("#upgradeModal .rel-name").val())
            setHashParam("revision", data.version)
            window.location.reload()
        } else {
            reportError("Failed to get new revision number")
        }
    })
})

let reconfigTimeout = null;

function changeTimer() {
    const self = $(this);
    self.data("dirty", true)
    if (reconfigTimeout) {
        window.clearTimeout(reconfigTimeout)
    }
    reconfigTimeout = window.setTimeout(requestChangeDiff, 500)
}

$("#upgradeModal textarea").keyup(changeTimer)
$("#upgradeModal .rel-name").keyup(changeTimer)
$("#upgradeModal .rel-ns").keyup(changeTimer)

$('#upgradeModal select').change(function () {
    const self = $(this)
    const ver = self.find("option:selected").data("ver");

    let chart = ""
    if (ver) {
        chart = ver.repository + "/" + ver.name;
        // local chart case
        if (ver.urls && ver.urls.length && ver.urls[0].startsWith("file://")) {
            chart = ver.urls[0];
        }
    }

    $('#upgradeModal').data("chart", chart)
    $('#upgradeModal form .chart-name').val(chart)

    requestChangeDiff()

    // fill reference values
    $("#upgradeModal .ref-vals").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')

    // TODO: if chart is empty, query different URL that will restore values without repo
    if (chart) {
        $.get("/api/helm/repositories/values?chart=" + chart + "&version=" + self.val()).fail(function (xhr) {
            reportError("Failed to get upgrade info", xhr)
        }).done(function (data) {
            data = hljs.highlight(data, {language: 'yaml'}).value
            $("#upgradeModal .ref-vals").html(data)
        })
    } else {
        $("#upgradeModal .ref-vals").html("No original values information found")
    }
})

$('#upgradeModal .btn-scan').click(function () {
    const self = $(this)

    self.prop("disabled", true).prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')

    const form = new FormData();
    form.append('manifest', $('#upgradeModal').data("newManifest"));
    $.ajax({
        type: "POST",
        url: "/api/scanners/manifests",
        processData: false,
        contentType: false,
        data: form,
    }).fail(function (xhr) {
        reportError("Failed to scan the manifest", xhr)
    }).done(function (data) {
        self.prop("disabled", false).find(".spinner-border").hide()

        const container = $("<div></div>")
        for (let name in data) {
            const res = data[name]

            if (!res) {
                continue
            }

            const pre = $("<pre></pre>").text(JSON.stringify(res.OrigReport, null, 2))

            container.append("<h2>" + name + " Scan Results</h2>")
            container.append(pre)
        }

        const tab = window.open('about:blank', '_blank');
        tab.document.write(container.prop('outerHTML')); // where 'html' is a variable containing your HTML
        tab.document.close(); // to finish loading the page
    })
})

function requestChangeDiff() {
    const diffBody = $("#upgradeModalBody");
    diffBody.empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Calculating diff...')
    $("#upgradeModal .btn-confirm").prop("disabled", true)

    $('#upgradeModal form .preview-mode').val("true")
    let form = $("#upgradeModal form").serialize();
    if ($("#upgradeModal textarea").data("dirty")) {
        $("#upgradeModal .invalid-feedback").hide()

        try {
            jsyaml.load($("#upgradeModal textarea").val())
        } catch (e) {
            $("#upgradeModal .invalid-feedback").text("YAML parse error: " + e.message).show()
            $("#upgradeModalBody").html("Invalid values YAML")
            return
        }
    }

    $.ajax({
        type: "POST",
        url: upgradeModalURL(),
        data: form,
    }).fail(function (xhr) {
        $("#upgradeModalBody").html("<p class='text-danger'>Failed to get upgrade info: " + xhr.responseText + "</p>")
    }).done(function (data) {
        $('#upgradeModal').data("newManifest", data.manifest)

        const form = new FormData();
        form.append('a', $('#upgradeModal').data("curManifest"));
        form.append('b', data.manifest);

        $.ajax({
            type: "POST",
            url: "/diff",
            processData: false,
            contentType: false,
            data: form,
        }).fail(function (xhr) {
            $("#upgradeModalBody").html("<p class='text-danger'>Failed to get upgrade info: " + xhr.responseText + "</p>")
        }).done(function (data) {
            diffBody.empty();
            $("#upgradeModal .btn-confirm").prop("disabled", false)

            const targetElement = document.getElementById('upgradeModalBody');
            const configuration = {
                inputFormat: 'diff', outputFormat: 'side-by-side',
                drawFileList: false, showFiles: false, highlight: true,
            };
            const diff2htmlUi = new Diff2HtmlUI(targetElement, data, configuration);
            diff2htmlUi.draw()
            if (!data) {
                diffBody.html("No changes will happen to the cluster")
            }
        })
    })
}

function upgradeModalURL() {
    let ns = $("#upgradeModal .rel-ns").val();
    if (!ns) {
        ns = "[empty]"
    }

    let qstr = "/api/helm/releases/" + ns;
    if (!$("#upgradeModal").data("initial")) {
        qstr += "/" + $("#upgradeModal .rel-name").val()
    }

    return qstr
}

const btnConfirm = $("#confirmModal .btn-confirm");
$("#btnUninstall").click(function () {
    const chart = getHashParam('chart');
    const namespace = getHashParam('namespace');
    const revision = $("#specRev").data("last-rev")
    $("#confirmModalLabel").html("Uninstall <b class='text-danger'>" + chart + "</b> from namespace <b class='text-danger'>" + namespace + "</b>")
    $("#confirmModalBody").empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    btnConfirm.prop("disabled", true).off('click').click(function () {
        btnConfirm.prop("disabled", true).append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
        const url = "/api/helm/releases/" + namespace + "/" + chart;
        $.ajax({
            url: url,
            type: 'DELETE',
        }).fail(function (xhr) {
            reportError("Failed to delete the chart", xhr)
        }).done(function () {
            window.location.href = "/"
        })
    })

    const myModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    myModal.show()

    let url = "/api/helm/releases/" + namespace + "/" + chart + "/resources"
    $.getJSON(url).fail(function (xhr) {
        reportError("Failed to get list of resources", xhr)
    }).done(function (data) {
        $("#confirmModalBody").empty().append("<p>Following resources will be deleted from the cluster:</p>");
        btnConfirm.prop("disabled", false)
        for (let i = 0; i < data.length; i++) {
            const res = data[i]
            $("#confirmModalBody").append("<p class='row'><i class='col-sm-3 text-end'>" + res.kind + "</i><b class='col-sm-9'>" + res.metadata.name + "</b></p>")
        }
    })
})

$("#btnRollback").click(function () {
    const chart = getHashParam('chart');
    const namespace = getHashParam('namespace');
    const revisionNew = $("#btnRollback").data("rev")
    const revisionCur = $("#specRev").data("last-rev")
    $("#confirmModalLabel").html("Rollback <b class='text-danger'>" + chart + "</b> from revision " + revisionCur + " to " + revisionNew)
    $("#confirmModalBody").empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    btnConfirm.prop("disabled", true).off('click').click(function () {
        btnConfirm.prop("disabled", true).append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
        const url = "/api/helm/releases/" + namespace + "/" + chart + "/rollback";
        $.ajax({
            url: url,
            type: 'POST',
            data: {
                revision: revisionNew
            }
        }).fail(function (xhr) {
            reportError("Failed to rollback the chart", xhr)
        }).done(function () {
            window.location.reload()
        })
    })

    const myModal = new bootstrap.Modal(document.getElementById('confirmModal'), {});
    myModal.show()

    let qstr = "revision=" + revisionNew + "&revisionDiff=" + revisionCur
    let url = "/api/helm/releases/" + namespace + "/" + chart + "/manifests"
    url += "?" + qstr
    $.get(url).fail(function (xhr) {
        reportError("Failed to get list of resources", xhr)
    }).done(function (data) {
        $("#confirmModalBody").empty();
        $("#confirmModal .btn-confirm").prop("disabled", false)

        const targetElement = document.getElementById('confirmModalBody');
        const configuration = {
            inputFormat: 'diff', outputFormat: 'side-by-side',
            drawFileList: false, showFiles: false, highlight: true,
        };
        const diff2htmlUi = new Diff2HtmlUI(targetElement, data, configuration);
        diff2htmlUi.draw()
        if (data) {
            $("#confirmModalBody").prepend("<p>Following changes will happen to cluster:</p>")
        } else {
            $("#confirmModalBody").html("<p>No changes will happen to cluster</p>")
        }
    })
})

$("#btnAddRepository").click(function () {
    setHashParam("section", "repository")
    window.location.reload()
})

$("#btnTest").click(function () {
    const myModal = new bootstrap.Modal(document.getElementById('testModal'), {});
    $("#testModal .test-result").empty().prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Waiting for completion...')
    myModal.show()
    $.ajax({
        type: 'POST',
        url: "/api/helm/releases/" + getHashParam("namespace") + "/" + getHashParam("chart") + "/test"
    }).fail(function (xhr) {
        reportError("Failed to execute test for chart", xhr)
        myModal.hide()
    }).done(function (data) {
        var output;
        if (data.length == 0 || data == null || data == "") {
            output = "<div>Tests executed successfully<br><br><pre>Empty response from API<pre></div>"
        } else {
            output = data.replaceAll("\n", "<br>")
        }
        $("#testModal .test-result").empty().html(output)
        myModal.show()
    })
})