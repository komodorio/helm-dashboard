$("#btnUpgradeCheck").click(function () {
    const self = $(this)
    self.find(".bi-repeat").hide()
    self.find(".spinner-border").show()
    const repoName = self.data("repo")
    $("#btnUpgrade span").text("Checking...")
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
            $("#btnUpgrade span").text("Upgrade to " + elm.version)
        } else {
            $("#btnUpgrade span").text("No upgrades")
        }

        $("#btnUpgrade").off("click").click(function () {
            popUpUpgrade($(this), verCur, elm)
        })
    })
}

function popUpUpgrade(self, verCur, elm) {
    const name = getHashParam("chart");
    let url = "/api/helm/charts/install?namespace=" + getHashParam("namespace") + "&name=" + name + "&chart=" + elm.name;
    $('#upgradeModalLabel select').data("url", url)

    $("#upgradeModalLabel .name").text(name)
    $("#upgradeModalLabel .ver-old").text(verCur)

    $('#upgradeModalLabel select').val(elm.version).trigger("change")

    const myModal = new bootstrap.Offcanvas(document.getElementById('upgradeModal'), {});
    myModal.show()

    const btnConfirm = $("#upgradeModal .btn-confirm");
    btnConfirm.prop("disabled", true).off('click').click(function () {
        console.log("working")
        btnConfirm.prop("disabled", true).prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
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

$('#upgradeModalLabel select').change(function () {
    const self = $(this)

    $("#upgradeModalBody").empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $("#upgradeModal .btn-confirm").prop("disabled", true)
    $.get(self.data("url") + "&version=" + self.val()).fail(function (xhr) {
        reportError("Failed to get upgrade info", xhr)
    }).done(function (data) {
        $("#upgradeModalBody").empty();
        $("#upgradeModal .btn-confirm").prop("disabled", false)

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

    const myModal = new bootstrap.Offcanvas(document.getElementById('confirmModal'));
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

    const myModal = new bootstrap.Offcanvas(document.getElementById('confirmModal'), {});
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

