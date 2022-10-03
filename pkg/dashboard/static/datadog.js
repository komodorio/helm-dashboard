(function(h,o,u,n,d) {
    h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
    d=o.createElement(u);d.async=1;d.src=n
    n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
})(window,document,'script','https://www.datadoghq-browser-agent.com/datadog-rum-v4.js','DD_RUM')
    DD_RUM.onReady(function() {
    DD_RUM.init({
        clientToken: 'pub16d64cd1c00cf073ce85af914333bf72',
        applicationId: 'e75439e5-e1b3-46ba-a9e9-a2e58579a2e2',
        site: 'datadoghq.com',
        service: 'helm-dashboard',
        version: '0.0.6',
        trackInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask'
    })
})