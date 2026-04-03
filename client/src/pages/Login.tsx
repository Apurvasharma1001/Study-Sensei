import { startTransition, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { AlertCircle, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, loginMutation } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    loginMutation.reset();

    try {
      await login({
        email,
        password,
      });

      toast({
        title: "Welcome back",
        description: "Your dashboard is ready.",
      });
      startTransition(() => {
        setLocation("/");
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to sign in right now."));
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-border bg-linear-to-br from-primary/10 via-background to-secondary/40 p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <BookOpen className="h-4 w-4" />
            Study Sensei
          </div>
          <div className="mt-8 space-y-5">
            <h1 className="max-w-xl text-4xl font-heading font-bold leading-tight text-foreground">
              Sign in to turn the mock frontend into your real study workspace.
            </h1>
            <p className="max-w-lg text-base text-muted-foreground">
              Access your planner, AI tutor, quizzes, and analytics with a persistent
              session backed by the new server foundation.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <Sparkles className="mb-3 h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Real session auth</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your login now comes from `/api/auth/login`, not hardcoded UI data.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <ArrowRight className="mb-3 h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Route protection</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Protected screens redirect cleanly until a valid session exists.
              </p>
            </div>
          </div>
        </section>

        <Card className="border-border/80 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-heading">Sign In</CardTitle>
            <CardDescription>
              Use your Study Sensei account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {formError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sign in failed</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="john@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete="current-password"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  type="password"
                  value={password}
                />
              </div>

              <Button
                className="w-full"
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending ? (
                  <>
                    <Spinner />
                    Signing you in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/register">
                <a className="font-medium text-primary hover:underline">
                  Create an account
                </a>
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
