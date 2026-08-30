import { mount } from "cypress/react";

import Badge, { BadgeCodes, getBadgeType } from "./Badge";

describe("Badge component tests", () => {
  it("renders success badge with correct content and classes", () => {
    mount(<Badge type={BadgeCodes.SUCCESS}>Healthy</Badge>);
    cy.get("span")
      .should("exist")
      .and("contain.text", "Healthy")
      .and("have.class", "bg-text-success");
  });

  it("renders warning badge with correct styling", () => {
    mount(<Badge type={BadgeCodes.WARNING}>Progressing</Badge>);
    cy.get("span")
      .should("exist")
      .and("contain.text", "Progressing")
      .and("have.class", "bg-text-warning");
  });

  it("renders error badge with correct styling", () => {
    mount(<Badge type={BadgeCodes.ERROR}>Failed</Badge>);
    cy.get("span")
      .should("exist")
      .and("contain.text", "Failed")
      .and("have.class", "bg-text-danger");
  });

  it("renders unknown badge with correct styling", () => {
    mount(<Badge type={BadgeCodes.UNKNOWN}>Unknown</Badge>);
    cy.get("span")
      .should("exist")
      .and("contain.text", "Unknown")
      .and("have.class", "bg-secondary");
  });

  it("applies additional class names when passed", () => {
    mount(
      <Badge type={BadgeCodes.SUCCESS} additionalClassNames="custom-test-class">
        Custom
      </Badge>
    );
    cy.get("span").should("have.class", "custom-test-class");
  });

  it("correctly maps status strings in getBadgeType helper", () => {
    expect(getBadgeType("Healthy")).to.equal(BadgeCodes.SUCCESS);
    expect(getBadgeType("available")).to.equal(BadgeCodes.SUCCESS);
    expect(getBadgeType("SecretExists")).to.equal(BadgeCodes.SUCCESS);
    expect(getBadgeType("Progressing")).to.equal(BadgeCodes.WARNING);
    expect(getBadgeType("Unknown")).to.equal(BadgeCodes.UNKNOWN);
    expect(getBadgeType("Failed")).to.equal(BadgeCodes.ERROR);
    expect(getBadgeType("CrashLoopBackOff")).to.equal(BadgeCodes.ERROR);
  });
});
