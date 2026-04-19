import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Button, Card, Chip, Typography } from "@mui/material";
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
  const calendarItems = useMemo(
    () => buildCalendarItems(events, groupByEventId(tasks)),
    [events, tasks]
  );

  const monthStart = useMemo(
    () => dayjs().startOf("month").add(monthOffset, "month"),
    [monthOffset]
  );
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mb: 1,
        }}
      >
        <Box>
          <Typography sx={pageTitle}>Calendar</Typography>
          <Typography sx={pageSubtitle}>Monthly event and deadline visibility.</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Button size="small" variant="outlined" onClick={() => setMonthOffset((value) => value - 1)}>
            Previous
          </Button>
          <Button size="small" variant="outlined" onClick={() => setMonthOffset(0)}>
            Today
          </Button>
          <Button size="small" variant="outlined" onClick={() => setMonthOffset((value) => value + 1)}>
            Next
          </Button>
        </Box>
      </Box>

      <Box sx={calendarLayout}>
        <Card sx={calendarCard}>
          <Typography sx={sectionTitle}>{monthStart.format("MMMM YYYY")}</Typography>

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
                      <Box
                        key={item.id}
                        sx={dot(item.type)}
                        title={item.title}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Card>

        <Card sx={calendarCard}>
          <Typography sx={sectionTitle}>Upcoming schedule</Typography>
          <Box mt={0.8}>
            {upcoming.map((item) => (
              <Box key={item.id} sx={upcomingRow} onClick={() => navigate(`/events/${item.eventId}`)}>
                <Box>
                  <Typography fontWeight={700}>{item.title}</Typography>
                  <Typography sx={captionText}>{dayjs(item.date).format("DD MMM YYYY")}</Typography>
                </Box>
                <Chip label={item.type === "event" ? "Event" : "Task"} size="small" />
              </Box>
            ))}
          </Box>

          <Typography sx={{ ...sectionTitle, mt: 1.2 }}>Selected day</Typography>
          <Box mt={0.8}>
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <Box key={item.id} sx={upcomingRow} onClick={() => navigate(`/events/${item.eventId}`)}>
                  <Box>
                    <Typography fontWeight={700}>{item.title}</Typography>
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
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

const pageShell = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  maxWidth: 1260,
  marginInline: "auto",
};

const pageTitle = {
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "-0.02em",
};

const pageSubtitle = {
  color: "text.secondary",
  fontSize: 11,
  mt: 0.25,
};

const calendarLayout = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    xl: "2fr 0.95fr",
  },
  gap: 1,
  flex: 1,
  overflow: "hidden",
};

const calendarCard = {
  p: 1,
  borderRadius: 2.5,
  overflow: "hidden",
};

const sectionTitle = {
  fontSize: 11.5,
  fontWeight: 600,
};

const weekHeader = {
  mt: 0.8,
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 0.5,
  mb: 0.5,
};

const weekLabel = {
  color: "text.secondary",
  fontSize: 10,
  textTransform: "uppercase",
  textAlign: "center",
};

const calendarGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 0.45,
  flex: 1,
};

const dayCell = (isCurrentMonth, isToday, isSelected) => ({
  minHeight: 0,
  aspectRatio: "1 / 1",
  padding: 6,
  borderRadius: 1.5,
  border: isSelected
    ? "1px solid rgba(109,107,255,0.5)"
    : "1px solid rgba(148,163,184,0.08)",
  background: isCurrentMonth ? "rgba(8,15,30,0.58)" : "rgba(8,15,30,0.24)",
  cursor: "pointer",
  boxShadow: isToday ? "inset 0 0 0 1px rgba(56,189,248,0.28)" : "none",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  overflow: "hidden",
});

const dayLabel = (isCurrentMonth, isToday) => ({
  fontSize: 11,
  fontWeight: 700,
  marginBottom: 4,
  color: isToday ? "#7dd3fc" : isCurrentMonth ? "#f8fafc" : "#64748b",
});

const dot = (type) => ({
  width: 8,
  height: 8,
  borderRadius: 999,
  background: type === "event" ? "#60a5fa" : "#22c55e",
});

const upcomingRow = {
  p: 0.8,
  mb: 0.55,
  borderRadius: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  background: "rgba(8,15,30,0.58)",
  border: "1px solid rgba(148,163,184,0.08)",
  cursor: "pointer",
};

const captionText = {
  color: "text.secondary",
  fontSize: 11,
};
