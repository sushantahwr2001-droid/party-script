import { useState } from "react";
import { Box, Card, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { TASK_STAGES } from "../lib/eventData";

export default function Tasks() {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState("");
  const activeEventId = selectedEvent || events[0]?.id || "";
  const currentEvent = events.find((event) => String(event.id) === String(activeEventId)) || null;
  const { tasks } = useTasks(currentEvent?.id);

  return (
    <Box sx={pageShell}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", mb: 1.25 }}
      >
        <Box>
          <Typography sx={eyebrow}>Task center</Typography>
          <Typography sx={pageTitle}>Track execution work by stage, due date, and completion.</Typography>
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

      <Box sx={grid}>
        {TASK_STAGES.map((stage) => {
          const stageTasks = tasks.filter((task) => task.stage === stage);

          return (
            <Card key={stage} sx={columnCard}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.1 }}>
                <Typography sx={sectionTitle}>{stage}</Typography>
                <Chip label={`${stageTasks.length} tasks`} size="small" />
              </Stack>

              <Box sx={taskList}>
                {stageTasks.map((task) => (
                  <Box key={task.id} sx={taskRow}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={taskTitle}>{task.title}</Typography>
                      <Typography sx={taskMeta}>
                        {dayjs(task.dueDate).format("DD MMM YYYY")} / {task.assignee || "Unassigned"}
                      </Typography>
                    </Box>
                    <Chip label={task.done ? "Done" : "Open"} size="small" sx={task.done ? doneChip : openChip} />
                  </Box>
                ))}

                {stageTasks.length === 0 ? (
                  <Typography sx={emptyText}>No tasks in this stage yet.</Typography>
                ) : null}
              </Box>
            </Card>
          );
        })}
      </Box>
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

const pageTitle = {
  maxWidth: 720,
  fontSize: { xs: 24, md: 30 },
  lineHeight: 1.04,
  letterSpacing: "-0.05em",
  fontWeight: 800,
};

const grid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
  gap: 1.25,
};

const columnCard = {
  p: 1.35,
  borderRadius: 4,
  minHeight: 380,
  display: "flex",
  flexDirection: "column",
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 700,
};

const taskList = {
  display: "grid",
  gap: 0.85,
};

const taskRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  p: 1,
  borderRadius: 3,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const taskTitle = {
  fontSize: 13,
  fontWeight: 700,
};

const taskMeta = {
  mt: 0.35,
  fontSize: 11.5,
  color: "text.secondary",
};

const emptyText = {
  fontSize: 12,
  color: "text.secondary",
  p: 1,
};

const doneChip = {
  background: "rgba(46,194,126,0.14)",
  color: "#99efc5",
};

const openChip = {
  background: "rgba(245,159,76,0.14)",
  color: "#ffd6a0",
};
