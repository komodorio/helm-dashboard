import ErrorFallback from "./ErrorFallback";
import { mount } from "cypress/react18";

/**
 * Component tests for ErrorFallback
 * Tests the error fallback UI and reset functionality
 */
describe("ErrorFallback", () => {
  beforeEach(() => {
    // Ensure portal root exists for createPortal
    if (!document.getElementById("portal")) {
      const portalDiv = document.createElement("div");
      portalDiv.id = "portal";
      document.body.appendChild(portalDiv);
    }
  });

  it("should render error modal with error message", () => {
    const mockError = new Error("Test error message");
    const mockReset = cy.stub().as("resetErrorBoundary");

    mount(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    // Verify modal is open (checking document directly because of portal)
    cy.get("#portal").should("contain", "Application Error");
    cy.get("#portal").should("contain", "Test error message");
  });

  it("should call resetErrorBoundary when modal is closed", () => {
    const mockError = new Error("Test error");
    const mockReset = cy.stub().as("resetErrorBoundary");

    mount(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    // Find and click close button (using the selector from Modal.tsx)
    cy.get("[data-modal-hide='staticModal']").click();

    // Verify reset was called
    cy.get("@resetErrorBoundary").should("have.been.calledOnce");
  });

  it("should handle non-Error objects gracefully", () => {
    const mockError = "String error" as unknown as Error;
    const mockReset = cy.stub().as("resetErrorBoundary");

    mount(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    // Should show fallback message
    cy.get("#portal").should(
      "contain",
      "An unexpected error occurred. Please try again."
    );
  });

  it("should log error in development mode", () => {
    const mockError = new Error("Test error for logging");
    const mockReset = cy.stub();

    cy.window().then((win) => {
      cy.spy(win.console, "error").as("consoleError");
    });

    mount(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    // In dev mode, error should be logged
    // Note: This test assumes DEV mode is enabled in test environment
    cy.get("@consoleError").should("have.been.called");
  });
});
