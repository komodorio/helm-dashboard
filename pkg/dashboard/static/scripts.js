$(function () {
    let limNS = null
    $.getJSON("/status").fail(function (xhr) { // maybe /options call in the future
        reportError("Failed to get tool version", xhr)
    }).done(function (data) {
        $("body").data("status", data)
        fillToolVersion(data)
        limNS = data.LimitedToNamespace
        if (limNS) {
            $("#limitNamespace").show().find("span").text(limNS)
        }
        fillClusters(limNS)

        if (data.ClusterMode) {
            $(".bi-power").hide()
            $("#clusterFilterBlock").hide()
        }
    })

    $.getJSON("/api/scanners").fail(function (xhr) {
        reportError("Failed to get list of scanners", xhr)
    }).done(function (data) {
        $("body").data("scanners", data)
        for (let k in data) {
            if (data[k].ManifestScannable) {
                $("#upgradeModal .btn-scan").show() // TODO: move this to install flow
            }
        }
    })
})

function fillClusters(limNS) {
    const clusterSelect = $("#cluster");
    clusterSelect.change(function () {
        window.location.href = "/#context=" + clusterSelect.find("input:radio:checked").val()
        window.location.reload()
    })
    const namespaceSelect = $("#namespace");
    namespaceSelect.change(function () {
        let filteredNamespaces = []
        namespaceSelect.find("input:checkbox:checked").each(function () {
            filteredNamespaces.push($(this).val());
        })
        setFilteredNamespaces(filteredNamespaces)
        filterInstalledList($("#installedList .body .row"))
    })

    $.getJSON("/api/kube/contexts").fail(function (xhr) {
        sendStats('contexts', {'status': 'fail'});
        reportError("Failed to get list of clusters", xhr)
    }).done(function (data) {
        $("body").data("contexts", data)
        const context = getHashParam("context")
        data.sort((a, b) => (getCleanClusterName(a.Name) > getCleanClusterName(b.Name)) - (getCleanClusterName(a.Name) < getCleanClusterName(b.Name)))
        fillClusterList(data, context);
        sendStats('contexts', {'status': 'success', length: data.length});
        $.getJSON("/api/kube/namespaces").fail(function (xhr) {
            reportError("Failed to get namespaces", xhr)
        }).done(function (res) {
            const ns = res.items.map(i => i.metadata.name)
            $.each(ns, function (i, item) {
                $("#upgradeModal #ns-datalist").append($("<option>", {
                    value: item,
                    text: item
                }))
            })
            if (!limNS) {
                fillNamespaceList(res.items)
            }
        }).always(function () {
            initView(); // can only do it after loading cluster and namespace lists
        })
    })
}

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
    const filteredNamespace = getHashParam("filteredNamespace")
    setHashParam(null, null)
    setHashParam("context", ctx)
    setHashParam("filteredNamespace", filteredNamespace)

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
        const clusterName = clusterSplit.slice(-1)[0].replace('cluster/', '')
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
    if (!data || !data.length) {
        $("#cluster").append("No clusters listed in kubectl config, please configure some")
        return
    }
    data.forEach(function (elm) {
        let label = getCleanClusterName(elm.Name)
        let opt = $('<li><label><input type="radio" name="cluster" class="me-2"/><span></span></label></li>');
        opt.attr('title', elm.Name)
        opt.find("input").val(elm.Name).text(label)
        opt.find("span").text(label)
        const isCurrent = elm.IsCurrent && !context;
        const isSelected = context && elm.Name === context
        if (isCurrent || isSelected) {
            opt.find("input").prop("checked", true)
            setCurrentContext(elm.Name)
        }
        $("#cluster").append(opt)
    })
}

function fillNamespaceList(data) {
    const curContextNamespaces = $("body").data("contexts").filter(obj => {
        return obj.IsCurrent
    })

    if (!data || !data.length) {
        $("#namespace").append("default")
        return
    }
    Array.from(data).forEach(function (elm) {
        const filteredNamespace = getHashParam("filteredNamespace")
        let opt = $('<li class="display-none"><label><input type="checkbox" name="namespace" class="me-2"/><span></span><span class="text-muted ms-2"></span></label></li>');
        opt.attr('title', elm.metadata.name)
        opt.find("input").val(elm.metadata.name).text(elm.metadata.name)
        opt.find("span").text(elm.metadata.name)
        if (filteredNamespace) {
            if (filteredNamespace.split('+').includes(elm.metadata.name)) {
                opt.find("input").prop("checked", true)
            }
        } else if (curContextNamespaces.length && curContextNamespaces[0].Namespace === elm.metadata.name) {
            opt.find("input").prop("checked", true)
            setFilteredNamespaces([elm.metadata.name])
        }
        $("#namespace").append(opt)
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
        // TODO: display explanation overlay here
        $("#PowerOffModal").modal('show');
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

$("#cacheClear").click(function () {
    $.ajax({
        url: "/api/cache",
        type: 'DELETE',
    }).done(function () {
        window.location.reload()
    })
})

function showHideInstalledRelease(card, filteredNamespaces, filterStr) {
    let releaseNamespace = card.data("namespace")
    let releaseName = card.data("name")
    let chartName = card.data("chart").chart
    const shownByNS = !filteredNamespaces || filteredNamespaces.split('+').includes(releaseNamespace);
    const shownByStr = releaseName.indexOf(filterStr) >= 0 || chartName.indexOf(filterStr) >= 0
    if (shownByNS && shownByStr) {
        card.show()
        return true
    } else {
        card.hide()
        return false
    }
}


function filterInstalledList(list) {
    const warnMsg = $("#installedList .all-filtered").hide();

    let filterStr = $("#installedSearch").val().toLowerCase();
    let filteredNamespaces = getHashParam("filteredNamespace")
    let anyShown = false;
    let installedCount = 0;

    list.each(function (ix, card) {
        anyShown = showHideInstalledRelease($(card), filteredNamespaces, filterStr)
        if (anyShown) {
            installedCount++;
        }
    })

    $("#installedList .header h2 span").text(installedCount)
    if (list.length && !installedCount) {
        warnMsg.show()
    }
}

function setFilteredNamespaces(filteredNamespaces) {
    if (filteredNamespaces.length === 0 && getHashParam("filteredNamespace")) {
        setHashParam("filteredNamespace")
    } else if (filteredNamespaces.length !== 0) {
        setHashParam("filteredNamespace", filteredNamespaces.join('+'))
    }
}