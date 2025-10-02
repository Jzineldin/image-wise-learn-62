import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "./lib/production-logger";

// Log startup with performance monitoring enabled
logger.info('Application starting', {
  operation: 'startup',
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent
});

// Note: Global error handlers moved to App.tsx for proper cleanup
createRoot(document.getElementById("root")!).render(<App />);
