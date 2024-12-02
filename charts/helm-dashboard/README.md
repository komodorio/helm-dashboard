# Helm Dashboard

## TL;DR;

```bash
helm repo add komodorio https://helm-charts.komodor.io
helm repo update
helm upgrade --install helm-dashboard komodorio/helm-dashboard
```

## Introduction

This chart bootstraps a Helm Dashboard deployment on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

While installed inside cluster, Helm Dashboard will run some additional background actions, for example, will automatically update Helm repositories. To enable that behavior locally, set `HD_CLUSTER_MODE` env variable.

## Prerequisites

- Kubernetes 1.16+

## Installing the Chart

To install the chart with the release name `helm-dashboard`:

```bash
helm install helm-dashboard .
```

The command deploys Helm Dashboard on the Kubernetes cluster in the default configuration. The [Parameters](#parameters) section lists the parameters that can be configured during installation.

> **Tip**: List all releases using `helm list`

## Uninstalling the Chart

To uninstall/delete the `helm-dashboard` deployment:

```bash
helm uninstall helm-dashboard
```

The command removes all the Kubernetes components associated with the chart and deletes the release.

## Adding Authentication

The task of authentication and user control is out of scope for Helm Dashboard. Luckily, there are third-party solutions which are dedicated to provide that functionality.

For instance, you can place authentication proxy in front of Helm Dashboard, like this one: https://github.com/oauth2-proxy/oauth2-proxy

## Parameters

The following table lists the configurable parameters of the chart and their default values.

| Parameter                             | Description                                                                                    | Default                          |
|---------------------------------------|------------------------------------------------------------------------------------------------|----------------------------------|
| `global.imageRegistry`                | Registry for all images, useful for private registry                                           | `""`                             |
| `global.imagePullSecrets`             | Specify Docker-registry secret names as an array                                               | `[]`                             |
| `image.repository`                    | Image registry/name                                                                            | `komodorio/helm-dashboard`       |
| `image.tag`                           | Image tag                                                                                      |                                  |
| `image.imagePullSecrets`              | Specify Docker-registry secret names as an array                                               | `[]`                             |
| `image.pullPolicy`                    | Image pull policy                                                                              | `IfNotPresent`                   |
| `replicaCount`                        | Number of dashboard Pods to run                                                                | `1`                              |
| `dashboard.allowWriteActions`         | Enables write actions. Allow modifying, deleting and creating charts and kubernetes resources. | `true`                           |
| `resources.requests.cpu`              | CPU resource requests                                                                          | `200m`                           |
| `resources.limits.cpu`                | CPU resource limits                                                                            | `1`                              |
| `resources.requests.memory`           | Memory resource requests                                                                       | `256Mi`                          |
| `resources.limits.memory`             | Memory resource limits                                                                         | `1Gi`                            |
| `service.type           `             | Kubernetes service type                                                                        | `ClusterIP`                      |
| `service.port           `             | Kubernetes service port                                                                        | `8080`                           |
| `serviceAccount.create`               | Creates a service account                                                                      | `true`                           |
| `serviceAccount.name`                 | Optional name for the service account                                                          | `{RELEASE_FULLNAME}`             |
| `nodeSelector`                        | Node labels for pod assignment                                                                 |                                  |
| `affinity`                            | Affinity settings for pod assignment                                                           |                                  |
| `tolerations`                         | Tolerations for pod assignment                                                                 |                                  |
| `dashboard.persistence.enabled`       | Enable helm data persistene using PVC                                                          | `true`                           |
| `dashboard.persistence.accessModes`   | Persistent Volume access modes                                                                 | `["ReadWriteOnce"]`              |
| `dashboard.persistence.storageClass`  | Persistent Volume storage class                                                                | `""`                             |
| `dashboard.persistence.size`          | Persistent Volume size                                                                         | `100M`                           |
| `dashboard.persistence.finalizers`    | Finalizers for the Persistent Volume Claim                                                     | `[kubernetes.io/pvc-protection]`                             |
| `dashboard.persistence.lookupVolumeName` | Lookup volume name for the Persistent Volume Claim                                             | `true`                             |
| `updateStrategy.type`                 | Set up update strategy for helm-dashboard installation.                                        | `RollingUpdate`                  |             
| `extraArgs`                           | Set the arguments to be supplied to the helm-dashboard binary                                  | `[--no-browser, --bind=0.0.0.0]` |
| `testImage.repository`                | Test image registry/name                                                                       | `busybox`                        |
| `testImage.tag`                       | Test image tag                                                                                 | `lastest`                        |
| `testImage.imagePullSecrets`          | Specify Docker-registry secret names as an array                                               | `[]`                             |
| `testImage.pullPolicy`                | Test image pull policy                                                                         | `IfNotPresent`                   |
Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`.

```bash
helm upgrade --install helm-dashboard komodorio/helm-dashboard --set dashboard.allowWriteActions=true --set service.port=9090
```

> **Tip**: You can use the default [values.yaml](values.yaml)
