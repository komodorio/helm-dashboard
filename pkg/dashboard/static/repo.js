function loadRepoView() {
    $("#sectionRepo .repo-details").hide()
    $("#sectionRepo").show()

    $.getJSON("/api/helm/repo").fail(function (xhr) {
        reportError("Failed to get list of repositories", xhr)
    }).done(function (data) {
        const items = $("#sectionRepo .repo-list ul").empty()

        data.forEach(function (elm) {
            let opt = $('<li class="mb-2"><label><input type="radio" name="cluster" class="me-2"/><span></span></label></li>');
            opt.attr('title', elm.url)
            opt.find("input").val(elm.name).text(elm.name).data("item", elm)
            opt.find("span").text(elm.name)
            items.append(opt)
        })

        if (!data.length) {
            items.text("No repositories found, try adding one")
        }

        items.find("input").click(function () {
            const self=$(this)
            const elm = self.data("item");
            setHashParam("repo", elm.name)
            $("#sectionRepo .repo-details").show()
            $("#sectionRepo .repo-details h2").text(elm.name)
            $("#sectionRepo .repo-details .url span").text(elm.url)
        })

        if (getHashParam("repo")) {
            items.find("input[value='" + getHashParam("repo") + "']").click()
        } else {
            items.find("input").first().click()
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
    }).done(function () {
        setHashParam("repo", $("#repoAddModal form input[name=name]").val())
        window.location.reload()
    })
})