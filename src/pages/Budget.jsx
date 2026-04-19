import { Suspense, lazy, useEffect, useState } from "react";
import { Box, Card, LinearProgress, MenuItem, TextField, Typography } from "@mui/material";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { useVendors } from "../hooks/useVendors";
import { buildEventSummary, formatCurrency } from "../utils/eventSelectors";
import ChartFallback from "../components/ChartFallback";

const BudgetVendorChart = lazy(() => import("../components/BudgetVendorChart"));

export default function Budget() {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (events.length > 0) {
      setSelectedEvent(events[0].id);
    }
  }, [events]);

  const currentEvent = events.find((event) => String(event.id) === String(selectedEvent)) || null;
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

  return (
    <Box sx={pageShell}>
      <Typography sx={pageTitle}>Budget clarity</Typography>
      <Typography sx={pageSubtitle}>Compact spend visibility for the selected event.</Typography>

      <TextField
        select
        size="small"
        label="Select Event"
        value={selectedEvent || ""}
        onChange={(event) => setSelectedEvent(event.target.value)}
        sx={{ mt: 1, mb: 1, width: 240 }}
      >
        {events.map((event) => (
          <MenuItem key={event.id} value={event.id}>
            {event.name}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={statsGrid}>
        <MetricCard title="Allocated" value={formatCurrency(currentEvent.budget)} />
        <MetricCard title="Spent" value={formatCurrency(summary.spent)} />
        <MetricCard title="Remaining" value={formatCurrency(summary.remaining)} color={summary.remaining >= 0 ? "#4ade80" : "#f87171"} />
      </Box>

      <Box sx={contentGrid}>
        <Card sx={card}>
          <Typography sx={sectionTitle}>Usage</Typography>
          <LinearProgress variant="determinate" value={Math.min(100, (summary.spent / currentEvent.budget) * 100)} sx={{ mt: 1, height: 6 }} />
          <Typography sx={captionText} mt={0.6}>
            {Math.round((summary.spent / currentEvent.budget) * 100)}% committed
          </Typography>
        </Card>

        <Card sx={card}>
          <Typography sx={sectionTitle}>Vendor split</Typography>
          <Suspense fallback={<ChartFallback height={160} />}>
            <BudgetVendorChart data={chartData} />
          </Suspense>
        </Card>
      </Box>
    </Box>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <Card sx={card}>
      <Typography sx={labelText}>{title}</Typography>
      <Typography sx={{ ...valueText, color: color || "#f8fafc" }}>{value}</Typography>
    </Card>
  );
}

const pageShell = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  maxWidth: 1100,
  marginInline: "auto",
};

const pageTitle = { fontSize: 12.5, fontWeight: 600 };
const pageSubtitle = { fontSize: 11, color: "text.secondary", mt: 0.25 };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1, marginBottom: 1 };
const contentGrid = { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 1, flex: 1, overflow: "hidden" };
const card = { p: 1.1, borderRadius: 2.5 };
const sectionTitle = { fontSize: 11.5, fontWeight: 600 };
const labelText = { fontSize: 10, color: "text.secondary", textTransform: "uppercase" };
const valueText = { fontSize: 13, fontWeight: 650, mt: 0.35 };
const captionText = { fontSize: 11, color: "text.secondary" };
