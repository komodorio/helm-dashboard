import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mount } from "cypress/react";
import { BrowserRouter } from "react-router";

import { AppContextProvider } from "../../context/AppContext";

import AddRepositoryModal from "./AddRepositoryModal";

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  mount(
    <AppContextProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AddRepositoryModal isOpen={true} onClose={() => {}} />
        </QueryClientProvider>
      </BrowserRouter>
    </AppContextProvider>
  );
}

describe("AddRepositoryModal preset suggestions", () => {
  beforeEach(() => {
    if (!document.getElementById("portal")) {
      const portal = document.createElement("div");
      portal.id = "portal";
      document.body.appendChild(portal);
    }
  });

  it("renders popular repository suggestions and auto-fills fields when clicked", () => {
    renderModal();

    cy.get("[data-cy='preset-repo-bitnami']").should("exist");
    cy.get("[data-cy='preset-repo-jetstack']").should("exist");

    cy.get("[data-cy='add-chart-name']").should("have.value", "");
    cy.get("[data-cy='add-chart-url']").should("have.value", "");

    cy.get("[data-cy='preset-repo-bitnami']").click();

    cy.get("[data-cy='add-chart-name']").should("have.value", "bitnami");
    cy.get("[data-cy='add-chart-url']").should(
      "have.value",
      "https://charts.bitnami.com/bitnami"
    );
  });
});
