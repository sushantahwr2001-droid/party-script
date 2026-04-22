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
import partyScriptLogoLight from "../assets/party-script-logo-light.png";

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
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top, rgba(99,102,241,0.2), transparent 30%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.16), transparent 28%), #0a0f18",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 95%)",
          pointerEvents: "none",
        }}
      />

      <Card
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 540,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 6,
          background: "#101826",
          border: "1px solid rgba(109, 107, 255, 0.18)",
          boxShadow: "0 18px 40px rgba(2, 6, 23, 0.32)",
        }}
      >
        <Stack spacing={0.75} sx={{ textAlign: "center", alignItems: "center" }}>
          <Box
            component="img"
            src={partyScriptLogoLight}
            alt="Party Script"
            sx={{
              display: "block",
              width: "100%",
              maxWidth: 238,
              height: "auto",
              objectFit: "contain",
              mb: 0.25,
            }}
          />
          <Typography
            sx={{
              fontSize: { xs: 30, md: 42 },
              lineHeight: 1,
              letterSpacing: "-0.06em",
              fontWeight: 800,
            }}
          >
            {copy.title}
          </Typography>
          <Typography
            sx={{
              maxWidth: 360,
              fontSize: 14,
              lineHeight: 1.55,
              color: "rgba(226, 232, 240, 0.72)",
            }}
          >
            {copy.body}
          </Typography>
        </Stack>

        <Divider sx={{ my: 2.25, borderColor: "rgba(148, 163, 184, 0.14)" }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1.25 }}>
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
            variant="outlined"
            InputLabelProps={{
              shrink: false,
              sx: {
                color: "rgba(148, 163, 184, 0.78)",
                "&.Mui-focused, &.MuiFormLabel-filled": {
                  display: "none",
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: 56,
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
            variant="outlined"
            InputLabelProps={{
              shrink: false,
              sx: {
                color: "rgba(148, 163, 184, 0.78)",
                "&.Mui-focused, &.MuiFormLabel-filled": {
                  display: "none",
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: 56,
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
              mt: 0.5,
              minHeight: 58,
              borderRadius: 999,
              fontSize: 17,
              fontWeight: 700,
              background: "linear-gradient(135deg, #5b61ff 0%, #6366f1 100%)",
              boxShadow: "0 18px 30px rgba(79, 70, 229, 0.28)",
              "&:hover": {
                background: "linear-gradient(135deg, #646cff 0%, #6d67ff 100%)",
              },
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
          mt={1.5}
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
