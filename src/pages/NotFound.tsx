import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { logger } from '@/lib/logger';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route", undefined, { 
      pathname: location.pathname,
      operation: '404_error' 
    });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-primary">404</h1>
        <p className="mb-4 text-xl text-text-secondary">Oops! Page not found</p>
        <a href="/" className="text-primary hover:text-primary-hover underline transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
