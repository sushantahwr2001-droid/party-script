import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/auth-context";

export default function Settings() {
  const { user, updateProfileName } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      await updateProfileName(name);
      setNotice("Display name updated");
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={pageShell}>
      <Typography sx={pageTitle}>Settings</Typography>
      <Typography sx={pageSubtitle}>
        Update the display name used in the dashboard greeting and across your console.
      </Typography>

      <Card sx={panelCard}>
        <Stack spacing={1.2}>
          <Typography sx={sectionTitle}>Profile</Typography>
          <TextField
            size="small"
            label="Display name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            size="small"
            label="Email"
            value={user?.email || ""}
            disabled
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Box>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Stack>
      </Card>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={2200}
        onClose={() => setNotice("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setNotice("")} severity="success" variant="filled" sx={{ width: "100%" }}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const pageShell = {
  maxWidth: 760,
  marginInline: "auto",
  height: "100%",
  overflowY: "auto",
  pb: 2,
};

const pageTitle = {
  fontSize: 22,
  fontWeight: 700,
  color: "#f7f9ff",
};

const pageSubtitle = {
  mt: 0.45,
  mb: 1.4,
  fontSize: 13,
  color: "text.secondary",
};

const panelCard = {
  p: 1.5,
  borderRadius: 3,
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 700,
};
