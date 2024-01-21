describe("Adding repository flow", () => {
  it("Adding new chart repository", () => {
    cy.intercept("GET", "http://localhost:5173/status", {
      fixture: "status.json",
    }).as("status");

    cy.visit(
      "http://localhost:5173/#/minikube/installed?filteredNamespace=default"
    );

    cy.get("[data-cy='navigation-link']").contains("Repository").click();
    cy.get("[data-cy='install-repository-button']").click();

    cy.get("[data-cy='add-chart-name']").type("Komodorio");
    cy.get("[data-cy='add-chart-url']").type("https://helm-charts.komodor.io");

    cy.intercept("GET", "http://localhost:5173/api/helm/repositories", {
      fixture: "repositories.json",
    }).as("repositories");

    cy.get("[data-cy='add-chart-repository-button']").click();

    cy.contains("https://helm-charts.komodor.io");

    cy.get("[data-cy='chart-viewer-install-button']")
      .eq(0)
      .click({ force: true })
      .contains("Install")
      .click();

    cy.intercept("POST", "http://localhost:5173/api/helm/releases/default", {
      fixture: "defaultReleases.json",
    }).as("defaultReleases");

    cy.intercept(
      "GET",
      "http://localhost:5173/api/helm/releases/default/helm-dashboard/history",
      { fixture: "history.json" }
    ).as("history");

    cy.contains("Confirm").click();

    cy.wait("@defaultReleases");

    cy.wait("@history");
  });
});
