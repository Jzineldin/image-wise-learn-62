import React from 'react';
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import RouteErrorFallback from "@/components/RouteErrorFallback";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load routes for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/auth/Auth"));
const Create = lazy(() => import("./pages/Create"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Characters = lazy(() => import("./pages/Characters"));
const MyStories = lazy(() => import("./pages/MyStories"));
const Settings = lazy(() => import("./pages/Settings"));
const Discover = lazy(() => import("./pages/Discover"));
const Admin = lazy(() => import("./pages/Admin"));
const StoryViewer = lazy(() => import("./pages/StoryViewer"));
const StoryEnd = lazy(() => import("./pages/StoryEnd"));
const About = lazy(() => import("./pages/About"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Success = lazy(() => import("./pages/Success"));
const TestimonialsPage = lazy(() => import("./pages/Testimonials"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));


import { queryClient } from "@/lib/query-client";
import { logger } from "@/lib/logger";
import { performanceMonitor } from "@/lib/performance-monitor";

// Force refresh - Testimonials component should be available

const App = () => {
  // Track initial app performance
  useEffect(() => {
    performanceMonitor.trackPageLoad('App');
    performanceMonitor.trackBundleMetrics();

    // Log memory usage in development
    if (import.meta.env.DEV) {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      if (memoryUsage) {
        logger.debug('Initial memory usage', memoryUsage);
      }
    }
  }, []);

  // Global error handlers with proper cleanup
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      const err = event.error;
      const message = event.message;
      const actionable = (err && (err.message || err.stack)) ||
                         (typeof message === 'string' && message.trim() && message !== 'Script error.');

      if (!actionable) return;

      logger.error('Global error caught', err ?? message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        operation: 'global-error'
      });
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (!reason) return;
      logger.error('Unhandled promise rejection', reason, {
        operation: 'unhandled-rejection'
      });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="midnight" enableAutoTheme={false}>
          <TooltipProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <>
                <Toaster />
                <Sonner />
                {/* Context7 Pattern: Enhanced Suspense boundary with proper loading state */}
                <Suspense fallback={<PageLoadingSpinner text="Loading application..." />}>
                  <main id="main-content" role="main" tabIndex={-1}>
                    <Routes>
                    <Route path="/auth" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Authentication" />}>
                        <Auth />
                      </ErrorBoundary>
                    } />
                    <Route path="/auth/callback" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Authentication Callback" />}>
                        <Auth />
                      </ErrorBoundary>
                    } />
                    <Route path="/" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Home" />}>
                        <Index />
                      </ErrorBoundary>
                    } />

                    <Route path="/create" element={
                      <ErrorBoundary fallback={(error) => <RouteErrorFallback error={error} context="Create" />}>
                        <ProtectedRoute>
                          {/* Context7 Pattern: Suspense for heavy create component */}
                          <Suspense fallback={<PageLoadingSpinner text="Loading story creator..." />}>
                            <Create />
                          </Suspense>
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />

                    <Route path="/dashboard" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Dashboard" />}>
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />

                    <Route path="/characters" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Characters" />}>
                        <ProtectedRoute>
                          <Characters />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />

                    <Route path="/my-stories" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="My Stories" />}>
                        <ProtectedRoute>
                          <MyStories />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />

                    <Route path="/settings" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Settings" />}>
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />

                    <Route path="/admin" element={
                      <ErrorBoundary fallback={(error) => <RouteErrorFallback error={error} context="Admin" />}>
                        <ProtectedRoute requiresAdmin={true}>
                          {/* Context7 Pattern: Suspense for heavy admin component */}
                          <Suspense fallback={<PageLoadingSpinner text="Loading admin panel..." />}>
                            <Admin />
                          </Suspense>
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />

                    <Route path="/discover" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Discover" />}>
                        <ProtectedRoute>
                          <Discover />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />

                    <Route path="/story/:id/end" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Story End" />}>
                        <StoryEnd />
                      </ErrorBoundary>
                    } />

                    <Route path="/story/:id" element={
                      <ErrorBoundary fallback={(error) => <RouteErrorFallback error={error} context="Story Viewer" />}>
                        <ProtectedRoute requiresAuth={false} checkStoryAccess={true}>
                          <StoryViewer />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } />

                    <Route path="/about" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="About" />}>
                        <About />
                      </ErrorBoundary>
                    } />
                    <Route path="/pricing" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Pricing" />}>
                        <Pricing />
                      </ErrorBoundary>
                    } />
                    <Route path="/success" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Success" />}>
                        <Success />
                      </ErrorBoundary>
                    } />
                    <Route path="/contact" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Contact" />}>
                        <Contact />
                      </ErrorBoundary>
                    } />
                    <Route path="/privacy" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Privacy Policy" />}>
                        <Privacy />
                      </ErrorBoundary>
                    } />
                    <Route path="/terms" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Terms of Service" />}>
                        <Terms />
                      </ErrorBoundary>
                    } />
                    <Route path="/testimonials" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Testimonials" />}>
                        <TestimonialsPage />
                      </ErrorBoundary>
                    } />
                     <Route path="*" element={
                      <ErrorBoundary fallback={<RouteErrorFallback context="Page Not Found" />}>
                        <NotFoundPage />
                      </ErrorBoundary>
                    } />
                   </Routes>
                  </main>
                   {/* React Query Devtools - only shows in development */}
                   <ReactQueryDevtools initialIsOpen={false} />
               </Suspense>
              </>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
