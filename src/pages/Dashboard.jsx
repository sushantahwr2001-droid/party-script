import { Suspense, lazy, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  LinearProgress,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useEvents } from "../hooks/useEvents";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { formatCurrency } from "../utils/eventSelectors";
import ChartFallback from "../components/ChartFallback";
import EmptyState from "../components/EmptyState";

const BudgetTrendChart = lazy(() =>
  import("../components/DashboardCharts").then((module) => ({ default: module.BudgetTrendChart }))
);

export default function Dashboard() {
  const { loading: eventsLoading, error: eventsError, createEvent } = useEvents();
  const { stats, loading: statsLoading, error: statsError, refresh } = useDashboardStats();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    notes: "",
    budget: "",
  });

  const loading = eventsLoading || statsLoading;
  const error = eventsError || statsError;
  const filteredEvents = stats.upcomingEvents.filter((event) =>
    `${event.name} ${event.venue} ${event.notes || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleCreate = async () => {
    if (!form.name || !form.date || !form.venue) {
      return;
    }

    setCreateError("");

    try {
      await createEvent(form);
      await refresh();
      setFeedback("Event workspace created successfully");
      setForm({
        name: "",
        date: "",
        venue: "",
        notes: "",
        budget: "",
      });
      setShowCreate(false);
    } catch (nextError) {
      setCreateError(nextError.message);
    }
  };

  return (
    <Box sx={pageShell}>
      <Card sx={heroShell}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Box>
            <Typography sx={pageTitle}>Operations overview</Typography>
            <Typography sx={pageSubtitle}>
              {stats.eventsCount} events / {stats.totalVendors} vendors / {stats.totalContacts} contacts
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 0.6, alignItems: "center" }}>
            <Box sx={searchField}>
              <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <TextField
                size="small"
                placeholder="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                variant="standard"
                fullWidth
                slotProps={{ input: { disableUnderline: true } }}
              />
            </Box>
            <Button variant="outlined" size="small" sx={iconButton}>
              <NotificationsNoneIcon sx={{ fontSize: 16 }} />
            </Button>
          </Box>
        </Box>
      </Card>

      <Collapse in={showCreate}>
        <Card sx={createCard}>
          <Typography sx={sectionTitle}>Create event workspace</Typography>
          <Box sx={createGrid}>
            <TextField size="small" label="Event name" value={form.name} onChange={handleChange("name")} />
            <TextField
              size="small"
              label="Date"
              type="date"
              value={form.date}
              onChange={handleChange("date")}
              InputLabelProps={{ shrink: true }}
            />
            <TextField size="small" label="Venue" value={form.venue} onChange={handleChange("venue")} />
            <TextField size="small" label="Notes" value={form.notes} onChange={handleChange("notes")} />
            <TextField size="small" label="Budget" type="number" value={form.budget} onChange={handleChange("budget")} />
            <Button size="small" variant="contained" onClick={handleCreate}>
              Create
            </Button>
          </Box>
          {createError ? (
            <Typography sx={{ ...captionText, color: "#fca5a5", mt: 0.8 }}>
              {createError}
            </Typography>
          ) : null}
        </Card>
      </Collapse>

      {error ? (
        <Alert severity="error" sx={{ mb: 1 }}>
          Unable to load dashboard data from Supabase: {error}
        </Alert>
      ) : null}

      {!loading && stats.upcomingEvents.length === 0 ? (
        <Card sx={onboardingCard}>
          <Typography sx={sectionTitle}>Create your first event to get started</Typography>
          <Typography sx={captionText}>
            Build the first workspace so your team can track tasks, vendors, documents, and budget in one place.
          </Typography>
          <Box mt={1}>
            <Button size="small" variant="contained" onClick={() => setShowCreate(true)}>
              + Create Event
            </Button>
          </Box>
        </Card>
      ) : null}

      <Box sx={statsGrid}>
        <Stat title="Active events" value={stats.eventsCount} detail="Live workspaces ready" />
        <Stat title="Open tasks" value={stats.openTasks} detail="Awaiting action" accent="#60a5fa" />
        <Stat title="Total vendors" value={stats.totalVendors} detail="Across all events" accent="#34d399" />
        <Stat title="Budget used" value={`${Math.round(stats.budgetUsed)}%`} detail="Committed spend" accent="#f59e0b" />
      </Box>

      {loading ? (
        <Card sx={onboardingCard}>
          <Typography sx={sectionTitle}>Loading events</Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Card>
      ) : null}

      <Box sx={mainGrid}>
        <Card sx={{ ...featureCard, gridRow: { xl: "span 2" } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
            <Typography sx={sectionTitle}>Upcoming events</Typography>
            <Button size="small" variant="text" onClick={() => setShowCreate(true)}>
              + Event
            </Button>
          </Box>

          {filteredEvents.slice(0, 4).map((event) => (
            <Box key={event.id} sx={rowCard} onClick={() => navigate(`/events/${event.id}`)}>
              <Box>
                <Typography fontWeight={700}>{event.name}</Typography>
                <Typography sx={captionText}>
                  {dayjs(event.date).format("DD MMM")} / {event.venue}
                </Typography>
              </Box>
              <Chip label={event.status} size="small" sx={statusChip(event.status)} />
            </Box>
          ))}

          {filteredEvents.length === 0 ? (
            <EmptyState
              title="No events match this search"
              subtitle="Try another keyword or create a new event workspace."
              actionLabel="+ Create Event"
              onAction={() => setShowCreate(true)}
            />
          ) : null}
        </Card>

        <Card sx={featureCard}>
          <Typography sx={sectionTitle}>Budget summary</Typography>
          <Box mt={0.8} display="grid" gap={0.8}>
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.35 }}>
                <Typography sx={captionText}>Committed spend</Typography>
                <Typography sx={captionText}>{formatCurrency(stats.totalSpent)}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={stats.budgetUsed} sx={{ height: 6 }} />
            </Box>
            {stats.vendorCategoryData.slice(0, 3).map((item) => (
              <Box key={item.name}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.35 }}>
                  <Typography fontWeight={700}>{item.name}</Typography>
                  <Typography sx={captionText}>{formatCurrency(item.value)}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.totalSpent ? (item.value / stats.totalSpent) * 100 : 0}
                  sx={{ height: 6 }}
                />
              </Box>
            ))}
          </Box>
        </Card>

        <Card sx={featureCard}>
          <Typography sx={sectionTitle}>Needs attention</Typography>
          <Box mt={0.8}>
            {stats.needsAttention.length > 0 ? (
              stats.needsAttention.map((item) => (
                <Box key={item.id} sx={attentionRow(item.tone)} onClick={() => navigate(`/events/${item.eventId}`)}>
                  <Typography fontWeight={700}>{item.title}</Typography>
                  <Typography sx={captionText}>{item.subtitle}</Typography>
                </Box>
              ))
            ) : (
              <EmptyState
                title="No urgent issues detected"
                subtitle="Deadlines, vendor confirmations, and budget levels look healthy."
                actionLabel="Open Events"
                onAction={() => navigate("/events")}
              />
            )}
          </Box>
        </Card>

        <Card sx={{ ...featureCard, gridColumn: { xl: "span 2" } }}>
          <Typography sx={sectionTitle}>Budget trend</Typography>
          <Box mt={1}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={captionText}>Committed spend</Typography>
              <Typography sx={captionText}>{formatCurrency(stats.totalSpent)}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={stats.budgetUsed} sx={{ height: 6 }} />
          </Box>
          <Suspense fallback={<ChartFallback height={160} />}>
            <BudgetTrendChart data={stats.spendTrend} />
          </Suspense>
        </Card>
      </Box>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2600}
        onClose={() => setFeedback("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setFeedback("")} severity="success" variant="filled" sx={{ width: "100%" }}>
          {feedback}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function Stat({ title, value, detail, accent }) {
  return (
    <Card sx={statCard}>
      <Typography sx={labelText}>{title}</Typography>
      <Typography sx={{ ...statValue, color: accent || "#f8fafc" }}>{value}</Typography>
      <Typography sx={captionText}>{detail}</Typography>
    </Card>
  );
}

const pageShell = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  maxWidth: 1260,
  marginInline: "auto",
};

const heroShell = {
  p: 1.35,
  borderRadius: 3.2,
  marginBottom: 1,
  background:
    "linear-gradient(180deg, rgba(18, 29, 52, 0.96), rgba(11, 19, 35, 0.92))",
  border: "1px solid rgba(95, 113, 165, 0.22)",
};

const pageTitle = {
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "-0.02em",
};

const pageSubtitle = {
  color: "text.secondary",
  fontSize: 11,
  mt: 0.25,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(2, minmax(0, 1fr))",
    lg: "repeat(4, minmax(0, 1fr))",
  },
  gap: 1,
  marginBottom: 1,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    xl: "1.25fr 0.95fr",
  },
  gap: 1,
  flex: 1,
  overflow: "hidden",
};

const statCard = {
  p: 1.05,
  borderRadius: 2.4,
  background:
    "linear-gradient(180deg, rgba(15, 24, 43, 0.96), rgba(10, 17, 32, 0.92))",
  border: "1px solid rgba(95,113,165,0.16)",
};

const featureCard = {
  p: 1.1,
  borderRadius: 2.8,
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(16, 27, 48, 0.96), rgba(10, 17, 32, 0.94))",
  border: "1px solid rgba(95,113,165,0.16)",
};

const createCard = {
  p: 1.1,
  borderRadius: 2.5,
  marginBottom: 1,
};

const createGrid = {
  marginTop: 0.8,
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(3, minmax(0, 1fr))",
    xl: "repeat(6, minmax(0, 1fr))",
  },
  gap: 0.7,
  alignItems: "center",
};

const onboardingCard = {
  p: 1.1,
  borderRadius: 2.5,
  marginBottom: 1,
};

const rowCard = {
  p: 0.95,
  mb: 0.6,
  borderRadius: 2,
  display: "flex",
  justifyContent: "space-between",
  gap: 1,
  alignItems: "center",
  background: "rgba(10, 18, 34, 0.82)",
  border: "1px solid rgba(95,113,165,0.14)",
  cursor: "pointer",
  transition: "all 0.18s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    borderColor: "rgba(109,123,255,0.24)",
    background: "rgba(12, 20, 38, 0.94)",
  },
};

const attentionRow = (tone) => ({
  p: 0.85,
  mb: 0.6,
  borderRadius: 2,
  cursor: "pointer",
  background:
    tone === "critical"
      ? "rgba(248,113,113,0.12)"
      : tone === "warning"
        ? "rgba(251,191,36,0.16)"
        : "rgba(96,165,250,0.14)",
  border: "1px solid rgba(95,113,165,0.12)",
});

const sectionTitle = {
  fontSize: 11.5,
  fontWeight: 600,
};

const labelText = {
  color: "text.secondary",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const statValue = {
  fontSize: 13,
  fontWeight: 650,
  mt: 0.35,
};

const captionText = {
  color: "text.secondary",
  fontSize: 11,
};

const searchField = {
  minWidth: 180,
  display: "flex",
  alignItems: "center",
  gap: 0.6,
  px: 1.1,
  borderRadius: 999,
  background: "rgba(8, 15, 30, 0.9)",
  border: "1px solid rgba(95,113,165,0.14)",
  "& .MuiInput-root": {
    color: "inherit",
  },
  "& .MuiInputBase-input": {
    py: 0.8,
  },
};

const iconButton = {
  minWidth: 0,
  width: 34,
  height: 34,
  borderRadius: 999,
  px: 0,
};

const statusChip = (status) => ({
  background:
    status === "Live"
      ? "rgba(34,197,94,0.18)"
      : status === "Planning"
        ? "rgba(251,191,36,0.18)"
        : "rgba(96,165,250,0.18)",
  color:
    status === "Live"
      ? "#bbf7d0"
      : status === "Planning"
        ? "#fde68a"
        : "#bfdbfe",
});
