function revisionClicked(namespace, name, self) {
    let active = "active border-primary border-1 bg-white";
    let inactive = "border-secondary bg-secondary";
    revRow.find(".active").removeClass(active).addClass(inactive)
    self.removeClass(inactive).addClass(active)
    const elm = self.data("elm")
    console.log(elm)
    setHashParam("revision", elm.revision)
    $("#sectionDetails span.rev").text("#"+elm.revision)
    statusStyle(elm.status, $("#none"), $("#sectionDetails .rev-details .rev-status"))

    $("#sectionDetails .rev-date").text(elm.updated.replace("T", " ").replace("+", " +"))
    $("#sectionDetails .rev-tags .rev-chart").text(elm.chart)
    $("#sectionDetails .rev-tags .rev-app").text(elm.app_version)
    $("#sectionDetails .rev-tags .rev-ns").text(getHashParam("namespace"))

    $("#revDescr").text(elm.description).removeClass("text-danger")
    if (elm.status === "failed") {
        $("#revDescr").addClass("text-danger")
    }

    const rev = $("#specRev").data("last-rev") == elm.revision ? elm.revision - 1 : elm.revision
    if (!rev || getHashParam("revision") === $("#specRev").data("first-rev")) {
        $("#btnRollback").hide()
    } else {
        $("#btnRollback").show().data("rev", rev).find("span").text("Rollback to #" + rev)
    }

    const tab = getHashParam("tab")
    if (!tab) {
        $("#nav-tab [data-tab=resources]").click()
    } else {
        $("#nav-tab [data-tab=" + tab + "]").click()
    }
}


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
    const resBody = $("#nav-resources .body");
    resBody.empty().append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
    let qstr = "name=" + chart + "&namespace=" + namespace + "&revision=" + revision
    let url = "/api/helm/charts/resources"
    url += "?" + qstr
    $.getJSON(url).fail(function (xhr) {
        reportError("Failed to get list of resources", xhr)
    }).done(function (data) {
        resBody.empty();
        for (let i = 0; i < data.length; i++) {
            const res = data[i]
            const resBlock = $(`
                    <div class="row px-3 py-2 mb-2">
                        <div class="col-2 res-kind"></div>
                        <div class="col-4 res-name"></div>
                        <div class="col-5 res-status"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> <span class="text-muted small">Getting status...</span></div>
                        <div class="col-1 res-actions"></div>
                    </div>
            `)

            resBlock.find(".res-kind").text(res.kind)
            resBlock.find(".res-name").text(res.metadata.name)

            resBody.append(resBlock)
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

                const statusBlock = resBlock.find(".res-status");
                statusBlock.empty().append(badge).append("<span class='text-muted small'>" + (data.status.message ? data.status.message : '') + "</span>")

                if (badge.text() !== "NotFound") {
                    resBlock.find(".res-actions")
                    resBlock.find(".res-actions").append("<i class=\"btn bi-zoom-in float-end text-muted\"></i>")
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

    const myModal = new bootstrap.Offcanvas(document.getElementById('describeModal'));
    myModal.show()
    $.get("/api/kube/describe/" + kind.toLowerCase() + "?name=" + name + "&namespace=" + ns).fail(function (xhr) {
        reportError("Failed to describe resource", xhr)
    }).done(function (data) {
        data = hljs.highlight(data, {language: 'yaml'}).value
        $("#describeModalBody").empty().append("<pre class='bg-white rounded p-3'></pre>").find("pre").html(data)
    })
}
