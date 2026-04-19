import { supabase } from "./supabaseClient";

export const TASK_STAGES = ["General", "Pre-Event", "Event Day", "Post-Event"];
export const EVENT_SELECT_FIELDS = `
  id,
  organization_id,
  owner_id,
  manager_ids,
  name,
  type,
  date,
  venue,
  notes,
  budget,
  status,
  contacts,
  created_at,
  updated_at
`;
export const TASK_SELECT_FIELDS = `
  id,
  event_id,
  organization_id,
  created_by,
  title,
  stage,
  priority,
  status,
  due_date,
  assignee,
  notes,
  created_at,
  updated_at
`;
export const VENDOR_SELECT_FIELDS = `
  id,
  event_id,
  organization_id,
  created_by,
  name,
  category,
  contact_name,
  email,
  phone,
  cost,
  status,
  notes,
  linked_document_id,
  created_at,
  updated_at
`;
export const DOCUMENT_SELECT_FIELDS = `
  id,
  event_id,
  organization_id,
  uploaded_by,
  name,
  category,
  notes,
  size_bytes,
  mime_type,
  storage_path,
  created_at,
  updated_at
`;
export const ACTIVITY_SELECT_FIELDS = `
  id,
  event_id,
  organization_id,
  user_id,
  type,
  message,
  metadata,
  created_at
`;
export const DOCUMENTS_BUCKET = "documents";

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function formatFileSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeEventRow(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ownerId: row.owner_id,
    managerIds: ensureArray(row.manager_ids),
    name: row.name,
    type: row.type || "Event",
    date: row.date,
    venue: row.venue || "",
    notes: row.notes || "",
    budget: Number(row.budget) || 0,
    status: row.status || "Planning",
    contacts: ensureArray(row.contacts),
  };
}

export function normalizeTaskRow(row) {
  const status = row.status || "open";

  return {
    id: row.id,
    eventId: row.event_id,
    organizationId: row.organization_id,
    createdBy: row.created_by,
    title: row.title,
    stage: row.stage || "General",
    priority: row.priority || "Medium",
    status,
    dueDate: row.due_date,
    assignee: row.assignee || "",
    notes: row.notes || "",
    done: status === "done",
  };
}

export function normalizeVendorRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    organizationId: row.organization_id,
    createdBy: row.created_by,
    name: row.name,
    category: row.category || "General",
    contactName: row.contact_name || "",
    email: row.email || "",
    phone: row.phone || "",
    cost: Number(row.cost) || 0,
    status: row.status || "Quoted",
    notes: row.notes || "",
    linkedDocumentId: row.linked_document_id || null,
  };
}

export function normalizeDocumentRow(row, signedUrl = "") {
  return {
    id: row.id,
    eventId: row.event_id,
    organizationId: row.organization_id,
    uploadedBy: row.uploaded_by,
    name: row.name,
    category: row.category || "Contract",
    notes: row.notes || "",
    sizeBytes: Number(row.size_bytes) || 0,
    sizeLabel: formatFileSize(row.size_bytes),
    mimeType: row.mime_type || "",
    storagePath: row.storage_path || "",
    previewUrl: signedUrl || "",
  };
}

export function normalizeActivityRow(row) {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};

  return {
    id: row.id,
    eventId: row.event_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    type: row.type,
    message: row.message,
    metadata,
    createdAt: row.created_at,
  };
}

export function buildTaskInsertPayload(task, event, user) {
  const safeStage = TASK_STAGES.includes(task.stage) ? task.stage : "General";

  return {
    event_id: event.id,
    organization_id: event.organizationId,
    created_by: user.id,
    title: task.title,
    stage: safeStage,
    priority: task.priority || "Medium",
    status: task.done ? "done" : "open",
    due_date: task.dueDate || event.date,
    assignee: task.assignee || "",
    notes: task.notes || "",
  };
}

export function buildTaskUpdatePayload(existingTask, updates) {
  const nextStatus =
    updates.status ||
    (updates.done === undefined ? existingTask.status : updates.done ? "done" : "open");
  const payload = {};

  if (updates.title !== undefined) {
    payload.title = updates.title;
  }
  if (updates.stage !== undefined) {
    payload.stage = TASK_STAGES.includes(updates.stage) ? updates.stage : "General";
  }
  if (updates.priority !== undefined) {
    payload.priority = updates.priority;
  }
  if (updates.dueDate !== undefined) {
    payload.due_date = updates.dueDate;
  }
  if (updates.assignee !== undefined) {
    payload.assignee = updates.assignee;
  }
  if (updates.notes !== undefined) {
    payload.notes = updates.notes;
  }

  payload.status = nextStatus;
  return payload;
}

export function buildVendorInsertPayload(vendor, event, user) {
  return {
    event_id: event.id,
    organization_id: event.organizationId,
    created_by: user.id,
    name: vendor.name,
    category: vendor.category || "General",
    contact_name: vendor.contactName || "",
    email: vendor.email || "",
    phone: vendor.phone || "",
    cost: Number(vendor.cost) || 0,
    status: vendor.status || "Quoted",
    notes: vendor.notes || "",
    linked_document_id: vendor.linkedDocumentId || null,
  };
}

export function buildVendorUpdatePayload(updates) {
  const payload = {};

  if (updates.name !== undefined) {
    payload.name = updates.name;
  }
  if (updates.category !== undefined) {
    payload.category = updates.category || "General";
  }
  if (updates.contactName !== undefined) {
    payload.contact_name = updates.contactName;
  }
  if (updates.email !== undefined) {
    payload.email = updates.email;
  }
  if (updates.phone !== undefined) {
    payload.phone = updates.phone;
  }
  if (updates.cost !== undefined) {
    payload.cost = Number(updates.cost) || 0;
  }
  if (updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (updates.notes !== undefined) {
    payload.notes = updates.notes;
  }
  if (updates.linkedDocumentId !== undefined) {
    payload.linked_document_id = updates.linkedDocumentId;
  }

  return payload;
}

export function buildDocumentInsertPayload(document, event, user, storagePath) {
  return {
    event_id: event.id,
    organization_id: event.organizationId,
    uploaded_by: user.id,
    name: document.name,
    category: document.category || "Contract",
    notes: document.notes || "",
    size_bytes: document.sizeBytes || 0,
    mime_type: document.mimeType || "",
    storage_path: storagePath || null,
  };
}

export function buildStoragePath(documentId, organizationId, eventId, fileName) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${organizationId}/${eventId}/${documentId}-${safeName}`;
}

export async function createDocumentSignedUrl(storagePath) {
  if (!storagePath) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

  if (error) {
    throw error;
  }

  return data?.signedUrl || "";
}

export async function insertActivityRecord(activity) {
  const { data, error } = await supabase
    .from("activities")
    .insert(activity)
    .select(ACTIVITY_SELECT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return normalizeActivityRow(data);
}

export function groupByEventId(items) {
  return items.reduce((grouped, item) => {
    if (!grouped[item.eventId]) {
      grouped[item.eventId] = [];
    }

    grouped[item.eventId].push(item);
    return grouped;
  }, {});
}
