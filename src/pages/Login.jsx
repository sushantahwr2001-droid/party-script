import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

const AUTH_COPY = {
  signin: {
    eyebrow: "Party Script",
    title: "Welcome back",
    body: "Sign in to access your event command center.",
    cta: "Login",
    footerPrompt: "Need an account?",
    footerAction: "Create account",
  },
  signup: {
    eyebrow: "Party Script",
    title: "Create account",
    body: "Start your workspace and manage every event from one place.",
    cta: "Create account",
    footerPrompt: "Already have an account?",
    footerAction: "Back to sign in",
  },
};

export default function Login() {
  const { login, signup, isConfigured, authError, authDebug } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState("signin");

  const copy = AUTH_COPY[mode];

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
        px: 2,
        py: 3,
        background: "#0a0f18",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 540,
          p: { xs: 3, md: 4.5 },
          borderRadius: 6,
          background: "#101826",
          border: "1px solid rgba(109, 107, 255, 0.18)",
          boxShadow: "0 18px 40px rgba(2, 6, 23, 0.32)",
        }}
      >
        <Stack spacing={1.25} sx={{ textAlign: "center", alignItems: "center" }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#7c76ff",
            }}
          >
            {copy.eyebrow}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 36, md: 48 },
              lineHeight: 0.98,
              letterSpacing: "-0.06em",
              fontWeight: 800,
            }}
          >
            {copy.title}
          </Typography>
          <Typography
            sx={{
              maxWidth: 360,
              fontSize: 15,
              lineHeight: 1.7,
              color: "rgba(226, 232, 240, 0.72)",
            }}
          >
            {copy.body}
          </Typography>
        </Stack>

        <Divider sx={{ my: 3.5, borderColor: "rgba(148, 163, 184, 0.14)" }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1.75 }}>
          {!isConfigured ? (
            <Alert severity="warning">
              Supabase isn&apos;t configured yet. Add `VITE_SUPABASE_URL` and
              `VITE_SUPABASE_PUBLISHABLE_KEY` to your local `.env` file.
            </Alert>
          ) : null}

          <TextField
            label="Email"
            value={form.email}
            onChange={handleChange("email")}
            fullWidth
            InputLabelProps={{ sx: { color: "rgba(148, 163, 184, 0.78)" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: 64,
                borderRadius: 2.2,
                bgcolor: "rgba(248, 250, 252, 0.98)",
                color: "#0f172a",
              },
            }}
          />

          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            fullWidth
            InputLabelProps={{ sx: { color: "rgba(148, 163, 184, 0.78)" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: 64,
                borderRadius: 2.2,
                bgcolor: "rgba(248, 250, 252, 0.98)",
                color: "#0f172a",
              },
            }}
          />

          {error ? (
            <Typography fontSize={12} color="#fca5a5">
              {error}
            </Typography>
          ) : null}

          {!error && notice ? (
            <Typography fontSize={12} color="#93c5fd">
              {notice}
            </Typography>
          ) : null}

          {!error && authError ? (
            <Typography fontSize={12} color="#fca5a5">
              {authError}
            </Typography>
          ) : null}

          {!error && !notice && authDebug ? (
            <Alert severity="error" sx={{ py: 0 }}>
              {authDebug}
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !isConfigured}
            sx={{
              mt: 1,
              minHeight: 62,
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {submitting
              ? mode === "signup"
                ? "Creating account..."
                : "Signing in..."
              : copy.cta}
          </Button>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          mt={2}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography fontSize={13} color="rgba(226, 232, 240, 0.62)">
            {copy.footerPrompt}
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setMode((current) => (current === "signup" ? "signin" : "signup"));
              setError("");
              setNotice("");
            }}
            sx={{ fontWeight: 700 }}
          >
            {copy.footerAction}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
