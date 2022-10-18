function loadRepoView() {
    $("#sectionRepo").show()

    $.getJSON("/api/helm/repo").fail(function (xhr) {
        reportError("Failed to get list of repositories", xhr)
    }).done(function (data) {
        $("#sectionRepo .repo-list").empty()

        data.forEach(function (elm) {
            let opt = $('<li class="mt-2 ps-2"><label><input type="radio" name="cluster" class="me-2"/><span></span></label></li>');
            opt.attr('title', elm.url)
            opt.find("input").val(elm.name).text(elm.name)
            opt.find("span").text(elm.name)
            if (getHashParam("repo") === elm.name) {
                opt.find("input").prop("checked", true)
            }
            $("#sectionRepo .repo-list").append(opt)
        })

        if (!data.length) {
            $("#sectionRepo .repo-list").text("No repositories found, try adding one")
        }
    })
}