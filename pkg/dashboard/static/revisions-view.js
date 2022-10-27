const revRow = $("#sectionDetails .rev-list ul");

function loadChartHistory(namespace, name) {
    $("body").removeClass("bg-variant1 bg-variant2").addClass("bg-variant2")
    $("#sectionDetails").show()
    $("#sectionDetails .name").text(name)
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
        $("#specRev").data("first-rev", elm.revision)

        if (!x) {
            $("#specRev").val(elm.revision).data("last-rev", elm.revision).data("last-chart-ver", elm.chart_ver)
        }

        const rev = $(`<li class="px-2 pt-5 pb-4 mb-2 rounded border border-secondary bg-secondary position-relative">
                                <div class="rev-status position-absolute top-0 m-2 mb-5 start-0 fw-bold"></div>
                                <div class="rev-number position-absolute top-0 m-2 mb-5 end-0 fw-bold fs-6"></div>
                                <div class="rev-changes position-absolute bottom-0 start-0 m-2 text-muted small"></div>
                                <div class="position-absolute bottom-0 end-0 m-2 text-muted small">AGE: <span class="rev-age"></span></div>
                            </li>`)
        rev.find(".rev-number").text("#" + elm.revision)
        //rev.find(".app-ver").text(elm.app_version)
        //rev.find(".chart-ver").text(elm.chart_ver)
        rev.find(".rev-date").text(elm.updated.replace("T", " "))

        rev.find(".rev-age").text(getAge(elm, data[x - 1])).parent().attr("title", elm.updated)
        statusStyle(elm.status, rev.find(".rev-status"), rev.find(".rev-status"))

        if (elm.description.startsWith("Rollback to ")) {
            //rev.find(".rev-status").append(" <span class='small fw-normal text-lowercase'>(rollback)</span>")
            rev.find(".rev-status").append(" <i class='bi-arrow-counterclockwise text-muted' title='" + elm.description + "'></i>")
        }

        const nxt = data[x + 1];
        if (nxt && isNewerVersion(elm.chart_ver, nxt.chart_ver)) {
            rev.find(".rev-changes").html("<span class='strike'>" + nxt.chart_ver + "</span> <i class='bi-arrow-down-right'></i> " + elm.chart_ver)
        } else if (nxt && isNewerVersion(nxt.chart_ver, elm.chart_ver)) {
            rev.find(".rev-changes").html("<span class='strike'>" + nxt.chart_ver + "</span> <i class='bi-arrow-up-right'></i> " + elm.chart_ver)
        }

        rev.data("elm", elm)
        rev.addClass("rev-" + elm.revision)
        rev.click(function () {
            revisionClicked(namespace, name, $(this))
        })

        revRow.append(rev)
    }
}
