import { Suspense, lazy, useMemo, useState } from "react";
import { Box, Card, Chip, LinearProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { useVendors } from "../hooks/useVendors";
import { buildEventSummary, formatCurrency } from "../utils/eventSelectors";
import ChartFallback from "../components/ChartFallback";

const BudgetVendorChart = lazy(() => import("../components/BudgetVendorChart"));

export default function Budget() {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState("");
  const activeEventId = selectedEvent || events[0]?.id || "";
  const currentEvent = useMemo(
    () => events.find((event) => String(event.id) === String(activeEventId)) || null,
    [events, activeEventId]
  );
  const { tasks } = useTasks(currentEvent?.id);
  const { vendors } = useVendors(currentEvent?.id);

  if (!currentEvent) {
    return null;
  }

  const summary = buildEventSummary(currentEvent, {
    tasksByEventId: { [currentEvent.id]: tasks },
    vendorsByEventId: { [currentEvent.id]: vendors },
  });

  const chartData = vendors.map((vendor) => ({
    name: vendor.category,
    cost: vendor.cost,
  }));

  const budgetPercent = currentEvent.budget ? Math.min(100, (summary.spent / currentEvent.budget) * 100) : 0;

  return (
    <Box sx={pageShell}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", mb: 1.25 }}
      >
        <Box>
          <Typography sx={eyebrow}>Budget desk</Typography>
          <Typography sx={pageTitle}>See committed spend, remaining budget, and vendor distribution in one view.</Typography>
        </Box>

        <TextField
          select
          size="small"
          label="Select Event"
          value={activeEventId}
          onChange={(event) => setSelectedEvent(event.target.value)}
          sx={{ width: 260 }}
        >
          {events.map((event) => (
            <MenuItem key={event.id} value={event.id}>
              {event.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={statsGrid}>
        <MetricCard title="Allocated" value={formatCurrency(currentEvent.budget)} />
        <MetricCard title="Spent" value={formatCurrency(summary.spent)} accent="#55b7ff" />
        <MetricCard title="Remaining" value={formatCurrency(summary.remaining)} accent={summary.remaining >= 0 ? "#2ec27e" : "#ef6a6a"} />
        <MetricCard title="Usage" value={`${Math.round(budgetPercent)}%`} accent="#f59f4c" />
      </Box>

      <Box sx={contentGrid}>
        <Card sx={panelCard}>
          <Typography sx={panelTitle}>Budget usage</Typography>
          <Typography sx={panelSubtitle}>Track how much of the allocated event budget is already committed.</Typography>

          <Box sx={usageShell}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Box>
                <Typography sx={metricLabel}>Committed spend</Typography>
                <Typography sx={metricValue}>{formatCurrency(summary.spent)}</Typography>
              </Box>
              <Chip label={`${Math.round(budgetPercent)}% used`} size="small" />
            </Stack>
            <LinearProgress variant="determinate" value={budgetPercent} sx={{ height: 8 }} />
            <Typography sx={helperText}>{formatCurrency(summary.remaining)} remaining</Typography>
          </Box>
        </Card>

        <Card sx={panelCard}>
          <Typography sx={panelTitle}>Vendor split</Typography>
          <Typography sx={panelSubtitle}>A category-level look at where vendor costs are concentrated.</Typography>
          <Suspense fallback={<ChartFallback height={240} />}>
            <BudgetVendorChart data={chartData} />
          </Suspense>
        </Card>
      </Box>
    </Box>
  );
}

function MetricCard({ title, value, accent }) {
  return (
    <Card sx={metricCard}>
      <Typography sx={metricLabel}>{title}</Typography>
      <Typography sx={{ ...metricValue, color: accent || "#f5f7ff" }}>{value}</Typography>
    </Card>
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

const pageTitle = {
  maxWidth: 780,
  fontSize: { xs: 24, md: 30 },
  lineHeight: 1.04,
  letterSpacing: "-0.05em",
  fontWeight: 800,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
  gap: 1.25,
  mb: 1.25,
};

const metricCard = {
  p: 1.35,
  borderRadius: 4,
};

const metricLabel = {
  fontSize: 11,
  color: "text.secondary",
};

const metricValue = {
  mt: 0.85,
  fontSize: 28,
  lineHeight: 1,
  letterSpacing: "-0.05em",
  fontWeight: 800,
};

const contentGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "0.95fr 1.2fr" },
  gap: 1.25,
};

const panelCard = {
  p: 1.5,
  borderRadius: 4,
};

const panelTitle = {
  fontSize: 14,
  fontWeight: 700,
};

const panelSubtitle = {
  mt: 0.45,
  fontSize: 11.5,
  color: "text.secondary",
};

const usageShell = {
  mt: 1.5,
  p: 1.25,
  borderRadius: 3,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const helperText = {
  mt: 0.85,
  fontSize: 11.5,
  color: "text.secondary",
};
