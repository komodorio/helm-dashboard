import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BrowserRouter } from "react-router";

import { AppContextProvider } from "../../context/AppContext";
import type { Release } from "../../data/types";
import { DeploymentStatus } from "../common/StatusLabel";

import InstalledPackagesList from "./InstalledPackagesList";

const baseRelease: Release = {
  id: "release-id",
  name: "shared-release",
  namespace: "default",
  revision: 1,
  updated: "2024-01-23T15:37:35.0992836+02:00",
  status: DeploymentStatus.DEPLOYED,
  chart: "shared-release-0.1.10",
  chart_name: "shared-release",
  chart_ver: "0.1.10",
  app_version: "1.3.3",
  icon: "",
  description: "A shared release used for namespace filtering tests.",
  has_tests: true,
  chartName: "shared-release",
  chartVersion: "0.1.10",
};

const createRelease = (overrides: Partial<Release> = {}): Release => ({
  ...baseRelease,
  ...overrides,
});

function InstalledPackagesListTestWrapper() {
  const [showOnlyTargetNamespace, setShowOnlyTargetNamespace] = useState(false);
  const releases = [
    createRelease({ id: "release-a", namespace: "airbyte" }),
    createRelease({ id: "release-b", namespace: "cert-manager" }),
  ];
  const filteredReleases = showOnlyTargetNamespace
    ? releases.filter((release) => release.namespace === "cert-manager")
    : releases;

  return (
    <div>
      <button type="button" onClick={() => setShowOnlyTargetNamespace(true)}>
        Filter to cert-manager
      </button>
      <InstalledPackagesList filteredReleases={filteredReleases} />
    </div>
  );
}

const renderInstalledPackagesList = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  cy.mount(
    <AppContextProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <InstalledPackagesListTestWrapper />
        </QueryClientProvider>
      </BrowserRouter>
    </AppContextProvider>
  );
};

describe("InstalledPackagesList", () => {
  it("updates visible cards when filtering duplicate release names by namespace", () => {
    cy.intercept("GET", "/status", {
      Analytics: false,
      CacheHitRatio: 0,
      ClusterMode: false,
      CurVer: "1.0.0",
      LatestVer: "1.0.0",
      NoHealth: true,
      NoLatest: true,
    }).as("getStatus");

    renderInstalledPackagesList();

    cy.wait("@getStatus");
    cy.get("img[alt='helm release icon']").should("have.length", 2);
    cy.contains(/^airbyte$/).should("exist");
    cy.contains(/^cert-manager$/).should("exist");

    cy.contains("button", "Filter to cert-manager").click();

    cy.get("img[alt='helm release icon']").should("have.length", 1);
    cy.contains(/^cert-manager$/).should("exist");
    cy.contains(/^airbyte$/).should("not.exist");
  });
});
