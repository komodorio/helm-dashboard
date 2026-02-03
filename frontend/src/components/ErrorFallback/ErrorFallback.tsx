import type { FallbackProps } from "react-error-boundary";
import { useEffect } from "react";
import GlobalErrorModal from "../modal/GlobalErrorModal";

/**
 * Error fallback component for React Error Boundary
 * Uses the existing GlobalErrorModal for consistent error display
 * @param error - The error that was caught
 * @param resetErrorBoundary - Function to reset the error boundary state
 */
const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  useEffect(() => {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("Error caught by ErrorBoundary:", error);
    }
  }, [error]);

  const handleClose = () => {
    // Reset the error boundary to allow the component tree to re-render
    resetErrorBoundary();
  };

  return (
    <GlobalErrorModal
      isOpen={true}
      onClose={handleClose}
      titleText="Application Error"
      contentText={
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      }
    />
  );
};

export default ErrorFallback;
