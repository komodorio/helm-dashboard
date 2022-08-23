# Helm Dashboard

A simplified way of working with Helm.

## Local Testing

Until we make our repo public, we have to use a custom way to install the plugin.

To install, checkout the source code and run from source dir:
```shell
helm plugin install .
```

There is a need to build binary for plugin to function, run:
```shell
go build -o bin/dashboard .
```

Local install of plugin just creates a symlink, so making the changes and rebuilding the binary would not require reinstall of a plugin.

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


## Roadmap

### Internal Milestone 1
- Helm Plugin Packaging
- CLI launcher
- Web Server with REST API


### First Public Version
Listing the installed applications
View k8s resources created by the application (describe, status)
Viewing revision history for application
View manifest diffs between revisions, also changelogs etc
Analytics reporting (telemetry)

### Further Ideas
Setting parameter values and installing
Installing new app from repo
Uninstalling the app completely
Reconfiguring the application
Rollback a revision

Validate manifests before deploy and get better errors
Switch clusters (?)
Browsing repositories
Adding new repository
