import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label } from "../components/forms";
import { Button, Card } from "../components/ui";

export function SignupPage() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the terms to continue.");
      return;
    }

    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password, form.organizationName);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-app px-6 py-10 text-text">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
        <Card className="w-full p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-textMuted">Create workspace</p>
          <h1 className="mt-3 text-3xl font-bold">Start your Party Script workspace</h1>
          <p className="mt-2 text-sm text-textSecondary">Create your account and workspace to run events, booths, vendors, budgets, and lead follow-up in one place.</p>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2"><Label>Full name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Organization</Label><Input value={form.organizationName} onChange={(event) => setForm({ ...form, organizationName: event.target.value })} required /></div>
            <div className="space-y-2 md:col-span-2"><Label>Work email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Confirm password</Label><Input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required /></div>
            <label className="md:col-span-2 flex items-center gap-3 text-sm text-textSecondary">
              <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
              I agree to use Party Script under my organization’s authorization.
            </label>
            {error ? <p className="md:col-span-2 text-sm text-danger">{error}</p> : null}
            <div className="md:col-span-2 flex items-center justify-between gap-3">
              <Link to="/login" className="text-sm text-textMuted transition hover:text-text">Back to login</Link>
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Account"}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
