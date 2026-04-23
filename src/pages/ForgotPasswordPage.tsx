import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label } from "../components/forms";
import { Button, Card } from "../components/ui";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const response = await forgotPassword(email);
      setResult(response.resetUrl ?? "If your account exists, a recovery link has been generated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start password reset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-app px-6 py-10 text-text">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center">
        <Card className="w-full p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-textMuted">Recovery</p>
          <h1 className="mt-3 text-3xl font-bold">Forgot your password?</h1>
          <p className="mt-2 text-sm text-textSecondary">Enter your email and Party Script will generate a secure reset link.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {result ? <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-textSecondary break-all">{result}</div> : null}
            <div className="flex items-center justify-between gap-3">
              <Link to="/login" className="text-sm text-textMuted transition hover:text-text">Back to login</Link>
              <Button type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send reset link"}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
