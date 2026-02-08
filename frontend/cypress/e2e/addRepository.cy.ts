describe("Adding repository flow", () => {
  const addChartNameInput = "[data-cy='add-chart-name']";
  const addChartUrlInput = "[data-cy='add-chart-url']";
  const addChartRepositoryButton = "[data-cy='add-chart-repository-button']";

  it("Adding new chart repository", () => {
    cy.intercept("GET", "/status", {
      fixture: "status.json",
    }).as("status");

    cy.intercept("GET", "/api/helm/releases", {
      fixture: "releases.json",
    }).as("releases");

    cy.visit("/#/minikube/installed?filteredNamespace=default");

    cy.get("[data-cy='navigation-link']").contains("Repository").click();
    cy.get("[data-cy='install-repository-button']").click();

    cy.get(addChartNameInput).type("Komodorio");
    cy.get(addChartUrlInput).type("https://helm-charts.komodor.io");

    cy.intercept("GET", "/api/helm/repositories", {
      fixture: "repositories.json",
    }).as("repositories");

    cy.get(addChartRepositoryButton).click();
    cy.wait("@repositories");

    cy.contains("https://helm-charts.komodor.io");

    cy.get("[data-cy='chart-viewer-install-button']")
      .eq(0)
      .click({ force: true })
      .contains("Install")
      .click();

    cy.intercept("POST", "/api/helm/releases/default", {
      fixture: "defaultReleases.json",
    }).as("defaultReleases");

    cy.intercept("GET", "/api/helm/releases/default/helm-dashboard/history", {
      fixture: "history.json",
    }).as("history");

    cy.contains("Confirm").click();

    cy.wait(["@defaultReleases", "@history"]);
  });
});
