import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "./lib/production-logger";

// Log startup with performance monitoring enabled

// Global error handlers for better debugging
window.addEventListener('error', (event) => {
  logger.error('Global error caught', event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    operation: 'global-error'
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason, {
    operation: 'unhandled-rejection'
  });
});

// Log startup
logger.info('Application starting', {
  operation: 'startup',
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent
});

createRoot(document.getElementById("root")!).render(<App />);
