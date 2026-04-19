import { Box, Card, Chip, LinearProgress, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatCurrency } from "../utils/eventSelectors";

export default function EventCard({ event, summary, vendorCount = 0 }) {
  const navigate = useNavigate();

  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.18 }}>
      <Card onClick={() => navigate(`/events/${event.id}`)} sx={card}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography sx={titleText}>{event.name}</Typography>
            <Typography sx={metaText}>{event.venue}</Typography>
          </Box>
          <Chip label={event.status} size="small" sx={statusChip(event.status)} />
        </Box>

        <Typography sx={{ ...metaText, mt: 0.6 }}>
          {dayjs(event.date).format("DD MMM YYYY")}
        </Typography>

        {event.notes ? (
          <Typography sx={{ ...metaText, mt: 0.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {event.notes}
          </Typography>
        ) : null}

        <Box sx={metricRow}>
          <Metric label="Budget" value={formatCurrency(event.budget)} />
          <Metric label="Spent" value={formatCurrency(summary.spent)} />
          <Metric label="Vendors" value={vendorCount} />
          <Metric label="Contacts" value={event.contacts.length} />
        </Box>

        <Box mt={1.2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.45 }}>
            <Typography sx={labelText}>Progress</Typography>
            <Typography sx={valueText}>{summary.overallProgress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={summary.overallProgress} sx={{ height: 6 }} />
        </Box>
      </Card>
    </motion.div>
  );
}

function Metric({ label, value }) {
  return (
    <Box>
      <Typography sx={labelText}>{label}</Typography>
      <Typography sx={valueText}>{value}</Typography>
    </Box>
  );
}

const card = {
  p: 1.2,
  cursor: "pointer",
  borderRadius: 2,
  background: "rgba(13, 22, 38, 0.92)",
  border: "1px solid rgba(148,163,184,0.14)",
  transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
  "&:hover": {
    borderColor: "rgba(129,140,248,0.24)",
    boxShadow: "0 12px 24px rgba(2, 6, 23, 0.22)",
  },
};

const metricRow = {
  mt: 1.1,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 0.8,
};

const titleText = {
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "-0.02em",
};

const metaText = {
  color: "text.secondary",
  fontSize: 11,
};

const labelText = {
  color: "text.secondary",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const valueText = {
  fontWeight: 600,
  fontSize: 11.5,
};

const statusChip = (status) => ({
  background:
    status === "Live"
      ? "rgba(34,197,94,0.18)"
      : status === "Planning"
      ? "rgba(251,191,36,0.18)"
      : "rgba(96,165,250,0.18)",
  color:
    status === "Live"
      ? "#bbf7d0"
      : status === "Planning"
      ? "#fde68a"
      : "#bfdbfe",
  border: "1px solid rgba(255,255,255,0.06)",
});
