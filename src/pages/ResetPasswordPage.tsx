import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label } from "../components/forms";
import { Button, Card } from "../components/ui";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-app px-6 py-10 text-text">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center">
        <Card className="w-full p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-textMuted">Reset password</p>
          <h1 className="mt-3 text-3xl font-bold">Choose a new password</h1>
          <p className="mt-2 text-sm text-textSecondary">Update your Party Script password securely using the recovery token.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2"><Label>New password</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="space-y-2"><Label>Confirm password</Label><Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {success ? <p className="text-sm text-success">Password updated. You can log in now.</p> : null}
            <div className="flex items-center justify-between gap-3">
              <Link to="/login" className="text-sm text-textMuted transition hover:text-text">Back to login</Link>
              <Button type="submit" disabled={submitting}>{submitting ? "Updating..." : "Update password"}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
