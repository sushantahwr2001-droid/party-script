import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label } from "../components/forms";
import { Button, Card } from "../components/ui";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("founder@partyscript.app");
  const [password, setPassword] = useState("partyscript123");
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
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
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
          <h1 className="mt-4 max-w-xl text-5xl font-bold tracking-tight">The production Event OS for teams that run events without chaos.</h1>
          <p className="mt-5 max-w-2xl text-lg text-textSecondary">
            This version includes real routing, JWT auth, persisted backend models, and live operational data for events, booths, budgets, opportunities, and leads.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Hosted events", "Run registrations, agenda, vendors, tickets, and check-ins in one place."],
              ["Exhibition planning", "Score opportunities, convert approved ones, and manage booth readiness."],
              ["Lead follow-up", "Track qualification, ownership, next actions, and revenue potential."]
            ].map(([title, description]) => (
              <Card key={title} className="p-5">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-textSecondary">{description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <Card className="w-full p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-textMuted">
              {mode === "login" ? "Sign in" : "Create account"}
            </p>
            <h2 className="mt-3 text-3xl font-bold">{mode === "login" ? "Welcome back" : "Start running the system"}</h2>
            <p className="mt-2 text-sm text-textSecondary">
              Demo credentials: `founder@partyscript.app` / `partyscript123`
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {mode === "register" ? (
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Aarav Mehta" required />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <button
              onClick={() => setMode((current) => (current === "login" ? "register" : "login"))}
              className="mt-4 text-sm font-semibold text-textSecondary transition hover:text-text"
            >
              {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
