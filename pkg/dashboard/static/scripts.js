$(function () {
    const clusterSelect = $("#cluster");
    $.getJSON("/api/kube/contexts").done(function (data) {
        data.forEach(function (elm) {
            let label = elm.Name + " (" + elm.Cluster + "/"+elm.AuthInfo+"/"+elm.Namespace+")"
            let opt = $("<option></option>").val(elm.Name).text(label)
            if (elm.isCurrent) {
                opt.attr("selected", "selected")
            }
            clusterSelect.append(opt)
        })
    }).fail(function () {
        reportError("Failed to get list of clusters")
    })
    clusterSelect.change(function () {
        // TODO: remember it, respect it in the function above and in all other places
    })
})

function reportError(err) {
    alert(err) // TODO: nice modal/baloon/etc
}