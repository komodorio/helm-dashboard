describe("Adding repository flow", () => {
  it("Adding new chart repository", () => {
    cy.intercept("GET", "http://localhost:5173/status", {
      CurVer: "0.0.0",
      LatestVer: "v1.3.3",
      Analytics: false,
      CacheHitRatio: 0,
      ClusterMode: false,
    }).as("status");

    cy.visit(
      "http://localhost:5173/#/minikube/installed?filteredNamespace=default"
    );

    cy.get("[data-cy='navigation-link']").contains("Repository").click();
    cy.get("[data-cy='install-repository-button']").click();

    cy.get("[data-cy='add-chart-name']").type("Komodorio");
    cy.get("[data-cy='add-chart-url']").type("https://helm-charts.komodor.io");

    cy.intercept("GET", "http://localhost:5173/api/helm/repositories", [
      {
        name: "Komodorio",
        url: "https://helm-charts.komodor.io",
      },
    ]).as("repositories");

    // cy.intercept("GET", "http://localhost:5173/api/k8s/contexts", [
    //   {
    //     IsCurrent: true,
    //     Name: "minikube",
    //     Cluster: "minikube",
    //     AuthInfo: "minikube",
    //     Namespace: "default",
    //   },
    // ]).as("k8s-contexts");

    cy.get("[data-cy='add-chart-repository-button']").click();

    cy.contains("https://helm-charts.komodor.io");

    cy.get("[data-cy='chart-viewer-install-button']")
      .eq(0)
      .click({ force: true })
      .contains("Install")
      .click();

    cy.intercept("POST", "http://localhost:5173/api/helm/releases/default", {
      name: "helm-dashboard",
      info: {
        first_deployed: "2024-01-17T22:25:14.933425+02:00",
        last_deployed: "2024-01-17T22:25:14.933425+02:00",
        deleted: "",
        description: "Install complete",
        status: "deployed",
        notes:
          'Thank you for installing Helm Dashboard.\nHelm Dashboard can be accessed:\n  * Within your cluster, at the following DNS name at port 8080:\n\n    helm-dashboard.default.svc.cluster.local\n\n  * From outside the cluster, run these commands in the same shell:\n\n    export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=helm-dashboard,app.kubernetes.io/instance=helm-dashboard" -o jsonpath="{.items[0].metadata.name}")\n    export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")\n    echo "Visit http://127.0.0.1:8080 to use your application"\n    kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT\n\nVisit our repo at:\nhttps://github.com/komodorio/helm-dashboard\n\n',
      },
      chart: {
        metadata: {
          name: "helm-dashboard",
          version: "0.1.10",
          description: "A GUI Dashboard for Helm by Komodor",
          icon: "https://raw.githubusercontent.com/komodorio/helm-dashboard/main/pkg/dashboard/static/logo.svg",
          apiVersion: "v2",
          appVersion: "1.3.3",
          type: "application",
        },
        lock: null,
        templates: [
          {
            name: "templates/NOTES.txt",
            data: "VGhhbmsgeW91IGZvciBpbnN0YWxsaW5nIEhlbG0gRGFzaGJvYXJkLgpIZWxtIERhc2hib2FyZCBjYW4gYmUgYWNjZXNzZWQ6CiAgKiBXaXRoaW4geW91ciBjbHVzdGVyLCBhdCB0aGUgZm9sbG93aW5nIEROUyBuYW1lIGF0IHBvcnQge3sgLlZhbHVlcy5zZXJ2aWNlLnBvcnQgfX06CgogICAge3sgdGVtcGxhdGUgImhlbG0tZGFzaGJvYXJkLmZ1bGxuYW1lIiAuIH19Lnt7IC5SZWxlYXNlLk5hbWVzcGFjZSB9fS5zdmMuY2x1c3Rlci5sb2NhbAoKICAqIEZyb20gb3V0c2lkZSB0aGUgY2x1c3RlciwgcnVuIHRoZXNlIGNvbW1hbmRzIGluIHRoZSBzYW1lIHNoZWxsOgoKICAgIGV4cG9ydCBQT0RfTkFNRT0kKGt1YmVjdGwgZ2V0IHBvZHMgLS1uYW1lc3BhY2Uge3sgLlJlbGVhc2UuTmFtZXNwYWNlIH19IC1sICJhcHAua3ViZXJuZXRlcy5pby9uYW1lPXt7IGluY2x1ZGUgImhlbG0tZGFzaGJvYXJkLm5hbWUiIC4gfX0sYXBwLmt1YmVybmV0ZXMuaW8vaW5zdGFuY2U9e3sgLlJlbGVhc2UuTmFtZSB9fSIgLW8ganNvbnBhdGg9InsuaXRlbXNbMF0ubWV0YWRhdGEubmFtZX0iKQogICAgZXhwb3J0IENPTlRBSU5FUl9QT1JUPSQoa3ViZWN0bCBnZXQgcG9kIC0tbmFtZXNwYWNlIHt7IC5SZWxlYXNlLk5hbWVzcGFjZSB9fSAkUE9EX05BTUUgLW8ganNvbnBhdGg9Insuc3BlYy5jb250YWluZXJzWzBdLnBvcnRzWzBdLmNvbnRhaW5lclBvcnR9IikKICAgIGVjaG8gIlZpc2l0IGh0dHA6Ly8xMjcuMC4wLjE6ODA4MCB0byB1c2UgeW91ciBhcHBsaWNhdGlvbiIKICAgIGt1YmVjdGwgLS1uYW1lc3BhY2Uge3sgLlJlbGVhc2UuTmFtZXNwYWNlIH19IHBvcnQtZm9yd2FyZCAkUE9EX05BTUUgODA4MDokQ09OVEFJTkVSX1BPUlQKClZpc2l0IG91ciByZXBvIGF0OgpodHRwczovL2dpdGh1Yi5jb20va29tb2RvcmlvL2hlbG0tZGFzaGJvYXJkCgo=",
          },
          {
            name: "templates/_helpers.tpl",
            data: "e3svKgpFeHBhbmQgdGhlIG5hbWUgb2YgdGhlIGNoYXJ0LgoqL319Cnt7LSBkZWZpbmUgImhlbG0tZGFzaGJvYXJkLm5hbWUiIC19fQp7ey0gZGVmYXVsdCAuQ2hhcnQuTmFtZSAuVmFsdWVzLm5hbWVPdmVycmlkZSB8IHRydW5jIDYzIHwgdHJpbVN1ZmZpeCAiLSIgfX0Ke3stIGVuZCB9fQoKe3svKgpDcmVhdGUgYSBkZWZhdWx0IGZ1bGx5IHF1YWxpZmllZCBhcHAgbmFtZS4KV2UgdHJ1bmNhdGUgYXQgNjMgY2hhcnMgYmVjYXVzZSBzb21lIEt1YmVybmV0ZXMgbmFtZSBmaWVsZHMgYXJlIGxpbWl0ZWQgdG8gdGhpcyAoYnkgdGhlIEROUyBuYW1pbmcgc3BlYykuCklmIHJlbGVhc2UgbmFtZSBjb250YWlucyBjaGFydCBuYW1lIGl0IHdpbGwgYmUgdXNlZCBhcyBhIGZ1bGwgbmFtZS4KKi99fQp7ey0gZGVmaW5lICJoZWxtLWRhc2hib2FyZC5mdWxsbmFtZSIgLX19Cnt7LSBpZiAuVmFsdWVzLmZ1bGxuYW1lT3ZlcnJpZGUgfX0Ke3stIC5WYWx1ZXMuZnVsbG5hbWVPdmVycmlkZSB8IHRydW5jIDYzIHwgdHJpbVN1ZmZpeCAiLSIgfX0Ke3stIGVsc2UgfX0Ke3stICRuYW1lIDo9IGRlZmF1bHQgLkNoYXJ0Lk5hbWUgLlZhbHVlcy5uYW1lT3ZlcnJpZGUgfX0Ke3stIGlmIGNvbnRhaW5zICRuYW1lIC5SZWxlYXNlLk5hbWUgfX0Ke3stIC5SZWxlYXNlLk5hbWUgfCB0cnVuYyA2MyB8IHRyaW1TdWZmaXggIi0iIH19Cnt7LSBlbHNlIH19Cnt7LSBwcmludGYgIiVzLSVzIiAuUmVsZWFzZS5OYW1lICRuYW1lIHwgdHJ1bmMgNjMgfCB0cmltU3VmZml4ICItIiB9fQp7ey0gZW5kIH19Cnt7LSBlbmQgfX0Ke3stIGVuZCB9fQoKe3svKgpDcmVhdGUgY2hhcnQgbmFtZSBhbmQgdmVyc2lvbiBhcyB1c2VkIGJ5IHRoZSBjaGFydCBsYWJlbC4KKi99fQp7ey0gZGVmaW5lICJoZWxtLWRhc2hib2FyZC5jaGFydCIgLX19Cnt7LSBwcmludGYgIiVzLSVzIiAuQ2hhcnQuTmFtZSAuQ2hhcnQuVmVyc2lvbiB8IHJlcGxhY2UgIisiICJfIiB8IHRydW5jIDYzIHwgdHJpbVN1ZmZpeCAiLSIgfX0Ke3stIGVuZCB9fQoKe3svKgpDb21tb24gbGFiZWxzCiovfX0Ke3stIGRlZmluZSAiaGVsbS1kYXNoYm9hcmQubGFiZWxzIiAtfX0KaGVsbS5zaC9jaGFydDoge3sgaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQuY2hhcnQiIC4gfX0Ke3sgaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQuc2VsZWN0b3JMYWJlbHMiIC4gfX0Ke3stIGlmIC5DaGFydC5BcHBWZXJzaW9uIH19CmFwcC5rdWJlcm5ldGVzLmlvL3ZlcnNpb246IHt7IC5DaGFydC5BcHBWZXJzaW9uIHwgcXVvdGUgfX0Ke3stIGVuZCB9fQphcHAua3ViZXJuZXRlcy5pby9tYW5hZ2VkLWJ5OiB7eyAuUmVsZWFzZS5TZXJ2aWNlIH19Cnt7LSBlbmQgfX0KCnt7LyoKU2VsZWN0b3IgbGFiZWxzCiovfX0Ke3stIGRlZmluZSAiaGVsbS1kYXNoYm9hcmQuc2VsZWN0b3JMYWJlbHMiIC19fQphcHAua3ViZXJuZXRlcy5pby9uYW1lOiB7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5uYW1lIiAuIH19CmFwcC5rdWJlcm5ldGVzLmlvL2luc3RhbmNlOiB7eyAuUmVsZWFzZS5OYW1lIH19Cnt7LSBlbmQgfX0KCnt7LyoKQ3JlYXRlIHRoZSBuYW1lIG9mIHRoZSBzZXJ2aWNlIGFjY291bnQgdG8gdXNlCiovfX0Ke3stIGRlZmluZSAiaGVsbS1kYXNoYm9hcmQuc2VydmljZUFjY291bnROYW1lIiAtfX0Ke3stIGlmIC5WYWx1ZXMuc2VydmljZUFjY291bnQuY3JlYXRlIH19Cnt7LSBkZWZhdWx0IChpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5mdWxsbmFtZSIgLikgLlZhbHVlcy5zZXJ2aWNlQWNjb3VudC5uYW1lIH19Cnt7LSBlbHNlIH19Cnt7LSBkZWZhdWx0ICJkZWZhdWx0IiAuVmFsdWVzLnNlcnZpY2VBY2NvdW50Lm5hbWUgfX0Ke3stIGVuZCB9fQp7ey0gZW5kIH19Cg==",
          },
          {
            name: "templates/deployment.yaml",
            data: "YXBpVmVyc2lvbjogYXBwcy92MQpraW5kOiBEZXBsb3ltZW50Cm1ldGFkYXRhOgogIG5hbWU6IHt7IGluY2x1ZGUgImhlbG0tZGFzaGJvYXJkLmZ1bGxuYW1lIiAuIH19CiAgbGFiZWxzOgogICAge3stIGluY2x1ZGUgImhlbG0tZGFzaGJvYXJkLmxhYmVscyIgLiB8IG5pbmRlbnQgNCB9fQpzcGVjOgogIHt7LSBpZiBub3QgLlZhbHVlcy5hdXRvc2NhbGluZy5lbmFibGVkIH19CiAgcmVwbGljYXM6IHt7IC5WYWx1ZXMucmVwbGljYUNvdW50IH19CiAge3stIGVuZCB9fQogIHNlbGVjdG9yOgogICAgbWF0Y2hMYWJlbHM6CiAgICAgIHt7LSBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5zZWxlY3RvckxhYmVscyIgLiB8IG5pbmRlbnQgNiB9fQogIHN0cmF0ZWd5OiB7ey0gdG9ZYW1sIC5WYWx1ZXMudXBkYXRlU3RyYXRlZ3kgfCBuaW5kZW50IDQgfX0KICB0ZW1wbGF0ZToKICAgIG1ldGFkYXRhOgogICAgICB7ey0gd2l0aCAuVmFsdWVzLnBvZEFubm90YXRpb25zIH19CiAgICAgIGFubm90YXRpb25zOgogICAgICAgIHt7LSB0b1lhbWwgLiB8IG5pbmRlbnQgOCB9fQogICAgICB7ey0gZW5kIH19CiAgICAgIGxhYmVsczoKICAgICAgICB7ey0gaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQuc2VsZWN0b3JMYWJlbHMiIC4gfCBuaW5kZW50IDggfX0KICAgIHNwZWM6CiAgICAgIHt7LSB3aXRoIC5WYWx1ZXMuaW1hZ2VQdWxsU2VjcmV0cyB9fQogICAgICBpbWFnZVB1bGxTZWNyZXRzOgogICAgICAgIHt7LSB0b1lhbWwgLiB8IG5pbmRlbnQgOCB9fQogICAgICB7ey0gZW5kIH19CiAgICAgIHNlcnZpY2VBY2NvdW50TmFtZToge3sgaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQuc2VydmljZUFjY291bnROYW1lIiAuIH19CiAgICAgIHNlY3VyaXR5Q29udGV4dDoKICAgICAgICB7ey0gdG9ZYW1sIC5WYWx1ZXMucG9kU2VjdXJpdHlDb250ZXh0IHwgbmluZGVudCA4IH19CiAgICAgIGNvbnRhaW5lcnM6CiAgICAgICAgLSBuYW1lOiB7eyAuQ2hhcnQuTmFtZSB9fQogICAgICAgICAgY29tbWFuZDoKICAgICAgICAgICAgLSAvYmluL2hlbG0tZGFzaGJvYXJkCiAgICAgICAgICBhcmdzOgogICAgICAgICAge3stIHdpdGggLlZhbHVlcy5leHRyYUFyZ3MgfX0KICAgICAgICAgICAge3stIHRvWWFtbCAuIHwgbmluZGVudCAxMiB9fQogICAgICAgICAge3stIGVuZCB9fQogICAgICAgICAgc2VjdXJpdHlDb250ZXh0OgogICAgICAgICAgICB7ey0gdG9ZYW1sIC5WYWx1ZXMuc2VjdXJpdHlDb250ZXh0IHwgbmluZGVudCAxMiB9fQogICAgICAgICAgaW1hZ2U6ICJ7eyAuVmFsdWVzLmltYWdlLnJlcG9zaXRvcnkgfX06e3sgLlZhbHVlcy5pbWFnZS50YWcgfCBkZWZhdWx0IC5DaGFydC5BcHBWZXJzaW9uIH19IgogICAgICAgICAgaW1hZ2VQdWxsUG9saWN5OiB7eyAuVmFsdWVzLmltYWdlLnB1bGxQb2xpY3kgfX0KICAgICAgICAgIGVudjoKICAgICAgICAgICAgLSBuYW1lOiBIRUxNX0NBQ0hFX0hPTUUKICAgICAgICAgICAgICB2YWx1ZTogL29wdC9kYXNoYm9hcmQvaGVsbS9jYWNoZQogICAgICAgICAgICAtIG5hbWU6IEhFTE1fQ09ORklHX0hPTUUKICAgICAgICAgICAgICB2YWx1ZTogL29wdC9kYXNoYm9hcmQvaGVsbS9jb25maWcKICAgICAgICAgICAgLSBuYW1lOiBIRUxNX0RBVEFfSE9NRQogICAgICAgICAgICAgIHZhbHVlOiAvb3B0L2Rhc2hib2FyZC9oZWxtL2RhdGEKICAgICAgICAgICAgLSBuYW1lOiBERUJVRwogICAgICAgICAgICAgIHZhbHVlOiB7ey0gdGVybmFyeSAiIDEiICIiIC5WYWx1ZXMuZGVidWcgfX0KICAgICAgICAgICAge3stIGlmIC5WYWx1ZXMuZGFzaGJvYXJkLm5hbWVzcGFjZSB9fQogICAgICAgICAgICAtIG5hbWU6IEhFTE1fTkFNRVNQQUNFCiAgICAgICAgICAgICAgdmFsdWU6IHt7IC5WYWx1ZXMuZGFzaGJvYXJkLm5hbWVzcGFjZSB9fQogICAgICAgICAgICB7e2VuZH19CiAgICAgICAgICBwb3J0czoKICAgICAgICAgICAgLSBuYW1lOiBodHRwCiAgICAgICAgICAgICAgY29udGFpbmVyUG9ydDogODA4MAogICAgICAgICAgICAgIHByb3RvY29sOiBUQ1AKICAgICAgICAgIGxpdmVuZXNzUHJvYmU6CiAgICAgICAgICAgIGh0dHBHZXQ6CiAgICAgICAgICAgICAgcGF0aDogL3N0YXR1cwogICAgICAgICAgICAgIHBvcnQ6IGh0dHAKICAgICAgICAgIHJlYWRpbmVzc1Byb2JlOgogICAgICAgICAgICBodHRwR2V0OgogICAgICAgICAgICAgIHBhdGg6IC9zdGF0dXMKICAgICAgICAgICAgICBwb3J0OiBodHRwCiAgICAgICAgICByZXNvdXJjZXM6CiAgICAgICAgICAgIHt7LSB0b1lhbWwgLlZhbHVlcy5yZXNvdXJjZXMgfCBuaW5kZW50IDEyIH19CiAgICAgICAgICB2b2x1bWVNb3VudHM6CiAgICAgICAgICAgIC0gbmFtZTogZGF0YQogICAgICAgICAgICAgIG1vdW50UGF0aDogL29wdC9kYXNoYm9hcmQvaGVsbQogICAgICB7ey0gd2l0aCAuVmFsdWVzLm5vZGVTZWxlY3RvciB9fQogICAgICBub2RlU2VsZWN0b3I6CiAgICAgICAge3stIHRvWWFtbCAuIHwgbmluZGVudCA4IH19CiAgICAgIHt7LSBlbmQgfX0KICAgICAge3stIHdpdGggLlZhbHVlcy5hZmZpbml0eSB9fQogICAgICBhZmZpbml0eToKICAgICAgICB7ey0gdG9ZYW1sIC4gfCBuaW5kZW50IDggfX0KICAgICAge3stIGVuZCB9fQogICAgICB7ey0gd2l0aCAuVmFsdWVzLnRvbGVyYXRpb25zIH19CiAgICAgIHRvbGVyYXRpb25zOgogICAgICAgIHt7LSB0b1lhbWwgLiB8IG5pbmRlbnQgOCB9fQogICAgICB7ey0gZW5kIH19CiAgICAgIHZvbHVtZXM6CiAgICAgICAgLSBuYW1lOiBkYXRhCiAgICAgICAge3stIGlmIC5WYWx1ZXMuZGFzaGJvYXJkLnBlcnNpc3RlbmNlLmVuYWJsZWQgfX0KICAgICAgICAgIHBlcnNpc3RlbnRWb2x1bWVDbGFpbToKICAgICAgICAgICAgY2xhaW1OYW1lOiB7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5mdWxsbmFtZSIgLiB9fQogICAgICAgIHt7LSBlbHNlIH19CiAgICAgICAgICBlbXB0eURpcjogeyB9CiAgICAgICAge3stIGVuZCB9fQoK",
          },
          {
            name: "templates/ingress.yaml",
            data: "e3stIGlmIC5WYWx1ZXMuaW5ncmVzcy5lbmFibGVkIC19fQp7ey0gJGZ1bGxOYW1lIDo9IGluY2x1ZGUgImhlbG0tZGFzaGJvYXJkLmZ1bGxuYW1lIiAuIC19fQp7ey0gJHN2Y1BvcnQgOj0gLlZhbHVlcy5zZXJ2aWNlLnBvcnQgLX19Cnt7LSBpZiBhbmQgLlZhbHVlcy5pbmdyZXNzLmNsYXNzTmFtZSAobm90IChzZW12ZXJDb21wYXJlICI+PTEuMTgtMCIgLkNhcGFiaWxpdGllcy5LdWJlVmVyc2lvbi5HaXRWZXJzaW9uKSkgfX0KICB7ey0gaWYgbm90IChoYXNLZXkgLlZhbHVlcy5pbmdyZXNzLmFubm90YXRpb25zICJrdWJlcm5ldGVzLmlvL2luZ3Jlc3MuY2xhc3MiKSB9fQogIHt7LSAkXyA6PSBzZXQgLlZhbHVlcy5pbmdyZXNzLmFubm90YXRpb25zICJrdWJlcm5ldGVzLmlvL2luZ3Jlc3MuY2xhc3MiIC5WYWx1ZXMuaW5ncmVzcy5jbGFzc05hbWV9fQogIHt7LSBlbmQgfX0Ke3stIGVuZCB9fQp7ey0gaWYgc2VtdmVyQ29tcGFyZSAiPj0xLjE5LTAiIC5DYXBhYmlsaXRpZXMuS3ViZVZlcnNpb24uR2l0VmVyc2lvbiAtfX0KYXBpVmVyc2lvbjogbmV0d29ya2luZy5rOHMuaW8vdjEKe3stIGVsc2UgaWYgc2VtdmVyQ29tcGFyZSAiPj0xLjE0LTAiIC5DYXBhYmlsaXRpZXMuS3ViZVZlcnNpb24uR2l0VmVyc2lvbiAtfX0KYXBpVmVyc2lvbjogbmV0d29ya2luZy5rOHMuaW8vdjFiZXRhMQp7ey0gZWxzZSAtfX0KYXBpVmVyc2lvbjogZXh0ZW5zaW9ucy92MWJldGExCnt7LSBlbmQgfX0Ka2luZDogSW5ncmVzcwptZXRhZGF0YToKICBuYW1lOiB7eyAkZnVsbE5hbWUgfX0KICBsYWJlbHM6CiAgICB7ey0gaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQubGFiZWxzIiAuIHwgbmluZGVudCA0IH19CiAge3stIHdpdGggLlZhbHVlcy5pbmdyZXNzLmFubm90YXRpb25zIH19CiAgYW5ub3RhdGlvbnM6CiAgICB7ey0gdG9ZYW1sIC4gfCBuaW5kZW50IDQgfX0KICB7ey0gZW5kIH19CnNwZWM6CiAge3stIGlmIGFuZCAuVmFsdWVzLmluZ3Jlc3MuY2xhc3NOYW1lIChzZW12ZXJDb21wYXJlICI+PTEuMTgtMCIgLkNhcGFiaWxpdGllcy5LdWJlVmVyc2lvbi5HaXRWZXJzaW9uKSB9fQogIGluZ3Jlc3NDbGFzc05hbWU6IHt7IC5WYWx1ZXMuaW5ncmVzcy5jbGFzc05hbWUgfX0KICB7ey0gZW5kIH19CiAge3stIGlmIC5WYWx1ZXMuaW5ncmVzcy50bHMgfX0KICB0bHM6CiAgICB7ey0gcmFuZ2UgLlZhbHVlcy5pbmdyZXNzLnRscyB9fQogICAgLSBob3N0czoKICAgICAgICB7ey0gcmFuZ2UgLmhvc3RzIH19CiAgICAgICAgLSB7eyAuIHwgcXVvdGUgfX0KICAgICAgICB7ey0gZW5kIH19CiAgICAgIHNlY3JldE5hbWU6IHt7IC5zZWNyZXROYW1lIH19CiAgICB7ey0gZW5kIH19CiAge3stIGVuZCB9fQogIHJ1bGVzOgogICAge3stIHJhbmdlIC5WYWx1ZXMuaW5ncmVzcy5ob3N0cyB9fQogICAgLSBob3N0OiB7eyAuaG9zdCB8IHF1b3RlIH19CiAgICAgIGh0dHA6CiAgICAgICAgcGF0aHM6CiAgICAgICAgICB7ey0gcmFuZ2UgLnBhdGhzIH19CiAgICAgICAgICAtIHBhdGg6IHt7IC5wYXRoIH19CiAgICAgICAgICAgIHt7LSBpZiBhbmQgLnBhdGhUeXBlIChzZW12ZXJDb21wYXJlICI+PTEuMTgtMCIgJC5DYXBhYmlsaXRpZXMuS3ViZVZlcnNpb24uR2l0VmVyc2lvbikgfX0KICAgICAgICAgICAgcGF0aFR5cGU6IHt7IC5wYXRoVHlwZSB9fQogICAgICAgICAgICB7ey0gZW5kIH19CiAgICAgICAgICAgIGJhY2tlbmQ6CiAgICAgICAgICAgICAge3stIGlmIHNlbXZlckNvbXBhcmUgIj49MS4xOS0wIiAkLkNhcGFiaWxpdGllcy5LdWJlVmVyc2lvbi5HaXRWZXJzaW9uIH19CiAgICAgICAgICAgICAgc2VydmljZToKICAgICAgICAgICAgICAgIG5hbWU6IHt7ICRmdWxsTmFtZSB9fQogICAgICAgICAgICAgICAgcG9ydDoKICAgICAgICAgICAgICAgICAgbnVtYmVyOiB7eyAkc3ZjUG9ydCB9fQogICAgICAgICAgICAgIHt7LSBlbHNlIH19CiAgICAgICAgICAgICAgc2VydmljZU5hbWU6IHt7ICRmdWxsTmFtZSB9fQogICAgICAgICAgICAgIHNlcnZpY2VQb3J0OiB7eyAkc3ZjUG9ydCB9fQogICAgICAgICAgICAgIHt7LSBlbmQgfX0KICAgICAgICAgIHt7LSBlbmQgfX0KICAgIHt7LSBlbmQgfX0Ke3stIGVuZCB9fQo=",
          },
          {
            name: "templates/pvc.yaml",
            data: "e3stIGlmIC5WYWx1ZXMuZGFzaGJvYXJkLnBlcnNpc3RlbmNlLmVuYWJsZWQgLX19CmFwaVZlcnNpb246IHYxCmtpbmQ6IFBlcnNpc3RlbnRWb2x1bWVDbGFpbQptZXRhZGF0YToKICBuYW1lOiB7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5mdWxsbmFtZSIgLiB9fQogIG5hbWVzcGFjZToge3sgLlJlbGVhc2UuTmFtZXNwYWNlIHwgcXVvdGUgfX0KICBsYWJlbHM6CiAgICB7ey0gaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQubGFiZWxzIiAuIHwgbmluZGVudCA0IH19CiAge3stIHdpdGggLlZhbHVlcy5kYXNoYm9hcmQucGVyc2lzdGVuY2UuYW5ub3RhdGlvbnMgfX0KICBhbm5vdGF0aW9uczoKICAgIHt7LSB0b1lhbWwgLiB8IG5pbmRlbnQgNCB9fQogIHt7LSBlbmQgfX0Kc3BlYzoKICB7ey0gaWYgLlZhbHVlcy5kYXNoYm9hcmQucGVyc2lzdGVuY2UuaG9zdFBhdGggfX0KICBzdG9yYWdlQ2xhc3NOYW1lOiAiIgogIHt7LSBlbHNlIH19CiAge3stIGlmIGtpbmRJcyAic3RyaW5nIiAuVmFsdWVzLmRhc2hib2FyZC5wZXJzaXN0ZW5jZS5zdG9yYWdlQ2xhc3MgfX0KICBzdG9yYWdlQ2xhc3NOYW1lOiAie3sgLlZhbHVlcy5kYXNoYm9hcmQucGVyc2lzdGVuY2Uuc3RvcmFnZUNsYXNzIH19IgogIHt7LSBlbmQgfX0KICB7ey0gZW5kIH19CiAgYWNjZXNzTW9kZXM6CiAge3stIGlmIG5vdCAoZW1wdHkgLlZhbHVlcy5kYXNoYm9hcmQucGVyc2lzdGVuY2UuYWNjZXNzTW9kZXMpIH19CiAge3stIHJhbmdlIC5WYWx1ZXMuZGFzaGJvYXJkLnBlcnNpc3RlbmNlLmFjY2Vzc01vZGVzIH19CiAgICAtIHt7IC4gfCBxdW90ZSB9fQogIHt7LSBlbmQgfX0KICB7ey0gZW5kIH19CiAgcmVzb3VyY2VzOgogICAgcmVxdWVzdHM6CiAgICAgIHN0b3JhZ2U6IHt7IC5WYWx1ZXMuZGFzaGJvYXJkLnBlcnNpc3RlbmNlLnNpemUgfCBxdW90ZSB9fQp7ey0gZW5kIH19CgotLS0Ke3stIGlmIGFuZCAuVmFsdWVzLmRhc2hib2FyZC5wZXJzaXN0ZW5jZS5lbmFibGVkIC5WYWx1ZXMuZGFzaGJvYXJkLnBlcnNpc3RlbmNlLmhvc3RQYXRoIC19fQphcGlWZXJzaW9uOiB2MQpraW5kOiBQZXJzaXN0ZW50Vm9sdW1lCm1ldGFkYXRhOgogIG5hbWU6IHt7IGluY2x1ZGUgImhlbG0tZGFzaGJvYXJkLmZ1bGxuYW1lIiAuIH19CiAgbmFtZXNwYWNlOiB7eyAuUmVsZWFzZS5OYW1lc3BhY2UgfCBxdW90ZSB9fQogIGxhYmVsczoKICAgIHt7LSBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5sYWJlbHMiIC4gfCBuaW5kZW50IDQgfX0KICB7ey0gd2l0aCAuVmFsdWVzLmRhc2hib2FyZC5wZXJzaXN0ZW5jZS5hbm5vdGF0aW9ucyB9fQogIGFubm90YXRpb25zOgogICAge3stIHRvWWFtbCAuIHwgbmluZGVudCA0IH19CiAge3stIGVuZCB9fQpzcGVjOgogIGFjY2Vzc01vZGVzOgogIHt7LSBpZiBub3QgKGVtcHR5IC5WYWx1ZXMuZGFzaGJvYXJkLnBlcnNpc3RlbmNlLmFjY2Vzc01vZGVzKSB9fQogIHt7LSByYW5nZSAuVmFsdWVzLmRhc2hib2FyZC5wZXJzaXN0ZW5jZS5hY2Nlc3NNb2RlcyB9fQogICAgLSB7eyAuIHwgcXVvdGUgfX0KICB7ey0gZW5kIH19CiAge3stIGVuZCB9fQogIGNhcGFjaXR5OgogICAgc3RvcmFnZToge3sgLlZhbHVlcy5kYXNoYm9hcmQucGVyc2lzdGVuY2Uuc2l6ZSB8IHF1b3RlIH19CiAgaG9zdFBhdGg6CiAgICBwYXRoOiB7eyAuVmFsdWVzLmRhc2hib2FyZC5wZXJzaXN0ZW5jZS5ob3N0UGF0aCB8IHF1b3RlIH19Cnt7LSBlbmQgLX19Cg==",
          },
          {
            name: "templates/service.yaml",
            data: "YXBpVmVyc2lvbjogdjEKa2luZDogU2VydmljZQptZXRhZGF0YToKICBuYW1lOiB7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5mdWxsbmFtZSIgLiB9fQogIGxhYmVsczoKICAgIHt7LSBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5sYWJlbHMiIC4gfCBuaW5kZW50IDQgfX0Kc3BlYzoKICB0eXBlOiB7eyAuVmFsdWVzLnNlcnZpY2UudHlwZSB9fQogIHBvcnRzOgogICAgLSBwb3J0OiB7eyAuVmFsdWVzLnNlcnZpY2UucG9ydCB9fQogICAgICB0YXJnZXRQb3J0OiBodHRwCiAgICAgIHByb3RvY29sOiBUQ1AKICAgICAgbmFtZTogaHR0cAogIHNlbGVjdG9yOgogICAge3stIGluY2x1ZGUgImhlbG0tZGFzaGJvYXJkLnNlbGVjdG9yTGFiZWxzIiAuIHwgbmluZGVudCA0IH19Cg==",
          },
          {
            name: "templates/serviceaccount.yaml",
            data: "e3stIGlmIC5WYWx1ZXMuc2VydmljZUFjY291bnQuY3JlYXRlIC19fQphcGlWZXJzaW9uOiB2MQpraW5kOiBTZXJ2aWNlQWNjb3VudAptZXRhZGF0YToKICBuYW1lOiB7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5zZXJ2aWNlQWNjb3VudE5hbWUiIC4gfX0KICBsYWJlbHM6CiAgICB7ey0gaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQubGFiZWxzIiAuIHwgbmluZGVudCA0IH19CiAge3stIHdpdGggLlZhbHVlcy5zZXJ2aWNlQWNjb3VudC5hbm5vdGF0aW9ucyB9fQogIGFubm90YXRpb25zOgogICAge3stIHRvWWFtbCAuIHwgbmluZGVudCA0IH19CiAge3stIGVuZCB9fQp7ey0gZW5kIH19CgotLS0Ka2luZDogQ2x1c3RlclJvbGUKYXBpVmVyc2lvbjogcmJhYy5hdXRob3JpemF0aW9uLms4cy5pby92MQptZXRhZGF0YToKICBuYW1lOiB7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5zZXJ2aWNlQWNjb3VudE5hbWUiIC4gfX0KcnVsZXM6CiAgLSBhcGlHcm91cHM6IFsiKiJdCiAgICByZXNvdXJjZXM6IFsiKiJdCiAge3stIGlmIC5WYWx1ZXMuZGFzaGJvYXJkLmFsbG93V3JpdGVBY3Rpb25zIH19CiAgICB2ZXJiczogWyJnZXQiLCAibGlzdCIsICJ3YXRjaCIsICJjcmVhdGUiLCAiZGVsZXRlIiwgInBhdGNoIiwgInVwZGF0ZSJdCiAge3stIGVsc2UgfX0KICAgIHZlcmJzOiBbImdldCIsICJsaXN0IiwgIndhdGNoIl0KICB7ey0gZW5kIH19Ci0tLQphcGlWZXJzaW9uOiByYmFjLmF1dGhvcml6YXRpb24uazhzLmlvL3YxCmtpbmQ6IENsdXN0ZXJSb2xlQmluZGluZwptZXRhZGF0YToKICBuYW1lOiB7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5zZXJ2aWNlQWNjb3VudE5hbWUiIC4gfX0Kcm9sZVJlZjoKICBhcGlHcm91cDogcmJhYy5hdXRob3JpemF0aW9uLms4cy5pbwogIGtpbmQ6IENsdXN0ZXJSb2xlCiAgbmFtZToge3sgaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQuc2VydmljZUFjY291bnROYW1lIiAuIH19CnN1YmplY3RzOgogIC0ga2luZDogU2VydmljZUFjY291bnQKICAgIG5hbWVzcGFjZToge3sgLlJlbGVhc2UuTmFtZXNwYWNlIH19CiAgICBuYW1lOiB7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5zZXJ2aWNlQWNjb3VudE5hbWUiIC4gfX0=",
          },
          {
            name: "templates/tests/test-connection.yaml",
            data: "YXBpVmVyc2lvbjogdjEKa2luZDogUG9kCm1ldGFkYXRhOgogIG5hbWU6ICJ7eyBpbmNsdWRlICJoZWxtLWRhc2hib2FyZC5mdWxsbmFtZSIgLiB9fS10ZXN0LWNvbm5lY3Rpb24iCiAgbGFiZWxzOgogICAge3stIGluY2x1ZGUgImhlbG0tZGFzaGJvYXJkLmxhYmVscyIgLiB8IG5pbmRlbnQgNCB9fQogIGFubm90YXRpb25zOgogICAgImhlbG0uc2gvaG9vayI6IHRlc3QKc3BlYzoKICBjb250YWluZXJzOgogICAgLSBuYW1lOiB3Z2V0CiAgICAgIGltYWdlOiBidXN5Ym94CiAgICAgIGNvbW1hbmQ6IFsnd2dldCddCiAgICAgIGFyZ3M6IFsnLS10aW1lb3V0PTUnLCAne3sgaW5jbHVkZSAiaGVsbS1kYXNoYm9hcmQuZnVsbG5hbWUiIC4gfX06e3sgLlZhbHVlcy5zZXJ2aWNlLnBvcnQgfX0nXQogIHJlc3RhcnRQb2xpY3k6IE5ldmVyCg==",
          },
        ],
        values: {
          affinity: {},
          autoscaling: {
            enabled: false,
            maxReplicas: 100,
            minReplicas: 1,
            targetCPUUtilizationPercentage: 80,
          },
          dashboard: {
            allowWriteActions: true,
            namespace: "",
            persistence: {
              accessModes: ["ReadWriteOnce"],
              annotations: {},
              enabled: true,
              hostPath: "",
              labels: {},
              size: "100M",
              storageClass: null,
            },
          },
          debug: false,
          extraArgs: ["--no-browser", "--bind=0.0.0.0"],
          fullnameOverride: "",
          image: {
            pullPolicy: "IfNotPresent",
            repository: "komodorio/helm-dashboard",
            tag: "",
          },
          imagePullSecrets: [],
          ingress: {
            annotations: {},
            className: "",
            enabled: false,
            hosts: [
              {
                host: "chart-example.local",
                paths: [
                  {
                    path: "/",
                    pathType: "ImplementationSpecific",
                  },
                ],
              },
            ],
            tls: [],
          },
          nameOverride: "",
          nodeSelector: {},
          podAnnotations: {},
          podSecurityContext: {},
          replicaCount: 1,
          resources: {
            limits: {
              cpu: 1,
              memory: "1Gi",
            },
            requests: {
              cpu: "200m",
              memory: "256Mi",
            },
          },
          securityContext: {},
          service: {
            port: 8080,
            type: "ClusterIP",
          },
          serviceAccount: {
            create: true,
            name: "",
          },
          tolerations: [],
          updateStrategy: {
            type: "RollingUpdate",
          },
        },
        schema: null,
        files: [
          {
            name: ".helmignore",
            data: "IyBQYXR0ZXJucyB0byBpZ25vcmUgd2hlbiBidWlsZGluZyBwYWNrYWdlcy4KIyBUaGlzIHN1cHBvcnRzIHNoZWxsIGdsb2IgbWF0Y2hpbmcsIHJlbGF0aXZlIHBhdGggbWF0Y2hpbmcsIGFuZAojIG5lZ2F0aW9uIChwcmVmaXhlZCB3aXRoICEpLiBPbmx5IG9uZSBwYXR0ZXJuIHBlciBsaW5lLgouRFNfU3RvcmUKIyBDb21tb24gVkNTIGRpcnMKLmdpdC8KLmdpdGlnbm9yZQouYnpyLwouYnpyaWdub3JlCi5oZy8KLmhnaWdub3JlCi5zdm4vCiMgQ29tbW9uIGJhY2t1cCBmaWxlcwoqLnN3cAoqLmJhawoqLnRtcAoqLm9yaWcKKn4KIyBWYXJpb3VzIElERXMKLnByb2plY3QKLmlkZWEvCioudG1wcm9qCi52c2NvZGUvCg==",
          },
          {
            name: "README.md",
            data: "IyBIZWxtIERhc2hib2FyZAoKIyMgVEw7RFI7CgpgYGBiYXNoCmhlbG0gcmVwbyBhZGQga29tb2RvcmlvIGh0dHBzOi8vaGVsbS1jaGFydHMua29tb2Rvci5pbwpoZWxtIHJlcG8gdXBkYXRlCmhlbG0gdXBncmFkZSAtLWluc3RhbGwgaGVsbS1kYXNoYm9hcmQga29tb2RvcmlvL2hlbG0tZGFzaGJvYXJkCmBgYAoKIyMgSW50cm9kdWN0aW9uCgpUaGlzIGNoYXJ0IGJvb3RzdHJhcHMgYSBIZWxtIERhc2hib2FyZCBkZXBsb3ltZW50IG9uIGEgW0t1YmVybmV0ZXNdKGh0dHA6Ly9rdWJlcm5ldGVzLmlvKSBjbHVzdGVyIHVzaW5nIHRoZSBbSGVsbV0oaHR0cHM6Ly9oZWxtLnNoKSBwYWNrYWdlIG1hbmFnZXIuCgpXaGlsZSBpbnN0YWxsZWQgaW5zaWRlIGNsdXN0ZXIsIEhlbG0gRGFzaGJvYXJkIHdpbGwgcnVuIHNvbWUgYWRkaXRpb25hbCBiYWNrZ3JvdWQgYWN0aW9ucywgZm9yIGV4YW1wbGUsIHdpbGwgYXV0b21hdGljYWxseSB1cGRhdGUgSGVsbSByZXBvc2l0b3JpZXMuIFRvIGVuYWJsZSB0aGF0IGJlaGF2aW9yIGxvY2FsbHksIHNldCBgSERfQ0xVU1RFUl9NT0RFYCBlbnYgdmFyaWFibGUuCgojIyBQcmVyZXF1aXNpdGVzCgotIEt1YmVybmV0ZXMgMS4xNisKCiMjIEluc3RhbGxpbmcgdGhlIENoYXJ0CgpUbyBpbnN0YWxsIHRoZSBjaGFydCB3aXRoIHRoZSByZWxlYXNlIG5hbWUgYGhlbG0tZGFzaGJvYXJkYDoKCmBgYGJhc2gKaGVsbSBpbnN0YWxsIGhlbG0tZGFzaGJvYXJkIC4KYGBgCgpUaGUgY29tbWFuZCBkZXBsb3lzIEhlbG0gRGFzaGJvYXJkIG9uIHRoZSBLdWJlcm5ldGVzIGNsdXN0ZXIgaW4gdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbi4gVGhlIFtQYXJhbWV0ZXJzXSgjcGFyYW1ldGVycykgc2VjdGlvbiBsaXN0cyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbiBiZSBjb25maWd1cmVkIGR1cmluZyBpbnN0YWxsYXRpb24uCgo+ICoqVGlwKio6IExpc3QgYWxsIHJlbGVhc2VzIHVzaW5nIGBoZWxtIGxpc3RgCgojIyBVbmluc3RhbGxpbmcgdGhlIENoYXJ0CgpUbyB1bmluc3RhbGwvZGVsZXRlIHRoZSBgaGVsbS1kYXNoYm9hcmRgIGRlcGxveW1lbnQ6CgpgYGBiYXNoCmhlbG0gdW5pbnN0YWxsIGhlbG0tZGFzaGJvYXJkCmBgYAoKVGhlIGNvbW1hbmQgcmVtb3ZlcyBhbGwgdGhlIEt1YmVybmV0ZXMgY29tcG9uZW50cyBhc3NvY2lhdGVkIHdpdGggdGhlIGNoYXJ0IGFuZCBkZWxldGVzIHRoZSByZWxlYXNlLgoKIyMgQWRkaW5nIEF1dGhlbnRpY2F0aW9uCgpUaGUgdGFzayBvZiBhdXRoZW50aWNhdGlvbiBhbmQgdXNlciBjb250cm9sIGlzIG91dCBvZiBzY29wZSBmb3IgSGVsbSBEYXNoYm9hcmQuIEx1Y2tpbHksIHRoZXJlIGFyZSB0aGlyZC1wYXJ0eSBzb2x1dGlvbnMgd2hpY2ggYXJlIGRlZGljYXRlZCB0byBwcm92aWRlIHRoYXQgZnVuY3Rpb25hbGl0eS4KCkZvciBpbnN0YW5jZSwgeW91IGNhbiBwbGFjZSBhdXRoZW50aWNhdGlvbiBwcm94eSBpbiBmcm9udCBvZiBIZWxtIERhc2hib2FyZCwgbGlrZSB0aGlzIG9uZTogaHR0cHM6Ly9naXRodWIuY29tL29hdXRoMi1wcm94eS9vYXV0aDItcHJveHkKCiMjIFBhcmFtZXRlcnMKClRoZSBmb2xsb3dpbmcgdGFibGUgbGlzdHMgdGhlIGNvbmZpZ3VyYWJsZSBwYXJhbWV0ZXJzIG9mIHRoZSBjaGFydCBhbmQgdGhlaXIgZGVmYXVsdCB2YWx1ZXMuCgp8IFBhcmFtZXRlciAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IERlc2NyaXB0aW9uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBEZWZhdWx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB8IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gfCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gfAp8IGBpbWFnZS5yZXBvc2l0b3J5YCAgICAgICAgICAgICAgICAgICB8IEltYWdlIHJlZ2lzdHJ5L25hbWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgZG9ja2VyLmlvL2tvbW9kb3Jpby9oZWxtLWRhc2hib2FyZGAgfAp8IGBpbWFnZS50YWdgICAgICAgICAgICAgICAgICAgICAgICAgICB8IEltYWdlIHRhZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBpbWFnZS5wdWxsUG9saWN5YCAgICAgICAgICAgICAgICAgICB8IEltYWdlIHB1bGwgcG9saWN5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgSWZOb3RQcmVzZW50YCAgICAgICAgICAgICAgICAgICAgICAgfAp8IGByZXBsaWNhQ291bnRgICAgICAgICAgICAgICAgICAgICAgICB8IE51bWJlciBvZiBkYXNoYm9hcmQgUG9kcyB0byBydW4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgMWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBkYXNoYm9hcmQuYWxsb3dXcml0ZUFjdGlvbnNgICAgICAgICB8IEVuYWJsZXMgd3JpdGUgYWN0aW9ucy4gQWxsb3cgbW9kaWZ5aW5nLCBkZWxldGluZyBhbmQgY3JlYXRpbmcgY2hhcnRzIGFuZCBrdWJlcm5ldGVzIHJlc291cmNlcy4gfCBgdHJ1ZWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGByZXNvdXJjZXMucmVxdWVzdHMuY3B1YCAgICAgICAgICAgICB8IENQVSByZXNvdXJjZSByZXF1ZXN0cyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgMjAwbWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGByZXNvdXJjZXMubGltaXRzLmNwdWAgICAgICAgICAgICAgICB8IENQVSByZXNvdXJjZSBsaW1pdHMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgMWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGByZXNvdXJjZXMucmVxdWVzdHMubWVtb3J5YCAgICAgICAgICB8IE1lbW9yeSByZXNvdXJjZSByZXF1ZXN0cyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgMjU2TWlgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGByZXNvdXJjZXMubGltaXRzLm1lbW9yeWAgICAgICAgICAgICB8IE1lbW9yeSByZXNvdXJjZSBsaW1pdHMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgMUdpYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBzZXJ2aWNlLnR5cGUgICAgICAgICAgIGAgICAgICAgICAgICB8IEt1YmVybmV0ZXMgc2VydmljZSB0eXBlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgQ2x1c3RlcklQYCAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBzZXJ2aWNlLnBvcnQgICAgICAgICAgIGAgICAgICAgICAgICB8IEt1YmVybmV0ZXMgc2VydmljZSBwb3J0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgODA4MGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBzZXJ2aWNlQWNjb3VudC5jcmVhdGVgICAgICAgICAgICAgICB8IENyZWF0ZXMgYSBzZXJ2aWNlIGFjY291bnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgdHJ1ZWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBzZXJ2aWNlQWNjb3VudC5uYW1lYCAgICAgICAgICAgICAgICB8IE9wdGlvbmFsIG5hbWUgZm9yIHRoZSBzZXJ2aWNlIGFjY291bnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBge1JFTEVBU0VfRlVMTE5BTUV9YCAgICAgICAgICAgICAgICAgfAp8IGBub2RlU2VsZWN0b3JgICAgICAgICAgICAgICAgICAgICAgICB8IE5vZGUgbGFiZWxzIGZvciBwb2QgYXNzaWdubWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBhZmZpbml0eWAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IEFmZmluaXR5IHNldHRpbmdzIGZvciBwb2QgYXNzaWdubWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGB0b2xlcmF0aW9uc2AgICAgICAgICAgICAgICAgICAgICAgICB8IFRvbGVyYXRpb25zIGZvciBwb2QgYXNzaWdubWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBkYXNoYm9hcmQucGVyc2lzdGVuY2UuZW5hYmxlZGAgICAgICB8IEVuYWJsZSBoZWxtIGRhdGEgcGVyc2lzdGVuZSB1c2luZyBQVkMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgdHJ1ZWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBkYXNoYm9hcmQucGVyc2lzdGVuY2UuYWNjZXNzTW9kZXNgICB8IFBlcnNpc3RlbnQgVm9sdW1lIGFjY2VzcyBtb2RlcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgWyJSZWFkV3JpdGVPbmNlIl1gICAgICAgICAgICAgICAgICAgfAp8IGBkYXNoYm9hcmQucGVyc2lzdGVuY2Uuc3RvcmFnZUNsYXNzYCB8IFBlcnNpc3RlbnQgVm9sdW1lIHN0b3JhZ2UgY2xhc3MgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgIiJgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBkYXNoYm9hcmQucGVyc2lzdGVuY2Uuc2l6ZWAgICAgICAgICB8IFBlcnNpc3RlbnQgVm9sdW1lIHNpemUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBgMTAwTWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IGBkYXNoYm9hcmQucGVyc2lzdGVuY2UuaG9zdFBhdGhgICAgICB8IFNldCBwYXRoIGluIGNhc2UgeW91IHdhbnQgdG8gdXNlIGxvY2FsIGhvc3QgcGF0aCB2b2x1bWVzIChub3QgcmVjb21tZW5kZWQgaW4gcHJvZHVjdGlvbikgICAgICAgfCBgIiJgCnwgYHVwZGF0ZVN0cmF0ZWd5LnR5cGVgICAgICAgICAgICAgICAgIHwgU2V0IHVwIHVwZGF0ZSBzdHJhdGVneSBmb3IgaGVsbS1kYXNoYm9hcmQgaW5zdGFsbGF0aW9uLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGBSb2xsaW5nVXBkYXRlYCAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAKfCBgZXh0cmFBcmdzYCAgICAgfCBTZXQgdGhlIGFyZ3VtZW50cyB0byBiZSBzdXBwbGllZCB0byB0aGUgaGVsbS1kYXNoYm9hcmQgYmluYXJ5ICAgICAgIHwgYFstLW5vLWJyb3dzZXIsIC0tYmluZD0wLjAuMC4wXWAKClNwZWNpZnkgZWFjaCBwYXJhbWV0ZXIgdXNpbmcgdGhlIGAtLXNldCBrZXk9dmFsdWVbLGtleT12YWx1ZV1gIGFyZ3VtZW50IHRvIGBoZWxtIGluc3RhbGxgLgoKYGBgYmFzaApoZWxtIHVwZ3JhZGUgLS1pbnN0YWxsIGhlbG0tZGFzaGJvYXJkIGtvbW9kb3Jpby9oZWxtLWRhc2hib2FyZCAtLXNldCBkYXNoYm9hcmQuYWxsb3dXcml0ZUFjdGlvbnM9dHJ1ZSAtLXNldCBzZXJ2aWNlLnBvcnQ9OTA5MApgYGAKCj4gKipUaXAqKjogWW91IGNhbiB1c2UgdGhlIGRlZmF1bHQgW3ZhbHVlcy55YW1sXSh2YWx1ZXMueWFtbCkK",
          },
        ],
      },
      manifest:
        '---\n# Source: helm-dashboard/templates/serviceaccount.yaml\napiVersion: v1\nkind: ServiceAccount\nmetadata:\n  name: helm-dashboard\n  labels:\n    helm.sh/chart: helm-dashboard-0.1.10\n    app.kubernetes.io/name: helm-dashboard\n    app.kubernetes.io/instance: helm-dashboard\n    app.kubernetes.io/version: "1.3.3"\n    app.kubernetes.io/managed-by: Helm\n---\n# Source: helm-dashboard/templates/pvc.yaml\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: helm-dashboard\n  namespace: "default"\n  labels:\n    helm.sh/chart: helm-dashboard-0.1.10\n    app.kubernetes.io/name: helm-dashboard\n    app.kubernetes.io/instance: helm-dashboard\n    app.kubernetes.io/version: "1.3.3"\n    app.kubernetes.io/managed-by: Helm\nspec:\n  accessModes:\n    - "ReadWriteOnce"\n  resources:\n    requests:\n      storage: "100M"\n---\n# Source: helm-dashboard/templates/serviceaccount.yaml\nkind: ClusterRole\napiVersion: rbac.authorization.k8s.io/v1\nmetadata:\n  name: helm-dashboard\nrules:\n  - apiGroups: ["*"]\n    resources: ["*"]\n    verbs: ["get", "list", "watch", "create", "delete", "patch", "update"]\n---\n# Source: helm-dashboard/templates/serviceaccount.yaml\napiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRoleBinding\nmetadata:\n  name: helm-dashboard\nroleRef:\n  apiGroup: rbac.authorization.k8s.io\n  kind: ClusterRole\n  name: helm-dashboard\nsubjects:\n  - kind: ServiceAccount\n    namespace: default\n    name: helm-dashboard\n---\n# Source: helm-dashboard/templates/service.yaml\napiVersion: v1\nkind: Service\nmetadata:\n  name: helm-dashboard\n  labels:\n    helm.sh/chart: helm-dashboard-0.1.10\n    app.kubernetes.io/name: helm-dashboard\n    app.kubernetes.io/instance: helm-dashboard\n    app.kubernetes.io/version: "1.3.3"\n    app.kubernetes.io/managed-by: Helm\nspec:\n  type: ClusterIP\n  ports:\n    - port: 8080\n      targetPort: http\n      protocol: TCP\n      name: http\n  selector:\n    app.kubernetes.io/name: helm-dashboard\n    app.kubernetes.io/instance: helm-dashboard\n---\n# Source: helm-dashboard/templates/deployment.yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: helm-dashboard\n  labels:\n    helm.sh/chart: helm-dashboard-0.1.10\n    app.kubernetes.io/name: helm-dashboard\n    app.kubernetes.io/instance: helm-dashboard\n    app.kubernetes.io/version: "1.3.3"\n    app.kubernetes.io/managed-by: Helm\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app.kubernetes.io/name: helm-dashboard\n      app.kubernetes.io/instance: helm-dashboard\n  strategy:\n    type: RollingUpdate\n  template:\n    metadata:\n      labels:\n        app.kubernetes.io/name: helm-dashboard\n        app.kubernetes.io/instance: helm-dashboard\n    spec:\n      serviceAccountName: helm-dashboard\n      securityContext:\n        {}\n      containers:\n        - name: helm-dashboard\n          command:\n            - /bin/helm-dashboard\n          args:\n            - --no-browser\n            - --bind=0.0.0.0\n          securityContext:\n            {}\n          image: "komodorio/helm-dashboard:1.3.3"\n          imagePullPolicy: IfNotPresent\n          env:\n            - name: HELM_CACHE_HOME\n              value: /opt/dashboard/helm/cache\n            - name: HELM_CONFIG_HOME\n              value: /opt/dashboard/helm/config\n            - name: HELM_DATA_HOME\n              value: /opt/dashboard/helm/data\n            - name: DEBUG\n              value:\n          ports:\n            - name: http\n              containerPort: 8080\n              protocol: TCP\n          livenessProbe:\n            httpGet:\n              path: /status\n              port: http\n          readinessProbe:\n            httpGet:\n              path: /status\n              port: http\n          resources:\n            limits:\n              cpu: 1\n              memory: 1Gi\n            requests:\n              cpu: 200m\n              memory: 256Mi\n          volumeMounts:\n            - name: data\n              mountPath: /opt/dashboard/helm\n      volumes:\n        - name: data\n          persistentVolumeClaim:\n            claimName: helm-dashboard\n',
      hooks: [
        {
          name: "helm-dashboard-test-connection",
          kind: "Pod",
          path: "helm-dashboard/templates/tests/test-connection.yaml",
          manifest:
            "apiVersion: v1\nkind: Pod\nmetadata:\n  name: \"helm-dashboard-test-connection\"\n  labels:\n    helm.sh/chart: helm-dashboard-0.1.10\n    app.kubernetes.io/name: helm-dashboard\n    app.kubernetes.io/instance: helm-dashboard\n    app.kubernetes.io/version: \"1.3.3\"\n    app.kubernetes.io/managed-by: Helm\n  annotations:\n    \"helm.sh/hook\": test\nspec:\n  containers:\n    - name: wget\n      image: busybox\n      command: ['wget']\n      args: ['--timeout=5', 'helm-dashboard:8080']\n  restartPolicy: Never",
          events: ["test"],
          last_run: {
            started_at: "",
            completed_at: "",
            phase: "",
          },
        },
      ],
      version: 1,
      namespace: "default",
    }).as("test111");

    cy.intercept(
      "GET",
      "http://localhost:5173/api/helm/releases/default/helm-dashboard/history",
      {
        body: [
          {
            revision: 1,
            updated: "2024-01-17T22:39:07.2371554+02:00",
            status: "deployed",
            chart: "helm-dashboard-0.1.10",
            app_version: "1.3.3",
            description: "Install complete",
            chart_name: "helm-dashboard",
            chart_ver: "0.1.10",
            has_tests: true,
          },
        ],
      }
    ).as("history");

    cy.contains("Confirm").click();

    cy.wait("@test111");

    cy.wait("@history");
  });
});
