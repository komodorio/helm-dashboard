import { StoryFn } from "@storybook/react";
import { Props, UpsertChart } from "./InstallChart";

const chartValues = `
replicaCount: 1

# Flag for setting environment to debug mode 
debug: false

image:
  repository: komodorio/helm-dashboard
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: ""

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  # Specifies whether a service account should be created
  create: true
  # The name of the service account to use.
  # If not set and create is true, a name is generated using the fullname template
  name: ""

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1
    memory: 1Gi
            `

const diff = `
--- current.yaml
+++ upgraded.yaml
@@ -5,10 +5,10 @@
 metadata:
   name: helm-dashboard2224
   labels:
-    helm.sh/chart: helm-dashboard-0.1.10
+    helm.sh/chart: helm-dashboard-0.1.7
     app.kubernetes.io/name: helm-dashboard
     app.kubernetes.io/instance: helm-dashboard2224
-    app.kubernetes.io/version: "1.3.3"
+    app.kubernetes.io/version: "1.3.0"
     app.kubernetes.io/managed-by: Helm
 ---
 # Source: helm-dashboard/templates/pvc.yaml
@@ -18,12 +16,13 @@
   name: helm-dashboard2224
   namespace: "default"
   labels:
-    helm.sh/chart: helm-dashboard-0.1.10
+    helm.sh/chart: helm-dashboard-0.1.7
     app.kubernetes.io/name: helm-dashboard
     app.kubernetes.io/instance: helm-dashboard2224
-    app.kubernetes.io/version: "1.3.3"
+    app.kubernetes.io/version: "1.3.0"
     app.kubernetes.io/managed-by: Helm
 spec:
+  storageClassName: ""
   accessModes:
     - "ReadWriteOnce"
   resources:
@@ -60,10 +55,10 @@
 metadata:
   name: helm-dashboard2224
   labels:
-    helm.sh/chart: helm-dashboard-0.1.10
+    helm.sh/chart: helm-dashboard-0.1.7
     app.kubernetes.io/name: helm-dashboard
     app.kubernetes.io/instance: helm-dashboard2224
-    app.kubernetes.io/version: "1.3.3"
+    app.kubernetes.io/version: "1.3.0"
     app.kubernetes.io/managed-by: Helm
 spec:
   type: ClusterIP
@@ -82,10 +75,10 @@
 metadata:
   name: helm-dashboard2224
   labels:
-    helm.sh/chart: helm-dashboard-0.1.10
+    helm.sh/chart: helm-dashboard-0.1.7
     app.kubernetes.io/name: helm-dashboard
     app.kubernetes.io/instance: helm-dashboard2224
-    app.kubernetes.io/version: "1.3.3"
+    app.kubernetes.io/version: "1.3.0"
     app.kubernetes.io/managed-by: Helm
 spec:
   replicas: 1
@@ -113,7 +104,7 @@
             - --bind=0.0.0.0
           securityContext:
             {}
-          image: "komodorio/helm-dashboard:1.3.3"
+          image: "komodorio/helm-dashboard:1.3.0"
           imagePullPolicy: IfNotPresent
           env:
             - name: HELM_CACHE_HOME

`
const Template: StoryFn<Props> = (args) => <UpsertChart {...args} />;
export const Install = Template.bind({});
Install.args = {
    state: 'install',
}

export const Upgrade = Template.bind({});
Upgrade.args = {
    state: 'upgrade',
    releaseName: 'release name',
    namespace: 'namespace',
}

export default {
    title: 'InstallChart',
    component: UpsertChart,
    args: {
        diff: {
            state: 'hasValue',
            value: diff,
        },
        onChange: () => { },
        onSubmit: () => { },
        chartValues: {
            state: 'hasValue',
            value: chartValues,
        },
        clusterName: 'cluster name',
        state: 'install',
        chartName: 'chart name',
        versions: [
            {
                repository: 'repo',
                version: '1.0.0',
                isInstalledVersion: false,
            },
            {
                repository: 'repo',
                version: '1.0.1',
                isInstalledVersion: false,
            },
            {
                repository: 'repo',
                version: '1.0.2',
                isInstalledVersion: false,
            },
        ],
        onSelectVersion: () => { },
    } as Props,
} as const;

