import TextInput from "../components/TextInput";

describe("TextInput", () => {
  const label = "label";
  const placeholder = "some placeholder";

  beforeEach(() => {
    cy.mount(
      <TextInput
        label={label}
        placeholder={placeholder}
        onChange={() => {
          return;
        }}
      />
    );
  });

  it("contains correct label", () => {
    cy.get("label").should("contain", label);
  });

  it("contains correct placeholder", () => {
    cy.get("input").should("have.attr", "placeholder", placeholder);
  });
});
