import { Avatar, Box, Card, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { TASK_STAGES } from "../lib/eventData";

const stageThemes = {
  General: {
    accent: "#7280ff",
    tone: "rgba(114, 128, 255, 0.16)",
  },
  "Pre-Event": {
    accent: "#ff8a2a",
    tone: "rgba(255, 138, 42, 0.16)",
  },
  "Event Day": {
    accent: "#33d0d6",
    tone: "rgba(51, 208, 214, 0.16)",
  },
  "Post-Event": {
    accent: "#5bb4ff",
    tone: "rgba(91, 180, 255, 0.16)",
  },
};

export default function Tasks() {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState("");
  const activeEventId = selectedEvent || events[0]?.id || "";
  const currentEvent = events.find((event) => String(event.id) === String(activeEventId)) || null;
  const { tasks } = useTasks(currentEvent?.id);

  const summary = useMemo(() => {
    const done = tasks.filter((task) => task.done).length;
    return {
      total: tasks.length,
      done,
      open: tasks.length - done,
    };
  }, [tasks]);

  return (
    <Box sx={pageShell}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", mb: 1.25 }}
      >
        <Box>
          <Typography sx={eyebrow}>Task workspace</Typography>
          <Typography sx={pageTitle}>Task Board</Typography>
          <Typography sx={pageSubtitle}>
            Manage tasks across event stages. {summary.total} total / {summary.open} open / {summary.done} completed
          </Typography>
        </Box>

        <TextField
          select
          size="small"
          label="Select Event"
          value={activeEventId}
          onChange={(event) => setSelectedEvent(event.target.value)}
          sx={{ width: 280 }}
        >
          {events.map((event) => (
            <MenuItem key={event.id} value={event.id}>
              {event.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={boardGrid}>
        {TASK_STAGES.map((stage) => {
          const stageTasks = tasks.filter((task) => task.stage === stage);
          const stageDone = stageTasks.filter((task) => task.done).length;
          const theme = stageThemes[stage] || stageThemes.General;

          return (
            <Card key={stage} sx={columnCard}>
              <Box sx={stageHeader(theme.accent, theme.tone)}>
                <Box>
                  <Typography sx={stageTitle}>{stage}</Typography>
                  <Typography sx={stageMeta}>
                    {stageDone}/{stageTasks.length} completed
                  </Typography>
                </Box>
                <Typography sx={stageCount(theme.accent)}>{stageTasks.length}</Typography>
              </Box>

              <Box sx={taskList}>
                {stageTasks.map((task) => (
                  <TaskCard key={task.id} task={task} accent={theme.accent} />
                ))}

                {stageTasks.length === 0 ? (
                  <Box sx={emptyCard}>
                    <Typography sx={emptyTitle}>No tasks here yet</Typography>
                    <Typography sx={emptyMeta}>This stage is currently clear.</Typography>
                  </Box>
                ) : null}
              </Box>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

function TaskCard({ task, accent }) {
  const initials = (task.assignee || task.title || "PS")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box sx={taskCard}>
      <Stack direction="row" spacing={1.2} sx={{ alignItems: "flex-start" }}>
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontSize: 12,
            fontWeight: 800,
            background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.12))`,
            color: "#f7f9ff",
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={taskTitle}>{task.title}</Typography>
          <Typography sx={taskSubtitle}>{task.assignee || "Unassigned task owner"}</Typography>

          <Stack direction="row" spacing={0.65} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.65 }}>
            <Chip label={task.priority} size="small" sx={priorityChip(task.priority)} />
            <Chip label={task.done ? "Done" : "Open"} size="small" sx={task.done ? doneChip : openChip} />
            <Chip label={dayjs(task.dueDate).format("DD MMM")} size="small" sx={dateChip} />
          </Stack>

          {task.notes ? (
            <Typography sx={noteText}>
              {task.notes}
            </Typography>
          ) : null}
        </Box>
      </Stack>
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

const pageSubtitle = {
  mt: 0.55,
  fontSize: 12,
  color: "text.secondary",
};

const boardGrid = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    lg: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
  gap: 1.25,
  alignItems: "start",
};

const columnCard = {
  p: 1.15,
  borderRadius: 3.8,
  minHeight: 520,
  display: "flex",
  flexDirection: "column",
};

const stageHeader = (accent, tone) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  p: 1,
  borderRadius: 2.8,
  background: tone,
  border: "1px solid rgba(255,255,255,0.05)",
  mb: 1.1,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 0 1px ${tone}`,
});

const stageTitle = {
  fontSize: 14,
  fontWeight: 700,
};

const stageMeta = {
  mt: 0.35,
  fontSize: 11.5,
  color: "text.secondary",
};

const stageCount = (accent) => ({
  fontSize: 16,
  fontWeight: 800,
  color: accent,
});

const taskList = {
  display: "grid",
  gap: 0.9,
  alignContent: "start",
};

const taskCard = {
  p: 1.1,
  borderRadius: 2.8,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.05)",
  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
};

const taskTitle = {
  fontSize: 15,
  lineHeight: 1.15,
  letterSpacing: "-0.03em",
  fontWeight: 700,
};

const taskSubtitle = {
  mt: 0.35,
  fontSize: 12,
  color: "text.secondary",
};

const noteText = {
  mt: 1,
  fontSize: 11.5,
  color: "rgba(229, 232, 245, 0.72)",
  lineHeight: 1.65,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const emptyCard = {
  p: 1.1,
  borderRadius: 2.8,
  border: "1px dashed rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)",
};

const emptyTitle = {
  fontSize: 13,
  fontWeight: 700,
};

const emptyMeta = {
  mt: 0.35,
  fontSize: 11.5,
  color: "text.secondary",
};

const priorityChip = (priority) => ({
  background:
    priority === "High"
      ? "rgba(239,106,106,0.16)"
      : priority === "Medium"
        ? "rgba(255,173,87,0.16)"
        : "rgba(95,111,255,0.16)",
  color:
    priority === "High"
      ? "#fecaca"
      : priority === "Medium"
        ? "#ffd6a0"
        : "#cfd7ff",
});

const doneChip = {
  background: "rgba(46,194,126,0.16)",
  color: "#a7efcd",
};

const openChip = {
  background: "rgba(85,183,255,0.16)",
  color: "#bee6ff",
};

const dateChip = {
  background: "rgba(255,255,255,0.05)",
  color: "#d5dbee",
};
