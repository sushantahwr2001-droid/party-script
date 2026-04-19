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
    badge: "Party Script",
    title: "Run every celebration from one calm command center.",
    body: "Sign in to manage timelines, vendors, budgets, documents, and the moving parts that make events feel effortless.",
    eyebrow: "Event operations, unified",
    formTitle: "Welcome back",
    formBody: "Sign in to return to your live dashboards, event workspaces, and execution tools.",
    cta: "Login",
    footerPrompt: "Need an account?",
    footerAction: "Create account",
  },
  signup: {
    badge: "Party Script",
    title: "Create your event workspace with a cleaner operating system.",
    body: "Start a secure workspace for planning, approvals, documents, budgets, vendors, and event-day execution in one place.",
    eyebrow: "Build your event OS",
    formTitle: "Create account",
    formBody: "Set up your Party Script workspace and start organizing events with better visibility.",
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
        background:
          "linear-gradient(135deg, #07111f 0%, #0a1630 42%, #121b3d 100%)",
        p: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          minHeight: "calc(100vh - 32px)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" },
          borderRadius: { xs: 4, lg: 5 },
          overflow: "hidden",
          boxShadow: "0 28px 70px rgba(2, 6, 23, 0.45)",
          border: "1px solid rgba(129, 140, 248, 0.12)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            px: { xs: 3, md: 5, lg: 7 },
            py: { xs: 5, md: 6 },
            background:
              "linear-gradient(135deg, rgba(8, 16, 30, 0.98) 0%, rgba(12, 20, 44, 0.98) 52%, rgba(20, 30, 72, 0.98) 100%)",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, transparent 0%, transparent 35%, rgba(109,107,255,0.12) 35%, rgba(109,107,255,0.12) 39%, transparent 39%), linear-gradient(135deg, transparent 0%, transparent 72%, rgba(255,255,255,0.05) 72%, rgba(255,255,255,0.05) 74%, transparent 74%)",
              pointerEvents: "none",
            },
          }}
        >
          <Stack spacing={3} sx={{ position: "relative", zIndex: 1, maxWidth: 620 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignSelf: "flex-start",
                px: 2,
                py: 0.9,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Typography fontSize={15} fontWeight={700}>
                {copy.badge}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: { xs: 52, md: 72, lg: 82 },
                lineHeight: { xs: 0.98, md: 0.94 },
                letterSpacing: "-0.07em",
                fontWeight: 800,
                maxWidth: 760,
              }}
            >
              {copy.title}
            </Typography>

            <Typography
              sx={{
                maxWidth: 620,
                fontSize: { xs: 18, md: 22 },
                lineHeight: 1.65,
                color: "rgba(226, 232, 240, 0.86)",
              }}
            >
              {copy.body}
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2.5, md: 4 },
            py: { xs: 4, md: 5 },
            background:
              "linear-gradient(180deg, rgba(247, 249, 253, 0.98), rgba(236, 241, 251, 0.96))",
          }}
        >
          <Card
            sx={{
              width: "100%",
              maxWidth: 560,
              p: { xs: 3, md: 4.5 },
              borderRadius: 5,
              background:
                "linear-gradient(180deg, rgba(20, 29, 52, 0.98), rgba(26, 34, 57, 0.98))",
              border: "1px solid rgba(99, 102, 241, 0.12)",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.24)",
            }}
          >
            <Stack spacing={1.25}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#6963ff",
                }}
              >
                {copy.eyebrow}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 42, md: 50 },
                  lineHeight: 0.98,
                  letterSpacing: "-0.06em",
                  fontWeight: 800,
                  color: "#0b1220",
                }}
              >
                {copy.formTitle}
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "rgba(10, 18, 32, 0.62)",
                  maxWidth: 420,
                }}
              >
                {copy.formBody}
              </Typography>
            </Stack>

            <Divider sx={{ my: 3.5, borderColor: "rgba(148, 163, 184, 0.16)" }} />

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
                InputLabelProps={{ sx: { color: "rgba(89, 111, 151, 0.7)" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    minHeight: 68,
                    borderRadius: 1.75,
                    bgcolor: "#f6f8fc",
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
                InputLabelProps={{ sx: { color: "rgba(89, 111, 151, 0.7)" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    minHeight: 68,
                    borderRadius: 1.75,
                    bgcolor: "#f6f8fc",
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
                  minHeight: 64,
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
              mt={1.75}
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography fontSize={13} color="rgba(10, 18, 32, 0.6)">
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
      </Box>
    </Box>
  );
}
