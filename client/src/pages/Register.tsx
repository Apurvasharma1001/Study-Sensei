import { startTransition, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register, registerMutation } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    registerMutation.reset();

    try {
      await register({
        name,
        email,
        password,
      });

      toast({
        title: "Account created",
        description: "Your Study Sensei workspace is ready.",
      });
      startTransition(() => {
        setLocation("/");
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create your account."));
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80 shadow-xl order-2 lg:order-1">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-heading">Create Account</CardTitle>
            <CardDescription>
              Register once and keep your session active for seven days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {formError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Registration failed</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  autoComplete="name"
                  id="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  required
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  autoComplete="email"
                  id="register-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="john@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  autoComplete="new-password"
                  id="register-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type="password"
                  value={password}
                />
              </div>

              <Button
                className="w-full"
                disabled={registerMutation.isPending}
                type="submit"
              >
                {registerMutation.isPending ? (
                  <>
                    <Spinner />
                    Creating your account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
                <a className="font-medium text-primary hover:underline">
                  Sign in here
                </a>
              </Link>
            </p>
          </CardContent>
        </Card>

        <section className="order-1 rounded-3xl border border-border bg-linear-to-br from-secondary/50 via-background to-primary/10 p-8 shadow-sm lg:order-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <UserPlus className="h-4 w-4" />
            Start your workspace
          </div>
          <div className="mt-8 space-y-5">
            <h1 className="max-w-xl text-4xl font-heading font-bold leading-tight text-foreground">
              Create the account that the new auth guard expects.
            </h1>
            <p className="max-w-lg text-base text-muted-foreground">
              Registration now writes to PostgreSQL, hashes your password with bcrypt,
              and boots a real server-side session immediately after signup.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              "Duplicate email protection with clear errors",
              "Server-side session cookie with 7-day lifetime",
              "Profile data ready for sidebar and future settings",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
