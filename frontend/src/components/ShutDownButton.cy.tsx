import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mount } from "cypress/react";

import ShutDownButton from "./ShutDownButton";

describe("ShutDownButton component tests", () => {
  const renderShutDownButton = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return mount(
      <QueryClientProvider client={queryClient}>
        <ShutDownButton />
      </QueryClientProvider>
    );
  };

  it("renders the shutdown power button", () => {
    renderShutDownButton();

    cy.get("button")
      .should("exist")
      .and(
        "have.attr",
        "title",
        "Shut down the Helm Dashboard application"
      );
  });

  it("triggers shutdown request on click", () => {
    cy.intercept("DELETE", "/", { statusCode: 202, body: "Accepted" }).as(
      "shutdownRequest"
    );

    renderShutDownButton();

    cy.get("button").click();
    cy.wait("@shutdownRequest");
  });
});
