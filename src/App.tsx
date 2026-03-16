import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import { AuthProvider } from "@/core/auth/context/AuthContext";
import PrivateRoute from "@/core/auth/components/PrivateRoute";

// Core routes
import { authRoutes } from "@/core/auth/routes";
import { dashboardRoutes } from "@/core/dashboard/routes";

// Module routes
import { moduleRoutes } from "@/modules/routes";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ChartCapturePage from "./pages/ChartCapturePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/chart-capture" element={<ChartCapturePage />} />
            <Route path="/" element={<Index />} />

            {/* Public routes (login, reset-password) */}
            {authRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Protected routes */}
            {[...dashboardRoutes, ...moduleRoutes].map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
