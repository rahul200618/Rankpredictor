import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExamModeProvider } from "@/contexts/ExamModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import RankPredictor from "@/pages/RankPredictor";
import CollegeFinder from "@/pages/CollegeFinder";
import CollegeDetail from "@/pages/CollegeDetail";
import AuthPage from "@/pages/AuthPage";
import AdminPage from "@/pages/AdminPage";
import DeveloperPage from "@/pages/DeveloperPage";
import NotFound from "@/pages/not-found";

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
        <RankPredictor />
      </Route>
      <Route path="/college-finder">
        <CollegeFinder />
      </Route>
      <Route path="/college/:collegeCode">
        {(params) => <CollegeDetail />}
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
    return <AppRoutes />;
  }

  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <AppRoutes />
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
