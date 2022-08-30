const clusterSelect = $("#cluster");
const chartsCards = $("#charts");

function reportError(err) {
    alert(err) // TODO: nice modal/baloon/etc
}

function fillChartDetails(namespace, name) {
    $("#sectionDetails").show()
    $("#sectionDetails h1 span").text(name)
    $.getJSON("/api/helm/charts/history?chart=" + name + "&namespace=" + namespace).fail(function () {
        reportError("Failed to get list of clusters")
    }).done(function (data) {
        data.forEach(function (elm) {
            const rev = $(`            
                            <div class="col-md-2 rounded border border-secondary bg-gradient bg-white">
                                <span><b class="rev-number"></b> - <span class="rev-status"></span></span><br/>
                                <span class="text-muted">Chart:</span> <span class="chart-ver"></span><br/>
                                <span class="text-muted">App:</span> <span class="app-ver"></span><br/>
                                <span class="text-muted small rev-date"></span><br/>                
                            </div>`)
            rev.find(".rev-number").text("#" + elm.revision)
            rev.find(".app-ver").text(elm.app_version)
            rev.find(".chart-ver").text(elm.chart_ver)
            rev.find(".rev-date").text(elm.updated.replace("T", " "))
            rev.find(".rev-status").text(elm.status).attr("title", elm.action)

            if (elm.status === "failed") {
                rev.find(".rev-status").parent().addClass("text-danger")
            }

            if (elm.status === "deployed") {
                rev.removeClass("bg-white").addClass("text-light bg-primary")
            }

            $("#sectionDetails .row").append(rev)
        })
    })

}

function loadChartsList() {
    $("#sectionList").show()
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
                window.location.hash = chart.namespace + "&" + chart.name
                fillChartDetails(chart.namespace, chart.name)
            })

            chartsCards.append($("<div class='col'></div>").append(card))
        })
    })
}

$(function () {
    // cluster list
    $.getJSON("/api/kube/contexts").fail(function () {
        reportError("Failed to get list of clusters")
    }).done(function (data) {
        data.forEach(function (elm) {
            // aws CLI uses complicated context names, the suffix does not work well
            // maybe we should have an `if` statement here
            let label = elm.Name //+ " (" + elm.Cluster + "/" + elm.AuthInfo + "/" + elm.Namespace + ")"
            let opt = $("<option></option>").val(elm.Name).text(label)
            if (elm.IsCurrent) {
                opt.attr("selected", "selected")
            }
            clusterSelect.append(opt)
        })
    })
    clusterSelect.change(function () {
        // TODO: remember it, respect it in the function above and in all other places
    })

    const parts = window.location.hash.split("&")
    if (parts[0] === "") {
        loadChartsList()
    } else {
        fillChartDetails(parts[0], parts[1])
    }
})
