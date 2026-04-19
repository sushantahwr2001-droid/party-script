import { Suspense, lazy, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Chip,
  Collapse,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { useVendors } from "../hooks/useVendors";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { groupByEventId } from "../lib/eventData";
import { buildEventSummary, formatCurrency } from "../utils/eventSelectors";
import ChartFallback from "../components/ChartFallback";
import EmptyState from "../components/EmptyState";

const BudgetTrendChart = lazy(() =>
  import("../components/DashboardCharts").then((module) => ({ default: module.BudgetTrendChart }))
);
const BudgetComparisonChart = lazy(() =>
  import("../components/DashboardCharts").then((module) => ({
    default: module.BudgetComparisonChart,
  }))
);

const metricCards = [
  { key: "eventsCount", title: "Live events", accent: "#6f72ff", change: "+12.4%" },
  { key: "openTasks", title: "Open tasks", accent: "#55b7ff", change: "-8.1%" },
  { key: "totalVendors", title: "Active vendors", accent: "#32d08a", change: "+6.8%" },
  { key: "budgetUsed", title: "Budget used", accent: "#ffad57", suffix: "%", change: "+3.2%" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { events, loading: eventsLoading, error: eventsError, createEvent } = useEvents();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { vendors, loading: vendorsLoading, error: vendorsError } = useVendors();
  const { stats, loading: statsLoading, error: statsError, refresh } = useDashboardStats();

  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    notes: "",
    budget: "",
  });

  const loading = eventsLoading || tasksLoading || vendorsLoading || statsLoading;
  const error = eventsError || tasksError || vendorsError || statsError;

  const tasksByEventId = useMemo(() => groupByEventId(tasks), [tasks]);
  const vendorsByEventId = useMemo(() => groupByEventId(vendors), [vendors]);

  const eventSummaries = useMemo(
    () =>
      Object.fromEntries(
        events.map((event) => [
          event.id,
          buildEventSummary(event, {
            tasksByEventId,
            vendorsByEventId,
          }),
        ])
      ),
    [events, tasksByEventId, vendorsByEventId]
  );

  const filteredEvents = events;

  const comparisonData = useMemo(
    () =>
      filteredEvents.slice(0, 6).map((event) => ({
        name: event.name.length > 10 ? `${event.name.slice(0, 10)}…` : event.name,
        budget: event.budget,
        spend: eventSummaries[event.id]?.spent || 0,
      })),
    [filteredEvents, eventSummaries]
  );

  const topVendors = useMemo(
    () =>
      [...vendors]
        .sort((a, b) => (b.cost || 0) - (a.cost || 0))
        .slice(0, 4)
        .map((vendor) => ({
          ...vendor,
          eventName: events.find((event) => event.id === vendor.eventId)?.name || "Unknown event",
        })),
    [vendors, events]
  );

  const urgentTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.done)
        .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
        .slice(0, 6)
        .map((task) => ({
          ...task,
          eventName: events.find((event) => event.id === task.eventId)?.name || "Unknown event",
        })),
    [tasks, events]
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
      <Collapse in={showCreate}>
        <Card sx={createCard}>
          <Typography sx={panelTitle}>Create event workspace</Typography>
          <Box sx={createGrid}>
            <TextField size="small" label="Event name" value={form.name} onChange={handleChange("name")} />
            <TextField
              size="small"
              label="Date"
              type="date"
              value={form.date}
              onChange={handleChange("date")}
              InputLabelProps={{ shrink: true }}
              inputProps={{ placeholder: "" }}
            />
            <TextField size="small" label="Venue" value={form.venue} onChange={handleChange("venue")} />
            <TextField size="small" label="Notes" value={form.notes} onChange={handleChange("notes")} />
            <TextField size="small" label="Budget" type="number" value={form.budget} onChange={handleChange("budget")} />
            <Button variant="contained" onClick={handleCreate}>
              Create
            </Button>
          </Box>
          {createError ? (
            <Typography sx={{ ...helperText, color: "#fca5a5", mt: 0.9 }}>{createError}</Typography>
          ) : null}
        </Card>
      </Collapse>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.25 }}>
          Unable to load dashboard data from Supabase: {error}
        </Alert>
      ) : null}

      <Box sx={topRowGrid}>
        <Card sx={welcomeCard}>
          <Typography sx={eyebrowMuted}>Today&apos;s control room</Typography>
          <Typography sx={welcomeTitle}>Good evening. Your event operations are live and ready.</Typography>
          <Typography sx={welcomeText}>
            Track budget movement, vendor progress, task pressure, and workspace activity from one
            premium dashboard.
          </Typography>
          <Stack direction="row" spacing={1} mt={2}>
            <Button size="small" variant="contained" onClick={() => setShowCreate(true)}>
              Create Event
            </Button>
            <Button size="small" variant="outlined" onClick={() => navigate("/events")}>
              Open Events
            </Button>
          </Stack>
        </Card>

        <Box sx={statsGrid}>
          {metricCards.map((item) => (
            <StatCard
              key={item.key}
              title={item.title}
              value={
                item.key === "budgetUsed"
                  ? `${Math.round(stats[item.key])}${item.suffix || ""}`
                  : stats[item.key]
              }
              accent={item.accent}
              change={item.change}
            />
          ))}
        </Box>
      </Box>

      {loading ? (
        <Card sx={loadingCard}>
          <Typography sx={panelTitle}>Loading dashboard</Typography>
          <LinearProgress sx={{ mt: 1.2 }} />
        </Card>
      ) : null}

      <Box sx={analyticsGrid}>
        <Card sx={{ ...panelCard, gridColumn: { xs: "1 / -1", xl: "span 2" } }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
            <Box>
              <Typography sx={panelTitle}>Revenue report</Typography>
              <Typography sx={panelSubtitle}>Budget vs committed spend across active event workspaces.</Typography>
            </Box>
            <Button size="small" variant="text" endIcon={<OpenInNewRoundedIcon />}>
              Details
            </Button>
          </Stack>

          <Suspense fallback={<ChartFallback height={260} />}>
            <BudgetComparisonChart data={comparisonData} />
          </Suspense>
        </Card>

        <Card sx={panelCard}>
          <Typography sx={panelTitle}>Needs attention</Typography>
          <Typography sx={panelSubtitle}>Important issues surfaced from your event workspaces.</Typography>
          <Box mt={1.2}>
            {stats.needsAttention.length > 0 ? (
              <Stack spacing={0.8}>
                {stats.needsAttention.slice(0, 4).map((item) => (
                  <Box key={item.id} sx={attentionRow(item.tone)} onClick={() => navigate(`/events/${item.eventId}`)}>
                    <Typography fontWeight={700} fontSize={13}>
                      {item.title}
                    </Typography>
                    <Typography sx={helperText}>{item.subtitle}</Typography>
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
          </Box>
        </Card>
      </Box>

      <Box sx={midGrid}>
        <Card sx={panelCard}>
          <Typography sx={panelTitle}>Budget flow</Typography>
          <Typography sx={panelSubtitle}>Committed spend movement and vendor category intensity.</Typography>
          <Box sx={trendSummaryRow}>
            <MetricPill label="Total spend" value={formatCurrency(stats.totalSpent)} />
            <MetricPill label="Budget left" value={formatCurrency(stats.totalBudget - stats.totalSpent)} />
          </Box>
          <Suspense fallback={<ChartFallback height={220} />}>
            <BudgetTrendChart data={stats.spendTrend} />
          </Suspense>
        </Card>

        <Card sx={panelCard}>
          <Typography sx={panelTitle}>Top vendors</Typography>
          <Typography sx={panelSubtitle}>Highest-value vendors connected to your live events.</Typography>
          <Stack spacing={0.9} mt={1.2}>
            {topVendors.map((vendor, index) => (
              <Box key={vendor.id} sx={rankRow}>
                <Box sx={rankBadge}>{index + 1}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} fontSize={13}>
                    {vendor.name}
                  </Typography>
                  <Typography sx={helperText} noWrap>
                    {vendor.eventName} / {vendor.category}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography fontWeight={700} fontSize={13}>
                    {formatCurrency(vendor.cost)}
                  </Typography>
                  <Chip label={vendor.status} size="small" sx={vendorStatusChip(vendor.status)} />
                </Box>
              </Box>
            ))}
            {topVendors.length === 0 ? (
              <Typography sx={helperText}>No vendors yet.</Typography>
            ) : null}
          </Stack>
        </Card>
      </Box>

      <Box sx={bottomGrid}>
        <Card sx={panelCard}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
            <Box>
              <Typography sx={panelTitle}>Event pipeline</Typography>
              <Typography sx={panelSubtitle}>Upcoming event workspaces with progress and budget context.</Typography>
            </Box>
            <Button size="small" variant="text" onClick={() => navigate("/events")}>
              View all
            </Button>
          </Stack>

          <Box sx={tableShell}>
            <Box sx={tableHeader}>
              <Typography sx={headerCell}>Event</Typography>
              <Typography sx={headerCell}>Date</Typography>
              <Typography sx={headerCell}>Venue</Typography>
              <Typography sx={headerCell}>Progress</Typography>
              <Typography sx={headerCell}>Status</Typography>
            </Box>
            {filteredEvents.slice(0, 6).map((event) => (
              <Box key={event.id} sx={tableRow} onClick={() => navigate(`/events/${event.id}`)}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={rowTitle}>{event.name}</Typography>
                  <Typography sx={rowMeta} noWrap>
                    {event.notes || "No notes"}
                  </Typography>
                </Box>
                <Typography sx={rowText}>{dayjs(event.date).format("DD MMM YYYY")}</Typography>
                <Typography sx={rowText}>{event.venue}</Typography>
                <Typography sx={rowText}>{eventSummaries[event.id]?.overallProgress || 0}%</Typography>
                <Chip label={event.status} size="small" sx={statusChip(event.status)} />
              </Box>
            ))}
            {filteredEvents.length === 0 ? (
              <Box sx={{ p: 1.4 }}>
                <EmptyState
                  title="No events found"
                  subtitle="Try another search or create a new workspace."
                  actionLabel="Create Event"
                  onAction={() => setShowCreate(true)}
                />
              </Box>
            ) : null}
          </Box>
        </Card>

        <Card sx={panelCard}>
          <Typography sx={panelTitle}>Recent task pressure</Typography>
          <Typography sx={panelSubtitle}>Open tasks sorted by nearest due date across your console.</Typography>
          <Stack spacing={0.85} mt={1.2}>
            {urgentTasks.map((task) => (
              <Box key={task.id} sx={taskRow}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography fontWeight={700} fontSize={13}>
                    {task.title}
                  </Typography>
                  <Typography sx={helperText} noWrap>
                    {task.eventName} / {task.stage} / {task.assignee || "Unassigned"}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography fontWeight={700} fontSize={12}>
                    {dayjs(task.dueDate).format("DD MMM")}
                  </Typography>
                  <Chip label={task.priority} size="small" sx={priorityChip(task.priority)} />
                </Box>
              </Box>
            ))}
            {urgentTasks.length === 0 ? (
              <Typography sx={helperText}>No open tasks right now.</Typography>
            ) : null}
          </Stack>
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

function StatCard({ title, value, accent, change }) {
  return (
    <Card sx={metricCard}>
      <Typography sx={metricLabel}>{title}</Typography>
      <Typography sx={{ ...metricValue, color: accent }}>{value}</Typography>
      <Typography sx={metricMeta}>{change} from last 30 days</Typography>
    </Card>
  );
}

function MetricPill({ label, value }) {
  return (
    <Box sx={metricPill}>
      <Typography sx={metricPillLabel}>{label}</Typography>
      <Typography sx={metricPillValue}>{value}</Typography>
    </Box>
  );
}

const pageShell = {
  maxWidth: 1260,
  marginInline: "auto",
  height: "100%",
  overflowY: "auto",
  pr: 0.25,
  pb: 2.5,
};

const eyebrowMuted = {
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "#9ca3b7",
};

const createCard = {
  p: 1.2,
  borderRadius: 3.4,
  mb: 1.25,
};

const createGrid = {
  mt: 1,
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(3, minmax(0, 1fr))",
    xl: "repeat(6, minmax(0, 1fr))",
  },
  gap: 0.8,
  alignItems: "center",
};

const topRowGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.05fr 1.45fr" },
  gap: 1.25,
  mb: 1.25,
};

const welcomeCard = {
  p: 1.5,
  borderRadius: 4,
  background:
    "linear-gradient(135deg, rgba(20,49,122,0.98), rgba(23,68,185,0.95) 48%, rgba(68,119,255,0.78) 100%)",
  border: "1px solid rgba(112,140,255,0.22)",
};

const welcomeTitle = {
  mt: 0.8,
  fontSize: { xs: 20, md: 24 },
  lineHeight: 1.12,
  letterSpacing: "-0.04em",
  fontWeight: 700,
};

const welcomeText = {
  mt: 1,
  maxWidth: 430,
  fontSize: 13,
  color: "rgba(244,247,255,0.8)",
  lineHeight: 1.7,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
  gap: 1.1,
};

const metricCard = {
  p: 1.3,
  borderRadius: 3.4,
};

const metricLabel = {
  color: "text.secondary",
  fontSize: 11,
};

const metricValue = {
  mt: 0.9,
  fontSize: 24,
  lineHeight: 1,
  letterSpacing: "-0.04em",
  fontWeight: 700,
};

const metricMeta = {
  mt: 0.7,
  color: "text.secondary",
  fontSize: 11,
};

const loadingCard = {
  p: 1.25,
  borderRadius: 3.4,
  mb: 1.25,
};

const analyticsGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.55fr 0.85fr" },
  gap: 1.25,
  mb: 1.25,
};

const midGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
  gap: 1.25,
  mb: 1.25,
};

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.5fr 0.9fr" },
  gap: 1.25,
};

const panelCard = {
  p: 1.35,
  borderRadius: 3.6,
  minHeight: 0,
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

const attentionRow = (tone) => ({
  p: 0.95,
  borderRadius: 2.6,
  background:
    tone === "critical"
      ? "rgba(239,106,106,0.1)"
      : tone === "warning"
        ? "rgba(255,173,87,0.1)"
        : "rgba(95,111,255,0.1)",
  border: "1px solid rgba(255,255,255,0.05)",
  cursor: "pointer",
});

const trendSummaryRow = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 0.9,
  mt: 1.2,
  mb: 1.1,
};

const metricPill = {
  p: 1,
  borderRadius: 2.8,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const metricPillLabel = {
  color: "text.secondary",
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const metricPillValue = {
  mt: 0.55,
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "-0.04em",
};

const rankRow = {
  display: "flex",
  alignItems: "center",
  gap: 0.9,
  p: 0.9,
  borderRadius: 2.6,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const rankBadge = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(95,111,255,0.14)",
  color: "#dce3ff",
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};

const tableShell = {
  borderRadius: 3.2,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.05)",
  background: "rgba(255,255,255,0.02)",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.85fr 1fr 0.75fr 0.7fr",
  gap: 1,
  px: 1.1,
  py: 0.95,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.85fr 1fr 0.75fr 0.7fr",
  gap: 1,
  alignItems: "center",
  px: 1.1,
  py: 1,
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

const rowTitle = {
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const rowMeta = {
  mt: 0.35,
  fontSize: 11.2,
  color: "text.secondary",
};

const rowText = {
  fontSize: 12.5,
  color: "#d7dcec",
};

const taskRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  p: 0.95,
  borderRadius: 2.6,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const helperText = {
  fontSize: 11.5,
  color: "text.secondary",
};

const statusChip = (status) => ({
  background:
    status === "Live"
      ? "rgba(34,197,94,0.16)"
      : status === "Planning"
        ? "rgba(251,191,36,0.16)"
        : "rgba(96,165,250,0.16)",
  color:
    status === "Live"
      ? "#bbf7d0"
      : status === "Planning"
        ? "#fde68a"
        : "#bfdbfe",
});

const vendorStatusChip = (status) => ({
  mt: 0.45,
  background:
    status === "Paid"
      ? "rgba(34,197,94,0.16)"
      : status === "Confirmed"
        ? "rgba(96,165,250,0.16)"
        : "rgba(251,191,36,0.16)",
  color:
    status === "Paid"
      ? "#bbf7d0"
      : status === "Confirmed"
        ? "#bfdbfe"
        : "#fde68a",
});

const priorityChip = (priority) => ({
  mt: 0.45,
  background:
    priority === "High"
      ? "rgba(239,106,106,0.16)"
      : priority === "Medium"
        ? "rgba(251,191,36,0.16)"
        : "rgba(96,165,250,0.16)",
  color:
    priority === "High"
      ? "#fecaca"
      : priority === "Medium"
        ? "#fde68a"
        : "#bfdbfe",
});
