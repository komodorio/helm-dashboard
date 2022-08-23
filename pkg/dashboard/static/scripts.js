$(function () {
    $.getJSON("/api/kube/contexts").done(function (data) {
        data.forEach(function (elm) {
            let label = elm.Name + " (" + elm.Cluster + "/"+elm.AuthInfo+"/"+elm.Namespace+")"
            let opt = $("<option></option>").val(elm.Name).text(label)
            if (elm.isCurrent) {
                opt.attr("selected", "selected")
            }
            $("#cluster").append(opt)
        })
    })
})

function reportError(err) {
    alert(err) // TODO: nice modal/baloon/etc
}