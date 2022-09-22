function loadContentWrapper() {
    let revDiff = 0
    const revision = parseInt(getHashParam("revision"));
    if (revision === $("#specRev").data("first-rev")) {
        revDiff = 0
    } else if (getHashParam("mode") === "diff-prev") {
        revDiff = revision - 1
    } else if (getHashParam("mode") === "diff-rev") {
        revDiff = $("#specRev").val()
    }

    const flag = $("#userDefinedVals").prop("checked");
    loadContent(getHashParam("tab"), getHashParam("namespace"), getHashParam("chart"), revision, revDiff, flag)
}

function loadContent(mode, namespace, name, revision, revDiff, flag) {
    let qstr = "name=" + name + "&namespace=" + namespace + "&revision=" + revision
    if (revDiff) {
        qstr += "&revisionDiff=" + revDiff
    }

    if (flag) {
        qstr += "&flag=" + flag
    }

    let url = "/api/helm/charts/" + mode
    url += "?" + qstr
    const diffDisplay = $("#manifestText");
    diffDisplay.empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $.get(url).fail(function (xhr) {
        reportError("Failed to get diff of " + mode, xhr)
    }).done(function (data) {
        diffDisplay.empty();
        if (data === "") {
            diffDisplay.text("No differences to display")
        } else {
            if (revDiff) {
                const targetElement = document.getElementById('manifestText');
                const configuration = {
                    inputFormat: 'diff', outputFormat: 'side-by-side',

                    drawFileList: false, showFiles: false, highlight: true, //matching: 'lines',
                };
                const diff2htmlUi = new Diff2HtmlUI(targetElement, data, configuration);
                diff2htmlUi.draw()
            } else {
                data = hljs.highlight(data, {language: 'yaml'}).value
                const code = $("#manifestText").empty().append("<pre class='bg-white rounded p-3'></pre>").find("pre");
                code.html(data)
            }
        }
    })
}

$('#specRev').keyup(function (event) {
    let keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '13') {
        $("#diffModeRev").click()
    }
    event.preventDefault()
});


$("#userDefinedVals").change(function () {
    const self = $(this)
    const flag = $("#userDefinedVals").prop("checked");
    setHashParam("udv", flag)
    loadContentWrapper()
})

$("#modePanel [data-mode]").click(function () {
    const self = $(this)
    const mode = self.data("mode")
    setHashParam("mode", mode)
    loadContentWrapper()
})

$("#nav-tab [data-tab]").click(function () {
    const self = $(this)
    setHashParam("tab", self.data("tab"))

    if (self.data("tab") === "values") {
        $("#userDefinedVals").parent().show()
    } else {
        $("#userDefinedVals").parent().hide()
    }

    const flag = getHashParam("udv") === "true";
    $("#userDefinedVals").prop("checked", flag)

    if (self.data("tab") === "resources") {
        showResources(getHashParam("namespace"), getHashParam("chart"), getHashParam("revision"))
    } else {
        const mode = getHashParam("mode")
        if (!mode) {
            $("#modePanel [data-mode=view]").trigger('click')
        } else {
            $("#modePanel [data-mode=" + mode + "]").trigger('click')
        }
    }
})

function showResources(namespace, chart, revision) {
    $("#nav-resources").empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
    let qstr = "name=" + chart + "&namespace=" + namespace + "&revision=" + revision
    let url = "/api/helm/charts/resources"
    url += "?" + qstr
    $.getJSON(url).fail(function (xhr) {
        reportError("Failed to get list of resources", xhr)
    }).done(function (data) {
        $("#nav-resources").empty();
        for (let i = 0; i < data.length; i++) {
            const res = data[i]
            const resBlock = $(` 
                <div class="input-group row">
                    <span class="input-group-text col-sm-2"><em class="text-muted small">` + res.kind + `</em></span>
                    <span class="input-group-text col-sm-6">` + res.metadata.name + `</span>
                    <span class="form-control col-sm-4"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> <span class="text-muted small">Getting status...</span></span>
                </div>`)
            $("#nav-resources").append(resBlock)
            let ns = res.metadata.namespace ? res.metadata.namespace : namespace
            $.getJSON("/api/kube/resources/" + res.kind.toLowerCase() + "?name=" + res.metadata.name + "&namespace=" + ns).fail(function () {
                //reportError("Failed to get list of resources")
            }).done(function (data) {
                const badge = $("<span class='badge me-2'></span>").text(data.status.phase);
                if (["Available", "Active", "Established"].includes(data.status.phase)) {
                    badge.addClass("bg-success")
                } else if (["Exists"].includes(data.status.phase)) {
                    badge.addClass("bg-success bg-opacity-50")
                } else if (["Progressing"].includes(data.status.phase)) {
                    badge.addClass("bg-warning")
                } else {
                    badge.addClass("bg-danger")
                }

                const statusBlock = resBlock.find(".form-control.col-sm-4");
                statusBlock.empty().append(badge).append("<span class='text-muted small'>" + (data.status.message ? data.status.message : '') + "</span>")

                if (badge.text() !== "NotFound") {
                    statusBlock.prepend("<i class=\"btn bi-zoom-in float-end text-muted\"></i>")
                    statusBlock.find(".bi-zoom-in").click(function () {
                        showDescribe(ns, res.kind, res.metadata.name)
                    })
                }
            })
        }
    })
}

function showDescribe(ns, kind, name) {
    $("#describeModalLabel").text("Describe " + kind + ": " + ns + " / " + name)
    $("#describeModalBody").empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')

    const myModal = new bootstrap.Modal(document.getElementById('describeModal'), {});
    myModal.show()
    $.get("/api/kube/describe/" + kind.toLowerCase() + "?name=" + name + "&namespace=" + ns).fail(function (xhr) {
        reportError("Failed to describe resource", xhr)
    }).done(function (data) {
        data = hljs.highlight(data, {language: 'yaml'}).value
        $("#describeModalBody").empty().append("<pre class='bg-white rounded p-3'></pre>").find("pre").html(data)
    })
}

$("#btnUninstall").click(function () {
    const chart = getHashParam('chart');
    const namespace = getHashParam('namespace');
    const revision = $("#specRev").data("last-rev")
    $("#confirmModalLabel").html("Uninstall <b class='text-danger'>" + chart + "</b> from namespace <b class='text-danger'>" + namespace + "</b>")
    $("#confirmModalBody").empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $("#confirmModal .btn-primary").prop("disabled", true).off('click').click(function () {
        $("#confirmModal .btn-primary").prop("disabled", true).append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
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

    const myModal = new bootstrap.Modal(document.getElementById('confirmModal'), {});
    myModal.show()

    let qstr = "name=" + chart + "&namespace=" + namespace + "&revision=" + revision
    let url = "/api/helm/charts/resources"
    url += "?" + qstr
    $.getJSON(url).fail(function (xhr) {
        reportError("Failed to get list of resources", xhr)
    }).done(function (data) {
        $("#confirmModalBody").empty().append("<p>Following resources will be deleted from the cluster:</p>");
        $("#confirmModal .btn-primary").prop("disabled", false)
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
    $("#confirmModal .btn-primary").prop("disabled", true).off('click').click(function () {
        $("#confirmModal .btn-primary").prop("disabled", true).append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
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
        $("#confirmModal .btn-primary").prop("disabled", false)

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


$("#btnUpgradeCheck").click(function () {
    const self = $(this)
    self.find(".bi-repeat").hide()
    self.find(".spinner-border").show()
    const repoName = self.data("repo")
    $("#btnUpgrade").text("Checking...")
    $.post("/api/helm/repo/update?name=" + repoName).fail(function (xhr) {
        reportError("Failed to update chart repo", xhr)
    }).done(function () {
        self.find(".spinner-border").hide()
        self.find(".bi-repeat").show()

        checkUpgradeable(self.data("chart"))
        $("#btnUpgradeCheck").prop("disabled", true).find(".fa").removeClass("fa-spin fa-spinner").addClass("fa-times")
    })
})


function checkUpgradeable(name) {
    $.getJSON("/api/helm/repo/search?name=" + name).fail(function (xhr) {
        reportError("Failed to find chart in repo", xhr)
    }).done(function (data) {
        if (!data) {
            return
        }

        $('#upgradeModalLabel select').empty()
        for (let i = 0; i < data.length; i++) {
            $('#upgradeModalLabel select').append("<option value='" + data[i].version + "'>" + data[i].version + "</option>")
        }

        const elm = data[0]
        $("#btnUpgradeCheck").data("repo", elm.name.split('/').shift())
        $("#btnUpgradeCheck").data("chart", elm.name.split('/').pop())

        const verCur = $("#specRev").data("last-chart-ver");
        const canUpgrade = isNewerVersion(verCur, elm.version);
        $("#btnUpgradeCheck").prop("disabled", false)
        if (canUpgrade) {
            $("#btnUpgrade").removeClass("bg-secondary bg-opacity-50").addClass("bg-success").text("Upgrade to " + elm.version)
        } else {
            $("#btnUpgrade").removeClass("bg-success").addClass("bg-secondary bg-opacity-50").text("No upgrades")
        }

        $("#btnUpgrade").off("click").click(function () {
            popUpUpgrade($(this), verCur, elm)
        })
    })
}

$('#upgradeModalLabel select').change(function () {
    const self = $(this)

    $("#upgradeModalBody").empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $("#upgradeModal .btn-success").prop("disabled", true)
    $.get(self.data("url") + "&version=" + self.val()).fail(function (xhr) {
        reportError("Failed to get upgrade", xhr)
    }).done(function (data) {
        $("#upgradeModalBody").empty();
        $("#upgradeModal .btn-success").prop("disabled", false)

        const targetElement = document.getElementById('upgradeModalBody');
        const configuration = {
            inputFormat: 'diff', outputFormat: 'side-by-side',
            drawFileList: false, showFiles: false, highlight: true,
        };
        const diff2htmlUi = new Diff2HtmlUI(targetElement, data, configuration);
        diff2htmlUi.draw()
        $("#upgradeModalBody").prepend("<p>Following changes will happen to cluster:</p>")
        if (!data) {
            $("#upgradeModalBody").html("No changes will happen to cluster")
        }
    })
})

$("#upgradeModal .btn-secondary").click(function () {
    const self = $(this)
    self.find(".fa").removeClass("fa-cloud-download").addClass("fa-spin fa-spinner").prop("disabled", true)
    $("#btnUpgradeCheck").click()
    $("#upgradeModal .btn-close").click()
})

function popUpUpgrade(self, verCur, elm) {
    const name = getHashParam("chart");
    let url = "/api/helm/charts/install?namespace=" + getHashParam("namespace") + "&name=" + name + "&chart=" + elm.name;
    $('#upgradeModalLabel select').data("url", url)

    $("#upgradeModalLabel .name").text(name)
    $("#upgradeModalLabel .ver-old").text(verCur)

    $('#upgradeModalLabel select').val(elm.version).trigger("change")

    const myModal = new bootstrap.Modal(document.getElementById('upgradeModal'), {});
    myModal.show()

    $("#upgradeModal .btn-success").prop("disabled", true).off('click').click(function () {
        $("#upgradeModal .btn-success").prop("disabled", true).prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
        $.ajax({
            url: url + "&version=" + $('#upgradeModalLabel select').val(),
            type: 'POST',
        }).fail(function (xhr) {
            reportError("Failed to upgrade the chart", xhr)
        }).done(function (data) {
            setHashParam("revision", data.version)
            window.location.reload()
        })
    })
}
