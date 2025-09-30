import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "./lib/production-logger";

// Log startup with performance monitoring enabled

// Global error handlers for better debugging
window.addEventListener('error', (event) => {
  const err: any = (event as ErrorEvent)?.error;
  const message = (event as ErrorEvent)?.message;
  const actionable = (
    err && (err.message || err.stack)
  ) || (
    typeof message === 'string' && message.trim() && message !== 'Script error.'
  );

  // Suppress null/empty/no-signal global errors
  if (!actionable) return;

  logger.error('Global error caught', err ?? message, {
    filename: (event as ErrorEvent).filename,
    lineno: (event as ErrorEvent).lineno,
    colno: (event as ErrorEvent).colno,
    operation: 'global-error'
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason: any = (event as PromiseRejectionEvent).reason;
  if (!reason) return; // Suppress empty reasons
  logger.error('Unhandled promise rejection', reason, {
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
