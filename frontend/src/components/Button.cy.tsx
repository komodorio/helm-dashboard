import { mount } from "cypress/react18";
import { Button } from "./common/Button/Button";

describe("Button component tests", () => {
  const buttonText = "buttonText";

  it("renders", () => {
    mount(<Button onClick={() => {}}>{buttonText}</Button>);
    cy.get("button").should("exist");
  });

  it("Should have correct text", () => {
    mount(
      <Button label={buttonText} onClick={() => {}}>
        {buttonText}
      </Button>
    );
    cy.get("button").contains(buttonText);
  });

  it("calls onClick when clicked", () => {
    const onClickStub = cy.stub().as("onClick");

    mount(<Button onClick={onClickStub}>{buttonText}</Button>);

    cy.get("button").click();
    cy.get("@onClick").should("have.been.calledOnce");
  });

  it("should be disabled", () => {
    mount(
      <Button onClick={() => {}} disabled>
        {buttonText}
      </Button>
    );

    cy.get("button").should("be.disabled");
  });
});
