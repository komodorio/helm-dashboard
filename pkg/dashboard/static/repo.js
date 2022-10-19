function loadRepoView() {
    $("#sectionRepo").show()

    $.getJSON("/api/helm/repo").fail(function (xhr) {
        reportError("Failed to get list of repositories", xhr)
    }).done(function (data) {
        const items = $("#sectionRepo .repo-list ul").empty()

        data.forEach(function (elm) {
            let opt = $('<li class="mb-2"><label><input type="radio" name="cluster" class="me-2"/><span></span></label></li>');
            opt.attr('title', elm.url)
            opt.find("input").val(elm.name).text(elm.name)
            opt.find("span").text(elm.name)
            if (getHashParam("repo") === elm.name) {
                opt.find("input").prop("checked", true)
            }
            items.append(opt)
        })

        if (!data.length) {
            items.text("No repositories found, try adding one")
        }
    })
}

$("#sectionRepo .repo-list .btn").click(function () {
    const myModal = new bootstrap.Modal(document.getElementById('repoAddModal'), {});
    myModal.show()
})

$("#repoAddModal .btn-confirm").click(function () {
    $("#repoAddModal .btn-confirm").prop("disabled", true).prepend('<span class="spinner-border spinner-border-sm mx-1" role="status" aria-hidden="true"></span>')
    $.ajax({
        type: 'POST',
        url: "/api/helm/repo",
        data: $("#repoAddModal form").serialize(),
    }).fail(function (xhr) {
        reportError("Failed to add repo", xhr)
    }).done(function (data) {
        setHashParam("repo", $("#repoAddModal form input[name=name]").val())
        window.location.reload()
    })
})