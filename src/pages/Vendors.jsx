import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import EmptyState from "../components/EmptyState";
import { useEvents } from "../hooks/useEvents";
import { useVendors } from "../hooks/useVendors";
import { useAuth } from "../context/auth-context";
import { supabase } from "../lib/supabaseClient";
import {
  buildVendorInsertPayload,
  insertActivityRecord,
  normalizeVendorRow,
  VENDOR_SELECT_FIELDS,
} from "../lib/eventData";

const STATUS_OPTIONS = ["Quoted", "Confirmed", "Paid"];

const initialForm = {
  eventId: "",
  name: "",
  category: "",
  email: "",
  phone: "",
  cost: "",
  status: "Quoted",
};

export default function Vendors() {
  const { user, permissions } = useAuth();
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [dialogMode, setDialogMode] = useState("create");
  const [form, setForm] = useState(initialForm);
  const [editingVendor, setEditingVendor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const scopedEventId = selectedEvent === "all" ? undefined : selectedEvent;
  const currentEvent = events.find((event) => String(event.id) === String(scopedEventId)) || null;
  const {
    vendors,
    loading,
    error,
    createVendor,
    updateVendor,
    updateVendorStatus,
    deleteVendor,
    refresh,
  } = useVendors(scopedEventId, currentEvent);

  const eventMap = useMemo(
    () =>
      events.reduce((accumulator, event) => {
        accumulator[event.id] = event;
        return accumulator;
      }, {}),
    [events]
  );

  const filteredVendors = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const matchesSearch =
        !searchTerm ||
        vendor.name.toLowerCase().includes(searchTerm) ||
        vendor.contactName.toLowerCase().includes(searchTerm) ||
        vendor.email.toLowerCase().includes(searchTerm) ||
        vendor.phone.toLowerCase().includes(searchTerm) ||
        vendor.category.toLowerCase().includes(searchTerm);

      const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, vendors]);

  const totals = useMemo(() => {
    return filteredVendors.reduce(
      (summary, vendor) => {
        summary.total += vendor.cost;
        summary[vendor.status] = (summary[vendor.status] || 0) + 1;
        return summary;
      },
      { total: 0, Quoted: 0, Confirmed: 0, Paid: 0 }
    );
  }, [filteredVendors]);

  const handleFormChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingVendor(null);
    setForm({
      ...initialForm,
      eventId: selectedEvent === "all" ? events[0]?.id || "" : selectedEvent,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (vendor) => {
    setDialogMode("edit");
    setEditingVendor(vendor);
    setForm({
      eventId: vendor.eventId,
      name: vendor.name,
      category: vendor.category,
      email: vendor.email,
      phone: vendor.phone,
      cost: String(vendor.cost || ""),
      status: vendor.status,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingVendor(null);
    setForm(initialForm);
  };

  const createVendorForAnyEvent = async (payload, eventId) => {
    const event = eventMap[eventId];

    if (!event || !user) {
      throw new Error("Select a valid event before creating a vendor.");
    }

    const { data, error: insertError } = await supabase
      .from("vendors")
      .insert(buildVendorInsertPayload(payload, event, user))
      .select(VENDOR_SELECT_FIELDS)
      .single();

    if (insertError) {
      throw insertError;
    }

    const normalized = normalizeVendorRow(data);

    try {
      await insertActivityRecord({
        event_id: normalized.eventId,
        organization_id: normalized.organizationId,
        user_id: user.id,
        type: "VENDOR_CREATED",
        message: "Vendor added",
        metadata: {
          vendorId: normalized.id,
          name: normalized.name,
          status: normalized.status,
        },
      });
    } catch {
      // Avoid blocking vendor creation on audit logging failure.
    }

    await refresh();
    return normalized;
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || "General",
      contactName: "",
      email: form.email.trim(),
      phone: form.phone.trim(),
      cost: Number(form.cost) || 0,
      status: form.status,
      notes: "",
    };

    if (dialogMode === "edit" && editingVendor) {
      await updateVendor(editingVendor.id, payload);
      closeDialog();
      return;
    }

    if (!form.eventId) {
      return;
    }

    if (selectedEvent !== "all" && currentEvent) {
      await createVendor(payload);
    } else {
      await createVendorForAnyEvent(payload, form.eventId);
    }

    closeDialog();
  };

  const handleDelete = async (vendorId) => {
    await deleteVendor(vendorId);
  };

  const openStatusMenu = (event, vendor) => {
    setStatusAnchor(event.currentTarget);
    setStatusTarget(vendor);
  };

  const closeStatusMenu = () => {
    setStatusAnchor(null);
    setStatusTarget(null);
  };

  const handleStatusChange = async (nextStatus) => {
    if (!statusTarget) {
      return;
    }

    await updateVendorStatus(statusTarget.id, nextStatus);
    closeStatusMenu();
  };

  return (
    <Box sx={pageShell}>
      <Box sx={headerBlock}>
        <Typography sx={pageTitle}>Vendor Relationships</Typography>
        <Typography sx={pageSubtitle}>
          Manage vendor status, payment visibility, and contact access across your events.
        </Typography>
      </Box>

      <TextField
        select
        size="small"
        label="Select Event"
        value={selectedEvent}
        onChange={(event) => setSelectedEvent(event.target.value)}
        sx={eventField}
      >
        <MenuItem value="all">All Events</MenuItem>
        {events.map((event) => (
          <MenuItem key={event.id} value={event.id}>
            {event.name}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={toolbar}>
        <Box sx={searchShell}>
          <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vendors..."
            style={searchInput}
          />
        </Box>

        <Box sx={toolbarActions}>
          <Button
            variant="outlined"
            startIcon={<TuneRoundedIcon />}
            endIcon={<ExpandMoreRoundedIcon />}
            sx={toolbarButton}
            onClick={(event) => setFilterAnchor(event.currentTarget)}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            endIcon={<ExpandMoreRoundedIcon />}
            sx={addButton}
            onClick={openCreateDialog}
            disabled={!permissions.canManageVendors || events.length === 0}
          >
            Add Vendor
          </Button>
        </Box>
      </Box>

      <Card sx={tableShell}>
        <Box sx={tableHeader}>
          <Typography sx={{ ...columnHeader, flex: 1.9 }}>Vendor</Typography>
          <Typography sx={{ ...columnHeader, flex: 1 }}>Status</Typography>
          <Typography sx={{ ...columnHeader, flex: 1, textAlign: "right" }}>Cost</Typography>
          <Typography sx={{ ...columnHeader, flex: 1, textAlign: "right" }}>Paid Amount</Typography>
          <Typography sx={{ ...columnHeader, width: 168, textAlign: "right" }}>Actions</Typography>
        </Box>

        <Box sx={tableBody}>
          {loading ? (
            <Box sx={emptyShell}>
              <Typography sx={emptyTitle}>Loading vendors…</Typography>
            </Box>
          ) : error ? (
            <Box sx={emptyShell}>
              <Typography sx={emptyTitle}>Unable to load vendors</Typography>
              <Typography sx={emptyCopy}>{error}</Typography>
            </Box>
          ) : filteredVendors.length === 0 ? (
            <Box sx={emptyShell}>
              <EmptyState
                title="No vendors yet"
                subtitle="Add your first vendor to build this relationship table."
                actionLabel="Add Vendor"
                onAction={openCreateDialog}
              />
            </Box>
          ) : (
            filteredVendors.map((vendor) => {
              const eventName = eventMap[vendor.eventId]?.name || "Event";
              const paidAmount = vendor.status === "Paid" ? vendor.cost : 0;

              return (
                <Box key={vendor.id} sx={row}>
                  <Box sx={{ flex: 1.9, minWidth: 0 }}>
                    <Typography sx={vendorName}>{vendor.name}</Typography>
                    <Typography sx={vendorMeta}>
                      {vendor.category} / {vendor.contactName || eventName}
                    </Typography>
                    <Typography sx={vendorMeta}>{vendor.phone || vendor.email || "No contact details"}</Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={statusPill(vendor.status)}>{vendor.status}</Box>
                  </Box>

                  <Typography sx={{ ...amountText, flex: 1, textAlign: "right" }}>
                    {formatINR(vendor.cost)}
                  </Typography>

                  <Typography sx={{ ...amountText, flex: 1, textAlign: "right" }}>
                    {formatINR(paidAmount)}
                  </Typography>

                  <Box sx={rowActions}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SyncAltRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={rowButton}
                      onClick={(event) => openStatusMenu(event, vendor)}
                    >
                      Change
                    </Button>
                    <IconButton size="small" sx={iconButton} onClick={() => openEditDialog(vendor)}>
                      <EditOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" sx={iconButton} onClick={() => handleDelete(vendor.id)}>
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <ArrowForwardIosRoundedIcon sx={{ fontSize: 13, color: "rgba(226, 232, 240, 0.44)" }} />
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Card>

      <Box sx={statsRow}>
        <Card sx={statCard}>
          <Typography sx={statLabel}>Total Spend</Typography>
          <Typography sx={statValue}>{formatINR(totals.total)}</Typography>
        </Card>
        <Card sx={statCard}>
          <Typography sx={statLabel}>Quoted</Typography>
          <Typography sx={statValue}>{totals.Quoted}</Typography>
        </Card>
        <Card sx={statCard}>
          <Typography sx={statLabel}>Confirmed</Typography>
          <Typography sx={statValue}>{totals.Confirmed}</Typography>
        </Card>
        <Card sx={statCard}>
          <Typography sx={statLabel}>Paid</Typography>
          <Typography sx={statValue}>{totals.Paid}</Typography>
        </Card>
      </Box>

      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
        MenuListProps={{ dense: true }}
      >
        <MenuItem
          selected={statusFilter === "all"}
          onClick={() => {
            setStatusFilter("all");
            setFilterAnchor(null);
          }}
        >
          All statuses
        </MenuItem>
        {STATUS_OPTIONS.map((status) => (
          <MenuItem
            key={status}
            selected={statusFilter === status}
            onClick={() => {
              setStatusFilter(status);
              setFilterAnchor(null);
            }}
          >
            {status}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={statusAnchor} open={Boolean(statusAnchor)} onClose={closeStatusMenu}>
        {STATUS_OPTIONS.map((status) => (
          <MenuItem
            key={status}
            selected={statusTarget?.status === status}
            onClick={() => handleStatusChange(status)}
          >
            {status}
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === "edit" ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.2, pt: "10px !important" }}>
          {selectedEvent === "all" && dialogMode === "create" ? (
            <TextField
              select
              label="Event"
              size="small"
              value={form.eventId}
              onChange={handleFormChange("eventId")}
            >
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

          <TextField label="Vendor name" size="small" value={form.name} onChange={handleFormChange("name")} />
          <TextField label="Category" size="small" value={form.category} onChange={handleFormChange("category")} />
          <TextField label="Email" size="small" value={form.email} onChange={handleFormChange("email")} />
          <TextField label="Mobile number" size="small" value={form.phone} onChange={handleFormChange("phone")} />
          <TextField label="Budget" size="small" value={form.cost} onChange={handleFormChange("cost")} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button variant="outlined" onClick={closeDialog}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            {dialogMode === "edit" ? "Save Changes" : "Add Vendor"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

const pageShell = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
  maxWidth: 1240,
  marginInline: "auto",
  pr: 0.5,
  pb: 2,
};

const headerBlock = {
  mb: 1.4,
};

const pageTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: "text.primary",
};

const pageSubtitle = {
  mt: 0.35,
  fontSize: 13,
  color: "text.secondary",
};

const eventField = {
  width: 252,
  mb: 1.5,
};

const toolbar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1,
  mb: 1.2,
  flexWrap: "wrap",
};

const searchShell = (theme) => ({
  minWidth: 320,
  flex: 1,
  height: 46,
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: 1.2,
  borderRadius: 2.5,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
});

const searchInput = (theme) => ({
  flex: 1,
  outline: "none",
  border: "none",
  background: "transparent",
  color: theme.palette.text.primary,
  fontSize: "13px",
});

const toolbarActions = {
  display: "flex",
  alignItems: "center",
  gap: 0.9,
  flexWrap: "wrap",
};

const toolbarButton = {
  minHeight: 46,
  px: 1.4,
};

const addButton = {
  minHeight: 46,
  px: 1.55,
};

const tableShell = (theme) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 3,
  overflow: "hidden",
  boxShadow:
    theme.palette.mode === "light"
      ? "0 14px 30px rgba(15, 23, 42, 0.08)"
      : "0 14px 30px rgba(2, 6, 23, 0.16)",
});

const tableHeader = (theme) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.2,
  px: 2.1,
  py: 1.35,
  borderBottom: `1px solid ${theme.palette.divider}`,
});

const columnHeader = {
  fontSize: 12,
  color: "text.secondary",
};

const tableBody = {
  display: "flex",
  flexDirection: "column",
};

const row = (theme) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.2,
  px: 2.1,
  py: 1.45,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
  "&:last-of-type": {
    borderBottom: "none",
  },
});

const vendorName = {
  fontSize: 14,
  fontWeight: 700,
  color: "text.primary",
};

const vendorMeta = {
  mt: 0.2,
  fontSize: 12,
  color: "text.secondary",
};

const amountText = {
  fontSize: 14,
  fontWeight: 600,
  color: "text.primary",
};

const rowActions = {
  width: 168,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 0.55,
  flexShrink: 0,
};

const rowButton = {
  minHeight: 34,
  px: 1.1,
  fontSize: 12,
};

const iconButton = (theme) => ({
  width: 32,
  height: 32,
  borderRadius: 2,
  color: theme.palette.text.secondary,
  background: theme.palette.mode === "light" ? alpha(theme.palette.primary.main, 0.04) : "#0c1421",
  border: `1px solid ${theme.palette.divider}`,
});

const emptyShell = {
  p: 3.2,
};

const emptyTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: "text.primary",
};

const emptyCopy = {
  mt: 0.4,
  fontSize: 12,
  color: "text.secondary",
};

const statsRow = {
  mt: 1.2,
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr 1fr",
    lg: "repeat(4, minmax(0, 1fr))",
  },
  gap: 1,
};

const statCard = (theme) => ({
  p: 1.2,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 2.8,
});

const statLabel = {
  fontSize: 12,
  color: "text.secondary",
};

const statValue = {
  mt: 0.45,
  fontSize: 18,
  fontWeight: 700,
  color: "text.primary",
};

const statusPill = (status) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 96,
  px: 1.1,
  py: 0.55,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  color:
    status === "Paid" ? "#71e3c6" : status === "Confirmed" ? "#b49bff" : "#f2ca87",
  background:
    status === "Paid" ? "#112922" : status === "Confirmed" ? "#1f1933" : "#2c2319",
  border:
    status === "Paid"
      ? "1px solid rgba(88, 216, 183, 0.14)"
      : status === "Confirmed"
      ? "1px solid rgba(180, 155, 255, 0.14)"
      : "1px solid rgba(242, 202, 135, 0.14)",
});
