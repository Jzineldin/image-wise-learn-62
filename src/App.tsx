import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";

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
const Testimonials = lazy(() => import("./pages/Testimonials"));
const NotFound = lazy(() => import("./pages/NotFound"));


const queryClient = new QueryClient();

// Force refresh - Testimonials component should be available

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
               <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
               <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
               <Route path="/characters" element={<ProtectedRoute><Characters /></ProtectedRoute>} />
               <Route path="/my-stories" element={<ProtectedRoute><MyStories /></ProtectedRoute>} />
               <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
               <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
               <Route path="/discover" element={<Discover />} />
                 <Route path="/story/:id/end" element={<StoryEnd />} />
                 <Route path="/story/:id" element={
                   <ProtectedRoute requiresAuth={false} checkStoryAccess={true}>
                     <StoryViewer />
                   </ProtectedRoute>
                 } />
                 <Route path="/about" element={<About />} />
                 <Route path="/pricing" element={<Pricing />} />
                 <Route path="/success" element={<Success />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/testimonials" element={<Testimonials />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
