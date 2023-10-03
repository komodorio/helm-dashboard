import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorBoundaryFallback } from "./components/ErrorBoundaryFallback";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ErrorBoundary>
);
