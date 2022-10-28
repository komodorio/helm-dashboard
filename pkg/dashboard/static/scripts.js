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

        initView(); // can only do it after loading cluster list
    })

    $.getJSON("/api/scanners").fail(function (xhr) {
        reportError("Failed to get list of scanners", xhr)
    }).done(function (data) {
        if (!data || !data.length) {
            $("#upgradeModal .btn-scan").hide()
        }
    })

    $.getJSON("/status").fail(function (xhr) {
        reportError("Failed to get tool version", xhr)
    }).done(function (data) {
        fillToolVersion(data)
    })
})

function initView() {
    $(".section").hide()

    const section = getHashParam("section")
    if (section === "repository") {
        $("#topNav ul a.section-repo").addClass("active")
        loadRepoView()
    } else {
        $("#topNav ul a.section-installed").addClass("active")
        const namespace = getHashParam("namespace")
        const chart = getHashParam("chart")
        if (!chart) {
            loadChartsList()
        } else {
            loadChartHistory(namespace, chart)
        }
    }
}

$("#topNav ul a").click(function () {
    const self = $(this)
    if (self.hasClass("section-help")) {
        return;
    }

    $("#topNav ul a").removeClass("active")

    const ctx = getHashParam("context")
    setHashParam(null, null)
    setHashParam("context", ctx)

    if (self.hasClass("section-repo")) {
        setHashParam("section", "repository")
    } else if (self.hasClass("section-installed")) {
        setHashParam("section", null)
    } else {
        return
    }

    initView()
})

const myAlert = document.getElementById('errorAlert')
myAlert.addEventListener('close.bs.alert', event => {
    event.preventDefault()
    $("#errorAlert").hide()
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
    let params = new URLSearchParams(window.location.hash.substring(1))
    if (!name) {
        params = new URLSearchParams()
    } else if (!val) {
        params.delete(name)
    } else {
        params.set(name, val)
    }
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

function getCleanClusterName(rawClusterName) {
    if (rawClusterName.indexOf('arn') === 0) {
        // AWS cluster
        const clusterSplit = rawClusterName.split(':')
        const clusterName = clusterSplit.at(-1).split("/").at(-1)
        const region = clusterSplit.at(-3)
        return region + "/" + clusterName + ' [AWS]'
    }
    if (rawClusterName.indexOf('gke') === 0) {
        // GKE cluster
        return rawClusterName.split('_').at(-2) + '/' + rawClusterName.split('_').at(-1) + ' [GKE]'
    }
    return rawClusterName
}

function fillClusterList(data, context) {
    data.forEach(function (elm) {
        let label = getCleanClusterName(elm.Name)
        let opt = $('<li><label><input type="radio" name="cluster" class="me-2"/><span></span></label></li>');
        opt.attr('title', elm.Name)
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
    if (oldVer && oldVer[0] === 'v') {
        oldVer = oldVer.substring(1)
    }

    if (newVer && newVer[0] === 'v') {
        newVer = newVer.substring(1)
    }

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

function fillToolVersion(data) {
    $("#toolVersion").text(data.CurVer)
    if (isNewerVersion(data.CurVer, data.LatestVer)) {
        $("#toolVersionUpgrade").text(data.LatestVer)
        $(".upgrade-possible").show()
    }
}