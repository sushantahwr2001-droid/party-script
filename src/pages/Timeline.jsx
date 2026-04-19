import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Button, Card, Chip, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { buildCalendarItems } from "../utils/eventSelectors";
import { groupByEventId } from "../lib/eventData";

export default function Timeline() {
  const { events } = useEvents();
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(dayjs().format("YYYY-MM-DD"));
  const calendarItems = useMemo(() => buildCalendarItems(events, groupByEventId(tasks)), [events, tasks]);

  const monthStart = useMemo(() => dayjs().startOf("month").add(monthOffset, "month"), [monthOffset]);
  const monthEnd = monthStart.endOf("month");
  const startWeek = monthStart.startOf("week");
  const endWeek = monthEnd.endOf("week");

  const days = [];
  let cursor = startWeek;
  while (cursor.isBefore(endWeek) || cursor.isSame(endWeek, "day")) {
    days.push(cursor);
    cursor = cursor.add(1, "day");
  }

  const selectedItems = calendarItems
    .filter((item) => dayjs(item.date).format("YYYY-MM-DD") === selectedDay)
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

  const upcoming = [...calendarItems]
    .filter((item) => dayjs(item.date).isAfter(dayjs().subtract(1, "day"), "day"))
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    .slice(0, 6);

  return (
    <Box sx={pageShell}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "flex-start", lg: "center" }, justifyContent: "space-between", mb: 1.25 }}
      >
        <Box>
          <Typography sx={eyebrow}>Calendar</Typography>
          <Typography sx={pageTitle}>Track event dates and task deadlines across the month.</Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => setMonthOffset((value) => value - 1)}>
            Previous
          </Button>
          <Button size="small" variant="outlined" onClick={() => setMonthOffset(0)}>
            Today
          </Button>
          <Button size="small" variant="outlined" onClick={() => setMonthOffset((value) => value + 1)}>
            Next
          </Button>
        </Stack>
      </Stack>

      <Box sx={calendarLayout}>
        <Card sx={calendarCard}>
          <Typography sx={panelTitle}>{monthStart.format("MMMM YYYY")}</Typography>

          <Box sx={weekHeader}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <Typography key={label} sx={weekLabel}>
                {label}
              </Typography>
            ))}
          </Box>

          <Box sx={calendarGrid}>
            {days.map((day) => {
              const dayKey = day.format("YYYY-MM-DD");
              const dayItems = calendarItems.filter((item) => dayjs(item.date).format("YYYY-MM-DD") === dayKey);
              const isCurrentMonth = day.isSame(monthStart, "month");
              const isToday = day.isSame(dayjs(), "day");
              const isSelected = selectedDay === dayKey;

              return (
                <Box key={dayKey} sx={dayCell(isCurrentMonth, isToday, isSelected)} onClick={() => setSelectedDay(dayKey)}>
                  <Typography sx={dayLabel(isCurrentMonth, isToday)}>{day.format("D")}</Typography>
                  <Box sx={{ display: "flex", gap: 0.35, flexWrap: "wrap" }}>
                    {dayItems.slice(0, 4).map((item) => (
                      <Box key={item.id} sx={dot(item.type)} title={item.title} />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Card>

        <Card sx={calendarCard}>
          <Typography sx={panelTitle}>Upcoming schedule</Typography>
          <Stack spacing={0.85} mt={1.2}>
            {upcoming.map((item) => (
              <Box key={item.id} sx={upcomingRow} onClick={() => navigate(`/events/${item.eventId}`)}>
                <Box>
                  <Typography fontWeight={700} fontSize={13}>
                    {item.title}
                  </Typography>
                  <Typography sx={captionText}>{dayjs(item.date).format("DD MMM YYYY")}</Typography>
                </Box>
                <Chip label={item.type === "event" ? "Event" : "Task"} size="small" />
              </Box>
            ))}
          </Stack>

          <Typography sx={{ ...panelTitle, mt: 2 }}>Selected day</Typography>
          <Stack spacing={0.85} mt={1.2}>
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <Box key={item.id} sx={upcomingRow} onClick={() => navigate(`/events/${item.eventId}`)}>
                  <Box>
                    <Typography fontWeight={700} fontSize={13}>
                      {item.title}
                    </Typography>
                    <Typography sx={captionText}>
                      {item.type === "event" ? "Event date" : item.stage || "Task"}
                    </Typography>
                  </Box>
                  <Box sx={dot(item.type)} />
                </Box>
              ))
            ) : (
              <Typography sx={captionText}>No items on this day.</Typography>
            )}
          </Stack>
        </Card>
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
  maxWidth: 680,
  fontSize: { xs: 24, md: 30 },
  lineHeight: 1.04,
  letterSpacing: "-0.05em",
  fontWeight: 800,
};

const calendarLayout = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", xl: "1.5fr 0.9fr" },
  gap: 1.25,
};

const calendarCard = {
  p: 1.35,
  borderRadius: 4,
};

const panelTitle = {
  fontSize: 14,
  fontWeight: 700,
};

const weekHeader = {
  mt: 1.1,
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 0.6,
  mb: 0.6,
};

const weekLabel = {
  color: "text.secondary",
  fontSize: 10.5,
  textTransform: "uppercase",
  textAlign: "center",
  letterSpacing: "0.08em",
};

const calendarGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 0.6,
};

const dayCell = (isCurrentMonth, isToday, isSelected) => ({
  aspectRatio: "1 / 1",
  p: 0.8,
  borderRadius: 2.5,
  border: isSelected
    ? "1px solid rgba(95,111,255,0.32)"
    : "1px solid rgba(255,255,255,0.04)",
  background: isCurrentMonth ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
  boxShadow: isToday ? "inset 0 0 0 1px rgba(85,183,255,0.28)" : "none",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
});

const dayLabel = (isCurrentMonth, isToday) => ({
  fontSize: 11.5,
  fontWeight: 700,
  color: isToday ? "#8fd4ff" : isCurrentMonth ? "#f5f7ff" : "#6f7280",
});

const dot = (type) => ({
  width: 8,
  height: 8,
  borderRadius: 999,
  background: type === "event" ? "#5f6fff" : "#2ec27e",
});

const upcomingRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  p: 1,
  borderRadius: 3,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
  cursor: "pointer",
};

const captionText = {
  fontSize: 11.5,
  color: "text.secondary",
};
