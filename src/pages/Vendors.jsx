import { useState } from "react";
import { Box, Card, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEvents } from "../hooks/useEvents";
import { useVendors } from "../hooks/useVendors";
import { formatCurrency } from "../utils/eventSelectors";

export default function Vendors() {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState("");
  const activeEventId = selectedEvent || events[0]?.id || "";
  const currentEvent = events.find((event) => String(event.id) === String(activeEventId)) || null;
  const { vendors } = useVendors(currentEvent?.id);

  return (
    <Box sx={pageShell}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", mb: 1.25 }}
      >
        <Box>
          <Typography sx={eyebrow}>Vendor desk</Typography>
          <Typography sx={pageTitle}>Manage partner status, contact points, and spend for each event.</Typography>
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

      <Card sx={tableCard}>
        <Box sx={tableHeader}>
          <Typography sx={headerCell}>Vendor</Typography>
          <Typography sx={headerCell}>Category</Typography>
          <Typography sx={headerCell}>Contact</Typography>
          <Typography sx={headerCell}>Cost</Typography>
          <Typography sx={headerCell}>Status</Typography>
        </Box>

        <Box sx={tableBody}>
          {vendors.map((vendor) => (
            <Box key={vendor.id} sx={tableRow}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={rowTitle}>{vendor.name}</Typography>
                <Typography sx={rowMeta}>{vendor.notes || "No notes"}</Typography>
              </Box>
              <Typography sx={rowText}>{vendor.category}</Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={rowText}>{vendor.contactName || "No contact"}</Typography>
                <Typography sx={rowMeta}>
                  {vendor.email || "No email"} / {vendor.phone || "No phone"}
                </Typography>
              </Box>
              <Typography sx={rowText}>{formatCurrency(vendor.cost)}</Typography>
              <Chip label={vendor.status} size="small" sx={chip(vendor.status)} />
            </Box>
          ))}

          {vendors.length === 0 ? (
            <Typography sx={emptyText}>No vendors for this event yet.</Typography>
          ) : null}
        </Box>
      </Card>
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

const tableCard = {
  p: 1.25,
  borderRadius: 4,
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.75fr 1fr 0.7fr 0.6fr",
  gap: 1,
  px: 1,
  py: 0.9,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const tableBody = {
  display: "grid",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.75fr 1fr 0.7fr 0.6fr",
  gap: 1,
  alignItems: "center",
  px: 1,
  py: 1.05,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const headerCell = {
  color: "text.secondary",
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const rowTitle = {
  fontSize: 13,
  fontWeight: 700,
};

const rowText = {
  fontSize: 12.5,
};

const rowMeta = {
  mt: 0.35,
  fontSize: 11.5,
  color: "text.secondary",
};

const emptyText = {
  p: 1.25,
  fontSize: 12,
  color: "text.secondary",
};

const chip = (status) => ({
  background:
    status === "Paid"
      ? "rgba(46,194,126,0.14)"
      : status === "Confirmed"
        ? "rgba(85,183,255,0.14)"
        : "rgba(245,159,76,0.14)",
  color:
    status === "Paid"
      ? "#99efc5"
      : status === "Confirmed"
        ? "#b9e5ff"
        : "#ffd6a0",
});
