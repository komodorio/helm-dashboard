import Button from "./Button";

describe("Button component tests", () => {
  it("renders", () => {
    cy.mount(<Button onClick={() => {}}>Click me</Button>);
    cy.get("button").should("exist");
  });

  it("calls onClick when clicked", () => {
    const onClickStub = cy.stub().as("onClick");

    cy.mount(<Button onClick={onClickStub}>Click me</Button>);

    cy.get("button").click();
    cy.get("@onClick").should("have.been.calledOnce");
  });

  it("should be disabled", () => {
    cy.mount(
      <Button onClick={() => {}} disabled>
        Click me
      </Button>
    );

    cy.get("button").should("be.disabled");
  });
});
