function loadChartsList() {
    $("body").removeClass("bg-variant1 bg-variant2").addClass("bg-variant1")
    $("#sectionList").show()
    const chartsCards = $("#installedList .body")
    chartsCards.empty().append("<div><span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Loading...</div>")
    $.getJSON("/api/helm/charts").fail(function (xhr) {
        reportError("Failed to get list of charts", xhr)
    }).done(function (data) {
        chartsCards.empty()
        $("#installedList .header h2 span").text(data.length)
        data.forEach(function (elm) {
            let card = buildChartCard(elm);
            chartsCards.append(card)
        })

        if (!data.length) {
            $("#installedList .no-charts").show()
        }
    })
}

function buildChartCard(elm) {
    const card = $(`<div class="row m-0 py-3 bg-white rounded-1 b-shadow border-4 border-start">
            <div class="col-4 rel-name"><span class="link">release-name</span><div></div></div>
            <div class="col-3 rel-status"><span></span><div></div></div>
            <div class="col-2 rel-chart text-nowrap"><span></span><div>Chart Version</div></div>
            <div class="col-1 rel-rev"><span>#0</span><div>Revision</div></div>
            <div class="col-1 rel-ns text-nowrap"><span>default</span><div>Namespace</div></div>
            <div class="col-1 rel-date text-nowrap"><span>today</span><div>Updated</div></div>
        </div>`)

    card.find(".rel-name span").text(elm.name)
    card.find(".rel-rev span").text("#" + elm.revision)
    card.find(".rel-ns span").text(elm.namespace)
    card.find(".rel-chart span").text(elm.chart)
    card.find(".rel-date span").text(getAge(elm))

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

