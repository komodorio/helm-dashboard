const mockData = {
  status: {
    CurVer: "0.0.0",
    LatestVer: "v1.3.1",
    Analytics: false,
    CacheHitRatio: 0,
    ClusterMode: false,
  },
  clusters: [
    {
      IsCurrent: true,
      Name: "docker-desktop",
      Cluster: "docker-desktop",
      AuthInfo: "docker-desktop",
      Namespace: "",
    },
  ],
  namespaces: {
    metadata: {
      resourceVersion: "2138754",
    },
    items: [
      {
        metadata: {
          name: "default",
          uid: "6b1ee2a8-0cb5-4a94-9731-a3e24c34c725",
          resourceVersion: "188",
          creationTimestamp: "2023-03-16T19:32:20Z",
          labels: {
            "kubernetes.io/metadata.name": "default",
          },
          managedFields: [
            {
              manager: "kube-apiserver",
              operation: "Update",
              apiVersion: "v1",
              time: "2023-03-16T19:32:20Z",
              fieldsType: "FieldsV1",
              fieldsV1: {
                "f:metadata": {
                  "f:labels": {
                    ".": {},
                    "f:kubernetes.io/metadata.name": {},
                  },
                },
              },
            },
          ],
        },
        spec: {
          finalizers: ["kubernetes"],
        },
        status: {
          phase: "Active",
        },
      },
      {
        metadata: {
          name: "kube-node-lease",
          uid: "729a5324-b38d-402f-a3b3-4479eb2a607d",
          resourceVersion: "40",
          creationTimestamp: "2023-03-16T19:32:18Z",
          labels: {
            "kubernetes.io/metadata.name": "kube-node-lease",
          },
          managedFields: [
            {
              manager: "kube-apiserver",
              operation: "Update",
              apiVersion: "v1",
              time: "2023-03-16T19:32:18Z",
              fieldsType: "FieldsV1",
              fieldsV1: {
                "f:metadata": {
                  "f:labels": {
                    ".": {},
                    "f:kubernetes.io/metadata.name": {},
                  },
                },
              },
            },
          ],
        },
        spec: {
          finalizers: ["kubernetes"],
        },
        status: {
          phase: "Active",
        },
      },
      {
        metadata: {
          name: "kube-public",
          uid: "de45c9dc-100b-482f-a4cb-f380e413d769",
          resourceVersion: "35",
          creationTimestamp: "2023-03-16T19:32:17Z",
          labels: {
            "kubernetes.io/metadata.name": "kube-public",
          },
          managedFields: [
            {
              manager: "kube-apiserver",
              operation: "Update",
              apiVersion: "v1",
              time: "2023-03-16T19:32:17Z",
              fieldsType: "FieldsV1",
              fieldsV1: {
                "f:metadata": {
                  "f:labels": {
                    ".": {},
                    "f:kubernetes.io/metadata.name": {},
                  },
                },
              },
            },
          ],
        },
        spec: {
          finalizers: ["kubernetes"],
        },
        status: {
          phase: "Active",
        },
      },
      {
        metadata: {
          name: "kube-system",
          uid: "786851e4-e58f-4c46-a52b-9d868b915262",
          resourceVersion: "16",
          creationTimestamp: "2023-03-16T19:32:17Z",
          labels: {
            "kubernetes.io/metadata.name": "kube-system",
          },
          managedFields: [
            {
              manager: "kube-apiserver",
              operation: "Update",
              apiVersion: "v1",
              time: "2023-03-16T19:32:17Z",
              fieldsType: "FieldsV1",
              fieldsV1: {
                "f:metadata": {
                  "f:labels": {
                    ".": {},
                    "f:kubernetes.io/metadata.name": {},
                  },
                },
              },
            },
          ],
        },
        spec: {
          finalizers: ["kubernetes"],
        },
        status: {
          phase: "Active",
        },
      },
    ],
  },
  installedReleases: [
    {
      id: "1",
      name: "argo-cd",
      namespace: "default",
      revision: "2",
      updated: "2023-04-05T08:00:07.7821687+03:00",
      status: "deployed",
      chart: "argo-cd-4.5.3",
      chartName: "argo-cd",
      chartVersion: "4.5.3",
      app_version: "2.6.7",
      icon: "https://bitnami.com/assets/stacks/argo-cd/img/argo-cd-stack-220x234.png",
      description:
        "Argo CD is a continuous delivery tool for Kubernetes based on GitOps.",
    },
    {
      id: "2",
      name: "mailhog",
      namespace: "default",
      revision: "1",
      updated: "2023-04-05T08:07:06.3105917+03:00",
      status: "deployed",
      chart: "mailhog-5.2.3",
      chartName: "mailhog",
      chartVersion: "5.2.3",
      app_version: "v1.0.1",
      icon: "https://raw.githubusercontent.com/mailhog/MailHog-UI/master/assets/images/hog.png",
      description: "An e-mail testing tool for developers",
    },
  ],
};

export default mockData;
