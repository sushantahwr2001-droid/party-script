import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label } from "../components/forms";
import { Button, Card } from "../components/ui";
import { api } from "../lib/api";
import type { SetupStatusResponse } from "../types";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const [setupStatus, setSetupStatus] = useState<SetupStatusResponse | null>(null);
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("Party Script Workspace");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(true);

  useEffect(() => {
    async function loadSetupStatus() {
      try {
        const status = await api.setupStatus();
        setSetupStatus(status);
        if (status.organizationName) {
          setOrganizationName(status.organizationName);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load authentication status.");
      } finally {
        setLoadingSetup(false);
      }
    }

    void loadSetupStatus();
  }, []);

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (setupStatus?.setupRequired) {
        await register(name, email, password, organizationName);
      } else {
        await login(email, password);
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
            {loadingSetup ? (
              <div className="py-10 text-sm text-textSecondary">Checking workspace setup...</div>
            ) : (
              <>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-textMuted">
              {setupStatus?.setupRequired ? "Create admin account" : "Sign in"}
            </p>
            <h2 className="mt-3 text-3xl font-bold">{setupStatus?.setupRequired ? "Set up your workspace" : "Welcome back"}</h2>
            <p className="mt-2 text-sm text-textSecondary">
              {setupStatus?.setupRequired
                ? "Create the first admin account for this Party Script workspace. Self-serve signup closes automatically after setup."
                : "Sign in with your workspace credentials. If you need access, ask a workspace admin."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {setupStatus?.setupRequired ? (
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Party Script Workspace" required />
                </div>
              ) : null}
              {setupStatus?.setupRequired ? (
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
                {submitting ? "Working..." : setupStatus?.setupRequired ? "Create Admin Account" : "Sign In"}
              </Button>
            </form>
            {!setupStatus?.setupRequired ? (
              <p className="mt-4 text-sm text-textMuted">
                Admin onboarding is complete for this workspace.
              </p>
            ) : null}
            </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
