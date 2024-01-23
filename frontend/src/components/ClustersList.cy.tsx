import { AppContextProvider } from "../context/AppContext";
import ClustersList from "./ClustersList";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Release } from "../data/types";

type ClustersListProps = {
  onClusterChange: (clusterName: string) => void;
  selectedCluster: string;
  filteredNamespaces: string[];
  installedReleases?: Release[];
};

const generateTestReleaseData = (): Release => ({
  id: "id",
  name: "helm-dashboard",
  namespace: "default",
  revision: 1,
  updated: "2024-01-23T15:37:35.0992836+02:00",
  status: "deployed",
  chart: "helm-dashboard-0.1.10",
  chart_name: "helm-dashboard",
  chart_ver: "0.1.10",
  app_version: "1.3.3",
  icon: "https://raw.githubusercontent.com/komodorio/helm-dashboard/main/pkg/dashboard/static/logo.svg",
  description: "A GUI Dashboard for Helm by Komodor",
  has_tests: true,
  chartName: "helm-dashboard",
  chartVersion: "0.1.10",
});

const renderClustersList = (props: ClustersListProps) => {
  const queryClient = new QueryClient();
  cy.mount(
    <AppContextProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ClustersList {...props} />
        </QueryClientProvider>
      </BrowserRouter>
    </AppContextProvider>
  );
};

describe("ClustersList", () => {
  it("Got one cluster information", () => {
    renderClustersList({
      selectedCluster: "minikube",
      filteredNamespaces: ["default"],
      onClusterChange: () => {},
      installedReleases: [generateTestReleaseData()],
    });

    cy.get(".data-cy-clusterName").contains("minikube");
    cy.get(".data-cy-clusterList-namespace").contains("default");
    cy.get(".data-cy-clustersInput").should("be.checked");
  });

  it("Dont have a cluster chekced", () => {
    renderClustersList({
      selectedCluster: "",
      filteredNamespaces: [""],
      onClusterChange: () => {},
      installedReleases: [generateTestReleaseData()],
    });

    cy.get(".data-cy-clustersInput").should("not.be.checked");
  });
});
