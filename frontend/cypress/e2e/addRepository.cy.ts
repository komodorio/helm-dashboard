describe("Adding repository flow", () => {
  it("Adding new chart repository", () => {
    cy.visit(
      "http://localhost:5173/#/minikube/installed?filteredNamespace=default"
    );

    cy.get("[data-cy='navigation-link']").contains("Repository").click();
    cy.get("[data-cy='install-repository-button']").click();

    cy.get("[data-cy='add-chart-name']").type("Komodorio");
    cy.get("[data-cy='add-chart-url']").type("https://helm-charts.komodor.io");

    cy.get("[data-cy='add-chart-repository-button']").click();

    cy.contains("https://helm-charts.komodor.io");

    cy.get("[data-cy='chart-viewer-install-button']")
      .eq(0)
      .click({ force: true })
      .contains("Install")
      .click();

    cy.contains("Confirm").click();
  });
});
