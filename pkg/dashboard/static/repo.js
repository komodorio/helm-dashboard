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
            const self = $(this)
            const elm = self.data("item");
            setHashParam("repo", elm.name)
            $("#sectionRepo .repo-details").show()
            $("#sectionRepo .repo-details h2").text(elm.name)
            $("#sectionRepo .repo-details .url").text(elm.url)

            $("#sectionRepo .repo-details ul").html('<span class="spinner-border spinner-border-sm mx-1" role="status" aria-hidden="true"></span>')
            $.getJSON("/api/helm/repo/charts?name=" + elm.name).fail(function (xhr) {
                reportError("Failed to get list of charts in repo", xhr)
            }).done(function (data) {
                $("#sectionRepo .repo-details ul").empty()
                data.forEach(function (elm) {
                    const li = $(`<li class="row p-2 rounded">
                        <h6 class="col-3 py-2">` + elm.name.split('/').pop() + `</h6>
                        <div class="col py-2">` + elm.description + `</div>
                        <div class="col-1 py-2">` + elm.version + `</div>
                        <div class="col-1 action text-nowrap"><button class="btn btn-sm border-secondary bg-white">Install</button></div>
                    </li>`)
                    li.data("item", elm)

                    if (elm.installed_namespace) {
                        li.find("button").text("View").addClass("btn-success").removeClass("bg-white")
                        li.find(".action").prepend("<i class='bi-check-circle-fill me-1 text-success' title='Already installed'></i>")
                    }

                    li.click(repoChartClicked)

                    $("#sectionRepo .repo-details ul").append(li)
                })
            })
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

$("#sectionRepo .btn-remove").click(function () {
    if (confirm("Confirm removing repository?")) {
        $.ajax({
            type: 'DELETE',
            url: "/api/helm/repo?name=" + $("#sectionRepo .repo-details h2").text(),
        }).fail(function (xhr) {
            reportError("Failed to add repo", xhr)
        }).done(function () {
            setHashParam("repo", null)
            window.location.reload()
        })
    }
})

$("#sectionRepo .btn-update").click(function () {
    $("#sectionRepo .btn-update i").removeClass("bi-arrow-repeat").append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
    $.ajax({
        type: 'POST',
        url: "/api/helm/repo/update?name=" + $("#sectionRepo .repo-details h2").text(),
    }).fail(function (xhr) {
        reportError("Failed to add repo", xhr)
    }).done(function () {
        window.location.reload()
    })
})

function repoChartClicked() {
    const self = $(this)
    const elm = self.data("item")
    if (elm.installed_namespace) {
        setHashParam("section", null)
        setHashParam("namespace", elm.installed_namespace)
        setHashParam("chart", elm.installed_name)
        window.location.reload()
    } else {
        popUpUpgrade(elm)
    }
}