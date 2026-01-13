import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

// Eager load the landing page for best LCP
import Index from "./pages/Index";

// Lazy load other routes to reduce initial bundle size
const Articles = lazy(() => import("./pages/Articles"));
const Article = lazy(() => import("./pages/Article"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Auth = lazy(() => import("./pages/Auth"));
const Congratulations = lazy(() => import("./pages/Congratulations"));
const Admin = lazy(() => import("./pages/Admin"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Sitemap = lazy(() => import("./pages/Sitemap"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/artiklar" element={<Articles />} />
            <Route path="/artikel/:slug" element={<Article />} />
            <Route path="/quiz/:slug" element={<Quiz />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/grattis" element={<Congratulations />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/avregistrera" element={<Unsubscribe />} />
            <Route path="/integritetspolicy" element={<PrivacyPolicy />} />
            <Route path="/om" element={<About />} />
            <Route path="/sitemap.xml" element={<Sitemap />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
