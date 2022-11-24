function loadChartsList() {
    $("body").removeClass("bg-variant1 bg-variant2").addClass("bg-variant1")
    $("#sectionList").show()
    const chartsCards = $("#installedList .body")
    chartsCards.empty().append("<div><span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Loading...</div>")
    $.getJSON("/api/helm/charts").fail(function (xhr) {
        reportError("Failed to get list of charts", xhr)
    }).done(function (data) {
        chartsCards.empty().hide()
        $("#installedList .header h2 span").text(data.length)
        data.forEach(function (elm) {
            let card = buildChartCard(elm);
            chartsCards.append(card)
        })
        filterInstalledList(chartsCards.find(".row"))
        chartsCards.show()
        if (!data.length) {
            $("#installedList .no-charts").show()
        }
    })
}


function buildChartCard(elm) {
    const card = $(`<div class="row m-0 py-4 bg-white rounded-1 b-shadow border-4 border-start">
            <div class="col-4 rel-name"><span class="link">release-name</span><div></div></div>
            <div class="col-3 rel-status"><span></span><div></div></div>
            <div class="col-2 rel-chart text-nowrap"><span></span><div>Chart Version</div></div>
            <div class="col-1 rel-rev"><span>#0</span><div>Revision</div></div>
            <div class="col-1 rel-ns text-nowrap"><span>default</span><div>Namespace</div></div>
            <div class="col-1 rel-date text-nowrap"><span>today</span><div>Updated</div></div>
        </div>`)
    
    // semver2 regex , add optional v prefix
    const chartNameRegex = 'v?(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?'
    const chartName = elm.chart.substring(0, elm.chart.match(chartNameRegex).index - 1)
    $.getJSON("/api/helm/repo/search?name=" + chartName).fail(function (xhr) {
        reportError("Failed to get repo name for charts", xhr)
    }).done(function (data) {
        if (data.length > 0) {
            $.getJSON("/api/helm/charts/show?name=" + data[0].name).fail(function (xhr) {
                reportError("Failed to get list of charts", xhr)
            }).done(function (data) {
                if (data) {
                    const res = data[0];
                    if (res.icon) {
                        card.find(".rel-name").attr("style", "background-image: url(" + res.icon + ")")
                    }
                    if (res.description) {
                        card.find(".rel-name div").text(res.description)
                    }
                }

            })
        }
    })

    card.find(".rel-name span").text(elm.name)
    card.find(".rel-rev span").text("#" + elm.revision)
    card.find(".rel-ns span").text(elm.namespace)
    card.find(".rel-chart span").text(elm.chart)
    card.find(".rel-date span").text(getAge(elm))

    card.data("namespace", elm.namespace)
    card.data("name", elm.name)
    card.data("chart", elm.chart)

    statusStyle(elm.status, card, card.find(".rel-status span"))

    card.find("a").attr("href", '#context=' + getHashParam('context') + '&namespace=' + elm.namespace + '&name=' + elm.name)

    card.find(".rel-name span").data("chart", elm).click(function () {
        const self = $(this)
        $("#sectionList").hide()

        let chart = self.data("chart");
        setHashParam("namespace", chart.namespace)
        setHashParam("chart", chart.name)

        loadChartHistory(chart.namespace, chart.name, elm.chart_name)
    })
    return card;
}

$("#installedSearch").keyup(function () {
    filterInstalledList($("#installedList .body .row"))
})
