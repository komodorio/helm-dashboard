import type { Meta, StoryObj } from "@storybook/react-vite";
import ErrorFallback from "./ErrorFallback";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Button from "../Button";

const meta = {
  title: "Components/ErrorFallback",
  component: ErrorFallback,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    resetErrorBoundary: { action: "reset" },
  },
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default error fallback with a standard error message
 */
export const Default: Story = {
  args: {
    error: new Error("Something went wrong in the application"),
    resetErrorBoundary: () => {},
  },
};

export const InteractiveIntegration: Story = {
  args: {
    error: new Error("Interactive Demo Error"),
    resetErrorBoundary: () => {},
  },
  render: (args) => {
    const BuggyComponent = () => {
      const [shouldError, setShouldError] = useState(false);

      if (shouldError) {
        throw new Error(
          "This is a real runtime error caught by the ErrorBoundary!"
        );
      }

      return (
        <div className="w-96 rounded border bg-white p-8 text-center shadow-md">
          <h3 className="mb-4 text-lg font-bold">Interactive Demo</h3>
          <p className="mb-6 text-sm text-gray-600">
            Clicking the button below will cause this component to throw a
            runtime error during render.
          </p>
          <Button onClick={() => setShouldError(true)}>
            Trigger Runtime Error
          </Button>
        </div>
      );
    };

    return (
      <ErrorBoundary
        FallbackComponent={(props) => (
          <ErrorFallback
            {...props}
            resetErrorBoundary={() => {
              props.resetErrorBoundary();
              args.resetErrorBoundary();
            }}
          />
        )}
      >
        <BuggyComponent />
      </ErrorBoundary>
    );
  },
};

/**
 * Long error message to test text wrapping
 */
export const LongErrorMessage: Story = {
  args: {
    error: new Error(
      "This is a very long error message that should demonstrate how the error modal handles text wrapping and displays lengthy error descriptions to the user. The error boundary should gracefully handle this scenario."
    ),
    resetErrorBoundary: () => {},
  },
};

/**
 * Non-Error object to test fallback behavior
 */
export const NonErrorObject: Story = {
  args: {
    error: "String error message" as unknown as Error,
    resetErrorBoundary: () => {},
  },
};

/**
 * Error with stack trace (useful for development)
 */
export const WithStackTrace: Story = {
  args: {
    error: (() => {
      try {
        throw new Error("Error with detailed stack trace");
      } catch (e) {
        return e as Error;
      }
    })(),
    resetErrorBoundary: () => {},
  },
};
