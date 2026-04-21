import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { useAuth } from "../context/auth-context";
import { useAppSettings } from "../context/AppSettingsContext";

const settingsNav = [
  { id: "general", label: "General", icon: TuneRoundedIcon },
  { id: "organization", label: "Organization", icon: BusinessRoundedIcon },
  { id: "team", label: "Team", icon: GroupRoundedIcon },
  { id: "notifications", label: "Notifications", icon: NotificationsRoundedIcon },
  { id: "preferences", label: "Preferences", icon: PaletteRoundedIcon },
  { id: "security", label: "Security", icon: SecurityRoundedIcon },
  { id: "account", label: "Account", icon: PersonRoundedIcon },
];

function SectionHeader({ eyebrow, title, description }) {
  return (
    <Stack spacing={0.6}>
      <Typography sx={sectionEyebrow}>{eyebrow}</Typography>
      <Typography sx={sectionTitle}>{title}</Typography>
      <Typography sx={sectionDescription}>{description}</Typography>
    </Stack>
  );
}

function SettingRow({ label, hint, children, divider = true }) {
  return (
    <>
      <Box sx={settingRow}>
        <Box sx={settingMeta}>
          <Typography sx={settingLabel}>{label}</Typography>
          {hint ? <Typography sx={settingHint}>{hint}</Typography> : null}
        </Box>
        <Box sx={settingControl}>{children}</Box>
      </Box>
      {divider ? <Divider sx={rowDivider} /> : null}
    </>
  );
}

function ComingSoonSection({ title, description }) {
  return (
    <Paper elevation={0} sx={sectionPanel}>
      <Stack spacing={1.5}>
        <SectionHeader eyebrow="Coming soon" title={title} description={description} />
        <Box sx={comingSoonBox}>
          <Chip label="Planned for the next pass" sx={comingSoonChip} />
          <Typography sx={comingSoonText}>
            This section is intentionally held back for now so the core controls stay clean.
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Settings() {
  const { user, updateProfileName, sendPasswordReset } = useAuth();
  const { settings, updateSettings, resetSettings } = useAppSettings();
  const [activeSection, setActiveSection] = useState("general");

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(settings.phone || "");
  const [companyName, setCompanyName] = useState(settings.companyName || "Party Script");
  const [currency, setCurrency] = useState(settings.currency || "INR");
  const [timeZone, setTimeZone] = useState(settings.timeZone || "Asia/Kolkata");
  const [eventReminders, setEventReminders] = useState(Boolean(settings.eventReminders));
  const [taskAlerts, setTaskAlerts] = useState(Boolean(settings.taskAlerts));
  const [emailNotifications, setEmailNotifications] = useState(Boolean(settings.emailNotifications));
  const [themeMode, setThemeMode] = useState("Dark");
  const [accentColor, setAccentColor] = useState(settings.accentColor || "electric-blue");
  const [defaultPage, setDefaultPage] = useState(settings.defaultPage || "/");
  const [profilePhoto, setProfilePhoto] = useState(settings.profilePhoto || "");
  const [organizationLogo, setOrganizationLogo] = useState(settings.organizationLogo || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const profilePhotoInputRef = useRef(null);
  const organizationLogoInputRef = useRef(null);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    setPhone(settings.phone || "");
    setCompanyName(settings.companyName || "Party Script");
    setCurrency(settings.currency || "INR");
    setTimeZone(settings.timeZone || "Asia/Kolkata");
    setEventReminders(Boolean(settings.eventReminders));
    setTaskAlerts(Boolean(settings.taskAlerts));
    setEmailNotifications(Boolean(settings.emailNotifications));
    setThemeMode("Dark");
    setAccentColor(settings.accentColor || "electric-blue");
    setDefaultPage(settings.defaultPage || "/");
    setProfilePhoto(settings.profilePhoto || "");
    setOrganizationLogo(settings.organizationLogo || "");
  }, [settings]);

  const selectedNavItem = useMemo(
    () => settingsNav.find((item) => item.id === activeSection) || settingsNav[0],
    [activeSection]
  );

  const handleSaveGeneral = async () => {
    setSaving(true);
    setError("");

    try {
      await updateProfileName(name);
      updateSettings({
        phone,
        profilePhoto,
      });
      setNotice("General settings saved");
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrganization = () => {
    updateSettings({
      companyName,
      currency,
      timeZone,
      organizationLogo,
    });
    setNotice("Organization settings saved");
  };

  const handleSaveNotifications = () => {
    updateSettings({
      eventReminders,
      taskAlerts,
      emailNotifications,
    });
    setNotice("Notification settings saved");
  };

  const handleSavePreferences = () => {
    updateSettings({
      themeMode: "dark",
      accentColor,
      defaultPage,
    });
    setNotice("Preferences saved");
  };

  const handleFileUpload = async (event, kind) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      if (kind === "profile") {
        setProfilePhoto(String(dataUrl));
      } else {
        setOrganizationLogo(String(dataUrl));
      }
    } catch {
      setError("Unable to read that file. Please try another image.");
    } finally {
      event.target.value = "";
    }
  };

  const renderActiveSection = () => {
    if (activeSection === "general") {
      return (
        <Paper elevation={0} sx={sectionPanel}>
          <Stack spacing={2.5}>
            <SectionHeader
              eyebrow="General"
              title="Profile basics"
              description="Keep the public-facing details of your console tidy and current."
            />

            <Box>
              <SettingRow
                label="Name"
                hint="Used in your dashboard greeting and throughout the console."
              >
                <TextField
                  fullWidth
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your display name"
                  sx={fieldSx}
                />
              </SettingRow>

              <SettingRow label="Email" hint="Your sign-in email for Party Script.">
                <TextField fullWidth value={user?.email || ""} disabled sx={fieldSx} />
              </SettingRow>

              <SettingRow
                label="Phone"
                hint="Optional contact number for handoffs and guest coordination."
              >
                <TextField
                  fullWidth
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  sx={fieldSx}
                />
              </SettingRow>

              <SettingRow
                label="Profile photo"
                hint="Use your team portrait or a brand avatar."
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  {profilePhoto ? (
                    <Box
                      component="img"
                      src={profilePhoto}
                      alt="Profile preview"
                      sx={{ width: 42, height: 42, borderRadius: 999, objectFit: "cover" }}
                    />
                  ) : null}
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadRoundedIcon />}
                    onClick={() => profilePhotoInputRef.current?.click()}
                  >
                    Upload
                  </Button>
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => void handleFileUpload(event, "profile")}
                  />
                </Stack>
              </SettingRow>

              <SettingRow
                label="Password"
                hint="Change your password from Supabase Auth when you are ready."
                divider={false}
              >
                <Button
                  variant="outlined"
                  startIcon={<LockRoundedIcon />}
                  onClick={async () => {
                    setError("");
                    try {
                      await sendPasswordReset();
                      setNotice("Password reset email sent");
                    } catch (nextError) {
                      setError(nextError.message);
                    }
                  }}
                >
                  Change password
                </Button>
              </SettingRow>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box sx={actionsRow}>
              <Button variant="contained" onClick={handleSaveGeneral} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      );
    }

    if (activeSection === "organization") {
      return (
        <Paper elevation={0} sx={sectionPanel}>
          <Stack spacing={2.5}>
            <SectionHeader
              eyebrow="Organization"
              title="Company details"
              description="These defaults help budgets, reports, and event context stay consistent."
            />

            <Box>
              <SettingRow
                label="Company name"
                hint="Shown in exported files and future branded surfaces."
              >
                <TextField
                  fullWidth
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  sx={fieldSx}
                />
              </SettingRow>

              <SettingRow
                label="Logo"
                hint="Upload a square logo to reuse across your workspace."
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  {organizationLogo ? (
                    <Box
                      component="img"
                      src={organizationLogo}
                      alt="Organization logo preview"
                      sx={{ width: 42, height: 42, borderRadius: 2, objectFit: "cover" }}
                    />
                  ) : null}
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadRoundedIcon />}
                    onClick={() => organizationLogoInputRef.current?.click()}
                  >
                    Upload
                  </Button>
                  <input
                    ref={organizationLogoInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => void handleFileUpload(event, "organization")}
                  />
                </Stack>
              </SettingRow>

              <SettingRow
                label="Default currency"
                hint="Controls how spend and budget totals are displayed."
              >
                <TextField
                  select
                  fullWidth
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  sx={fieldSx}
                >
                  <MenuItem value="INR">INR Rs</MenuItem>
                  <MenuItem value="USD">USD $</MenuItem>
                  <MenuItem value="AED">AED Dirham</MenuItem>
                </TextField>
              </SettingRow>

              <SettingRow
                label="Time zone"
                hint="Used for dashboards, dates, reminders, and timelines."
                divider={false}
              >
                <TextField
                  select
                  fullWidth
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  sx={fieldSx}
                >
                  <MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem>
                  <MenuItem value="Asia/Dubai">Asia/Dubai</MenuItem>
                  <MenuItem value="Europe/London">Europe/London</MenuItem>
                </TextField>
              </SettingRow>
            </Box>

            <Box sx={actionsRow}>
              <Button variant="contained" onClick={handleSaveOrganization}>
                Save organization
              </Button>
            </Box>
          </Stack>
        </Paper>
      );
    }

    if (activeSection === "notifications") {
      return (
        <Paper elevation={0} sx={sectionPanel}>
          <Stack spacing={2.5}>
            <SectionHeader
              eyebrow="Notifications"
              title="What should reach you"
              description="Keep only the alerts that matter to live event operations."
            />

            <Box>
              <SettingRow
                label="Event reminders"
                hint="Upcoming event dates, vendor deadlines, and run-of-show nudges."
              >
                <Switch
                  checked={eventReminders}
                  onChange={(event) => setEventReminders(event.target.checked)}
                />
              </SettingRow>

              <SettingRow
                label="Task alerts"
                hint="Overdue tasks, pending approvals, and high-priority blockers."
              >
                <Switch
                  checked={taskAlerts}
                  onChange={(event) => setTaskAlerts(event.target.checked)}
                />
              </SettingRow>

              <SettingRow
                label="Email notifications"
                hint="A lighter inbox mode for summaries instead of real-time checks."
                divider={false}
              >
                <Switch
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                />
              </SettingRow>
            </Box>

            <Box sx={actionsRow}>
              <Button variant="contained" onClick={handleSaveNotifications}>
                Save notifications
              </Button>
            </Box>
          </Stack>
        </Paper>
      );
    }

    if (activeSection === "preferences") {
      return (
        <Paper elevation={0} sx={sectionPanel}>
          <Stack spacing={2.5}>
            <SectionHeader
              eyebrow="Preferences"
              title="Console defaults"
              description="Small choices here shape how your workspace feels every day."
            />

            <Box>
              <SettingRow
                label="Theme"
                hint="Dark stays active for now. Light mode is being refined and will return soon."
              >
                <TextField
                  select
                  fullWidth
                  value="Dark"
                  onChange={(event) => setThemeMode(event.target.value)}
                  sx={fieldSx}
                >
                  <MenuItem value="Dark">Dark</MenuItem>
                  <MenuItem value="Light" disabled>
                    Light (Coming soon)
                  </MenuItem>
                </TextField>
              </SettingRow>

              <SettingRow
                label="Accent color"
                hint="A subtle visual preference for actions and highlights."
              >
                <TextField
                  select
                  fullWidth
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                  sx={fieldSx}
                >
                  <MenuItem value="electric-blue">Electric Blue</MenuItem>
                  <MenuItem value="indigo">Indigo</MenuItem>
                  <MenuItem value="soft-violet">Soft Violet</MenuItem>
                </TextField>
              </SettingRow>

              <SettingRow
                label="Default page"
                hint="Choose where the console should drop you in after sign-in."
                divider={false}
              >
                <TextField
                  select
                  fullWidth
                  value={defaultPage}
                  onChange={(event) => setDefaultPage(event.target.value)}
                  sx={fieldSx}
                >
                  <MenuItem value="/">Dashboard</MenuItem>
                  <MenuItem value="/events">Events</MenuItem>
                  <MenuItem value="/tasks">Tasks</MenuItem>
                  <MenuItem value="/vendors">Vendors</MenuItem>
                  <MenuItem value="/budget">Budget</MenuItem>
                </TextField>
              </SettingRow>
            </Box>

            <Box sx={actionsRow}>
              <Button variant="contained" onClick={handleSavePreferences}>
                Save preferences
              </Button>
            </Box>
          </Stack>
        </Paper>
      );
    }

    if (activeSection === "security") {
      return (
        <ComingSoonSection
          title="Security"
          description="MFA, active sessions, and more advanced account protection will live here."
        />
      );
    }

    if (activeSection === "team") {
      return (
        <ComingSoonSection
          title="Team"
          description="Invite members, assign roles, and manage shared access from one place."
        />
      );
    }

    return (
      <ComingSoonSection
        title="Account"
        description="Plan controls, upgrades, and account-level actions will be added here."
      />
    );
  };

  return (
    <Box sx={pageShell}>
      <Stack spacing={1.1} sx={{ mb: 2.4 }}>
        <Typography sx={pageTitle}>Settings</Typography>
        <Typography sx={pageSubtitle}>
          Quiet, powerful control over the way your Party Script console behaves.
        </Typography>
      </Stack>

      <Box sx={settingsLayout}>
        <Paper elevation={0} sx={navPanel}>
          <Stack spacing={2}>
            <Box>
              <Typography sx={navEyebrow}>Control panel</Typography>
              <Typography sx={navTitle}>Workspace settings</Typography>
            </Box>

            <List disablePadding sx={{ display: "grid", gap: 0.65 }}>
              {settingsNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeSection;

                return (
                  <ListItemButton
                    key={item.id}
                    selected={isActive}
                    onClick={() => setActiveSection(item.id)}
                    sx={navItem}
                  >
                    <ListItemIcon sx={navIconWrap}>
                      <Icon sx={navIcon(isActive)} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ sx: navLabel(isActive) }}
                    />
                    {item.id === "team" || item.id === "security" || item.id === "account" ? (
                      <Chip label="Soon" size="small" sx={soonChip} />
                    ) : null}
                  </ListItemButton>
                );
              })}
            </List>

            <Box sx={navFooter}>
              <Typography sx={footerLabel}>Currently viewing</Typography>
              <Typography sx={footerValue}>{selectedNavItem.label}</Typography>
              <Typography sx={footerHint}>
                Keep this page lean and only touch what matters right now.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Box sx={contentWrap}>{renderActiveSection()}</Box>
      </Box>

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
  height: "100%",
  overflowY: "auto",
  pb: 2,
};

const pageTitle = {
  fontSize: { xs: 30, md: 34 },
  lineHeight: 1,
  fontWeight: 700,
  color: "text.primary",
};

const pageSubtitle = {
  fontSize: 14,
  color: "text.secondary",
};

const settingsLayout = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", lg: "280px minmax(0, 1fr)" },
  alignItems: "start",
};

const navPanel = {
  p: 1.5,
  borderRadius: 4,
  backgroundColor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  position: { lg: "sticky" },
  top: { lg: 0 },
};

const navEyebrow = {
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(126, 150, 255, 0.72)",
};

const navTitle = {
  mt: 0.7,
  fontSize: 18,
  fontWeight: 700,
  color: "text.primary",
};

const navItem = {
  minHeight: 48,
  borderRadius: 2.4,
  border: "1px solid transparent",
  px: 1.1,
  "&.Mui-selected": {
    backgroundColor: "rgba(86, 104, 255, 0.12)",
    borderColor: "rgba(104, 127, 255, 0.28)",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "rgba(86, 104, 255, 0.16)",
  },
};

const navIconWrap = {
  minWidth: 36,
};

const navIcon = (isActive) => ({
  fontSize: 20,
  color: isActive ? "#7a7cff" : "rgba(171, 181, 209, 0.76)",
});

const navLabel = (isActive) => ({
  fontSize: 14,
  fontWeight: isActive ? 700 : 500,
  color: isActive ? "text.primary" : "text.secondary",
});

const soonChip = {
  height: 22,
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 700,
  color: "rgba(204, 213, 244, 0.74)",
  backgroundColor: "rgba(255, 255, 255, 0.06)",
};

const navFooter = {
  mt: 1.4,
  pt: 2,
  borderTop: "1px solid",
  borderColor: "divider",
};

const footerLabel = {
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(126, 150, 255, 0.72)",
};

const footerValue = {
  mt: 0.8,
  fontSize: 16,
  fontWeight: 700,
  color: "text.primary",
};

const footerHint = {
  mt: 0.6,
  fontSize: 13,
  lineHeight: 1.6,
  color: "text.secondary",
};

const contentWrap = {
  display: "grid",
  gap: 2,
};

const sectionPanel = {
  p: { xs: 1.5, md: 2.2 },
  borderRadius: 4,
  backgroundColor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
};

const sectionEyebrow = {
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(126, 150, 255, 0.72)",
};

const sectionTitle = {
  fontSize: 24,
  fontWeight: 700,
  color: "text.primary",
};

const sectionDescription = {
  fontSize: 14,
  lineHeight: 1.7,
  color: "text.secondary",
};

const settingRow = {
  display: "grid",
  gap: 1.4,
  py: 1.5,
  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 220px) minmax(0, 1fr)" },
  alignItems: "start",
};

const settingMeta = {
  display: "grid",
  gap: 0.4,
};

const settingLabel = {
  fontSize: 14,
  fontWeight: 600,
  color: "text.primary",
};

const settingHint = {
  fontSize: 13,
  lineHeight: 1.65,
  color: "text.secondary",
};

const settingControl = {
  width: "100%",
};

const rowDivider = {
  borderColor: "rgba(125, 144, 197, 0.12)",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 48,
    borderRadius: 2.4,
    color: "text.primary",
    backgroundColor: "background.default",
    "& fieldset": {
      borderColor: "divider",
    },
    "&:hover fieldset": {
      borderColor: "rgba(125, 144, 197, 0.28)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#6d77ff",
    },
  },
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: "rgba(219, 226, 245, 0.72)",
  },
};

const actionsRow = {
  display: "flex",
  justifyContent: "flex-end",
};

const comingSoonBox = {
  p: 2,
  borderRadius: 3,
  border: "1px dashed",
  borderColor: "divider",
  backgroundColor: "rgba(255, 255, 255, 0.02)",
};

const comingSoonChip = {
  mb: 1.4,
  borderRadius: 999,
  backgroundColor: "rgba(104, 127, 255, 0.14)",
  color: "#dbe3ff",
  fontWeight: 700,
};

const comingSoonText = {
  fontSize: 14,
  lineHeight: 1.7,
  color: "text.secondary",
};
