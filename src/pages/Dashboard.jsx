import { Suspense, lazy, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { useVendors } from "../hooks/useVendors";
import { useActivities } from "../hooks/useActivities";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { groupByEventId } from "../lib/eventData";
import { buildCalendarItems, buildEventSummary, formatCurrency } from "../utils/eventSelectors";
import ChartFallback from "../components/ChartFallback";
import EmptyState from "../components/EmptyState";

const BudgetComparisonChart = lazy(() =>
  import("../components/DashboardCharts").then((module) => ({
    default: module.BudgetComparisonChart,
  }))
);
const BudgetDonutChart = lazy(() =>
  import("../components/DashboardCharts").then((module) => ({
    default: module.BudgetDonutChart,
  }))
);

const metricCards = [
  { key: "eventsCount", title: "Live Events", accent: "#7f85ff", helper: "from last 30 days" },
  { key: "openTasks", title: "Open Tasks", accent: "#73b7ff", helper: "from last 30 days" },
  { key: "totalVendors", title: "Active Vendors", accent: "#43d29a", helper: "from last 30 days" },
  { key: "budgetUsed", title: "Budget Used", accent: "#ffb163", helper: "from last 30 days", suffix: "%" },
];

const PLACEHOLDER_ANALYTICS = [
  { name: "Week 1", revenue: 18000, expense: 9000, profit: 9000, placeholder: true },
  { name: "Week 2", revenue: 24000, expense: 12000, profit: 12000, placeholder: true },
  { name: "Week 3", revenue: 21000, expense: 10500, profit: 10500, placeholder: true },
  { name: "Week 4", revenue: 28000, expense: 14000, profit: 14000, placeholder: true },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, loading: eventsLoading, error: eventsError, createEvent } = useEvents();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { vendors, loading: vendorsLoading, error: vendorsError } = useVendors();
  const { activities, loading: activitiesLoading, error: activitiesError } = useActivities();
  const { stats, loading: statsLoading, error: statsError, refresh } = useDashboardStats();

  const [feedback, setFeedback] = useState("");
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    notes: "",
    budget: "",
  });

  const loading =
    eventsLoading || tasksLoading || vendorsLoading || statsLoading || activitiesLoading;
  const error = eventsError || tasksError || vendorsError || statsError || activitiesError;

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

  const now = dayjs();
  const hour = now.hour();
  const greetingPrefix = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingName = user?.name || "there";
  const greeting = `${greetingPrefix}, ${greetingName}.`;

  const monthStart = useMemo(() => dayjs().startOf("month"), []);
  const monthEnd = monthStart.endOf("month");
  const startWeek = monthStart.startOf("week");
  const endWeek = monthEnd.endOf("week");
  const calendarItems = useMemo(() => buildCalendarItems(events, tasksByEventId), [events, tasksByEventId]);

  const calendarDays = [];
  let cursor = startWeek;
  while (cursor.isBefore(endWeek) || cursor.isSame(endWeek, "day")) {
    calendarDays.push(cursor);
    cursor = cursor.add(1, "day");
  }

  const lineChartData = useMemo(() => {
    if (stats.spendTrend.length > 0) {
      return stats.spendTrend.map((item, index) => {
        const spend = Number(item.spend) || 0;
        const expense = Math.round(spend * 0.3);
        const profit = Math.max(spend - expense, 0);

        return {
          name: item.name,
          revenue: spend,
          expense,
          profit,
          marker: index === Math.floor(stats.spendTrend.length / 2),
        };
      });
    }

    return events.slice(0, 6).map((event) => {
      const summary = eventSummaries[event.id];
      const spend = summary?.spent || 0;
      const expense = Math.round(spend * 0.34);
      return {
        name: dayjs(event.date).format("D MMM"),
        revenue: spend,
        expense,
        profit: Math.max(spend - expense, 0),
      };
    });
  }, [stats.spendTrend, events, eventSummaries]);

  const analyticsChartData = useMemo(() => {
    const hasSignal = lineChartData.some(
      (item) => Number(item.revenue) > 0 || Number(item.expense) > 0 || Number(item.profit) > 0
    );

    return hasSignal ? lineChartData : PLACEHOLDER_ANALYTICS;
  }, [lineChartData]);

  const donutData = useMemo(() => {
    const spent = Math.max(Number(stats.totalSpent) || 0, 0);
    const remaining = Math.max(Number(stats.totalBudget) - spent, 0);
    return [
      { name: "Spent", value: spent, fill: "#7f85ff" },
      { name: "Remaining", value: remaining, fill: "#37445f" },
    ];
  }, [stats.totalBudget, stats.totalSpent]);

  const eventRows = useMemo(
    () =>
      events
        .map((event) => ({
          ...event,
          summary: eventSummaries[event.id],
        }))
        .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
        .slice(0, 6),
    [events, eventSummaries]
  );

  const activityRows = useMemo(() => activities.slice(0, 5), [activities]);

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
    } catch (nextError) {
      setCreateError(nextError.message);
    }
  };

  return (
    <Box sx={pageShell}>
      {error ? (
        <Alert severity="error" sx={{ mb: 1.25 }}>
          Unable to load dashboard data from Supabase: {error}
        </Alert>
      ) : null}

      <Card sx={heroSection}>
        <Box sx={heroGrid}>
          <Box sx={heroCard}>
            <Typography sx={eyebrow}>Today&apos;s Control Room</Typography>
            <Typography sx={heroTitle}>{greeting}</Typography>
            <Typography sx={heroCopy}>
              Your event operations are live and ready. Track budgets, vendors, tasks, and timelines
              in one place.
            </Typography>

            <Box sx={quickCreateGrid}>
              <TextField size="small" label="Event name" value={form.name} onChange={handleChange("name")} />
              <TextField
                size="small"
                type="date"
                value={form.date}
                onChange={handleChange("date")}
                inputProps={{ "aria-label": "Event date" }}
                placeholder="dd-mm-yyyy"
                sx={dateField}
              />
              <TextField size="small" label="Venue" value={form.venue} onChange={handleChange("venue")} />
              <TextField size="small" label="Budget" value={form.budget} onChange={handleChange("budget")} />
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={handleCreate}
                sx={saveEventButton}
              >
                Save Event
              </Button>
            </Box>

            {createError ? (
              <Typography sx={{ ...subtleText, color: "error.main", mt: 1 }}>{createError}</Typography>
            ) : null}
          </Box>

          <Box sx={metricGrid}>
            {metricCards.map((item) => (
              <Card key={item.key} sx={metricCard}>
                <Box sx={metricIcon(item.accent)} />
                <Typography sx={metricTitle}>{item.title}</Typography>
                <Typography sx={{ ...metricValue, color: item.accent }}>
                  {item.key === "budgetUsed"
                    ? `${Math.round(stats[item.key])}${item.suffix || ""}`
                    : stats[item.key]}
                </Typography>
                <Typography sx={metricMeta}>{item.helper}</Typography>
              </Card>
            ))}
          </Box>
        </Box>
      </Card>

      {loading ? (
        <Card sx={loadingCard}>
          <Typography sx={sectionTitle}>Loading dashboard</Typography>
          <LinearProgress sx={{ mt: 1.2 }} />
        </Card>
      ) : null}

      <Box sx={dashboardGrid}>
        <Card sx={{ ...panelCard, gridColumn: { xs: "1 / -1", xl: "span 2" } }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.1 }}>
            <Typography sx={sectionTitle}>Overview Analytics</Typography>
            <Chip label="This Month" size="small" sx={softChip} />
          </Stack>

          <Box sx={summaryStrip}>
            <SummaryBox label="Total Revenue" value={formatCurrency(stats.totalBudget)} />
            <SummaryBox label="Total Expense" value={formatCurrency(stats.totalSpent)} />
            <SummaryBox label="Net Balance" value={formatCurrency(stats.totalBudget - stats.totalSpent)} />
          </Box>

          <Suspense fallback={<ChartFallback height={240} />}>
            <BudgetComparisonChart data={analyticsChartData} />
          </Suspense>
        </Card>

        <Card sx={panelCard}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.1 }}>
            <Typography sx={sectionTitle}>Needs Attention</Typography>
            <Typography sx={linkText}>View all</Typography>
          </Stack>
          <Stack spacing={0.85}>
            {stats.needsAttention.length > 0 ? (
              stats.needsAttention.slice(0, 4).map((item) => (
                <Box key={item.id} sx={attentionItem} onClick={() => navigate(`/events/${item.eventId}`)}>
                  <Box>
                    <Typography sx={attentionTitle}>{item.title}</Typography>
                    <Typography sx={subtleText}>{item.subtitle}</Typography>
                  </Box>
                  <Typography sx={arrowText}>›</Typography>
                </Box>
              ))
            ) : (
              <EmptyState
                title="No current blockers"
                subtitle="Payments, budgets, and deadlines are looking healthy right now."
                actionLabel="Open Events"
                onAction={() => navigate("/events")}
              />
            )}
          </Stack>
        </Card>

        <Card sx={{ ...panelCard, gridColumn: { xs: "1 / -1", xl: "span 1" } }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.1 }}>
            <Typography sx={sectionTitle}>Budget Overview</Typography>
            <Chip label="This Month" size="small" sx={softChip} />
          </Stack>

          <Box sx={budgetGrid}>
            <Stack spacing={1.1} sx={donutColumn}>
              <Box sx={donutWrap}>
                <Suspense fallback={<ChartFallback height={180} />}>
                  <BudgetDonutChart data={donutData} width={208} height={208} innerRadius={64} outerRadius={92} />
                </Suspense>
              </Box>
              <Box sx={donutSummaryCard}>
                <Typography sx={donutCenterLabel}>Total Budget</Typography>
                <Typography sx={donutCenterValue}>{formatCurrency(stats.totalBudget)}</Typography>
                <Typography sx={donutCenterMeta}>30d used</Typography>
              </Box>
            </Stack>

            <Stack spacing={1.1}>
              <Box sx={budgetList}>
                {donutData.map((item) => (
                  <Box key={item.name} sx={budgetListRow}>
                    <Stack direction="row" spacing={0.7} sx={{ alignItems: "center", minWidth: 0 }}>
                      <Box sx={legendSwatch(item.fill)} />
                      <Typography sx={subtleText} noWrap>
                        {item.name}
                      </Typography>
                    </Stack>
                    <Typography sx={budgetListValue}>{formatCurrency(item.value)}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={budgetFooter}>
                <MetricTile label="Budget Used" value={formatCurrency(stats.totalSpent)} />
                <MetricTile label="Budget Left" value={formatCurrency(stats.totalBudget - stats.totalSpent)} tone="success" />
              </Box>
            </Stack>
          </Box>
        </Card>

        <Card sx={panelCard}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.1 }}>
            <Stack direction="row" spacing={0.9} sx={{ alignItems: "center" }}>
              <Box sx={calendarIconShell}>
                <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: "#8a8eff" }} />
              </Box>
              <Typography sx={sectionTitle}>Calendar</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <LegendDot color="#7f85ff" label="Events" />
              <LegendDot color="#ffb163" label="Tasks" />
            </Stack>
          </Stack>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.05 }}>
            <Box sx={calendarNavButton}>
              <ChevronLeftRoundedIcon sx={{ fontSize: 17, color: "#9da6be" }} />
            </Box>
            <Typography sx={calendarMonth}>{monthStart.format("MMMM YYYY")}</Typography>
            <Box sx={calendarNavButton}>
              <ChevronRightRoundedIcon sx={{ fontSize: 17, color: "#9da6be" }} />
            </Box>
          </Stack>
          <Box sx={calendarWeekHeader}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <Typography key={label} sx={calendarWeekLabel}>
                {label}
              </Typography>
            ))}
          </Box>
          <Box sx={calendarGrid}>
            {calendarDays.map((day) => {
              const dayKey = day.format("YYYY-MM-DD");
              const dayItems = calendarItems.filter((item) => dayjs(item.date).format("YYYY-MM-DD") === dayKey);
              const isCurrentMonth = day.isSame(monthStart, "month");
              const isToday = day.isSame(now, "day");
              const dayTone = dayItems[0]?.type === "task" ? "task" : dayItems[0]?.type === "event" ? "event" : null;

              return (
                <Box key={dayKey} sx={calendarCell(isCurrentMonth, isToday, dayTone, dayItems.length > 0)}>
                  <Typography sx={calendarDayLabel(isCurrentMonth, isToday)}>{day.format("D")}</Typography>
                  <Box sx={calendarDots}>
                    {dayItems.slice(0, 3).map((item) => (
                      <Box key={item.id} sx={calendarDot(item.type)} />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Card>

        <Card sx={{ ...panelCard, gridColumn: { xs: "1 / -1", xl: "span 1" } }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.1 }}>
            <Typography sx={sectionTitle}>Event Pipeline</Typography>
            <IconButtonShell />
          </Stack>
          <Box sx={pipelineStats}>
            <PipelineStat label="Confirmed" value={events.filter((item) => item.status === "Confirmed").length} />
            <PipelineStat label="Planning" value={events.filter((item) => item.status === "Planning").length} />
            <PipelineStat label="Completed" value={events.filter((item) => item.status === "Completed").length} />
          </Box>
          <Box sx={pipelineHeader}>
            <Typography sx={tableHeaderText}>Event</Typography>
            <Typography sx={tableHeaderText}>Venue</Typography>
            <Typography sx={tableHeaderText}>Status</Typography>
          </Box>
          <Stack spacing={0.7}>
            {eventRows.length > 0 ? (
              eventRows.map((event) => (
                <Box key={event.id} sx={pipelineRow} onClick={() => navigate(`/events/${event.id}`)}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={pipelineTitle}>{event.name}</Typography>
                    <Typography sx={subtleText}>{dayjs(event.date).format("DD MMM YYYY")}</Typography>
                  </Box>
                  <Typography sx={subtleText}>{event.venue}</Typography>
                  <Chip label={event.status} size="small" sx={statusChip(event.status)} />
                </Box>
              ))
            ) : (
              <EmptyState
                title="No event data yet"
                subtitle="Create your first event workspace to populate the dashboard."
                actionLabel="Create Event"
                onAction={handleCreate}
              />
            )}
          </Stack>
        </Card>

        <Card sx={panelCard}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.1 }}>
            <Typography sx={sectionTitle}>Recent Activity</Typography>
            <Typography sx={linkText}>View all</Typography>
          </Stack>
          <Stack spacing={0.75}>
            {activityRows.length > 0 ? (
              activityRows.map((activity) => (
                <Box key={activity.id} sx={activityRow}>
                  <Box sx={activityBadge}>{activity.type?.[0] || "A"}</Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={activityTitle}>{activity.message}</Typography>
                    <Typography sx={subtleText} noWrap>
                      {activity.metadata?.name || activity.metadata?.title || activity.metadata?.eventName || activity.type}
                    </Typography>
                  </Box>
                  <Typography sx={activityTime}>{dayjs(activity.createdAt).fromNow?.() || dayjs(activity.createdAt).format("D MMM")}</Typography>
                </Box>
              ))
            ) : (
              <Typography sx={subtleText}>No recent activity yet.</Typography>
            )}
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

function SummaryBox({ label, value }) {
  return (
    <Box sx={summaryBox}>
      <Typography sx={summaryLabel}>{label}</Typography>
      <Typography sx={summaryValue}>{value}</Typography>
    </Box>
  );
}

function MetricTile({ label, value, tone }) {
  return (
    <Box sx={metricTile}>
      <Typography sx={subtleText}>{label}</Typography>
      <Typography sx={{ ...tileValue, color: tone === "success" ? "#74e4b0" : "#f6f8ff" }}>{value}</Typography>
    </Box>
  );
}

function PipelineStat({ label, value }) {
  return (
    <Box sx={pipelineStat}>
      <Typography sx={subtleText}>{label}</Typography>
      <Typography sx={pipelineStatValue}>{value}</Typography>
    </Box>
  );
}

function LegendDot({ color, label }) {
  return (
    <Stack direction="row" spacing={0.45} sx={{ alignItems: "center" }}>
      <Box sx={{ width: 7, height: 7, borderRadius: 999, bgcolor: color }} />
      <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>{label}</Typography>
    </Stack>
  );
}

function IconButtonShell() {
  return (
    <Box sx={iconShell}>
      <MoreHorizRoundedIcon sx={{ fontSize: 18, color: "#9ca3b7" }} />
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

const heroSection = (theme) => ({
  p: 1.05,
  borderRadius: 3,
  mb: 1.25,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
});

const heroGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
  gap: 1.15,
};

const heroCard = {
  p: 1.2,
  borderRadius: 2.6,
  background:
    "linear-gradient(135deg, #2b45b5 0%, #4460dd 54%, #5c77eb 100%)",
  border: "1px solid rgba(161, 175, 255, 0.18)",
  boxShadow: "none",
  position: "relative",
  overflow: "hidden",
  "&:before": {
    content: '""',
    position: "absolute",
    inset: "auto -18px -18px auto",
    width: 120,
    height: 120,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
  },
  "&:after": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 55%)",
  },
};

const eyebrow = {
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "rgba(232, 238, 255, 0.76)",
};

const heroTitle = {
  mt: 0.7,
  fontSize: { xs: 24, md: 32 },
  lineHeight: 1.08,
  fontWeight: 700,
  letterSpacing: "-0.04em",
};

const heroCopy = {
  mt: 0.9,
  maxWidth: 460,
  fontSize: 13,
  lineHeight: 1.65,
  color: "rgba(242, 246, 255, 0.84)",
};

const quickCreateGrid = {
  mt: 1.3,
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
  gap: 0.8,
  position: "relative",
  zIndex: 1,
};

const dateField = {
  "& .MuiOutlinedInput-root": {
    height: "100%",
    "& input": {
      color: "#eef2ff",
      fontSize: 14,
      paddingBlock: "12px",
    },
  },
  "& input::-webkit-calendar-picker-indicator": {
    cursor: "pointer",
    filter: "invert(1) opacity(0.72)",
  },
};

const saveEventButton = {
  minHeight: 40,
  borderRadius: 2,
  fontWeight: 700,
  boxShadow: "none",
  whiteSpace: "nowrap",
  gridColumn: "1 / -1",
  justifySelf: { xs: "stretch", md: "start" },
  minWidth: { xs: "100%", md: 172 },
};

const metricGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))", xl: "repeat(2, minmax(0, 1fr))" },
  gap: 1,
};

const metricCard = {
  p: 1.1,
  borderRadius: 2.4,
  background: "#0d1421",
  border: "1px solid rgba(95,113,165,0.14)",
  boxShadow: "none",
};

const metricIcon = (color) => ({
  width: 16,
  height: 16,
  borderRadius: 1.5,
  background: color,
  mb: 1,
});

const metricTitle = {
  fontSize: 11.5,
  color: "text.secondary",
};

const metricValue = {
  mt: 0.65,
  fontSize: 25,
  lineHeight: 1,
  fontWeight: 700,
  letterSpacing: "-0.04em",
};

const metricMeta = {
  mt: 0.7,
  fontSize: 11,
  color: "text.secondary",
};

const loadingCard = {
  p: 1.25,
  borderRadius: 3.4,
  mb: 1.25,
};

const dashboardGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.35fr 0.85fr" },
  gap: 1.2,
};

const panelCard = (theme) => ({
  p: 1.1,
  borderRadius: 2.8,
  minHeight: 0,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
});

const sectionTitle = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const summaryStrip = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
  gap: 0.8,
  mb: 1.1,
};

const summaryBox = {
  p: 0.95,
  borderRadius: 1.9,
  background: "#0c1421",
  border: "1px solid rgba(95,113,165,0.12)",
};

const summaryLabel = {
  fontSize: 11,
  color: "text.secondary",
};

const summaryValue = {
  mt: 0.45,
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "-0.03em",
};

const attentionItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  p: 0.95,
  borderRadius: 2,
  background: "#0c1421",
  border: "1px solid rgba(95,113,165,0.12)",
  cursor: "pointer",
};

const attentionTitle = {
  fontSize: 13,
  fontWeight: 600,
};

const arrowText = {
  fontSize: 18,
  color: "rgba(226,232,240,0.48)",
};

const linkText = {
  fontSize: 11.5,
  color: "#aeb7cb",
};

const subtleText = {
  fontSize: 11.5,
  color: "text.secondary",
};

const budgetGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "240px minmax(0, 1fr)" },
  gap: 1,
  alignItems: "start",
};

const donutColumn = {
  alignItems: "center",
};

const donutWrap = {
  width: "100%",
  maxWidth: 208,
  height: 208,
  display: "grid",
  placeItems: "center",
  marginInline: "auto",
  justifySelf: "center",
};

const donutSummaryCard = (theme) => ({
  width: "100%",
  p: 0.9,
  borderRadius: 1.9,
  background: theme.palette.mode === "light" ? alpha(theme.palette.primary.main, 0.04) : "#0c1421",
  border: `1px solid ${theme.palette.divider}`,
  textAlign: "center",
});

const donutCenterLabel = {
  fontSize: 10,
  lineHeight: 1.2,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const donutCenterValue = {
  maxWidth: 120,
  fontSize: 16,
  lineHeight: 1.12,
  fontWeight: 700,
  letterSpacing: "-0.03em",
};

const donutCenterMeta = {
  fontSize: 11,
  lineHeight: 1.2,
  color: "text.secondary",
};

const budgetList = {
  display: "grid",
  gap: 0.8,
  minWidth: 0,
};

const budgetListRow = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 1,
  minWidth: 0,
};

const budgetListValue = (theme) => ({
  minWidth: 0,
  textAlign: "right",
  fontSize: 12.5,
  lineHeight: 1.3,
  whiteSpace: "nowrap",
  color: theme.palette.text.primary,
});

const budgetFooter = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 0.8,
};

const metricTile = (theme) => ({
  p: 0.95,
  borderRadius: 1.9,
  background: theme.palette.mode === "light" ? alpha(theme.palette.primary.main, 0.04) : "#0c1421",
  border: `1px solid ${theme.palette.divider}`,
});

const tileValue = {
  mt: 0.45,
  fontSize: 16,
  lineHeight: 1.2,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const calendarMonth = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const calendarWeekHeader = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 0.48,
  mb: 0.48,
};

const calendarWeekLabel = {
  color: "text.secondary",
  fontSize: 10.5,
  textAlign: "center",
  letterSpacing: "0.02em",
};

const calendarGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 0.5,
};

const calendarCell = (isCurrentMonth, isToday, tone, hasItems) => (theme) => ({
  aspectRatio: "1 / 1",
  minHeight: 34,
  p: 0.28,
  borderRadius: 1.6,
  border: "1px solid transparent",
  background:
    hasItems
      ? tone === "task"
        ? "rgba(255, 177, 99, 0.16)"
        : "rgba(127, 133, 255, 0.22)"
      : theme.palette.mode === "light"
        ? isCurrentMonth
          ? isToday
            ? alpha(theme.palette.primary.main, 0.14)
            : "transparent"
          : "#eef3fb"
        : isCurrentMonth
          ? isToday
            ? alpha(theme.palette.primary.main, 0.18)
            : "transparent"
          : "#0b1019",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
});

const calendarDayLabel = (isCurrentMonth, isToday) => (theme) => ({
  fontSize: 11,
  fontWeight: isToday ? 700 : 600,
  color: isToday
    ? theme.palette.text.primary
    : isCurrentMonth
      ? theme.palette.text.primary
      : alpha(theme.palette.text.secondary, 0.9),
  textAlign: "center",
  lineHeight: 1,
  ...(isToday
    ? {
        width: 24,
        height: 24,
        display: "grid",
        placeItems: "center",
        borderRadius: 999,
        background: alpha(theme.palette.primary.main, 0.2),
      }
    : {}),
});

const calendarDots = {
  display: "flex",
  justifyContent: "center",
  gap: 0.28,
  minHeight: 7,
  alignItems: "center",
  marginTop: 4,
};

const calendarDot = (type) => ({
  width: 5,
  height: 5,
  borderRadius: 999,
  background: type === "event" ? "#7f85ff" : "#ffb163",
});

const pipelineStats = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 0.8,
  mb: 1.1,
};

const pipelineStat = (theme) => ({
  p: 0.9,
  borderRadius: 1.9,
  background: theme.palette.mode === "light" ? alpha(theme.palette.primary.main, 0.04) : "#0c1421",
  border: `1px solid ${theme.palette.divider}`,
});

const pipelineStatValue = {
  mt: 0.45,
  fontSize: 18,
  fontWeight: 700,
};

const pipelineHeader = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 0.8fr",
  gap: 1,
  px: 0.3,
  mb: 0.6,
};

const tableHeaderText = {
  fontSize: 10.5,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const pipelineRow = (theme) => ({
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 0.8fr",
  gap: 1,
  alignItems: "center",
  p: 0.85,
  borderRadius: 1.9,
  background: theme.palette.mode === "light" ? alpha(theme.palette.primary.main, 0.04) : "#0c1421",
  border: `1px solid ${theme.palette.divider}`,
  cursor: "pointer",
});

const pipelineTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: "text.primary",
};

const activityRow = (theme) => ({
  display: "flex",
  alignItems: "center",
  gap: 0.9,
  p: 0.85,
  borderRadius: 1.9,
  background: theme.palette.mode === "light" ? alpha(theme.palette.primary.main, 0.04) : "#0c1421",
  border: `1px solid ${theme.palette.divider}`,
});

const activityBadge = (theme) => ({
  width: 28,
  height: 28,
  borderRadius: 1.5,
  display: "grid",
  placeItems: "center",
  background: theme.palette.mode === "light" ? alpha(theme.palette.primary.main, 0.08) : "#151f33",
  color: theme.palette.text.secondary,
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
});

const activityTitle = {
  fontSize: 12.5,
  fontWeight: 600,
};

const activityTime = {
  fontSize: 10.5,
  color: "text.secondary",
  flexShrink: 0,
};

const iconShell = (theme) => ({
  width: 30,
  height: 30,
  borderRadius: 1.7,
  background: theme.palette.mode === "light" ? alpha(theme.palette.primary.main, 0.04) : "#0c1421",
  border: `1px solid ${theme.palette.divider}`,
  display: "grid",
  placeItems: "center",
});

const softChip = (theme) => ({
  background: theme.palette.mode === "light" ? "#f4f7ff" : "#141c2c",
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.divider}`,
});

const statusChip = (status) => ({
  background:
    status === "Live"
      ? "rgba(34,197,94,0.16)"
      : status === "Planning"
        ? "rgba(251,191,36,0.16)"
        : status === "Confirmed"
          ? "rgba(127,133,255,0.18)"
          : "rgba(96,165,250,0.16)",
  color:
    status === "Live"
      ? "#bbf7d0"
      : status === "Planning"
        ? "#fde68a"
        : status === "Confirmed"
          ? "#d4d7ff"
          : "#bfdbfe",
});

const legendSwatch = (color) => {
  return {
    width: 7,
    height: 7,
    borderRadius: 999,
    bgcolor: color,
  };
};

const calendarIconShell = {
  width: 28,
  height: 28,
  borderRadius: 1.6,
  background: "rgba(127,133,255,0.14)",
  display: "grid",
  placeItems: "center",
};

const calendarNavButton = {
  width: 22,
  height: 22,
  display: "grid",
  placeItems: "center",
};
