import ErrorFallback from "./ErrorFallback";
import { mount } from "cypress/react18";
import { ErrorBoundary } from "react-error-boundary";
import { useState } from "react";

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

  it("should render error modal with error message and hint", () => {
    const mockError = new Error("Test error message");
    const mockReset = cy.stub().as("resetErrorBoundary");

    mount(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    // Verify modal is open (checking document directly because of portal)
    cy.get("#portal").should("be.visible");
    cy.get("#portal").should("contain", "Application Error");
    cy.get("#portal").should("contain", "Test error message");

    // Verify Komodor hint is present (from GlobalErrorModal)
    cy.get("#portal").should("contain", "Sign up for free.");
    cy.get("#portal a")
      .should("have.attr", "href")
      .and("include", "komodor.com");
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
    cy.get("@consoleError").should("have.been.called");
  });

  it("should catch errors from a real component and recover after reset (Integration)", () => {
    const BuggyComponent = ({ shouldCrash }: { shouldCrash: boolean }) => {
      if (shouldCrash) {
        throw new Error("Integrated crash");
      }
      return <div data-cy="recovered">Recovered successfully!</div>;
    };

    const TestWrapper = () => {
      const [shouldCrash, setShouldCrash] = useState(true);
      return (
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => setShouldCrash(false)}
        >
          <BuggyComponent shouldCrash={shouldCrash} />
        </ErrorBoundary>
      );
    };

    mount(<TestWrapper />);

    // Verify modal caught the real throw
    cy.get("#portal").should("be.visible").and("not.be.empty");
    cy.get("#portal").should("contain", "Integrated crash");

    // Click close to reset
    cy.get("[data-modal-hide='staticModal']").click();

    // Verify modal is gone (portal should be empty) and component recovered
    cy.get("#portal").should("be.empty");
    cy.get("[data-cy='recovered']")
      .should("be.visible")
      .and("contain", "Recovered successfully!");
  });
});
