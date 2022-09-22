const revRow = $("#sectionDetails .rev-list ul");

function loadChartHistory(namespace, name) {
    $("#sectionDetails").show()
    $("#sectionDetails h1 span.name").text(name)
    revRow.empty().append("<li><span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span></li>")
    $.getJSON("/api/helm/charts/history?name=" + name + "&namespace=" + namespace).fail(function (xhr) {
        reportError("Failed to get chart details", xhr)
    }).done(function (data) {
        fillChartHistory(data, namespace, name);

        checkUpgradeable(data[data.length - 1].chart_name)

        const rev = getHashParam("revision")
        if (rev) {
            revRow.find(".rev-" + rev).click()
        } else {
            revRow.find("li:first-child").click()
        }
    })
}

function fillChartHistory(data, namespace, name) {
    revRow.empty()
    data.reverse()
    for (let x = 0; x < data.length; x++) {
        const elm = data[x]
        $("#specRev").val(elm.revision).data("last-rev", elm.revision).data("last-chart-ver", elm.chart_ver)

        if (!x) {
            $("#specRev").data("first-rev", elm.revision)
        }

        const rev = $(`<li class="p-2 mb-2 rounded border border-secondary bg-secondary">
                                <div class="rev-number float-end fw-bold fs-6"></div>
                                <div class="rev-status float-start fw-bold"></div>
                                <span><span class=""></span></span><br/>
                                <span class="text-muted">Chart:</span> <span class="chart-ver"></span><br/>
                                <span class="text-muted">App ver:</span> <span class="app-ver"></span><br/>
                                <p class="small mt-3 mb-0"><span class="text-muted">Age:</span> <span class="rev-age"></span><br/>
                                <span class="text-muted rev-date"></span><br/></p>                
                            </li>`)
        rev.find(".rev-number").text("#" + elm.revision)
        rev.find(".app-ver").text(elm.app_version)
        rev.find(".chart-ver").text(elm.chart_ver)
        rev.find(".rev-date").text(elm.updated.replace("T", " "))
        rev.find(".rev-age").text(getAge(elm, data[x + 1]))
        statusStyle(elm.status, rev.find(".rev-status"), rev.find(".rev-status"))
        rev.find(".fa").attr("title", elm.action)

        switch (elm.action) {
            case "app_upgrade":
                rev.find(".app-ver").append(" <i class='bi-chevron-double-up text-success'></i>")
                break
            case "app_downgrade":
                rev.find(".app-ver").append(" <i class='bi-chevron-double-down text-danger'></i>")
                break
            case "chart_upgrade":
                rev.find(".chart-ver").append(" <i class='bi-chevron-up text-success'></i>")
                break
            case "chart_downgrade":
                rev.find(".chart-ver").append(" <i class='bi-chevron-down text-danger'></i>")
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
}

function revisionClicked(namespace, name, self) {
    let active = "active border-primary border-1 bg-white";
    let inactive = "border-secondary bg-secondary";
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

    const rev = $("#specRev").data("last-rev") == elm.revision ? elm.revision - 1 : elm.revision
    console.log(rev, $("#specRev").data("first-rev"))
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
