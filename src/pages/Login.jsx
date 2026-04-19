import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import heroGraphic from "../assets/hero.png";
import { useAuth } from "../context/auth-context";

const AUTH_COPY = {
  signin: {
    eyebrow: "Event operations, unified",
    title: "Run every celebration from one calm command center.",
    body: "Sign in to manage timelines, vendors, budgets, documents, and the moving parts that make events feel effortless.",
    cta: "Login",
    footerPrompt: "Need an account?",
    footerAction: "Create account",
    panelBadge: "Live workspace",
    panelTitle: "Stay ahead of event-day chaos.",
    panelBody:
      "Keep every brief, payment, vendor handoff, and task update visible before small misses turn into expensive surprises.",
  },
  signup: {
    eyebrow: "Build your event OS",
    title: "Create your Party Script workspace.",
    body: "Start a secure operations hub for events, teams, vendors, and guests with a setup that takes only a minute.",
    cta: "Create account",
    footerPrompt: "Already have an account?",
    footerAction: "Back to sign in",
    panelBadge: "Faster launches",
    panelTitle: "Bring every event thread into one system.",
    panelBody:
      "From first enquiry to final payout, Party Script gives your team one place to plan, approve, track, and deliver with confidence.",
  },
};

const HIGHLIGHTS = [
  "Track tasks, budgets, vendors, and documents in one place",
  "Keep your team aligned with a live event-by-event workspace",
  "Reduce last-minute follow-up and missed approvals",
];

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
          "radial-gradient(circle at top left, rgba(56,189,248,0.14), transparent 22%), radial-gradient(circle at 85% 15%, rgba(109,107,255,0.28), transparent 30%), linear-gradient(180deg, #060d18 0%, #08111f 45%, #07101d 100%)",
        p: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          minHeight: "calc(100vh - 32px)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.12fr 0.88fr" },
          gap: { xs: 2, lg: 0 },
          overflow: "hidden",
          borderRadius: { xs: 4, lg: 6 },
          border: "1px solid rgba(125, 146, 189, 0.18)",
          background:
            "linear-gradient(180deg, rgba(8, 16, 30, 0.98), rgba(7, 14, 26, 0.96))",
          boxShadow: "0 28px 80px rgba(2, 6, 23, 0.42)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: { xs: 3, md: 5, lg: 6 },
            overflow: "hidden",
            background:
              "radial-gradient(circle at 25% 20%, rgba(56,189,248,0.16), transparent 20%), radial-gradient(circle at 75% 24%, rgba(109,107,255,0.22), transparent 26%), linear-gradient(135deg, rgba(11, 19, 35, 0.95) 0%, rgba(17, 28, 50, 0.98) 52%, rgba(28, 24, 68, 0.98) 100%)",
            minHeight: { xs: 360, lg: "100%" },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.75,
              background:
                "linear-gradient(135deg, transparent 0%, transparent 58%, rgba(255,255,255,0.05) 58%, rgba(255,255,255,0.05) 60%, transparent 60%), linear-gradient(315deg, transparent 0%, transparent 73%, rgba(109,107,255,0.12) 73%, rgba(109,107,255,0.12) 75%, transparent 75%)",
              pointerEvents: "none",
            }}
          />

          <Stack spacing={2} sx={{ position: "relative", zIndex: 1, maxWidth: 560 }}>
            <Chip
              label="Party Script"
              sx={{
                alignSelf: "flex-start",
                bgcolor: "rgba(255,255,255,0.08)",
                color: "#f8fbff",
                border: "1px solid rgba(255,255,255,0.12)",
                fontWeight: 700,
              }}
            />
            <Typography
              sx={{
                fontSize: { xs: 32, md: 44, lg: 52 },
                lineHeight: 1.02,
                letterSpacing: "-0.05em",
                fontWeight: 800,
                maxWidth: 620,
              }}
            >
              {copy.title}
            </Typography>
            <Typography
              sx={{
                maxWidth: 520,
                fontSize: { xs: 14, md: 16 },
                color: "rgba(226, 232, 240, 0.82)",
                lineHeight: 1.7,
              }}
            >
              {copy.body}
            </Typography>
          </Stack>

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              mt: { xs: 4, lg: 5 },
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.08fr 0.92fr" },
              gap: 3,
              alignItems: "end",
            }}
          >
            <Box
              sx={{
                borderRadius: 5,
                border: "1px solid rgba(255,255,255,0.1)",
                bgcolor: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                px: { xs: 2.5, md: 3 },
                py: { xs: 2.5, md: 3 },
              }}
            >
              <Chip
                label={copy.panelBadge}
                size="small"
                sx={{
                  mb: 2,
                  bgcolor: "rgba(109,107,255,0.18)",
                  color: "#dfe5ff",
                  border: "1px solid rgba(129,140,248,0.28)",
                }}
              />
              <Typography fontSize={{ xs: 22, md: 26 }} fontWeight={700} letterSpacing="-0.04em">
                {copy.panelTitle}
              </Typography>
              <Typography
                mt={1.25}
                color="rgba(226, 232, 240, 0.78)"
                fontSize={{ xs: 13, md: 14 }}
                lineHeight={1.7}
              >
                {copy.panelBody}
              </Typography>

              <Stack spacing={1.4} mt={3}>
                {HIGHLIGHTS.map((item) => (
                  <Stack key={item} direction="row" spacing={1.2} sx={{ alignItems: "flex-start" }}>
                    <Box
                      sx={{
                        mt: "6px",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6d6bff, #38bdf8)",
                        flexShrink: 0,
                      }}
                    />
                    <Typography fontSize={13} color="rgba(226, 232, 240, 0.8)">
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-end" },
                alignItems: "flex-end",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 340,
                  borderRadius: 6,
                  px: { xs: 2, md: 2.5 },
                  py: { xs: 2.5, md: 3 },
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 22px 45px rgba(2, 6, 23, 0.34)",
                }}
              >
                <Box
                  component="img"
                  src={heroGraphic}
                  alt="Party Script event operations graphic"
                  sx={{
                    width: "100%",
                    display: "block",
                    objectFit: "contain",
                    filter: "drop-shadow(0 18px 28px rgba(91,82,240,0.3))",
                  }}
                />
                <Card
                  sx={{
                    position: "absolute",
                    right: -10,
                    bottom: 18,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 3,
                    minWidth: 124,
                    background:
                      "linear-gradient(180deg, rgba(17, 27, 50, 0.96), rgba(10, 17, 34, 0.96))",
                  }}
                >
                  <Typography fontSize={11} color="text.secondary">
                    Live control
                  </Typography>
                  <Typography fontSize={22} fontWeight={800} letterSpacing="-0.05em">
                    24/7
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    Event operations visibility
                  </Typography>
                </Card>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2.5, md: 4, lg: 5 },
            background:
              "linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(239, 244, 255, 0.96))",
          }}
        >
          <Card
            sx={{
              width: "100%",
              maxWidth: 470,
              p: { xs: 3, md: 4 },
              borderRadius: 6,
              bgcolor: "rgba(255,255,255,0.88)",
              color: "#091120",
              border: "1px solid rgba(157, 173, 202, 0.32)",
              boxShadow: "0 28px 50px rgba(15, 23, 42, 0.14)",
            }}
          >
            <Stack spacing={1}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#5b52f0",
                }}
              >
                {copy.eyebrow}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 28, md: 34 },
                  lineHeight: 1.04,
                  letterSpacing: "-0.05em",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {mode === "signup" ? "Sign up" : "Welcome back"}
              </Typography>
              <Typography sx={{ color: "rgba(15, 23, 42, 0.68)", fontSize: 14, lineHeight: 1.7 }}>
                {mode === "signup"
                  ? "Launch your workspace and start organizing events with better clarity."
                  : "Sign in to return to your live dashboards, event workspaces, and execution tools."}
              </Typography>
            </Stack>

            <Divider sx={{ my: 3, borderColor: "rgba(148, 163, 184, 0.24)" }} />

            <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1.5 }}>
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
                InputLabelProps={{ sx: { color: "rgba(15, 23, 42, 0.68)" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(248, 250, 252, 0.92)",
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
                InputLabelProps={{ sx: { color: "rgba(15, 23, 42, 0.68)" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(248, 250, 252, 0.92)",
                    color: "#0f172a",
                  },
                }}
              />

              {error ? (
                <Typography fontSize={12} color="#dc2626">
                  {error}
                </Typography>
              ) : null}

              {!error && notice ? (
                <Typography fontSize={12} color="#1d4ed8">
                  {notice}
                </Typography>
              ) : null}

              {!error && authError ? (
                <Typography fontSize={12} color="#dc2626">
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
                  minHeight: 52,
                  borderRadius: 999,
                  fontSize: 15,
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
              mt={2.5}
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography fontSize={12} color="rgba(15, 23, 42, 0.6)">
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
