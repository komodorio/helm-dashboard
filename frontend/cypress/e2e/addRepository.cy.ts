describe("Adding repository flow", () => {
  it("Adding new chart repository", () => {
    cy.visit(
      "http://localhost:5173/#/minikube/installed?filteredNamespace=default"
    );
    cy.contains("Repository").click();
    cy.contains("+ Add Repository").click();

    cy.get("#name").type("Komodorio");
    cy.get("#url").type("https://helm-charts.komodor.io");
    cy.get(".p-5.text-sm button").contains("Add Repository").click();

    cy.contains("https://helm-charts.komodor.io");
    cy.get(".flex.flex-col.p-6 .grid.grid-cols-10 button")
      .eq(0)
      .should("have.text", "Install")
      .click({ force: true });

    cy.wait(3000);

    cy.contains("Chart Value Reference");

    cy.get("pre").scrollTo("bottom");
    cy.get(".p-4.space-y-6.overflow-y-auto").scrollTo("bottom");

    cy.contains("Confirm").click();
  });
});
