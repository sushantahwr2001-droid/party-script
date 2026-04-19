import { Box, Card, Chip, IconButton, LinearProgress, Typography } from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/eventSelectors";

export default function EventCard({ event, summary, vendorCount = 0, onDelete = null }) {
  const navigate = useNavigate();

  return (
    <Card onClick={() => navigate(`/events/${event.id}`)} sx={card}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.2, alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={titleText}>{event.name}</Typography>
          <Typography sx={metaText}>
            {dayjs(event.date).format("DD MMM YYYY")} / {event.venue}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.6, alignItems: "center", flexShrink: 0 }}>
          <Chip label={event.status} size="small" sx={statusChip(event.status)} />
          {onDelete ? (
            <IconButton
              size="small"
              onClick={(eventObject) => {
                eventObject.stopPropagation();
                onDelete(event);
              }}
              sx={deleteButton}
            >
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          ) : null}
        </Box>
      </Box>

      {event.notes ? (
        <Typography sx={noteText}>
          {event.notes}
        </Typography>
      ) : null}

      <Box sx={metricGrid}>
        <Metric label="Budget" value={formatCurrency(event.budget)} />
        <Metric label="Spend" value={formatCurrency(summary.spent)} />
        <Metric label="Vendors" value={vendorCount} />
        <Metric label="Tasks" value={summary.taskCount} />
      </Box>

      <Box sx={progressRow}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.55 }}>
            <Typography sx={labelText}>Progress</Typography>
            <Typography sx={valueText}>{summary.overallProgress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={summary.overallProgress} sx={{ height: 7 }} />
        </Box>

        <IconButton
          size="small"
          sx={openButton}
          onClick={(eventObject) => {
            eventObject.stopPropagation();
            navigate(`/events/${event.id}`);
          }}
        >
          <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <Box sx={metricItem}>
      <Typography sx={labelText}>{label}</Typography>
      <Typography sx={valueText}>{value}</Typography>
    </Box>
  );
}

const card = {
  p: 1.4,
  borderRadius: 4,
  cursor: "pointer",
  transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    borderColor: "rgba(95,111,255,0.2)",
    background: "linear-gradient(180deg, rgba(36,34,42,0.98), rgba(30,28,35,0.98))",
  },
};

const titleText = {
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.15,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const metaText = {
  mt: 0.45,
  fontSize: 11.5,
  color: "text.secondary",
};

const noteText = {
  mt: 1,
  fontSize: 12,
  color: "rgba(240,243,252,0.74)",
  lineHeight: 1.6,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const metricGrid = {
  mt: 1.3,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 0.8,
};

const metricItem = {
  p: 0.95,
  borderRadius: 2.5,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const progressRow = {
  mt: 1.3,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const labelText = {
  fontSize: 10.5,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const valueText = {
  mt: 0.4,
  fontSize: 13,
  fontWeight: 700,
};

const statusChip = (status) => ({
  background:
    status === "Live"
      ? "rgba(46,194,126,0.14)"
      : status === "Planning"
        ? "rgba(245,159,76,0.14)"
        : "rgba(85,183,255,0.14)",
  color:
    status === "Live"
      ? "#99efc5"
      : status === "Planning"
        ? "#ffd6a0"
        : "#b9e5ff",
});

const deleteButton = {
  width: 30,
  height: 30,
  border: "1px solid rgba(239,106,106,0.16)",
  background: "rgba(239,106,106,0.08)",
  color: "#ffb0b0",
  "&:hover": {
    background: "rgba(239,106,106,0.14)",
  },
};

const openButton = {
  width: 34,
  height: 34,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
};
