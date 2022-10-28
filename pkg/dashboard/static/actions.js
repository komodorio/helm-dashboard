$("#btnUpgradeCheck").click(function () {
    const self = $(this)
    self.find(".bi-repeat").hide()
    self.find(".spinner-border").show()
    const repoName = self.data("repo")
    $("#btnUpgrade span").text("Checking...")
    $("#btnUpgrade .icon").removeClass("bi-arrow-up bi-pencil").addClass("bi-hourglass-split")
    $.post("/api/helm/repo/update?name=" + repoName).fail(function (xhr) {
        reportError("Failed to update chart repo", xhr)
    }).done(function () {
        self.find(".spinner-border").hide()
        self.find(".bi-repeat").show()

        checkUpgradeable(self.data("chart"))
        $("#btnUpgradeCheck").prop("disabled", true)
    })
})


function checkUpgradeable(name) {
    $.getJSON("/api/helm/repo/search?name=" + name).fail(function (xhr) {
        reportError("Failed to find chart in repo", xhr)
    }).done(function (data) {
        if (!data || !data.length) {
            $("#btnUpgrade span").text("No upgrades")
            $("#btnUpgrade .icon").removeClass("bi-hourglass-split").addClass("bi-x-octagon")
            $("#btnUpgrade").prop("disabled", true)
            $("#btnUpgradeCheck").prop("disabled", true)
            $("#btnAddRepository").text("Add repository for it")
            return
        }

        $("#btnUpgradeCheck").text("Check for new version")
        const verCur = $("#specRev").data("last-chart-ver");
        const elm = data[0]
        $("#btnUpgradeCheck").data("repo", elm.name.split('/').shift())
        $("#btnUpgradeCheck").data("chart", elm.name.split('/').pop())

        const canUpgrade = isNewerVersion(verCur, elm.version);
        $("#btnUpgradeCheck").prop("disabled", false)
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

    $('#upgradeModal').data("chart", elm.name).data("initial", !verCur)

    $("#upgradeModalLabel .name").text(elm.name)

    if (verCur) {
        $("#upgradeModal .ver-old").show().find("span").text(verCur)
        $("#upgradeModal .rel-name").prop("disabled", true).val(name)
        $("#upgradeModal .rel-ns").prop("disabled", true).val(ns)
    } else {
        $("#upgradeModal .ver-old").hide()
        $("#upgradeModal .rel-name").prop("disabled", false).val(elm.name.split("/").pop())
        $("#upgradeModal .rel-ns").prop("disabled", false).val("")
    }

    $.getJSON("/api/helm/repo/search?name=" + elm.name).fail(function (xhr) {
        reportError("Failed to find chart in repo", xhr)
    }).done(function (vers) {
        // fill versions
        $('#upgradeModal select').empty()
        for (let i = 0; i < vers.length; i++) {
            const opt = $("<option value='" + vers[i].version + "'></option>");
            if (vers[i].version === verCur) {
                opt.html(vers[i].version + " &middot;")
            } else {
                opt.html(vers[i].version)
            }
            $('#upgradeModal select').append(opt)
        }

        $('#upgradeModal select').val(elm.version).trigger("change")

        const myModal = new bootstrap.Modal(document.getElementById('upgradeModal'), {});
        myModal.show()

        if (verCur) {
            // fill current values
            $.get("/api/helm/charts/values?namespace=" + ns + "&revision=" + lastRev + "&name=" + name + "&flag=true").fail(function (xhr) {
                reportError("Failed to get charts values info", xhr)
            }).done(function (data) {
                $("#upgradeModal textarea").val(data).data("dirty", false)
            })
        } else {
            $("#upgradeModal textarea").val("").data("dirty", true)
        }
    })
}

$("#upgradeModal .btn-confirm").click(function () {
    const btnConfirm = $("#upgradeModal .btn-confirm")
    btnConfirm.prop("disabled", true).prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $.ajax({
        type: 'POST',
        url: "/api/helm/charts/install" + upgradeModalQstr() + "&flag=true",
        data: $("#upgradeModal textarea").data("dirty") ? $("#upgradeModal form").serialize() : null,
    }).fail(function (xhr) {
        reportError("Failed to upgrade the chart", xhr)
    }).done(function (data) {
        if (data.version) {
            setHashParam("section", null)
            const ns = $("#upgradeModal .rel-ns").val();
            setHashParam("namespace", ns ? ns : "default")
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
    reconfigTimeout = window.setTimeout(function () {
        requestChangeDiff()
    }, 500)
}

$("#upgradeModal textarea").keyup(changeTimer)
$("#upgradeModal .rel-name").keyup(changeTimer)
$("#upgradeModal .rel-ns").keyup(changeTimer)

$('#upgradeModal select').change(function () {
    const self = $(this)

    requestChangeDiff()

    // fill reference values
    $("#upgradeModal .ref-vals").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $.get("/api/helm/repo/values?chart=" + $("#upgradeModal").data("chart") + "&version=" + self.val()).fail(function (xhr) {
        reportError("Failed to get upgrade info", xhr)
    }).done(function (data) {
        data = hljs.highlight(data, {language: 'yaml'}).value
        $("#upgradeModal .ref-vals").html(data)
    })
})

$('#upgradeModal .btn-scan').click(function () {
    const self = $(this)

    self.prop("disabled", true).prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $.ajax({
        type: "POST",
        url: "/api/scanners/manifests" + upgradeModalQstr(),
        data: $("#upgradeModal form").serialize(),
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

            const pre = $("<pre></pre>").text(res.OrigReport)

            container.append("<h2>" + name + " Scan Results</h2>")
            container.append(pre)
        }

        const tab = window.open('about:blank', '_blank');
        tab.document.write(container.prop('outerHTML')); // where 'html' is a variable containing your HTML
        tab.document.close(); // to finish loading the page
    })
})

function requestChangeDiff() {
    const self = $('#upgradeModal select');
    const diffBody = $("#upgradeModalBody");
    diffBody.empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Calculating diff...')
    $("#upgradeModal .btn-confirm").prop("disabled", true)

    let values = null;
    if ($("#upgradeModal textarea").data("dirty")) {
        $("#upgradeModal .invalid-feedback").hide()
        values = $("#upgradeModal form").serialize()

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
        url: "/api/helm/charts/install" + upgradeModalQstr(),
        data: values,
    }).fail(function (xhr) {
        $("#upgradeModalBody").html("<p class='text-danger'>Failed to get upgrade info:     " + xhr.responseText + "</p>")
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
}

function upgradeModalQstr() {
    let qstr = "?" +
        "namespace=" + $("#upgradeModal .rel-ns").val() +
        "&name=" + $("#upgradeModal .rel-name").val() +
        "&chart=" + $("#upgradeModal").data("chart") +
        "&version=" + $('#upgradeModal select').val()

    if ($("#upgradeModal").data("initial")) {
        qstr += "&initial=true"
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
        const url = "/api/helm/charts?namespace=" + namespace + "&name=" + chart;
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

    let qstr = "name=" + chart + "&namespace=" + namespace + "&revision=" + revision
    let url = "/api/helm/charts/resources"
    url += "?" + qstr
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
        const url = "/api/helm/charts/rollback?namespace=" + namespace + "&name=" + chart + "&revision=" + revisionNew;
        $.ajax({
            url: url,
            type: 'POST',
        }).fail(function (xhr) {
            reportError("Failed to rollback the chart", xhr)
        }).done(function () {
            window.location.reload()
        })
    })

    const myModal = new bootstrap.Modal(document.getElementById('confirmModal'), {});
    myModal.show()

    let qstr = "name=" + chart + "&namespace=" + namespace + "&revision=" + revisionNew + "&revisionDiff=" + revisionCur
    let url = "/api/helm/charts/manifests"
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