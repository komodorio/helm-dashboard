$(function () {
    const clusterSelect = $("#cluster");
    clusterSelect.change(function () {
        window.location.href = "/#context=" + clusterSelect.find("input:radio:checked").val()
        window.location.reload()
    })

    $.getJSON("/api/kube/contexts").fail(function (xhr) {
        reportError("Failed to get list of clusters", xhr)
    }).done(function (data) {
        const context = getHashParam("context")
        fillClusterList(data, context);

        const namespace = getHashParam("namespace")
        const chart = getHashParam("chart")
        if (!chart) {
            loadChartsList()
        } else {
            loadChartHistory(namespace, chart)
        }
    })
})


function reportError(err, xhr) {
    $("#errorAlert h4 span").text(err)
    if (xhr) {
        $("#errorAlert p").text(xhr.responseText)
    }
    $("#errorAlert").show()
}


function getHashParam(name) {
    const params = new URLSearchParams(window.location.hash.substring(1))
    return params.get(name)
}

function setHashParam(name, val) {
    const params = new URLSearchParams(window.location.hash.substring(1))
    params.set(name, val)
    window.location.hash = new URLSearchParams(params).toString()
}

function statusStyle(status, card, txt) {
    txt.addClass("text-uppercase")
    txt.html("<span class='fs-6'>●</span> " + status)
    txt.removeClass("text-failed text-deployed text-pending text-other")
    if (status === "failed") {
        card.addClass("border-failed")
        txt.addClass("text-failed")
        // TODO: add failure description here
    } else if (status === "deployed") {
        card.addClass("border-deployed")
        txt.addClass("text-deployed")
    } else if (status.startsWith("pending-")) {
        card.addClass("border-pending")
        txt.addClass("text-pending")
    } else {
        card.addClass("border-other")
        txt.addClass("text-other")
    }
}


function fillClusterList(data, context) {
    data.forEach(function (elm) {
        // aws CLI uses complicated context names, the suffix does not work well
        // maybe we should have an `if` statement here
        let label = elm.Name //+ " (" + elm.Cluster + "/" + elm.AuthInfo + "/" + elm.Namespace + ")"
        let opt = $('<li><label><input type="radio" name="cluster" class="me-2"/><span></span></label></li>');
        opt.attr('title', label)
        opt.find("input").val(elm.Name).text(label)
        opt.find("span").text(label)
        if (elm.IsCurrent && !context) {
            opt.find("input").prop("checked", true)
            setCurrentContext(elm.Name)
        } else if (context && elm.Name === context) {
            opt.find("input").prop("checked", true)
            setCurrentContext(elm.Name)
        }
        $("#cluster").append(opt)
    })
}

function setCurrentContext(ctx) {
    setHashParam("context", ctx)
    $.ajaxSetup({
        headers: {
            'x-kubecontext': ctx
        }
    });
}

function getAge(obj1, obj2) {
    const date = luxon.DateTime.fromISO(obj1.updated);
    let dateNext = luxon.DateTime.now()
    if (obj2) {
        dateNext = luxon.DateTime.fromISO(obj2.updated);
    }
    const diff = dateNext.diff(date);

    const map = {
        "years": "yr", "months": "mo", "days": "d", "hours": "h", "minutes": "m", "seconds": "s", "milliseconds": "ms"
    }

    for (let unit of ["years", "months", "days", "hours", "minutes", "seconds", "milliseconds"]) {
        const val = diff.as(unit);
        if (val >= 1) {
            return Math.round(val) + map[unit]
        }
    }
    return "n/a"
}

$(".bi-power").click(function () {
    $(".bi-power").attr("disabled", "disabled").removeClass(".bi-power").append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $.ajax({
        url: "/",
        type: 'DELETE',
    }).done(function () {
        window.close();
    })
})

function isNewerVersion(oldVer, newVer) {
    const oldParts = oldVer.split('.')
    const newParts = newVer.split('.')
    for (let i = 0; i < newParts.length; i++) {
        const a = ~~newParts[i] // parse int
        const b = ~~oldParts[i] // parse int
        if (a > b) return true
        if (a < b) return false
    }
    return false
}