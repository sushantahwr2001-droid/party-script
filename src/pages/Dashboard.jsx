import { Suspense, lazy, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { formatCurrency } from "../utils/eventSelectors";
import ChartFallback from "../components/ChartFallback";
import EmptyState from "../components/EmptyState";

const BudgetTrendChart = lazy(() =>
  import("../components/DashboardCharts").then((module) => ({ default: module.BudgetTrendChart }))
);

const metricCards = [
  { key: "eventsCount", title: "Live Events", accent: "#7c83ff", change: "+12.4%" },
  { key: "openTasks", title: "Open Tasks", accent: "#55b7ff", change: "-8.1%" },
  { key: "totalVendors", title: "Active Vendors", accent: "#2ec27e", change: "+6.8%" },
  { key: "budgetUsed", title: "Budget Used", accent: "#f59f4c", suffix: "%", change: "+3.2%" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { loading: eventsLoading, error: eventsError, createEvent } = useEvents();
  const { stats, loading: statsLoading, error: statsError, refresh } = useDashboardStats();
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [createError, setCreateError] = useState("");
  const [timeframe, setTimeframe] = useState("30d");
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    notes: "",
    budget: "",
  });

  const loading = eventsLoading || statsLoading;
  const error = eventsError || statsError;

  const upcomingRows = useMemo(
    () =>
      stats.upcomingEvents.map((event, index) => ({
        id: event.id,
        code: String(index + 1).padStart(2, "0"),
        name: event.name,
        date: dayjs(event.date).format("YYYY-MM-DD"),
        venue: event.venue,
        status: event.status,
        notes: event.notes || "No notes added",
      })),
    [stats.upcomingEvents]
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
      setFeedback("Event workspace created");
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
      <Stack
        direction={{ xs: "column", xl: "row" }}
        spacing={1.25}
        sx={{ alignItems: { xs: "flex-start", xl: "center" }, justifyContent: "space-between", mb: 1.25 }}
      >
        <Box>
          <Typography sx={eyebrow}>Control room</Typography>
          <Typography sx={heroTitle}>Keep every event, vendor, and deadline in one live view.</Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Stack direction="row" spacing={0.8}>
            {[
              { label: "30 Days", value: "30d" },
              { label: "3 Months", value: "90d" },
              { label: "1 Year", value: "365d" },
            ].map((option) => (
              <Button
                key={option.value}
                size="small"
                variant={timeframe === option.value ? "contained" : "outlined"}
                onClick={() => setTimeframe(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
          <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />}>
            Export
          </Button>
          <Button size="small" variant="contained" onClick={() => setShowCreate((current) => !current)}>
            New
          </Button>
        </Stack>
      </Stack>

      <Collapse in={showCreate}>
        <Card sx={formCard}>
          <Typography sx={panelTitle}>Create event workspace</Typography>
          <Box sx={formGrid}>
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
            <TextField size="small" label="Budget" type="number" value={form.budget} onChange={handleChange("budget")} />
            <TextField size="small" label="Notes" value={form.notes} onChange={handleChange("notes")} />
            <Button variant="contained" onClick={handleCreate}>
              Create
            </Button>
          </Box>
          {createError ? (
            <Typography sx={{ color: "#fca5a5", fontSize: 12, mt: 1 }}>{createError}</Typography>
          ) : null}
        </Card>
      </Collapse>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.25 }}>
          Unable to load dashboard data from Supabase: {error}
        </Alert>
      ) : null}

      <Box sx={metricGrid}>
        {metricCards.map((item) => (
          <Card key={item.key} sx={metricCard}>
            <Typography sx={metricLabel}>{item.title}</Typography>
            <Typography sx={{ ...metricValue, color: item.accent }}>
              {item.key === "budgetUsed"
                ? `${Math.round(stats[item.key])}${item.suffix || ""}`
                : stats[item.key]}
            </Typography>
            <Typography sx={metricMeta}>{item.change} over last 30 days</Typography>
          </Card>
        ))}
      </Box>

      <Box sx={dashboardGrid}>
        <Card sx={{ ...panelCard, minHeight: 320 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box>
              <Typography sx={panelTitle}>Revenue flow</Typography>
              <Typography sx={panelSubtitle}>Committed spend trend across active event workspaces.</Typography>
            </Box>
            <Button size="small" variant="text" endIcon={<OpenInNewRoundedIcon />}>
              Details
            </Button>
          </Stack>

          <Box sx={chartSummary}>
            <Box>
              <Typography sx={metricLabel}>Total spend</Typography>
              <Typography sx={trendValue}>{formatCurrency(stats.totalSpent)}</Typography>
            </Box>
            <Box>
              <Typography sx={metricLabel}>Budget available</Typography>
              <Typography sx={trendMeta}>{formatCurrency(stats.totalBudget - stats.totalSpent)}</Typography>
            </Box>
          </Box>

          <Suspense fallback={<ChartFallback height={220} />}>
            <BudgetTrendChart data={stats.spendTrend} />
          </Suspense>
        </Card>

        <Card sx={{ ...panelCard, minHeight: 320 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography sx={panelTitle}>Needs attention</Typography>
            <Button size="small" variant="text" startIcon={<FilterListRoundedIcon />}>
              Filter
            </Button>
          </Stack>

          {stats.needsAttention.length > 0 ? (
            <Stack spacing={1}>
              {stats.needsAttention.slice(0, 5).map((item) => (
                <Box key={item.id} sx={attentionRow(item.tone)} onClick={() => navigate(`/events/${item.eventId}`)}>
                  <Box>
                    <Typography fontWeight={700} fontSize={13}>
                      {item.title}
                    </Typography>
                    <Typography sx={cellMeta}>{item.subtitle}</Typography>
                  </Box>
                  <Typography sx={severityText(item.tone)}>
                    {item.tone === "critical" ? "Critical" : item.tone === "warning" ? "Watch" : "Review"}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState
              title="No urgent issues"
              subtitle="Deadlines, vendors, and budgets look healthy right now."
              actionLabel="Open Events"
              onAction={() => navigate("/events")}
            />
          )}
        </Card>
      </Box>

      <Card sx={{ ...panelCard, mt: 1.25 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", mb: 1.5 }}
        >
          <Box>
            <Typography sx={panelTitle}>Upcoming events</Typography>
            <Typography sx={panelSubtitle}>A live list of event workspaces and upcoming execution dates.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<FilterListRoundedIcon />}>
              Filter
            </Button>
            <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />}>
              Export
            </Button>
          </Stack>
        </Stack>

        {loading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

        {upcomingRows.length > 0 ? (
          <Box sx={tableShell}>
            <Box sx={tableHeader}>
              <Typography sx={headerCell}>#</Typography>
              <Typography sx={headerCell}>Event</Typography>
              <Typography sx={headerCell}>Date</Typography>
              <Typography sx={headerCell}>Venue</Typography>
              <Typography sx={headerCell}>Status</Typography>
            </Box>

            {upcomingRows.map((row) => (
              <Box key={row.id} sx={tableRow} onClick={() => navigate(`/events/${row.id}`)}>
                <Typography sx={cellText}>{row.code}</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={cellTitle}>{row.name}</Typography>
                  <Typography sx={cellMeta} noWrap>
                    {row.notes}
                  </Typography>
                </Box>
                <Typography sx={cellText}>{row.date}</Typography>
                <Typography sx={cellText}>{row.venue}</Typography>
                <Chip label={row.status} size="small" sx={statusChip(row.status)} />
              </Box>
            ))}
          </Box>
        ) : (
          <EmptyState
            title="No event data yet"
            subtitle="Create your first event workspace to populate the dashboard."
            actionLabel="Create Event"
            onAction={() => setShowCreate(true)}
          />
        )}
      </Card>

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

const pageShell = {
  maxWidth: 1240,
  marginInline: "auto",
  pb: 3,
};

const eyebrow = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "text.secondary",
  mb: 0.7,
};

const heroTitle = {
  maxWidth: 760,
  fontSize: { xs: 26, md: 34 },
  lineHeight: 1.02,
  letterSpacing: "-0.05em",
  fontWeight: 800,
};

const formCard = {
  p: 1.5,
  borderRadius: 4,
  mb: 1.25,
};

const formGrid = {
  mt: 1.25,
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" },
  gap: 1,
  alignItems: "center",
};

const metricGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
  gap: 1.25,
  mb: 1.25,
};

const metricCard = {
  p: 1.4,
  borderRadius: 4,
};

const metricLabel = {
  color: "text.secondary",
  fontSize: 11,
};

const metricValue = {
  mt: 1,
  fontSize: 30,
  lineHeight: 1,
  letterSpacing: "-0.06em",
  fontWeight: 800,
};

const metricMeta = {
  mt: 0.8,
  color: "text.secondary",
  fontSize: 11,
};

const dashboardGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.55fr 1fr" },
  gap: 1.25,
};

const panelCard = {
  p: 1.5,
  borderRadius: 4,
};

const panelTitle = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const panelSubtitle = {
  mt: 0.45,
  color: "text.secondary",
  fontSize: 11.5,
};

const chartSummary = {
  display: "flex",
  justifyContent: "space-between",
  gap: 1,
  alignItems: "center",
  mb: 1.2,
  p: 1.2,
  borderRadius: 3,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const trendValue = {
  mt: 0.35,
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: "-0.05em",
};

const trendMeta = {
  mt: 0.35,
  fontSize: 18,
  fontWeight: 700,
  color: "#d7e2ff",
};

const attentionRow = (tone) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  p: 1.1,
  borderRadius: 3,
  background:
    tone === "critical"
      ? "rgba(239,106,106,0.08)"
      : tone === "warning"
        ? "rgba(245,159,76,0.08)"
        : "rgba(95,111,255,0.08)",
  border: "1px solid rgba(255,255,255,0.05)",
  cursor: "pointer",
});

const severityText = (tone) => ({
  fontSize: 12,
  fontWeight: 700,
  color:
    tone === "critical" ? "#ff9b9b" : tone === "warning" ? "#ffc98a" : "#bcc7ff",
});

const tableShell = {
  borderRadius: 3.5,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.05)",
  background: "rgba(255,255,255,0.02)",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "0.4fr 1.6fr 0.9fr 1fr 0.8fr",
  gap: 1,
  px: 1.25,
  py: 1,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "0.4fr 1.6fr 0.9fr 1fr 0.8fr",
  gap: 1,
  alignItems: "center",
  px: 1.25,
  py: 1.1,
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  cursor: "pointer",
  "&:last-of-type": {
    borderBottom: "none",
  },
  "&:hover": {
    background: "rgba(255,255,255,0.03)",
  },
};

const headerCell = {
  color: "text.secondary",
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const cellText = {
  fontSize: 12.5,
  color: "#d7dcec",
};

const cellTitle = {
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cellMeta = {
  fontSize: 11,
  color: "text.secondary",
};

const statusChip = (status) => ({
  justifySelf: "start",
  background:
    status === "Live"
      ? "rgba(46,194,126,0.14)"
      : status === "Planning"
        ? "rgba(245,159,76,0.14)"
        : "rgba(85,183,255,0.14)",
  color:
    status === "Live"
      ? "#99efc5"
      : status === "Planning"
        ? "#ffd6a0"
        : "#b9e5ff",
});
