import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Planner from "@/pages/Planner";
import Tutor from "@/pages/Tutor";
import Quizzes from "@/pages/Quiz";
import Analytics from "@/pages/Analytics";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useEffect, type ReactNode } from "react";

function ProtectedRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/planner" component={Planner} />
        <Route path="/tutor" component={Tutor} />
        <Route path="/quizzes" component={Quizzes} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AuthRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={Login} />
    </Switch>
  );
}

function FullscreenState({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      {children}
    </div>
  );
}

function AppRouter() {
  const [location, setLocation] = useLocation();
  const { error, isAuthenticated, isLoading, refetchUser } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute = location === "/login" || location === "/register";
    if (!isAuthenticated && !isAuthRoute) {
      setLocation("/login");
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <FullscreenState>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          Checking your session...
        </div>
      </FullscreenState>
    );
  }

  if (error) {
    return (
      <FullscreenState>
        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold text-foreground">
            We could not verify your session.
          </p>
          <p className="text-sm text-muted-foreground">
            Please retry the request or refresh the page.
          </p>
          <Button onClick={() => void refetchUser()}>Retry</Button>
        </div>
      </FullscreenState>
    );
  }

  return isAuthenticated ? <ProtectedRouter /> : <AuthRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
