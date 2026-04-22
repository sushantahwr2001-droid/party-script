import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
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

const fieldLabel = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "rgba(191, 219, 254, 0.78)",
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

      <Box
        sx={{
          position: "absolute",
          top: "12%",
          left: "50%",
          width: 460,
          height: 460,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.08) 30%, transparent 72%)",
          filter: "blur(12px)",
          pointerEvents: "none",
        }}
      />

      <Card
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          px: { xs: 2.5, md: 3.25 },
          py: { xs: 3, md: 3.5 },
          borderRadius: 7,
          background:
            "linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(15,23,36,0.98) 100%)",
          border: "1px solid rgba(109, 107, 255, 0.14)",
          boxShadow:
            "0 28px 60px rgba(2, 6, 23, 0.46), inset 0 1px 0 rgba(255,255,255,0.03)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(99,102,241,0.14), transparent 28%), radial-gradient(circle at bottom left, rgba(59,130,246,0.08), transparent 24%)",
            pointerEvents: "none",
          }}
        />

        <Stack spacing={1.25} sx={{ position: "relative", textAlign: "center", alignItems: "center" }}>
          <Box
            sx={{
              px: 1.25,
              py: 0.55,
              borderRadius: 999,
              border: "1px solid rgba(99,102,241,0.18)",
              background: "rgba(99,102,241,0.08)",
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#8f98ff",
              }}
            >
              Event Operations
            </Typography>
          </Box>

          <Box
            component="img"
            src={partyScriptLogoLight}
            alt="Party Script"
            sx={{
              display: "block",
              width: "100%",
              maxWidth: 210,
              height: "auto",
              objectFit: "contain",
              mt: 0.5,
            }}
          />
          <Typography
            sx={{
              fontSize: { xs: 30, md: 42 },
              lineHeight: 0.98,
              letterSpacing: "-0.06em",
              fontWeight: 800,
              color: "#f8fafc",
            }}
          >
            {copy.title}
          </Typography>
          <Typography
            sx={{
              maxWidth: 340,
              fontSize: 14,
              lineHeight: 1.6,
              color: "rgba(226, 232, 240, 0.72)",
            }}
          >
            {copy.body}
          </Typography>
        </Stack>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            position: "relative",
            display: "grid",
            gap: 1.15,
            mt: 2.25,
          }}
        >
          {!isConfigured ? (
            <Alert severity="warning">
              Supabase isn&apos;t configured yet. Add `VITE_SUPABASE_URL` and
              `VITE_SUPABASE_PUBLISHABLE_KEY` to your local `.env` file.
            </Alert>
          ) : null}

          <Typography sx={fieldLabel}>Email</Typography>
          <TextField
            value={form.email}
            onChange={handleChange("email")}
            fullWidth
            variant="outlined"
            placeholder="Email"
            InputLabelProps={{ shrink: false, sx: { display: "none" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: 58,
                borderRadius: 2.5,
                bgcolor: "rgba(248, 250, 252, 0.98)",
                color: "#0f172a",
                boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
              },
            }}
          />

          <Typography sx={{ ...fieldLabel, mt: 0.4 }}>Password</Typography>
          <TextField
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            fullWidth
            variant="outlined"
            placeholder="Password"
            InputLabelProps={{ shrink: false, sx: { display: "none" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: 58,
                borderRadius: 2.5,
                bgcolor: "rgba(248, 250, 252, 0.98)",
                color: "#0f172a",
                boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
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
              mt: 0.8,
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
          mt={1.75}
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
