function loadChartsList() {
    $("body").removeClass("bg-variant1 bg-variant2").addClass("bg-variant1")
    $("#sectionList").show()
    const chartsCards = $("#installedList .body")
    chartsCards.empty().append("<div><span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Loading...</div>")
    $.getJSON("/api/helm/releases").fail(function (xhr) {
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

    if (elm.icon) {
        card.find(".rel-name").attr("style", "background-image: url(" + elm.icon + ")")
    }

    if (elm.description) {
        card.find(".rel-name div").text(elm.description)
    }

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

    // check if upgrade is possible
    $.getJSON("/api/helm/repositories/latestver?name=" + elm.chartName).fail(function (xhr) {
        reportError("Failed to find chart in repo", xhr)
    }).done(function (data) {
        if (!data || !data.length) {
            return
        }

        if (isNewerVersion(elm.chartVersion, data[0].version) || data[0].isSuggestedRepo) {
            const icon = $("<br/><span class='fw-bold' data-bs-toggle='tooltip' data-bs-placement='bottom'></span>")
            if (data[0].isSuggestedRepo) {
                icon.addClass("bi-plus-circle-fill text-primary")
                icon.text(" ADD REPO")
                icon.attr("data-bs-title", "Add '" + data[0].repository + "' to list of known repositories")
            } else {
                icon.addClass("bi-arrow-up-circle-fill text-primary")
                icon.text(" UPGRADE")
                icon.attr("data-bs-title", "Upgrade available: " + data[0].version + " from " + data[0].repository)
            }
            card.find(".rel-chart div").append(icon)

            const tooltipTriggerList = card.find('.rel-chart [data-bs-toggle="tooltip"]')
            const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
            sendStats('upgradeIconShown', {'isProbable': data[0].isSuggestedRepo})
        }
    })

    // check resource health status
    $.getJSON("/api/helm/releases/" + elm.namespace + "/" + elm.name + "/resources?health=true").fail(function (xhr) {
        reportError("Failed to find chart in repo", xhr)
    }).done(function (data) {
        for (let i = 0; i < data.length; i++) {
            const res = data[i]
            for (let k = 0; k < res.status.conditions.length; k++) {
                if (res.status.conditions[k].type !== "hdHealth") { // it's our custom condition type
                    continue
                }

                const cond = res.status.conditions[k]
                const square=$("<span class='me-1 mb-1 square rounded rounded-1' data-bs-toggle='tooltip'>&nbsp;</span>")
                if (cond.status === "Healthy") {
                    square.addClass("bg-success")
                } else if (cond.status === "Progressing") {
                    square.addClass("bg-warning")
                } else {
                    square.addClass("bg-danger")
                }
                square.attr("data-bs-title", cond.status+" "+res.kind+" '"+res.metadata.name+"'")
                card.find(".rel-status div").append(square)
            }
        }

        const tooltipTriggerList = card.find('.rel-status [data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    })

    return card;
}

$("#installedSearch").keyup(function () {
    filterInstalledList($("#installedList .body .row"))
})
