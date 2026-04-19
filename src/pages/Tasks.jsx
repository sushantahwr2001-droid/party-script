import { useEffect, useState } from "react";
import { Box, Card, Chip, MenuItem, TextField, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { TASK_STAGES } from "../lib/eventData";

export default function Tasks() {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (events.length > 0) {
      setSelectedEvent(events[0].id);
    }
  }, [events]);

  const currentEvent = events.find((event) => String(event.id) === String(selectedEvent)) || null;
  const { tasks } = useTasks(currentEvent?.id);

  return (
    <Box sx={pageShell}>
      <Typography sx={pageTitle}>Tasks</Typography>
      <Typography sx={pageSubtitle}>Flexible execution tasks across general, pre-event, live, and follow-up work.</Typography>

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

      <Box sx={grid}>
        {TASK_STAGES.map((stage) => {
          const stageTasks = tasks.filter((task) => task.stage === stage);

          return (
            <Card key={stage} sx={card}>
              <Typography sx={sectionTitle}>{stage}</Typography>
              <Box mt={0.8} sx={taskScrollArea}>
                {stageTasks.map((task) => (
                  <Box key={task.id} sx={taskRow}>
                    <Box>
                      <Typography sx={taskTitle}>{task.title}</Typography>
                      <Typography sx={captionText}>{dayjs(task.dueDate).format("DD MMM YYYY")}</Typography>
                    </Box>
                    <Chip label={task.done ? "Done" : "Open"} size="small" sx={task.done ? doneChip : openChip} />
                  </Box>
                ))}
              </Box>
            </Card>
          );
        })}
      </Box>
    </Box>
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
const grid = { display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1, flex: 1, overflow: "hidden" };
const card = { p: 1.1, borderRadius: 2.5, display: "flex", flexDirection: "column", minHeight: 0 };
const sectionTitle = { fontSize: 11.5, fontWeight: 600 };
const taskRow = { display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", p: 0.8, borderRadius: 2, background: "rgba(8,15,30,0.58)" };
const taskScrollArea = { display: "grid", gap: 0.7, flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", pr: 0.25 };
const taskTitle = { fontSize: 11, fontWeight: 600, lineHeight: 1.2 };
const captionText = { fontSize: 11, color: "text.secondary" };
const doneChip = { background: "rgba(34,197,94,0.18)", color: "#bbf7d0" };
const openChip = { background: "rgba(251,191,36,0.18)", color: "#fde68a" };
