import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";
import { logger } from "./lib/production-logger";
import ErrorBoundary from "./components/ErrorBoundary";

// Log startup with performance monitoring enabled
logger.info('Application starting', {
  operation: 'startup',
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent
});

// Note: Global error handlers moved to App.tsx for proper cleanup
// Wrap App in ErrorBoundary for production-grade error handling
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </ErrorBoundary>
);
