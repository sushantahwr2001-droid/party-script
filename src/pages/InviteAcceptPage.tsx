import { useState, type FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label } from "../components/forms";
import { Button, Card } from "../components/ui";

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const { user, acceptInvite } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Invite token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvite(token, name, password);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to accept invite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-app px-6 py-10 text-text">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center">
        <Card className="w-full p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-textMuted">Workspace invite</p>
          <h1 className="mt-3 text-3xl font-bold">Join Party Script</h1>
          <p className="mt-2 text-sm text-textSecondary">Set your name and password to join the invited workspace.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2"><Label>Full name</Label><Input value={name} onChange={(event) => setName(event.target.value)} required /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="space-y-2"><Label>Confirm password</Label><Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex items-center justify-between gap-3">
              <Link to="/login" className="text-sm text-textMuted transition hover:text-text">Back to login</Link>
              <Button type="submit" disabled={submitting}>{submitting ? "Joining..." : "Accept Invite"}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
