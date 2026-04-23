import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label } from "../components/forms";
import { Button, Card } from "../components/ui";

export function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-app px-6 py-10 text-text">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#BDAEFF]">Party Script</p>
          <h1 className="mt-4 max-w-xl text-5xl font-bold tracking-tight">The clean Event OS for teams that run events without chaos.</h1>
          <p className="mt-5 max-w-2xl text-lg text-textSecondary">
            Log in to manage hosted events, exhibition planning, booth readiness, leads, vendors, budgets, and operational follow-up in one connected system.
          </p>
        </div>

        <div className="flex items-center">
          <Card className="w-full p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-textMuted">Sign in</p>
            <h2 className="mt-3 text-3xl font-bold">Welcome back</h2>
            <p className="mt-2 text-sm text-textSecondary">Use your workspace credentials to continue.</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  <button type="button" className="text-xs font-semibold text-[#C9BDFF]" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm text-textMuted">
              <Link to="/signup" className="transition hover:text-text">Create an account</Link>
              <Link to="/forgot-password" className="transition hover:text-text">Forgot password?</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
