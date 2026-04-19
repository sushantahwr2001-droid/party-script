import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EventCard from "../components/EventCard";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { useVendors } from "../hooks/useVendors";
import { useAuth } from "../context/auth-context";
import { groupByEventId } from "../lib/eventData";
import { buildEventSummary } from "../utils/eventSelectors";

export default function Events() {
  const { events, loading: eventsLoading, error: eventsError, createEvent, deleteEvent } = useEvents();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { vendors, loading: vendorsLoading, error: vendorsError } = useVendors();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    notes: "",
    budget: "",
  });

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

  const loading = eventsLoading || tasksLoading || vendorsLoading;
  const error = eventsError || tasksError || vendorsError;

  const stats = useMemo(
    () => ({
      total: events.length,
      live: events.filter((event) => event.status === "Live").length,
      planning: events.filter((event) => event.status === "Planning").length,
      avgProgress:
        events.length === 0
          ? 0
          : Math.round(
              events.reduce((sum, event) => sum + eventSummaries[event.id].overallProgress, 0) /
                events.length
            ),
    }),
    [events, eventSummaries]
  );

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date || !form.venue) {
      return;
    }

    setFormError("");

    try {
      await createEvent(form);
      setForm({
        name: "",
        date: "",
        venue: "",
        notes: "",
        budget: "",
      });
      setShowForm(false);
      setFeedback("Event workspace created");
    } catch (nextError) {
      setFormError(nextError.message);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteEvent(deleteTarget.id);
      setFeedback("Event deleted successfully");
    } catch (nextError) {
      setFeedback(nextError.message || "Event delete failed");
    } finally {
      setDeleteTarget(null);
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
          <Typography sx={eyebrow}>Event control</Typography>
          <Typography sx={pageTitle}>See every event workspace, status, progress, and budget in one place.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setShowForm(true)}>
          New event
        </Button>
      </Stack>

      <Box sx={summaryGrid}>
        <SummaryCard title="Total workspaces" value={stats.total} caption="Accessible event environments" />
        <SummaryCard title="Live events" value={stats.live} caption="Execution in progress" />
        <SummaryCard title="Planning" value={stats.planning} caption="Upcoming builds" />
        <SummaryCard title="Average progress" value={`${stats.avgProgress}%`} caption="Readiness across all events" />
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.25 }}>
          Unable to load events from Supabase: {error}
        </Alert>
      ) : null}

      {loading ? <LinearProgress sx={{ mb: 1.25 }} /> : null}

      <Box sx={grid}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            summary={eventSummaries[event.id]}
            vendorCount={(vendorsByEventId[event.id] || []).length}
            onDelete={user ? setDeleteTarget : null}
          />
        ))}
      </Box>

      <Dialog open={showForm} onClose={() => setShowForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create event</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1, pt: "10px !important" }}>
          <TextField autoFocus size="small" label="Event name" value={form.name} onChange={handleChange("name")} />
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
          {formError ? (
            <Typography fontSize={12} color="#f87171">
              {formError}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete event</DialogTitle>
        <DialogContent>
          <Typography fontSize={13} color="text.secondary">
            Delete {deleteTarget?.name}? This removes the event workspace and its related tasks,
            vendors, documents, and activity log.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteEvent}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2600}
        onClose={() => setFeedback("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setFeedback("")} severity="info" variant="filled" sx={{ width: "100%" }}>
          {feedback}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function SummaryCard({ title, value, caption }) {
  return (
    <Card sx={summaryCard}>
      <Typography sx={summaryLabel}>{title}</Typography>
      <Typography sx={summaryValue}>{value}</Typography>
      <Typography sx={summaryCaption}>{caption}</Typography>
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
  fontSize: { xs: 24, md: 32 },
  lineHeight: 1.04,
  letterSpacing: "-0.05em",
  fontWeight: 800,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
  gap: 1.25,
  mb: 1.25,
};

const summaryCard = {
  p: 1.35,
  borderRadius: 4,
};

const summaryLabel = {
  color: "text.secondary",
  fontSize: 11,
};

const summaryValue = {
  mt: 0.85,
  fontSize: 30,
  lineHeight: 1,
  letterSpacing: "-0.05em",
  fontWeight: 800,
};

const summaryCaption = {
  color: "text.secondary",
  fontSize: 11,
  mt: 0.7,
};

const grid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
  gap: 1.25,
};
