const clusterSelect = $("#cluster");
const chartsCards = $("#charts");

function reportError(err) {
    alert(err) // TODO: nice modal/baloon/etc
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

    // charts list
    $.getJSON("/api/helm/charts").fail(function () {
        reportError("Failed to get list of clusters")
    }).done(function (data) {
        chartsCards.empty()
        data.forEach(function (elm) {
            const header = $("<div class='card-header'></div>")
            header.append($('<div class="float-end"><h5 class="float-end text-muted text-end">#' + elm.revision + '</h5><br/><div class="badge bg-info">' + elm.status + "</div>"))
            header.append($('<h5 class="card-title"></h5>').text(elm.name))
            header.append($('<p class="card-text small text-muted"></p>').append("Version: " + elm.app_version))

            const body = $("<div class='card-body'></div>")
            body.append($('<p class="card-text"></p>').append("Namespace: " + elm.namespace))
            body.append($('<p class="card-text"></p>').append("Chart: " + elm.chart))
            body.append($('<p class="card-text"></p>').append("Updated: " + elm.updated))

            /*
        "namespace": "default",
            "revision": "4",
            "updated": "2022-08-16 17:11:26.73393511 +0300 IDT",
            "status": "deployed",
            "chart": "k8s-watcher-0.17.1",
            "app_version": "0.1.108"

             */

            let card = $("<div class='card'></div>").append(header).append(body);
            chartsCards.append($("<div class='col'></div>").append(card))
        })
    })
})
