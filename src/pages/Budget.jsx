import { Suspense, lazy, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { useVendors } from "../hooks/useVendors";
import { useActivities } from "../hooks/useActivities";
import { buildEventSummary, formatCurrency } from "../utils/eventSelectors";
import ChartFallback from "../components/ChartFallback";

const BudgetVendorChart = lazy(() => import("../components/BudgetVendorChart"));
const BudgetDonutChart = lazy(() =>
  import("../components/DashboardCharts").then((module) => ({
    default: module.BudgetDonutChart,
  }))
);

export default function Budget() {
  const navigate = useNavigate();
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState("");

  const activeEventId = selectedEvent || events[0]?.id || "";
  const currentEvent = events.find((event) => String(event.id) === String(activeEventId)) || null;
  const { tasks } = useTasks(currentEvent?.id);
  const { vendors } = useVendors(currentEvent?.id);
  const { activities, error: activitiesError } = useActivities(currentEvent?.id);

  const recentBudgetActivity = useMemo(
    () =>
      activities.filter((activity) =>
        ["VENDOR_CREATED", "VENDOR_UPDATED", "VENDOR_STATUS_UPDATED", "EVENT_CREATED"].includes(activity.type)
      ),
    [activities]
  );

  if (!currentEvent) {
    return null;
  }

  const summary = buildEventSummary(currentEvent, {
    tasksByEventId: { [currentEvent.id]: tasks },
    vendorsByEventId: { [currentEvent.id]: vendors },
  });

  const committedPercent = currentEvent.budget > 0 ? Math.round((summary.spent / currentEvent.budget) * 100) : 0;
  const vendorChartData = vendors.map((vendor) => ({
    name: vendor.name,
    cost: vendor.cost,
  }));

  const donutData = [
    { name: "Spent", value: Math.max(summary.spent, 0), fill: "#6d6bff" },
    { name: "Remaining", value: Math.max(summary.remaining, 0), fill: "#232d45" },
  ];

  const exportBudget = () => {
    const lines = [
      ["Budget Report"],
      [`Event,${escapeCsv(currentEvent.name)}`],
      [`Allocated,${currentEvent.budget}`],
      [`Spent,${summary.spent}`],
      [`Remaining,${summary.remaining}`],
      [""],
      ["Vendor,Category,Status,Cost,Email,Phone"],
      ...vendors.map((vendor) => [
        escapeCsv(vendor.name),
        escapeCsv(vendor.category),
        escapeCsv(vendor.status),
        vendor.cost,
        escapeCsv(vendor.email || ""),
        escapeCsv(vendor.phone || ""),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentEvent.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-budget.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={pageShell}>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 1.4 }}>
        <Box>
          <Typography sx={pageTitle}>Budget</Typography>
          <Typography sx={pageSubtitle}>Track spend, compare with plan and stay in control.</Typography>
        </Box>

        <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} sx={exportButton} onClick={exportBudget}>
          Export
        </Button>
      </Stack>

      {activitiesError ? (
        <Alert severity="error" sx={{ mb: 1.2 }}>
          Unable to load budget activity: {activitiesError}
        </Alert>
      ) : null}

      <Box sx={topGrid}>
        <Card sx={selectorCard}>
          <Typography sx={selectorLabel}>Select Event</Typography>
          <TextField
            select
            size="small"
            value={activeEventId}
            onChange={(event) => setSelectedEvent(event.target.value)}
            sx={selectorField}
          >
            {events.map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.name}
              </MenuItem>
            ))}
          </TextField>
        </Card>

        <MetricCard
          icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 20 }} />}
          title="Allocated"
          value={formatCurrency(currentEvent.budget)}
        />
        <MetricCard
          icon={<TrendingUpRoundedIcon sx={{ fontSize: 20 }} />}
          title="Spent"
          value={formatCurrency(summary.spent)}
        />
        <MetricCard
          icon={<DonutLargeRoundedIcon sx={{ fontSize: 20 }} />}
          title="Remaining"
          value={formatCurrency(summary.remaining)}
          valueColor="#7f85ff"
        />
      </Box>

      <Box sx={midGrid}>
        <Card sx={panelCard}>
          <Typography sx={sectionTitle}>Budget overview</Typography>
          <Typography sx={sectionSubtitle}>Committed vs Remaining</Typography>

          <Box sx={budgetOverviewGrid}>
            <Box sx={donutWrap}>
              <Suspense fallback={<ChartFallback height={180} />}>
                <BudgetDonutChart data={donutData} width={204} height={204} innerRadius={62} outerRadius={88} />
              </Suspense>
              <Box sx={donutCenter}>
                <Typography sx={donutCenterValue}>{committedPercent}%</Typography>
                <Typography sx={donutCenterLabel}>Committed</Typography>
              </Box>
            </Box>

            <Stack spacing={1.15}>
              <LegendRow label="Spent" value={formatCurrency(summary.spent)} color="#6d6bff" />
              <LegendRow label="Remaining" value={formatCurrency(summary.remaining)} color="#232d45" />
              <MetricStrip label="Budget Used" value={formatCurrency(summary.spent)} />
              <MetricStrip label="Budget Left" value={formatCurrency(summary.remaining)} tone="success" />
            </Stack>
          </Box>
        </Card>

        <Card sx={panelCard}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Box>
              <Typography sx={sectionTitle}>Vendor split</Typography>
              <Typography sx={sectionSubtitle}>Spend distribution across vendors</Typography>
            </Box>
            <Button variant="text" sx={linkButton} onClick={() => navigate("/vendors")}>
              View vendors
            </Button>
          </Stack>

          <Suspense fallback={<ChartFallback height={260} />}>
            <BudgetVendorChart data={vendorChartData} />
          </Suspense>
        </Card>
      </Box>

      <Card sx={activityCard}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography sx={sectionTitle}>Recent budget activity</Typography>
            <Typography sx={sectionSubtitle}>Latest updates and changes</Typography>
          </Box>
          <Button
            variant="text"
            sx={linkButton}
            onClick={() => navigate(currentEvent ? `/events/${currentEvent.id}` : "/events")}
          >
            View all activity
          </Button>
        </Stack>

        <Stack spacing={0.85}>
          {recentBudgetActivity.length > 0 ? (
            recentBudgetActivity.slice(0, 4).map((activity) => (
              <Box key={activity.id} sx={activityRow}>
                <Box sx={activityIconWrap}>
                  <ReceiptLongRoundedIcon sx={{ fontSize: 18, color: "#7f85ff" }} />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={activityTitle}>{buildActivityCopy(activity)}</Typography>
                </Box>

                <Typography sx={activityTime}>{formatRelativeTime(activity.createdAt)}</Typography>
              </Box>
            ))
          ) : (
            <Typography sx={emptyText}>No recent budget activity yet.</Typography>
          )}
        </Stack>
      </Card>
    </Box>
  );
}

function MetricCard({ icon, title, value, valueColor }) {
  return (
    <Card sx={metricCard}>
      <Box sx={metricIcon}>{icon}</Box>
      <Box>
        <Typography sx={metricLabel}>{title}</Typography>
        <Typography sx={{ ...metricValue, color: valueColor || "#f5f7ff" }}>{value}</Typography>
      </Box>
    </Card>
  );
}

function LegendRow({ label, value, color }) {
  return (
    <Box sx={legendRow}>
      <Stack direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
        <Box sx={{ width: 12, height: 12, borderRadius: 999, bgcolor: color }} />
        <Typography sx={legendLabel}>{label}</Typography>
      </Stack>
      <Typography sx={legendValue}>{value}</Typography>
    </Box>
  );
}

function MetricStrip({ label, value, tone }) {
  return (
    <Box sx={metricStrip}>
      <Typography sx={metricStripLabel}>{label}</Typography>
      <Typography sx={{ ...metricStripValue, color: tone === "success" ? "#74e4b0" : "#f4f7ff" }}>
        {value}
      </Typography>
    </Box>
  );
}

function buildActivityCopy(activity) {
  const name = activity.metadata?.name || activity.metadata?.title || activity.metadata?.eventName || "Vendor";

  switch (activity.type) {
    case "VENDOR_STATUS_UPDATED":
      return `Payment or status update recorded for ${name}`;
    case "VENDOR_UPDATED":
      return `${name} vendor details were updated`;
    case "VENDOR_CREATED":
      return `${name} was added to the event budget`;
    case "EVENT_CREATED":
      return `Budget created for ${name}`;
    default:
      return activity.message;
  }
}

function formatRelativeTime(timestamp) {
  const date = dayjs(timestamp);
  const now = dayjs();
  const hours = now.diff(date, "hour");
  const days = now.diff(date, "day");

  if (hours < 1) {
    return "just now";
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.format("DD MMM");
}

function escapeCsv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

const pageShell = {
  maxWidth: 1180,
  marginInline: "auto",
  height: "100%",
  overflowY: "auto",
  pb: 2.5,
};

const pageTitle = {
  fontSize: 22,
  fontWeight: 700,
  color: "#f7f9ff",
};

const pageSubtitle = {
  mt: 0.35,
  fontSize: 13,
  color: "text.secondary",
};

const exportButton = {
  minHeight: 44,
  px: 1.6,
};

const topGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.2fr repeat(3, minmax(0, 1fr))" },
  gap: 1.15,
  mb: 1.2,
};

const selectorCard = {
  p: 1.25,
  borderRadius: 3,
  border: "1px solid rgba(127,133,255,0.4)",
  boxShadow: "0 0 0 2px rgba(109,107,255,0.18), 0 10px 26px rgba(50, 57, 102, 0.22)",
};

const selectorLabel = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "text.secondary",
  mb: 0.9,
};

const selectorField = {
  width: "100%",
};

const metricCard = {
  p: 1.35,
  borderRadius: 2.8,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const metricIcon = {
  width: 50,
  height: 50,
  borderRadius: 2,
  display: "grid",
  placeItems: "center",
  background: "#171f31",
  color: "#7f85ff",
  flexShrink: 0,
};

const metricLabel = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "text.secondary",
};

const metricValue = {
  mt: 0.4,
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: "-0.03em",
};

const midGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "0.9fr 1.6fr" },
  gap: 1.2,
  mb: 1.2,
};

const panelCard = {
  p: 1.35,
  borderRadius: 3,
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 700,
};

const sectionSubtitle = {
  mt: 0.35,
  fontSize: 12,
  color: "text.secondary",
};

const budgetOverviewGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", lg: "minmax(248px, 280px) minmax(0, 1fr)" },
  gap: 1.1,
  alignItems: "center",
  mt: 1.2,
};

const donutWrap = {
  width: "100%",
  maxWidth: 228,
  height: 228,
  position: "relative",
  display: "grid",
  placeItems: "center",
  marginInline: "auto",
  justifySelf: "center",
};

const donutCenter = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.2,
  textAlign: "center",
  pointerEvents: "none",
  paddingInline: 24,
};

const donutCenterValue = {
  fontSize: 22,
  lineHeight: 1.05,
  fontWeight: 700,
};

const donutCenterLabel = {
  fontSize: 12,
  lineHeight: 1.2,
  color: "text.secondary",
};

const legendRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1,
  minWidth: 0,
};

const legendLabel = {
  fontSize: 13,
  color: "#d5dced",
};

const legendValue = {
  fontSize: 13,
  fontWeight: 700,
  color: "#f4f7ff",
};

const metricStrip = {
  p: 1,
  borderRadius: 2.2,
  background: "#0c1421",
  border: "1px solid rgba(95,113,165,0.12)",
};

const metricStripLabel = {
  fontSize: 11.5,
  color: "text.secondary",
};

const metricStripValue = {
  mt: 0.35,
  fontSize: 18,
  fontWeight: 700,
};

const linkButton = {
  color: "#8e92ff",
  fontWeight: 600,
};

const activityCard = {
  p: 1.35,
  borderRadius: 3,
};

const activityRow = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  p: 0.95,
  borderRadius: 2.2,
  background: "#0c1421",
  border: "1px solid rgba(95,113,165,0.12)",
};

const activityIconWrap = {
  width: 44,
  height: 44,
  borderRadius: 2,
  display: "grid",
  placeItems: "center",
  background: "#171f31",
  flexShrink: 0,
};

const activityTitle = {
  fontSize: 13,
  color: "#e9eefb",
};

const activityTime = {
  fontSize: 12,
  color: "text.secondary",
  flexShrink: 0,
};

const emptyText = {
  fontSize: 12,
  color: "text.secondary",
};
