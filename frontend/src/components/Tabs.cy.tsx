import { mount } from "cypress/react";
import { BrowserRouter } from "react-router";

import type { Tab } from "./Tabs";
import Tabs from "./Tabs";

describe("Tabs component tests", () => {
  const mockTabs: Tab[] = [
    {
      value: "manifest",
      label: "Manifest",
      content: <div data-testid="tab-content-manifest">Manifest Content</div>,
    },
    {
      value: "values",
      label: "Values",
      content: <div data-testid="tab-content-values">Values Content</div>,
    },
    {
      value: "notes",
      label: "Notes",
      content: <div data-testid="tab-content-notes">Notes Content</div>,
    },
  ];

  it("renders all tab buttons", () => {
    mount(
      <BrowserRouter>
        <Tabs tabs={mockTabs} selectedTab={mockTabs[0]} />
      </BrowserRouter>
    );

    cy.get("button").should("have.length", 3);
    cy.contains("button", "Manifest").should("exist");
    cy.contains("button", "Values").should("exist");
    cy.contains("button", "Notes").should("exist");
  });

  it("renders selected tab content", () => {
    mount(
      <BrowserRouter>
        <Tabs tabs={mockTabs} selectedTab={mockTabs[1]} />
      </BrowserRouter>
    );

    cy.get('[data-testid="tab-content-values"]')
      .should("exist")
      .and("contain.text", "Values Content");
  });

  it("highlights the active selected tab", () => {
    mount(
      <BrowserRouter>
        <Tabs tabs={mockTabs} selectedTab={mockTabs[0]} />
      </BrowserRouter>
    );

    cy.contains("button", "Manifest").should(
      "have.class",
      "border-b-[3px]"
    );
  });
});
