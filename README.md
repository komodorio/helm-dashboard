# <img src="pkg/dashboard/static/logo.png" height=30 style="height: 2rem"> Helm Dashboard

A simplified way of working with Helm.

[<img src="screenshot.png" style="width: 100%; border: 1px solid silver">](screenshot.png)

## Local Testing

Prerequisites: `helm` and `kubectl` binaries installed and operational.

Until we make our repo public, we have to use a custom way to install the plugin.

There is a need to build binary for plugin to function, run:

```shell
go build -o bin/dashboard .
```

To install, checkout the source code and run from source dir:

```shell
helm plugin install .
```

Local install of plugin just creates a symlink, so making the changes and rebuilding the binary would not require to
reinstall a plugin.

To use the plugin, run in your terminal:

```shell
helm dashboard
```

Then, use the web UI.

## Uninstalling

To uninstall, run:

```shell
helm plugin uninstall dashboard
```

## Support Channels

We have two main channels for supporting the Helm Dashboard users: [Slack community](https://komodorkommunity.slack.com/x-p3820586794880-3937175868755-4092688791734/archives/C042U85BD45/p1663573506220839) for general conversations
and [GitHub issues](https://github.com/komodorio/helm-dashboard/issues) for real bugs.

## Roadmap

### First Public Version

- CLI launcher
- Web Server with REST API
- Listing the installed applications
- View k8s resources created by the application (describe, status)
- Viewing revision history for application
- View manifest diffs between revisions, also changelogs etc
- Analytics reporting (telemetry)
- Rollback to a revision
- Check for repo updates & upgrade flow
- Uninstalling the app completely
- Switch clusters
- Show manifest/describe upon clicking on resource

- Helm Plugin Packaging
- Styled properly

### Further Ideas
- solve umbrella-chart case
- use `--dry-run` instead of `template`
- Have cleaner idea on the web API structure
- Recognise & show ArgoCD-originating charts/objects, those `helm ls` does not show
- Recognise the revisions that are rollbacks by their description and mark in timeline

#### Topic "Validating Manifests"

- Validate manifests before deploy and get better errors
- See if we can build in Chechov or Validkube validation

#### Iteration "Value Setting"

- Setting parameter values and installing
- Reconfiguring the application

#### Iteration "Repo View"

- Browsing repositories
- Adding new repository
- Installing new app from repo
