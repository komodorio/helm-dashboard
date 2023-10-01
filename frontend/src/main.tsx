import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "react-error-boundary";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ErrorBoundary fallback={<div>Something went wrong</div>}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ErrorBoundary>
);
