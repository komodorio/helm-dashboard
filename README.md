# <img src="pkg/dashboard/static/logo.png" height=30 style="height: 2rem"> Helm Dashboard

A simplified way of working with Helm.

[<img src="screenshot.png" style="width: 100%; border: 1px solid silver;" border="1" alt="Screenshot">](screenshot.png)

## What it Does?

The _Helm Dashboard_ plugin offers a UI-driven way to view the installed Helm charts, see their revision history and corresponding k8s resources. Also, you can perform simple actions like roll back to a revision or upgrade to newer version.

This project is part of [Komodor's](https://komodor.io) vision of helping Kubernetes users to navigate and troubleshoot their clusters.

## Installing 

To install it, simply run Helm command:

```shell
helm plugin install https://github.com/komodorio/helm-dashboard.git
```

To uninstall, run:

```shell
helm plugin uninstall dashboard
```

## Running

To use the plugin, your machine needs to have working `helm` and also `kubectl` commands.

After installing, start the UI by running:
```shell
helm dashboard
```

The command above will launch the local Web server and will open the UI in new browser tab. The command will hang waiting for you to terminate it in command-line or web UI.

By default, the web server is only available locally. You can change that by specifying `HD_BIND` environment variable to the desired value. For example, `0.0.0.0` would bind to all IPv4 addresses or `[::0]` would be all IPv6 addresses.

If your port 8080 is busy, you can specify a different port to use via `HD_PORT` environment variable.

If you don't want browser tab to automatically open, set `HD_NOBROWSER=1` in your environment variables.

If you want to increase the logging verbosity and see all the debug info, set `DEBUG=1` environment variable.

## Support Channels

We have two main channels for supporting the Helm Dashboard users: [Slack community](https://komodorkommunity.slack.com/x-p3820586794880-3937175868755-4092688791734/archives/C042U85BD45/p1663573506220839) for general conversations
and [GitHub issues](https://github.com/komodorio/helm-dashboard/issues) for real bugs.


## Roadmap & Ideas

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

## Local Dev Testing

Prerequisites: `helm` and `kubectl` binaries installed and operational.

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
