import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  LinearProgress,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import EventWorkspaceLayout from "../layout/EventWorkspaceLayout";
import EmptyState from "../components/EmptyState";
import RouteFallback from "../components/RouteFallback";
import { useAuth } from "../context/auth-context";
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { useVendors } from "../hooks/useVendors";
import { useDocuments } from "../hooks/useDocuments";
import { useActivities } from "../hooks/useActivities";
import { buildEventSummary, formatCurrency } from "../utils/eventSelectors";

const TASK_STAGES = ["General", "Pre-Event", "Event Day", "Post-Event"];
const VISIBLE_LIMIT = 4;

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    events,
    loading: eventsLoading,
    addContact,
    deleteEvent,
    error: eventsError,
  } = useEvents();
  const event = events.find((item) => String(item.id) === String(id));
  const {
    tasks: eventTasks,
    loading: tasksLoading,
    createTask,
    toggleTask,
    updateTask,
    deleteTask,
    error: tasksError,
  } = useTasks(event?.id, event);
  const {
    vendors: eventVendors,
    loading: vendorsLoading,
    createVendor,
    updateVendor,
    updateVendorStatus,
    deleteVendor,
    error: vendorsError,
  } = useVendors(event?.id, event);
  const {
    documents: eventDocuments,
    loading: documentsLoading,
    upload,
    rename,
    replace,
    remove,
    error: documentsError,
  } = useDocuments(event?.id, event);
  const {
    activities: eventActivities,
    loading: activitiesLoading,
    error: activitiesError,
  } = useActivities(event?.id);
  const { permissions } = useAuth();
  const error = eventsError || tasksError || vendorsError || documentsError || activitiesError;
  const pageLoading =
    eventsLoading ||
    (Boolean(event?.id) && (tasksLoading || vendorsLoading || documentsLoading || activitiesLoading));
  const summary = event
    ? buildEventSummary(event, {
        tasksByEventId: { [event.id]: eventTasks },
        vendorsByEventId: { [event.id]: eventVendors },
      })
    : null;

  const [expanded, setExpanded] = useState({});
  const [drawerState, setDrawerState] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    stage: "General",
    priority: "Medium",
    dueDate: event?.date || "",
    assignee: "",
  });
  const [vendorForm, setVendorForm] = useState({
    name: "",
    category: "",
    contactName: "",
    email: "",
    phone: "",
    cost: "",
    status: "Quoted",
    notes: "",
  });
  const [contactForm, setContactForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [documentOpen, setDocumentOpen] = useState(false);
  const [documentCategory, setDocumentCategory] = useState("Contract");
  const [documentNotes, setDocumentNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [documentPreview, setDocumentPreview] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [taskEditTarget, setTaskEditTarget] = useState(null);
  const [vendorEditTarget, setVendorEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (pageLoading) {
    return <RouteFallback />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load this event"
        subtitle={`Supabase returned an error: ${error}`}
      />
    );
  }

  if (!event || !summary) {
    return (
      <EmptyState
        title="Event workspace not found"
        subtitle="This event may have been removed or the link is incorrect."
      />
    );
  }

  const tabs = [
    "Overview",
    "Contacts",
    "Vendors",
    "Budget",
    "Tasks",
    "Calendar",
    "Documents",
  ];

  const toggleExpanded = (key) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  const openQuickAction = (tab) => {
    if (tab === "Documents") {
      setDocumentOpen(true);
      return;
    }

    setDrawerState(tab);
  };

  const closeDrawer = () => {
    setDrawerState(null);
    setTaskForm({
      title: "",
      stage: "General",
      priority: "Medium",
      dueDate: event?.date || "",
      assignee: "",
      notes: "",
    });
    setVendorForm({
      name: "",
      category: "",
      contactName: "",
      email: "",
      phone: "",
      cost: "",
      status: "Quoted",
      notes: "",
    });
    setContactForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      notes: "",
    });
  };

  const closeDocumentDialog = () => {
    setSelectedFile(null);
    setDocumentNotes("");
    setDocumentCategory("Contract");
    setDocumentOpen(false);
  };

  const submitTask = async () => {
    if (!taskForm.title.trim()) {
      return;
    }

    try {
      await createTask({
        title: taskForm.title.trim(),
        stage: taskForm.stage,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        assignee: taskForm.assignee.trim(),
        notes: taskForm.notes.trim(),
      });
      setFeedback("Task added successfully");
      closeDrawer();
    } catch {
      setFeedback("Task add failed");
    }
  };

  const submitVendor = async () => {
    if (!vendorForm.name.trim()) {
      return;
    }

    try {
      await createVendor({
        name: vendorForm.name.trim(),
        category: vendorForm.category,
        contactName: vendorForm.contactName.trim(),
        email: vendorForm.email.trim(),
        phone: vendorForm.phone.trim(),
        cost: Number(vendorForm.cost) || 0,
        status: vendorForm.status,
        notes: vendorForm.notes.trim(),
      });
      setFeedback("Vendor added successfully");
      closeDrawer();
    } catch {
      setFeedback("Vendor add failed");
    }
  };

  const submitContact = async () => {
    if (!contactForm.name.trim()) {
      return;
    }

    const success = await addContact(event.id, {
      name: contactForm.name.trim(),
      company: contactForm.company.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim(),
      notes: contactForm.notes.trim(),
    });
    setFeedback(success ? "Contact added successfully" : "Contact add failed");
    if (success) {
      closeDrawer();
    }
  };

  const submitDocument = async () => {
    if (!selectedFile) {
      return;
    }

    const success = await upload({
      name: selectedFile.name,
      category: documentCategory,
      notes: documentNotes,
      sizeBytes: selectedFile.size,
      mimeType: selectedFile.type,
      file: selectedFile,
    });

    if (!success) {
      setFeedback("Document upload failed");
      return;
    }

    setFeedback("Document uploaded successfully");
    closeDocumentDialog();
  };

  const handleDocumentAction = (action, document) => {
    if (action === "preview") {
      const mimeType = document.mimeType || "";

      if (
        mimeType.includes("word") ||
        mimeType.includes("officedocument") ||
        document.name.toLowerCase().endsWith(".doc") ||
        document.name.toLowerCase().endsWith(".docx")
      ) {
        if (document.previewUrl) {
          window.open(document.previewUrl, "_blank", "noopener,noreferrer");
        } else {
          setFeedback("Preview is only available for uploaded Word files");
        }
        return;
      }

      setDocumentPreview(document);
      return;
    }

    if (action === "rename") {
      setRenameTarget(document);
      setRenameValue(document.name);
      return;
    }

    if (action === "replace") {
      setReplaceTarget(document);
      return;
    }

    remove(document.id).then((success) => {
      setFeedback(success ? "Document deleted successfully" : "Document delete failed");
    });
  };

  const submitRename = async () => {
    if (!renameTarget || !renameValue.trim()) {
      return;
    }

    const success = await rename(renameTarget.id, renameValue.trim());
    if (!success) {
      setFeedback("Document rename failed");
      return;
    }
    setRenameTarget(null);
    setRenameValue("");
    setFeedback("Document renamed successfully");
  };

  const submitReplace = async (file) => {
    if (!replaceTarget || !file) {
      return;
    }

    const success = await replace(replaceTarget.id, {
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
      file,
    });

    if (!success) {
      setFeedback("Document replace failed");
      return;
    }
    setReplaceTarget(null);
    setFeedback("Document replaced successfully");
  };

  const openTaskEditor = (task) => {
    setTaskEditTarget(task);
    setTaskForm({
      title: task.title,
      stage: task.stage || "General",
      priority: task.priority || "Medium",
      dueDate: task.dueDate || event?.date || "",
      assignee: task.assignee || "",
      notes: task.notes || "",
    });
  };

  const submitTaskEdit = async () => {
    if (!taskEditTarget || !taskForm.title.trim()) {
      return;
    }

    try {
      await updateTask(taskEditTarget.id, {
        title: taskForm.title.trim(),
        stage: taskForm.stage,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        assignee: taskForm.assignee.trim(),
        notes: taskForm.notes.trim(),
      });
      setTaskEditTarget(null);
      closeDrawer();
      setFeedback("Task updated successfully");
    } catch {
      setFeedback("Task update failed");
    }
  };

  const openVendorEditor = (vendor) => {
    setVendorEditTarget(vendor);
    setVendorForm({
      name: vendor.name || "",
      category: vendor.category || "",
      contactName: vendor.contactName || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      cost: vendor.cost || "",
      status: vendor.status || "Quoted",
      notes: vendor.notes || "",
    });
  };

  const submitVendorEdit = async () => {
    if (!vendorEditTarget || !vendorForm.name.trim()) {
      return;
    }

    try {
      await updateVendor(vendorEditTarget.id, {
        name: vendorForm.name.trim(),
        category: vendorForm.category.trim(),
        contactName: vendorForm.contactName.trim(),
        email: vendorForm.email.trim(),
        phone: vendorForm.phone.trim(),
        cost: Number(vendorForm.cost) || 0,
        status: vendorForm.status,
        notes: vendorForm.notes.trim(),
      });
      setVendorEditTarget(null);
      closeDrawer();
      setFeedback("Vendor updated successfully");
    } catch {
      setFeedback("Vendor update failed");
    }
  };

  const cycleVendorStatus = async (vendor) => {
    const flow = ["Quoted", "Confirmed", "Paid"];
    const nextStatus = flow[(flow.indexOf(vendor.status) + 1) % flow.length];
    try {
      await updateVendorStatus(vendor.id, nextStatus);
      setFeedback(`Vendor moved to ${nextStatus}`);
    } catch {
      setFeedback("Vendor status update failed");
    }
  };

  const requestDelete = (type, item) => {
    setDeleteTarget({ type, item });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === "task") {
      try {
        await deleteTask(deleteTarget.item.id);
        setFeedback("Task deleted successfully");
      } catch {
        setFeedback("Task delete failed");
      }
    }

    if (deleteTarget.type === "vendor") {
      try {
        await deleteVendor(deleteTarget.item.id);
        setFeedback("Vendor deleted successfully");
      } catch {
        setFeedback("Vendor delete failed");
      }
    }

    if (deleteTarget.type === "event") {
      try {
        await deleteEvent(deleteTarget.item.id);
        setDeleteTarget(null);
        navigate("/events", { replace: true });
        return;
      } catch {
        setFeedback("Event delete failed");
      }
    }

    setDeleteTarget(null);
  };

  return (
    <>
      <EventWorkspaceLayout
        event={event}
        tabs={tabs}
        overallProgress={summary.overallProgress}
        summary={summary}
        vendorCount={eventVendors.length}
        onQuickAction={openQuickAction}
        quickActionPermissions={{
          contacts: permissions.canManageContacts,
          vendors: permissions.canManageVendors,
          tasks: permissions.canManageTasks,
          documents: permissions.canManageDocuments,
        }}
      >
        <OverviewTab
          event={event}
          summary={summary}
          vendorCount={eventVendors.length}
          activities={eventActivities}
          onQuickAction={openQuickAction}
          canDeleteEvent={permissions.canEditAll}
          onDeleteEvent={() => requestDelete("event", event)}
        />
        <ContactsTab event={event} expanded={expanded} onToggle={toggleExpanded} onQuickAction={openQuickAction} />
        <VendorsTab
          vendors={eventVendors}
          expanded={expanded}
          onToggle={toggleExpanded}
          onQuickAction={openQuickAction}
          onVendorEdit={openVendorEditor}
          onVendorDelete={(vendor) => requestDelete("vendor", vendor)}
          onVendorStatusCycle={cycleVendorStatus}
        />
        <BudgetTab event={event} vendors={eventVendors} summary={summary} />
        <TasksTab
          tasks={eventTasks}
          expanded={expanded}
          onToggle={toggleExpanded}
          onQuickAction={openQuickAction}
          onTaskToggle={(taskId) => toggleTask(taskId)}
          onTaskEdit={openTaskEditor}
          onTaskDelete={(task) => requestDelete("task", task)}
        />
        <CalendarTab event={event} tasks={eventTasks} />
        <DocumentsTab
          documents={eventDocuments}
          expanded={expanded}
          onToggle={toggleExpanded}
          onQuickAction={openQuickAction}
          onDocumentAction={handleDocumentAction}
        />
      </EventWorkspaceLayout>

      <Drawer
        anchor="right"
        open={Boolean(drawerState)}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: 360,
            p: 2,
            background:
              "linear-gradient(180deg, rgba(17, 28, 49, 0.98), rgba(12, 20, 36, 0.96))",
          },
        }}
      >
        {drawerState === "Tasks" ? (
          <ActionPanel
            title="Add task"
            description="Create a new checklist item without leaving the workspace."
            onSubmit={submitTask}
            onCancel={closeDrawer}
          >
            <TextField
              label="Task"
              size="small"
              autoFocus
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <TextField
              select
              label="Stage"
              size="small"
              value={taskForm.stage}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, stage: event.target.value }))
              }
            >
              {TASK_STAGES.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {stage}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Priority"
              size="small"
              value={taskForm.priority}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, priority: event.target.value }))
              }
            >
              {["Low", "Medium", "High"].map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Due date"
              size="small"
              type="date"
              value={taskForm.dueDate}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, dueDate: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Assigned person"
              size="small"
              value={taskForm.assignee}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, assignee: event.target.value }))
              }
            />
            <TextField
              label="Notes"
              size="small"
              multiline
              minRows={2}
              value={taskForm.notes}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </ActionPanel>
        ) : null}

        {drawerState === "Vendors" ? (
          <ActionPanel
            title="Add vendor"
            description="Track a vendor and push its spend directly into the budget."
            onSubmit={submitVendor}
            onCancel={closeDrawer}
            disabled={!permissions.canManageVendors}
            submitLabel={permissions.canManageVendors ? "Save vendor" : "Admin only"}
          >
            <TextField
              label="Vendor name"
              size="small"
              autoFocus
              value={vendorForm.name}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, name: event.target.value }))
              }
              disabled={!permissions.canManageVendors}
            />
            <TextField
              label="Category"
              size="small"
              value={vendorForm.category}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, category: event.target.value }))
              }
              disabled={!permissions.canManageVendors}
            />
            <TextField
              label="Contact name"
              size="small"
              value={vendorForm.contactName}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, contactName: event.target.value }))
              }
              disabled={!permissions.canManageVendors}
            />
            <TextField
              label="Email"
              size="small"
              value={vendorForm.email}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, email: event.target.value }))
              }
              disabled={!permissions.canManageVendors}
            />
            <TextField
              label="Phone"
              size="small"
              value={vendorForm.phone}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, phone: event.target.value }))
              }
              disabled={!permissions.canManageVendors}
            />
            <TextField
              label="Cost"
              type="number"
              size="small"
              value={vendorForm.cost}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, cost: event.target.value }))
              }
              disabled={!permissions.canManageVendors}
            />
            <TextField
              select
              label="Status"
              size="small"
              value={vendorForm.status}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, status: event.target.value }))
              }
              disabled={!permissions.canManageVendors}
            >
              {["Quoted", "Confirmed", "Paid"].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notes"
              size="small"
              multiline
              minRows={2}
              value={vendorForm.notes}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, notes: event.target.value }))
              }
              disabled={!permissions.canManageVendors}
            />
          </ActionPanel>
        ) : null}

        {drawerState === "Contacts" ? (
          <ActionPanel
            title="Add contact"
            description="Capture stakeholder details and keep them attached to the event."
            onSubmit={submitContact}
            onCancel={closeDrawer}
          >
            <TextField
              label="Name"
              size="small"
              autoFocus
              value={contactForm.name}
              onChange={(event) =>
                setContactForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <TextField
              label="Company"
              size="small"
              value={contactForm.company}
              onChange={(event) =>
                setContactForm((current) => ({ ...current, company: event.target.value }))
              }
            />
            <TextField
              label="Email"
              size="small"
              value={contactForm.email}
              onChange={(event) =>
                setContactForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <TextField
              label="Phone"
              size="small"
              value={contactForm.phone}
              onChange={(event) =>
                setContactForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
            <TextField
              label="Notes"
              size="small"
              multiline
              minRows={3}
              value={contactForm.notes}
              onChange={(event) =>
                setContactForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </ActionPanel>
        ) : null}
      </Drawer>

      <Dialog open={documentOpen} onClose={closeDocumentDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>Upload document</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.2, pt: "8px !important" }}>
          <TextField
            label="Category"
            size="small"
            autoFocus
            value={documentCategory}
            onChange={(event) => setDocumentCategory(event.target.value)}
          />
          <TextField
            label="Notes"
            size="small"
            multiline
            minRows={2}
            value={documentNotes}
            onChange={(event) => setDocumentNotes(event.target.value)}
          />
          <Button variant="outlined" component="label">
            <input
              type="file"
              hidden
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
            {selectedFile ? "Replace file" : "Choose file"}
          </Button>
          {selectedFile ? (
            <Card sx={miniCard}>
              <Typography fontWeight={700}>{selectedFile.name}</Typography>
              <Typography sx={captionText}>
                {(selectedFile.size / 1024).toFixed(0)} KB
              </Typography>
            </Card>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDocumentDialog}>Cancel</Button>
          <Button variant="contained" onClick={submitDocument} disabled={!selectedFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(documentPreview)} onClose={() => setDocumentPreview(null)} fullWidth maxWidth="md">
        <DialogTitle>{documentPreview?.name || "Preview"}</DialogTitle>
        <DialogContent sx={{ minHeight: 360, display: "grid", gap: 1 }}>
          {documentPreview?.mimeType?.startsWith("image/") && documentPreview?.previewUrl ? (
            <Box component="img" src={documentPreview.previewUrl} alt={documentPreview.name} sx={{ width: "100%", maxHeight: 480, objectFit: "contain", borderRadius: 2 }} />
          ) : documentPreview?.mimeType?.includes("pdf") && documentPreview?.previewUrl ? (
            <Box component="iframe" src={documentPreview.previewUrl} title={documentPreview.name} sx={{ width: "100%", minHeight: 480, border: 0, borderRadius: 2 }} />
          ) : (
            <Card sx={miniCard}>
              <Typography fontWeight={700}>Preview unavailable</Typography>
              <Typography sx={captionText}>
                Upload a PDF, image, or Word file to enable direct preview or open-in-new-tab behavior.
              </Typography>
            </Card>
          )}
          {documentPreview?.notes ? (
            <Card sx={miniCard}>
              <Typography fontWeight={700}>Notes</Typography>
              <Typography sx={captionText}>{documentPreview.notes}</Typography>
            </Card>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDocumentPreview(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Rename document</DialogTitle>
        <DialogContent sx={{ pt: "10px !important" }}>
          <TextField autoFocus fullWidth size="small" label="File name" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitRename}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(replaceTarget)} onClose={() => setReplaceTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Replace document</DialogTitle>
        <DialogContent sx={{ pt: "10px !important" }}>
          <Button variant="outlined" component="label" fullWidth>
            Choose replacement file
            <input
              type="file"
              hidden
              onChange={(event) => submitReplace(event.target.files?.[0] || null)}
            />
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReplaceTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(taskEditTarget)} onClose={() => setTaskEditTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit task</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1, pt: "10px !important" }}>
          <TextField autoFocus size="small" label="Task name" value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} />
          <TextField size="small" type="date" label="Due date" value={taskForm.dueDate} onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField select size="small" label="Priority" value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}>
            {["Low", "Medium", "High"].map((priority) => (
              <MenuItem key={priority} value={priority}>{priority}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Category" value={taskForm.stage} onChange={(event) => setTaskForm((current) => ({ ...current, stage: event.target.value }))}>
            {TASK_STAGES.map((stage) => (
              <MenuItem key={stage} value={stage}>{stage}</MenuItem>
            ))}
          </TextField>
          <TextField size="small" label="Assigned person" value={taskForm.assignee} onChange={(event) => setTaskForm((current) => ({ ...current, assignee: event.target.value }))} />
          <TextField size="small" label="Notes" multiline minRows={3} value={taskForm.notes} onChange={(event) => setTaskForm((current) => ({ ...current, notes: event.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTaskEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitTaskEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(vendorEditTarget)} onClose={() => setVendorEditTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit vendor</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1, pt: "10px !important" }}>
          <TextField autoFocus size="small" label="Vendor name" value={vendorForm.name} onChange={(event) => setVendorForm((current) => ({ ...current, name: event.target.value }))} />
          <TextField size="small" label="Category" value={vendorForm.category} onChange={(event) => setVendorForm((current) => ({ ...current, category: event.target.value }))} />
          <TextField size="small" label="Contact person" value={vendorForm.contactName} onChange={(event) => setVendorForm((current) => ({ ...current, contactName: event.target.value }))} />
          <TextField size="small" label="Phone" value={vendorForm.phone} onChange={(event) => setVendorForm((current) => ({ ...current, phone: event.target.value }))} />
          <TextField size="small" label="Email" value={vendorForm.email} onChange={(event) => setVendorForm((current) => ({ ...current, email: event.target.value }))} />
          <TextField size="small" type="number" label="Cost" value={vendorForm.cost} onChange={(event) => setVendorForm((current) => ({ ...current, cost: event.target.value }))} />
          <TextField select size="small" label="Status" value={vendorForm.status} onChange={(event) => setVendorForm((current) => ({ ...current, status: event.target.value }))}>
            {["Quoted", "Confirmed", "Paid"].map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>
          <TextField size="small" label="Notes" multiline minRows={3} value={vendorForm.notes} onChange={(event) => setVendorForm((current) => ({ ...current, notes: event.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVendorEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitVendorEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Confirm delete</DialogTitle>
        <DialogContent sx={{ pt: "10px !important" }}>
          <Typography sx={captionText}>
            Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2600}
        onClose={() => setFeedback("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setFeedback("")} severity="success" variant="filled" sx={{ width: "100%" }}>
          {feedback}
        </Alert>
      </Snackbar>
    </>
  );
}

function OverviewTab({
  event,
  summary,
  vendorCount,
  activities,
  onQuickAction,
  canDeleteEvent,
  onDeleteEvent,
}) {
  const attentionItems = [
    ...summary.overdueTasks.map((task) => ({
      title: task.title,
      subtitle: `Overdue since ${dayjs(task.dueDate).format("DD MMM")}`,
      tone: "warning",
    })),
    ...(summary.budgetAlert
      ? [
          {
            title: "Budget above 80%",
            subtitle: `${formatCurrency(summary.spent)} committed`,
            tone: "critical",
          },
        ]
      : []),
    ...summary.unconfirmedVendors.map((vendor) => ({
      title: `${vendor.name} pending`,
      subtitle: `${vendor.category} is still quoted`,
      tone: "info",
    })),
  ].slice(0, 4);

  return (
    <Box sx={contentGrid}>
      <Card sx={{ ...panelCard, gridColumn: { lg: "span 2" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography sx={sectionTitle}>Workspace snapshot</Typography>
          {canDeleteEvent ? (
            <Button size="small" color="error" variant="outlined" onClick={onDeleteEvent}>
              Delete event
            </Button>
          ) : null}
        </Box>
        <Box sx={compactStatsGrid}>
          <MetricCard label="Progress" value={`${summary.overallProgress}%`} caption="Event readiness" />
          <MetricCard label="Remaining" value={formatCurrency(summary.remaining)} caption="Budget available" />
          <MetricCard label="Contacts" value={event.contacts.length} caption="Stakeholder records" />
          <MetricCard label="Vendors" value={vendorCount} caption="Tracked suppliers" />
        </Box>
      </Card>

      <Card sx={panelCard}>
        <Typography sx={sectionTitle}>Needs attention</Typography>
        <Stack spacing={0.8} mt={1}>
          {attentionItems.length > 0 ? (
            attentionItems.map((item) => (
              <Box key={item.title} sx={attentionRow(item.tone)}>
                <Typography fontWeight={600}>{item.title}</Typography>
                <Typography sx={captionText}>{item.subtitle}</Typography>
              </Box>
            ))
          ) : (
            <EmptyState
              title="No risks detected"
              subtitle="Budget, vendors, and deadlines look stable right now."
              actionLabel="+ Add task"
              onAction={() => onQuickAction("Tasks")}
            />
          )}
        </Stack>
      </Card>

      <Card sx={panelCard}>
        <Typography sx={sectionTitle}>Recent activity</Typography>
        <Stack spacing={0.8} mt={1}>
          {activities.slice(0, 4).map((activity) => (
            <Box key={activity.id} sx={listRow}>
              <Box>
                <Typography fontWeight={600}>{activity.message}</Typography>
                <Typography sx={captionText}>
                  {activity.metadata?.name ||
                    activity.metadata?.title ||
                    activity.metadata?.eventName ||
                    activity.type}
                </Typography>
              </Box>
              <Typography sx={captionText}>{dayjs(activity.createdAt).format("DD MMM, hh:mm A")}</Typography>
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  );
}

function ContactsTab({ event, expanded, onToggle, onQuickAction }) {
  return (
    <CompactListTab
      title="Contacts"
      items={event.contacts}
      expanded={expanded.contacts}
      onToggle={() => onToggle("contacts")}
      emptyTitle="No contacts yet"
      emptySubtitle="Add your first stakeholder to manage communication."
      emptyActionLabel="+ Add Contact"
      onEmptyAction={() => onQuickAction("Contacts")}
      renderItem={(contact) => (
        <Box key={contact.id} sx={listRow}>
          <Box>
            <Typography fontWeight={600}>{contact.name}</Typography>
            <Typography sx={captionText}>{contact.company || "No company"}</Typography>
          </Box>
          <Box textAlign="right">
            <Typography sx={captionText}>{contact.email || "No email"}</Typography>
            <Typography sx={captionText}>{contact.phone || "No phone"}</Typography>
          </Box>
        </Box>
      )}
    />
  );
}

function VendorsTab({ vendors, expanded, onToggle, onQuickAction, onVendorEdit, onVendorDelete, onVendorStatusCycle }) {
  return (
    <CompactListTab
      title="Vendors"
      items={vendors}
      expanded={expanded.vendors}
      onToggle={() => onToggle("vendors")}
      emptyTitle="No vendors added"
      emptySubtitle="Add your first supplier to track status, cost, and contact details."
      emptyActionLabel="+ Add Vendor"
      onEmptyAction={() => onQuickAction("Vendors")}
      renderItem={(vendor) => (
        <Box key={vendor.id} sx={listRow}>
          <Box>
            <Typography fontWeight={600}>{vendor.name}</Typography>
            <Typography sx={captionText}>{vendor.category || "Custom vendor"}</Typography>
          </Box>
          <Box sx={itemMetaActions}>
            <Chip label={vendor.status} size="small" sx={statusChip(vendor.status)} onClick={() => onVendorStatusCycle(vendor)} />
            <Typography sx={captionText}>{formatCurrency(vendor.cost)}</Typography>
            <Box sx={actionIconGroup}>
              <IconButton size="small" onClick={() => onVendorEdit(vendor)}>
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" onClick={() => onVendorDelete(vendor)}>
                <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
    />
  );
}

function BudgetTab({ event, vendors, summary }) {
  const categoryTotals = Object.entries(
    vendors.reduce((accumulator, vendor) => {
      accumulator[vendor.category] = (accumulator[vendor.category] || 0) + vendor.cost;
      return accumulator;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <Box sx={contentGrid}>
      <Card sx={panelCard}>
        <Typography sx={sectionTitle}>Budget health</Typography>
        <Box sx={compactStatsGrid}>
          <MetricCard label="Allocated" value={formatCurrency(event.budget)} caption="Total budget" />
          <MetricCard label="Spent" value={formatCurrency(summary.spent)} caption="Committed spend" />
          <MetricCard label="Remaining" value={formatCurrency(summary.remaining)} caption="Available" />
        </Box>
      </Card>

      <Card sx={panelCard}>
        <Typography sx={sectionTitle}>Category breakdown</Typography>
        <Stack spacing={0.8} mt={1}>
          {categoryTotals.slice(0, 4).map(([category, amount]) => (
            <Box key={category}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.35 }}>
                <Typography fontWeight={600}>{category}</Typography>
                <Typography sx={captionText}>{formatCurrency(amount)}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={Math.min(100, (amount / event.budget) * 100)} sx={{ height: 6 }} />
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  );
}

function TasksTab({ tasks, expanded, onToggle, onQuickAction, onTaskToggle, onTaskEdit, onTaskDelete }) {
  return (
    <Box sx={taskGrid}>
      {TASK_STAGES.map((stage) => {
        const stageTasks = tasks.filter((task) => task.stage === stage);
        const isExpanded = expanded[stage];
        const visibleTasks = isExpanded ? stageTasks : stageTasks.slice(0, VISIBLE_LIMIT);
        const hiddenCount = Math.max(0, stageTasks.length - VISIBLE_LIMIT);
        const completedCount = stageTasks.filter((task) => task.done).length;
        const stageProgress = stageTasks.length === 0 ? 0 : (completedCount / stageTasks.length) * 100;

        return (
          <Card key={stage} sx={taskStageCard}>
            <Box mb={0.15}>
              <Typography sx={sectionTitle}>{stage}</Typography>
              <Typography sx={captionText}>
                {completedCount}/{stageTasks.length} complete
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={stageProgress} sx={taskStageProgress} />

            <Stack spacing={0.55} mt={0.85} sx={taskListStack}>
              {visibleTasks.length > 0 ? (
                visibleTasks.map((task) => (
                  <Box key={task.id} sx={taskRowCard}>
                    <Checkbox size="small" checked={task.done} onChange={() => onTaskToggle(task.id)} sx={taskCheckbox} />
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={700} sx={task.done ? doneText : taskTitle}>
                        {task.title}
                      </Typography>
                      <Typography sx={taskMetaText}>
                        {dayjs(task.dueDate).format("DD MMM")} / {task.priority || "Medium"} / {task.assignee || "Unassigned"}
                      </Typography>
                    </Box>
                    <Box sx={itemMetaActions}>
                      <Chip label={task.done ? "Done" : "Open"} size="small" sx={task.done ? taskDoneChip : taskOpenChip} />
                      <Box sx={actionIconGroup}>
                        <IconButton size="small" onClick={() => onTaskEdit(task)}>
                          <EditOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => onTaskDelete(task)}>
                          <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                <EmptyState
                  title={`No ${stage.toLowerCase()} tasks`}
                  subtitle="Create the next checklist item to keep the runbook moving."
                  actionLabel="+ Add Task"
                  onAction={() => onQuickAction("Tasks")}
                />
              )}
            </Stack>

            {hiddenCount > 0 ? (
              <Button size="small" sx={{ mt: 0.6 }} onClick={() => onToggle(stage)}>
                {isExpanded ? "Show less" : `+${hiddenCount} more`}
              </Button>
            ) : null}
          </Card>
        );
      })}
    </Box>
  );
}

function CalendarTab({ event, tasks }) {
  const calendarItems = [
    { id: "event-date", title: `${event.type} date`, date: event.date, type: "Event" },
    ...tasks.map((task) => ({
      id: task.id,
      title: task.title,
      date: task.dueDate,
      type: task.stage,
    })),
  ]
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    .slice(0, 6);

  return (
    <Card sx={panelCard}>
      <Typography sx={sectionTitle}>Upcoming schedule</Typography>
      <Stack spacing={0.8} mt={1}>
        {calendarItems.map((item) => (
          <Box key={item.id} sx={listRow}>
            <Box>
              <Typography fontWeight={600}>{item.title}</Typography>
              <Typography sx={captionText}>{item.type}</Typography>
            </Box>
            <Typography sx={captionText}>{dayjs(item.date).format("DD MMM YYYY")}</Typography>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}

function DocumentsTab({ documents, expanded, onToggle, onQuickAction, onDocumentAction }) {
  const isExpanded = expanded.documents;
  const visibleDocs = isExpanded ? documents : documents.slice(0, VISIBLE_LIMIT);
  const hiddenCount = Math.max(0, documents.length - VISIBLE_LIMIT);

  return (
    <CompactListTab
      title="Documents"
      items={visibleDocs}
      expanded={isExpanded}
      onToggle={() => onToggle("documents")}
      emptyTitle="No documents uploaded"
      emptySubtitle="Upload your first contract, proposal, or invoice for this event."
      emptyActionLabel="+ Add Document"
      onEmptyAction={() => onQuickAction("Documents")}
      renderItem={(document) => (
        <Box key={document.id} sx={listRow}>
          <Box>
            <Typography fontWeight={600}>{document.name}</Typography>
            <Typography sx={captionText}>{document.category} / {document.notes || "No notes"}</Typography>
          </Box>
          <Box
            sx={documentActionRow}
          >
            <Typography sx={captionText}>{document.sizeLabel || "File"}</Typography>
            <Box sx={documentButtonGroup}>
              <Button size="small" variant="outlined" onClick={() => onDocumentAction("preview", document)}>Preview</Button>
              <Button size="small" variant="outlined" onClick={() => onDocumentAction("rename", document)}>Rename</Button>
              <Button size="small" variant="outlined" onClick={() => onDocumentAction("replace", document)}>Replace</Button>
              <Button size="small" color="error" variant="outlined" onClick={() => onDocumentAction("delete", document)}>Delete</Button>
            </Box>
          </Box>
        </Box>
      )}
      footer={
        hiddenCount > 0 ? (
          <Button size="small" sx={{ mt: 0.6 }} onClick={() => onToggle("documents")}>
            {isExpanded ? "Show less" : `+${hiddenCount} more`}
          </Button>
        ) : null
      }
    />
  );
}

function CompactListTab({
  title,
  items,
  expanded,
  onToggle,
  emptyTitle,
  emptySubtitle,
  emptyActionLabel,
  onEmptyAction,
  renderItem,
  footer,
}) {
  const actualItems = expanded ? items : items.slice(0, VISIBLE_LIMIT);
  const hiddenCount = Math.max(0, items.length - VISIBLE_LIMIT);

  return (
    <Card sx={{ ...panelCard, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Typography sx={sectionTitle}>{title}</Typography>
      <Stack spacing={0.7} mt={1} sx={scrollArea}>
        {actualItems.length > 0 ? (
          actualItems.map(renderItem)
        ) : (
          <EmptyState
            title={emptyTitle}
            subtitle={emptySubtitle}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        )}
      </Stack>

      {footer ||
        (hiddenCount > 0 ? (
          <Button size="small" sx={{ mt: 0.6 }} onClick={onToggle}>
            {expanded ? "Show less" : `+${hiddenCount} more`}
          </Button>
        ) : null)}
    </Card>
  );
}

function ActionPanel({
  title,
  description,
  children,
  onSubmit,
  onCancel,
  disabled,
  submitLabel = "Save",
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.1 }}>
      <Typography fontSize={16} fontWeight={700}>
        {title}
      </Typography>
      <Typography fontSize={12} color="text.secondary">
        {description}
      </Typography>
      {children}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.75, mt: 1 }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={disabled}>
          {submitLabel}
        </Button>
      </Box>
    </Box>
  );
}

function MetricCard({ label, value, caption }) {
  return (
    <Card sx={miniCard}>
      <Typography sx={metricLabel}>{label}</Typography>
      <Typography sx={metricValue}>{value}</Typography>
      <Typography sx={captionText}>{caption}</Typography>
    </Card>
  );
}

const contentGrid = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    lg: "repeat(2, minmax(0, 1fr))",
  },
  gap: 1,
  gridAutoRows: "max-content",
  minHeight: 0,
  alignContent: "start",
};

const panelCard = {
  p: 1.2,
  borderRadius: 3,
  background:
    "linear-gradient(180deg, rgba(17, 28, 49, 0.9), rgba(12, 20, 36, 0.8))",
  border: "1px solid rgba(95,113,165,0.16)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  overflow: "hidden",
  minHeight: 0,
};

const compactStatsGrid = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
  },
  gap: 0.8,
  mt: 1,
};

const miniCard = {
  p: 1,
  borderRadius: 2,
  background: "rgba(9, 16, 31, 0.82)",
  border: "1px solid rgba(95,113,165,0.12)",
};

const listRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  p: 0.85,
  borderRadius: 2,
  background: "rgba(8, 15, 30, 0.66)",
  border: "1px solid rgba(148,163,184,0.08)",
  cursor: "pointer",
  transition: "background 0.18s ease, border-color 0.18s ease",
  "&:hover": {
    background: "rgba(12, 20, 36, 0.9)",
    borderColor: "rgba(129,140,248,0.18)",
  },
};

const attentionRow = (tone) => ({
  p: 0.9,
  borderRadius: 2,
  background:
    tone === "critical"
      ? "rgba(248,113,113,0.12)"
      : tone === "warning"
      ? "rgba(251,191,36,0.12)"
      : "rgba(96,165,250,0.12)",
  border:
    tone === "critical"
      ? "1px solid rgba(248,113,113,0.24)"
      : tone === "warning"
      ? "1px solid rgba(251,191,36,0.24)"
      : "1px solid rgba(96,165,250,0.24)",
});

const sectionTitle = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "#f3f6ff",
};

const sectionCopy = {
  color: "text.secondary",
  fontSize: 13,
  mt: 0.4,
};

const metricLabel = {
  color: "text.secondary",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const metricValue = {
  fontSize: 13,
  fontWeight: 650,
  mt: 0.25,
};

const captionText = {
  color: "text.secondary",
  fontSize: 11,
};

const doneChip = {
  background: "rgba(34,197,94,0.18)",
  color: "#bbf7d0",
};

const doneText = {
  textDecoration: "line-through",
  opacity: 0.64,
};

const openChip = {
  background: "rgba(251,191,36,0.18)",
  color: "#fde68a",
};

const statusChip = (status) => ({
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
  cursor: "pointer",
});

const rowActions = {
  display: "flex",
  alignItems: "center",
  opacity: 0.72,
};

const itemMetaActions = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 0.55,
  flexWrap: "wrap",
  minWidth: 120,
};

const actionIconGroup = {
  display: "flex",
  alignItems: "center",
  gap: 0.2,
  opacity: 0.82,
};

const taskStageCard = {
  ...panelCard,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  background:
    "linear-gradient(180deg, rgba(18, 29, 52, 0.96), rgba(11, 18, 33, 0.92))",
};

const taskStageProgress = {
  height: 7,
  mt: 0.8,
  borderRadius: 999,
  backgroundColor: "rgba(74, 85, 140, 0.4)",
};

const taskRowCard = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  p: 0.8,
  borderRadius: 2,
  background: "rgba(10, 18, 34, 0.8)",
  border: "1px solid rgba(95,113,165,0.12)",
  transition: "all 0.18s ease",
  "&:hover": {
    background: "rgba(12, 20, 38, 0.96)",
    borderColor: "rgba(109,123,255,0.22)",
    transform: "translateY(-1px)",
  },
};

const taskCheckbox = {
  p: 0.4,
  color: "#8fa0c6",
};

const taskTitle = {
  color: "#eef2ff",
  lineHeight: 1.2,
  fontSize: 11,
  fontWeight: 600,
};

const taskMetaText = {
  color: "text.secondary",
  fontSize: 11,
  mt: 0.2,
};

const taskOpenChip = {
  background: "rgba(98, 83, 28, 0.58)",
  color: "#f6de82",
  border: "1px solid rgba(214, 172, 63, 0.18)",
};

const taskDoneChip = {
  background: "rgba(17, 83, 55, 0.58)",
  color: "#c9f5d8",
  border: "1px solid rgba(61, 172, 113, 0.16)",
};

const taskGrid = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    lg: "repeat(2, minmax(0, 1fr))",
  },
  gridTemplateRows: {
    xs: "auto",
    lg: "repeat(2, minmax(0, 1fr))",
  },
  gap: 1,
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
};

const taskListStack = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  pr: 0.25,
};

const documentActionRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 0.6,
  flexWrap: "wrap",
};

const documentButtonGroup = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 0.4,
  flexWrap: "wrap",
};

const scrollArea = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  pr: 0.25,
};
