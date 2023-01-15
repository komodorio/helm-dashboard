function loadChartsList() {
    $("body").removeClass("bg-variant1 bg-variant2").addClass("bg-variant1")
    $("#sectionList").show()
    const chartsCards = $("#installedList .body")
    chartsCards.empty().append("<div><span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Loading...</div>")
    $.getJSON("/api/helm/charts").fail(function (xhr) {
        sendStats('Get releases', {'status': 'failed'});
        reportError("Failed to get list of charts", xhr)
        chartsCards.empty().append("<div class=\"row m-0 py-4 bg-white rounded-1 b-shadow border-4 border-start\"><div class=\"col\">Failed to get list of charts</div></div>")
    }).done(function (data) {
        chartsCards.empty().hide()
        const usedNS = {}
        data.forEach(function (elm) {
            let card = buildChartCard(elm);
            chartsCards.append(card)
            usedNS[elm.namespace] = usedNS[elm.namespace] ? usedNS[elm.namespace] + 1 : 1
        })
        sendStats('Get releases', {'status': 'success', length: data.length});
        filterInstalledList(chartsCards.find(".row"))
        $("#namespace li").each(function (ix, obj) {
            obj = $(obj)
            const objNS = obj.find("input").val();
            if (usedNS[objNS]) {
                obj.find("label .text-muted").text('[' + usedNS[objNS] + ']')
                obj.show()
            } else {
                obj.hide()
            }
        })
        chartsCards.show()
        if (!data.length) {
            $("#installedList .no-charts").show()
        }
    })
}

function buildChartCard(elm) {
    const card = $(`<div class="row m-0 py-4 bg-white rounded-1 b-shadow border-4 border-start link">
            <div class="col-4 rel-name"><span>release-name</span><div></div></div>
            <div class="col-3 rel-status"><span></span><div></div></div>
            <div class="col-2 rel-chart text-nowrap"><span></span><div>Chart Version</div></div>
            <div class="col-1 rel-rev"><span>#0</span><div>Revision</div></div>
            <div class="col-1 rel-ns text-nowrap"><span>default</span><div>Namespace</div></div>
            <div class="col-1 rel-date text-nowrap"><span>today</span><div>Updated</div></div>
        </div>`)

    let chartName = elm.chart
    let match = null
    // semver2 regex , add optional v prefix
    const chartNameRegex = 'v?(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?'
    if (!new RegExp(chartNameRegex).test(chartName)) {
        alert('Chart name does not match chart name regex.')
    } else {
        match = chartName.match(chartNameRegex);
    }

    if (match) {
        chartName = elm.chart.substring(0, match.index - 1)
    } else {
        // fall back to simple substr
        chartName = elm.chart.substring(0, elm.chart.lastIndexOf("-"))
    }
    $.getJSON("/api/helm/repo/search?name=" + chartName).fail(function (xhr) {
        // we're ok if we can't show icon and description
        console.log("Failed to get repo name for charts", xhr)
    }).done(function (data) {
        if (data.length > 0) {
            $.getJSON("/api/helm/charts/show?name=" + data[0].name).fail(function (xhr) {
                console.log("Failed to get chart", xhr)
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

    card.data("chart", elm).click(function () {
        if (window.getSelection().toString()) {
            return
        }
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
