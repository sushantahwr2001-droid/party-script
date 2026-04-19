import { useState } from "react";
import { Alert, Box, Button, Card, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

export default function Login() {
  const { login, signup, isConfigured, authError, authDebug } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState("signin");

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const result = await signup(form.email, form.password);

        if (result?.requiresEmailConfirmation) {
          setNotice("Account created. Confirm your email, then come back and sign in.");
        } else {
          navigate("/", { replace: true });
        }
      } else {
        await login(form.email, form.password);
        navigate("/", { replace: true });
      }
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,0.12), transparent 24%), radial-gradient(circle at top right, rgba(129,140,248,0.16), transparent 20%), #07111f",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420, p: 3 }}>
        <Typography fontSize={28} fontWeight={800} letterSpacing="-0.04em">
          Party Script
        </Typography>
        <Typography fontSize={13} color="text.secondary" mt={0.75} mb={2}>
          {mode === "signup"
            ? "Create your account for Party OS."
            : "Sign in to access your event command center."}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1.25 }}>
          {!isConfigured ? (
            <Alert severity="warning">
              Supabase isn&apos;t configured yet. Add `VITE_SUPABASE_URL` and
              `VITE_SUPABASE_PUBLISHABLE_KEY` to your local `.env` file.
            </Alert>
          ) : null}

          <TextField label="Email" value={form.email} onChange={handleChange("email")} />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
          />

          {error ? (
            <Typography fontSize={12} color="#f87171">
              {error}
            </Typography>
          ) : null}

          {!error && notice ? (
            <Typography fontSize={12} color="#93c5fd">
              {notice}
            </Typography>
          ) : null}

          {!error && authError ? (
            <Typography fontSize={12} color="#f87171">
              {authError}
            </Typography>
          ) : null}

          {!error && !notice && authDebug ? (
            <Alert severity="error" sx={{ py: 0 }}>
              {authDebug}
            </Alert>
          ) : null}

          <Button type="submit" variant="contained" disabled={submitting || !isConfigured}>
            {submitting
              ? mode === "signup"
                ? "Creating account..."
                : "Signing in..."
              : mode === "signup"
                ? "Create account"
                : "Login"}
          </Button>

        </Box>

        <Stack
          direction="row"
          spacing={1}
          mt={2}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography fontSize={11} color="text.secondary">
            {mode === "signup"
              ? "Already have an account?"
              : "Need an account?"}
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setMode((current) => (current === "signup" ? "signin" : "signup"));
              setError("");
              setNotice("");
            }}
          >
            {mode === "signup" ? "Back to sign in" : "Create account"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
