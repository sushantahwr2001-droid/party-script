import { useEffect, useState } from "react";
import { Box, Card, Chip, MenuItem, TextField, Typography } from "@mui/material";
import { useEvents } from "../hooks/useEvents";
import { useVendors } from "../hooks/useVendors";

export default function Vendors() {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (events.length > 0) {
      setSelectedEvent(events[0].id);
    }
  }, [events]);

  const currentEvent = events.find((event) => String(event.id) === String(selectedEvent)) || null;
  const { vendors } = useVendors(currentEvent?.id);

  return (
    <Box sx={pageShell}>
      <Typography sx={pageTitle}>Vendor relationships</Typography>
      <Typography sx={pageSubtitle}>Compact vendor status and contact visibility.</Typography>

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

      <Box sx={vendorScrollArea}>
        {vendors.map((vendor) => (
          <Card key={vendor.id} sx={card}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <Box>
                <Typography sx={vendorTitle}>{vendor.name}</Typography>
                <Typography sx={captionText}>{vendor.category} / {vendor.contactName || "No contact"}</Typography>
                <Typography sx={captionText}>{vendor.email || "No email"} / {vendor.phone || "No phone"}</Typography>
              </Box>
              <Box textAlign="right">
                <Chip label={vendor.status} size="small" sx={chip(vendor.status)} />
                <Typography mt={0.5} fontWeight={700}>
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(vendor.cost)}
                </Typography>
              </Box>
            </Box>
          </Card>
        ))}
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
const card = { p: 1.1, borderRadius: 2.5 };
const vendorScrollArea = { display: "grid", gap: 0.8, flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", pr: 0.25 };
const vendorTitle = { fontSize: 11, fontWeight: 600, lineHeight: 1.2 };
const captionText = { fontSize: 11, color: "text.secondary" };
const chip = (status) => ({
  background:
    status === "Paid"
      ? "rgba(34,197,94,0.18)"
      : status === "Confirmed"
      ? "rgba(96,165,250,0.18)"
      : "rgba(251,191,36,0.18)",
  color:
    status === "Paid"
      ? "#bbf7d0"
      : status === "Confirmed"
      ? "#bfdbfe"
      : "#fde68a",
});
