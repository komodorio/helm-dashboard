const clusterSelect = $("#cluster");
const chartsCards = $("#charts");
const revRow = $("#sectionDetails .row");

function reportError(err) {
    alert(err) // TODO: nice modal/baloon/etc
}

function revisionClicked(namespace, name, self) {
    let active = "active border-primary border-2 bg-opacity-25 bg-primary";
    let inactive = "border-secondary bg-white";
    revRow.find(".active").removeClass(active).addClass(inactive)
    self.removeClass(inactive).addClass(active)
    const elm = self.data("elm")
    setHashParam("revision", elm.revision)
    $("#sectionDetails h1 span.rev").text(elm.revision)
    $("#chartName").text(elm.chart)
    $("#revDescr").text(elm.description).removeClass("text-danger")
    if (elm.status === "failed") {
        $("#revDescr").addClass("text-danger")
    }

    const tab = getHashParam("tab")
    if (!tab) {
        $("#nav-tab [data-tab=manifests]").click()
    } else {
        $("#nav-tab [data-tab=" + tab + "]").click()
    }
}

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

    const mode = getHashParam("mode")
    if (!mode) {
        $("#modePanel [data-mode=diff-prev]").trigger('click')
    } else {
        $("#modePanel [data-mode=" + mode + "]").trigger('click')
    }
})

$("#modePanel [data-mode]").click(function () {
    const self = $(this)
    const mode = self.data("mode")
    setHashParam("mode", mode)
    loadContentWrapper()
})


$("#userDefinedVals").change(function () {
    const self = $(this)
    const flag = $("#userDefinedVals").prop("checked");
    setHashParam("udv", flag)
    loadContentWrapper()
})

function loadContentWrapper() {
    let revDiff = 0
    const revision = parseInt(getHashParam("revision"));
    if (getHashParam("mode") === "diff-prev") {
        revDiff = revision - 1
    } else if (getHashParam("mode") === "diff-rev") {
        revDiff = $("#specRev").val()
    }
    const flag = $("#userDefinedVals").prop("checked");
    loadContent(getHashParam("tab"), getHashParam("namespace"), getHashParam("chart"), revision, revDiff, flag)
}

function loadContent(mode, namespace, name, revision, revDiff, flag) {
    let qstr = "chart=" + name + "&namespace=" + namespace + "&revision=" + revision
    if (revDiff) {
        qstr += "&revisionDiff=" + revDiff
    }

    if (flag) {
        qstr += "&flag=" + flag
    }

    let url = "/api/helm/charts/" + mode
    url += "?" + qstr
    const diffDisplay = $("#manifestText");
    diffDisplay.empty().append("<i class='fa fa-spinner fa-spin fa-2x'></i>")
    $.get(url).fail(function () {
        reportError("Failed to get diff of " + mode)
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

function loadChartHistory(namespace, name) {
    $("#sectionDetails").show()
    $("#sectionDetails h1 span.name").text(name)
    revRow.empty().append("<div><i class='fa fa-spinner fa-spin fa-2x'></i></div>")
    $.getJSON("/api/helm/charts/history?chart=" + name + "&namespace=" + namespace).fail(function () {
        reportError("Failed to get list of clusters")
    }).done(function (data) {
        revRow.empty()
        for (let x = 0; x < data.length; x++) {
            const elm = data[x]
            $("#specRev").val(elm.revision)
            const rev = $(`<div class="col-md-2 p-2 rounded border border-secondary bg-gradient bg-white">
                                <span><b class="rev-number"></b> - <span class="rev-status"></span></span><br/>
                                <span class="text-muted">Chart:</span> <span class="chart-ver"></span><br/>
                                <span class="text-muted">App ver:</span> <span class="app-ver"></span><br/>
                                <p class="small mt-3 mb-0"><span class="text-muted">Age:</span> <span class="rev-age"></span><br/>
                                <span class="text-muted rev-date"></span><br/></p>                
                            </div>`)
            rev.find(".rev-number").text("#" + elm.revision)
            rev.find(".app-ver").text(elm.app_version)
            rev.find(".chart-ver").text(elm.chart_ver)
            rev.find(".rev-date").text(elm.updated.replace("T", " "))
            rev.find(".rev-age").text(getAge(elm, data[x + 1]))
            rev.find(".rev-status").text(elm.status)
            rev.find(".fa").attr("title", elm.action)

            if (elm.status === "failed") {
                rev.find(".rev-status").parent().addClass("text-danger")
            }

            switch (elm.action) {
                case "app_upgrade":
                    rev.find(".app-ver").append(" <i class='fa fa-angle-double-up text-success'></i>")
                    break
                case "app_downgrade":
                    rev.find(".app-ver").append(" <i class='fa fa-angle-double-down text-danger'></i>")
                    break
                case "chart_upgrade":
                    rev.find(".chart-ver").append(" <i class='fa fa-angle-up text-success'></i>")
                    break
                case "chart_downgrade":
                    rev.find(".chart-ver").append(" <i class='fa fa-angle-down text-danger'></i>")
                    break
                case "reconfigure": // ?
                    break
            }

            rev.data("elm", elm)
            rev.addClass("rev-" + elm.revision)
            rev.click(function () {
                revisionClicked(namespace, name, $(this))
            })

            revRow.append(rev)
        }

        const rev = getHashParam("revision")
        if (rev) {
            revRow.find(".rev-" + rev).click()
        } else {
            revRow.find("div.col-md-2:last-child").click()
        }
    })
}

function getHashParam(name) {
    const params = new URLSearchParams(window.location.hash.substring(1))
    return params.get(name)
}

function setHashParam(name, val) {
    const params = new URLSearchParams(window.location.hash.substring(1))
    params.set(name, val)
    window.location.hash = new URLSearchParams(params).toString()
}

function loadChartsList() {
    $("#sectionList").show()
    chartsCards.empty().append("<div><i class='fa fa-spinner fa-spin fa-2x'></i> Loading...</div>")
    $.getJSON("/api/helm/charts").fail(function () {
        reportError("Failed to get list of clusters")
    }).done(function (data) {
        chartsCards.empty()
        data.forEach(function (elm) {
            const header = $("<div class='card-header'></div>")
            header.append($('<div class="float-end"><h5 class="float-end text-muted text-end">#' + elm.revision + '</h5><br/><div class="badge">' + elm.status + "</div>"))
            // TODO: for pending- and uninstalling, add the spinner
            if (elm.status === "failed") {
                header.find(".badge").addClass("bg-danger text-light")
            } else if (elm.status === "deployed" || elm.status === "superseded") {
                header.find(".badge").addClass("bg-info")
            } else {
                header.find(".badge").addClass("bg-light text-dark")
            }

            header.append($('<h5 class="card-title"></h5>').text(elm.name))
            header.append($('<p class="card-text small text-muted"></p>').append("Chart: " + elm.chart))

            const body = $("<div class='card-body'></div>")
            body.append($('<p class="card-text"></p>').append("Namespace: " + elm.namespace))
            body.append($('<p class="card-text"></p>').append("Version: " + elm.app_version))
            body.append($('<p class="card-text"></p>').append("Updated: " + elm.updated))

            let card = $("<div class='card'></div>").append(header).append(body);

            card.data("chart", elm)
            card.click(function () {
                const self = $(this)
                $("#sectionList").hide()

                let chart = self.data("chart");
                setHashParam("namespace", chart.namespace)
                setHashParam("chart", chart.name)
                loadChartHistory(chart.namespace, chart.name)
            })

            chartsCards.append($("<div class='col'></div>").append(card))
        })
    })
}


$(function () {
    // cluster list
    clusterSelect.change(function () {
        Cookies.set("context", clusterSelect.val())
        window.location.href = "/"
    })

    $.getJSON("/api/kube/contexts").fail(function () {
        reportError("Failed to get list of clusters")
    }).done(function (data) {
        const context = Cookies.get("context")

        data.forEach(function (elm) {
            // aws CLI uses complicated context names, the suffix does not work well
            // maybe we should have an `if` statement here
            let label = elm.Name //+ " (" + elm.Cluster + "/" + elm.AuthInfo + "/" + elm.Namespace + ")"
            let opt = $("<option></option>").val(elm.Name).text(label)
            if (elm.IsCurrent && !context) {
                opt.attr("selected", "selected")
            } else if (context && elm.Name === context) {
                opt.attr("selected", "selected")
                $.ajaxSetup({
                    headers: {
                        'x-kubecontext': context
                    }
                });
            }
            clusterSelect.append(opt)
        })

        const namespace = getHashParam("namespace")
        const chart = getHashParam("chart")
        if (!chart) {
            loadChartsList()
        } else {
            loadChartHistory(namespace, chart)
        }
    })
})

function getAge(obj1, obj2) {
    const date = luxon.DateTime.fromISO(obj1.updated);
    let dateNext = luxon.DateTime.now()
    if (obj2) {
        dateNext = luxon.DateTime.fromISO(obj2.updated);
    }
    const diff = dateNext.diff(date);

    const map = {
        "years": "yr", "months": "mo", "days": "d", "hours": "h", "minutes": "m", "seconds": "s", "milliseconds": "ms"
    }

    for (let unit of ["years", "months", "days", "hours", "minutes", "seconds", "milliseconds"]) {
        const val = diff.as(unit);
        if (val >= 1) {
            return Math.round(val) + map[unit]
        }
    }
    return "n/a"
}