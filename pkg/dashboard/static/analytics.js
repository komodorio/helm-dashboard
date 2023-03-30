const xhr = new XMLHttpRequest();


xhr.onload = function () {

    if (xhr.readyState === XMLHttpRequest.DONE) {
        const status = JSON.parse(xhr.responseText);
        const version = status.CurVer
        if (status.Analytics) {
            enableDD(version)
            enableHeap(version, status.ClusterMode)
            enableSegmentBackend(version, status.ClusterMode)
        } else {
            console.log("Analytics is disabled in this session")
        }
    }
}
xhr.open('GET', '/status', true);
xhr.send(null);


function enableDD(version) {
    (function (h, o, u, n, d) {
        h = h[d] = h[d] || {
            q: [], onReady: function (c) {
                h.q.push(c)
            }
        }
        d = o.createElement(u);
        d.async = true;
        d.src = n
        n = o.getElementsByTagName(u)[0];
        n.parentNode.insertBefore(d, n)
    })(window, document, 'script', 'https://www.datadoghq-browser-agent.com/datadog-rum-v4.js', 'DD_RUM')
    DD_RUM.onReady(function () {
        DD_RUM.init({
            clientToken: 'pub16d64cd1c00cf073ce85af914333bf72',
            applicationId: 'e75439e5-e1b3-46ba-a9e9-a2e58579a2e2',
            site: 'datadoghq.com',
            service: 'helm-dashboard',
            version: version,
            trackInteractions: true,
            trackResources: true,
            trackLongTasks: true,
            defaultPrivacyLevel: 'mask',
            sessionReplaySampleRate: 0
        })
    })
}

function enableHeap(version, inCluster) {
    window.heap = window.heap || [], heap.load = function (e, t) {
        window.heap.appid = e, window.heap.config = t = t || {};
        let r = document.createElement("script");
        r.type = "text/javascript", r.async = !0, r.src = "https://cdn.heapanalytics.com/js/heap-" + e + ".js";
        let a = document.getElementsByTagName("script")[0];
        a.parentNode.insertBefore(r, a);
        for (let n = function (e) {
            return function () {
                heap.push([e].concat(Array.prototype.slice.call(arguments, 0)))
            }
        }, p = ["addEventProperties", "addUserProperties", "clearEventProperties", "identify", "resetIdentity", "removeEventProperty", "setEventProperties", "track", "unsetEventProperty"], o = 0; o < p.length; o++) heap[p[o]] = n(p[o])
    };
    heap.load("4249623943");
    window.heap.addEventProperties({
        'version': version,
        'installationMode': inCluster ? "cluster" : "local"
    });
}

function sendStats(name, prop) {
    if (window.heap) {
        window.heap.track(name, prop);
    }
}

function enableSegmentBackend(version, ClusterMode) {
    sendToSegmentThroughAPI("helm dashboard loaded", {version, 'installationMode': ClusterMode ? "cluster" : "local"})
}

function sendToSegmentThroughAPI(eventName, properties) {
    if (window.heap) {
        const userId = getUserId();
        try {
            sendData(properties, "track", userId, eventName);
        } catch (e) {
            console.log("failed sending data to segment", e);
        }
    }
}

function sendData(data, eventType, userId, eventName) {
    const body = createBody(eventType, userId, data, eventName);
    ANALYTICS_ADMIN_USER_EMAIL = "komodor.analytics@admin.com"
    const auth_skipper = ANALYTICS_ADMIN_USER_EMAIL;
    return fetch(`https://api.komodor.com/analytics/segment/${eventType}`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        //credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "api-key": auth_skipper,
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(body),
    });
}

function createBody(segmentCallType, userId, params, eventName) {
    const data = {userId: userId};
    if (segmentCallType === "identify") {
        data["traits"] = params;
    } else if (segmentCallType === "track") {
        if (!eventName) {
            throw new Error("no eventName parameter on segment track call");
        }
        data["properties"] = params;
        data["eventName"] = eventName;
    }
    return data;
}

const getUserId = (() => {
    let userId = null;
    return () => {
        if (!userId) {
            userId = crypto.randomUUID();
        }
        return userId;
    };
})();
