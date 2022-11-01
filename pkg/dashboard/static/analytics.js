const xhr = new XMLHttpRequest();
xhr.onload = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
        const status = JSON.parse(xhr.responseText);
        const version = status.CurVer
        if (status.Analytics && version !== "dev") {
            enableDD(version)
            enableHeap()
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

function enableHeap() {
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
    heap.load("3615793373");
}