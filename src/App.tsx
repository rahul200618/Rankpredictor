import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExamModeProvider } from "@/contexts/ExamModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Premium Lazy-loaded Pages
const Home = lazy(() => import("@/pages/Home"));
const RankPredictor = lazy(() => import("@/pages/RankPredictor"));
const CollegeFinder = lazy(() => import("@/pages/CollegeFinder"));
const CollegeDetail = lazy(() => import("@/pages/CollegeDetail"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const DeveloperPage = lazy(() => import("@/pages/DeveloperPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Custom animated premium loader for chunk transitions
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative w-12 h-12">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 animate-spin" />
    </div>
    <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading secure module...</p>
  </div>
);

const queryClient = new QueryClient();

function AppRoutes() {
  const [location] = useLocation();
  const isAuthPage = location === "/auth";

  if (isAuthPage) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/rank-predictor">
        <ProtectedRoute><RankPredictor /></ProtectedRoute>
      </Route>
      <Route path="/college-finder">
        <ProtectedRoute><CollegeFinder /></ProtectedRoute>
      </Route>
      <Route path="/college/:collegeCode">
        {(params) => <ProtectedRoute><CollegeDetail /></ProtectedRoute>}
      </Route>
      <Route path="/admin">
        <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
      </Route>
      <Route path="/developer">
        <ProtectedRoute developerOnly><DeveloperPage /></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const [theme, setTheme] = useState<"light" | "dark">(lightOrDarkTheme);
  const [location] = useLocation();
  const isAuthPage = location === "/auth";

  function lightOrDarkTheme(): "light" | "dark" {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  if (isAuthPage) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    );
  }

  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ExamModeProvider>
            <AuthProvider>
              <WouterRouter base={import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, "") : ""}>
                <AppShell />
              </WouterRouter>
              <Toaster />
            </AuthProvider>
          </ExamModeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
