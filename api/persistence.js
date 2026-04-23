import { createClient } from "@supabase/supabase-js";
import { createSeedStore } from "./seed.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseEnabled = process.env.SUPABASE_ENABLED === "true";

const memoryStore = globalThis.__partyScriptDb || createSeedStore();
globalThis.__partyScriptDb = memoryStore;

export function hasSupabase() {
  return Boolean(supabaseEnabled && supabaseUrl && supabaseServiceRoleKey);
}

export function supabase() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function mapRow(record, mapping) {
  return Object.fromEntries(Object.entries(mapping).map(([camelKey, snakeKey]) => [camelKey, record[snakeKey]]));
}

const orgMap = { id: "id", name: "name", slug: "slug", createdAt: "created_at" };
const userMap = { id: "id", organizationId: "organization_id", name: "name", email: "email", role: "role", passwordHash: "password_hash", createdAt: "created_at" };
const eventMap = { id: "id", organizationId: "organization_id", name: "name", type: "type", city: "city", country: "country", venue: "venue", startDate: "start_date", endDate: "end_date", ownerUserId: "owner_user_id", status: "status", health: "health", expectedAttendees: "expected_attendees", expectedLeads: "expected_leads", budgetTotal: "budget_total", budgetSpent: "budget_spent", createdAt: "created_at" };
const opportunityMap = { id: "id", organizationId: "organization_id", name: "name", eventType: "event_type", industry: "industry", organizer: "organizer", city: "city", country: "country", startDate: "start_date", endDate: "end_date", participationType: "participation_type", boothNeeded: "booth_needed", expectedReach: "expected_reach", expectedLeads: "expected_leads", strategicFitScore: "strategic_fit_score", estimatedCost: "estimated_cost", priority: "priority", decision: "decision", ownerUserId: "owner_user_id", notes: "notes", createdAt: "created_at" };
const taskMap = { id: "id", organizationId: "organization_id", title: "title", eventId: "event_id", assigneeUserId: "assignee_user_id", dueDate: "due_date", priority: "priority", status: "status", notes: "notes", createdAt: "created_at" };
const vendorMap = { id: "id", organizationId: "organization_id", eventId: "event_id", name: "name", category: "category", deliverable: "deliverable", ownerUserId: "owner_user_id", status: "status", paymentStatus: "payment_status", createdAt: "created_at" };
const budgetMap = { id: "id", organizationId: "organization_id", eventId: "event_id", category: "category", budgeted: "budgeted", actual: "actual", committed: "committed", createdAt: "created_at" };
const leadMap = { id: "id", organizationId: "organization_id", fullName: "full_name", company: "company", title: "title", email: "email", phone: "phone", eventId: "event_id", ownerUserId: "owner_user_id", priority: "priority", qualificationStatus: "qualification_status", nextAction: "next_action", nextFollowUpDate: "next_follow_up_date", notes: "notes", createdAt: "created_at" };
const boothMap = { id: "id", organizationId: "organization_id", eventId: "event_id", status: "status", setupCompletion: "setup_completion", materialReadiness: "material_readiness", staffAssigned: "staff_assigned", meetingsBooked: "meetings_booked", leadsCaptured: "leads_captured", createdAt: "created_at" };
const checklistMap = { id: "id", boothId: "booth_id", ownerUserId: "owner_user_id", label: "label", dueDate: "due_date", status: "status" };
const attendeeMap = { id: "id", organizationId: "organization_id", eventId: "event_id", fullName: "full_name", email: "email", phone: "phone", company: "company", city: "city", ticketType: "ticket_type", registrationStatus: "registration_status", checkInStatus: "check_in_status", source: "source", tags: "tags", createdAt: "created_at" };
const checkinMap = { id: "id", organizationId: "organization_id", attendeeId: "attendee_id", eventId: "event_id", status: "status", checkedInAt: "checked_in_at", createdAt: "created_at" };
const assetMap = { id: "id", organizationId: "organization_id", eventId: "event_id", name: "name", category: "category", fileUrl: "file_url", createdByUserId: "created_by_user_id", createdAt: "created_at" };
const activityMap = { id: "id", organizationId: "organization_id", actorUserId: "actor_user_id", kind: "kind", message: "message", createdAt: "created_at" };

function mapCollection(rows, mapping) {
  return (rows ?? []).map((row) => mapRow(row, mapping));
}

function uuid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function hasVipTag(attendee) {
  return (attendee.tags || []).some((tag) => String(tag).trim().toLowerCase() === "vip");
}

export function persistenceMode() {
  return hasSupabase() ? "supabase" : "seed";
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "party-script-org";
}

export async function countUsers() {
  if (!hasSupabase()) {
    return memoryStore.users.length;
  }

  const client = supabase();
  const { count, error } = await client.from("users").select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getPrimaryOrganization() {
  if (!hasSupabase()) {
    return memoryStore.organizations[0] ?? null;
  }

  const client = supabase();
  const { data, error } = await client.from("organizations").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, orgMap) : null;
}

export async function createOrganization(name) {
  const baseSlug = slugify(name);
  const organization = {
    id: uuid("org"),
    name,
    slug: `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.organizations.push(organization);
    return organization;
  }

  const client = supabase();
  const { data, error } = await client.from("organizations").insert({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    created_at: organization.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, orgMap);
}

export async function findUserByEmail(email) {
  if (!hasSupabase()) {
    return memoryStore.users.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  const client = supabase();
  const { data, error } = await client.from("users").select("*").ilike("email", email).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, userMap) : null;
}

export async function findUserById(id) {
  if (!hasSupabase()) {
    return memoryStore.users.find((item) => item.id === id) ?? null;
  }

  const client = supabase();
  const { data, error } = await client.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, userMap) : null;
}

export async function createUser({ name, email, passwordHash, organizationId, role = "Admin" }) {
  const createdAt = new Date().toISOString();
  const user = { id: uuid("user"), organizationId, name, email: email.toLowerCase(), role, passwordHash, createdAt };

  if (!hasSupabase()) {
    memoryStore.users.push(user);
    return user;
  }

  const client = supabase();
  const { data, error } = await client.from("users").insert({
    id: user.id,
    organization_id: user.organizationId,
    name: user.name,
    email: user.email,
    role: user.role,
    password_hash: user.passwordHash,
    created_at: user.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, userMap);
}

export async function updateUserPassword(userId, passwordHash) {
  if (!hasSupabase()) {
    const user = memoryStore.users.find((item) => item.id === userId);
    if (!user) return null;
    user.passwordHash = passwordHash;
    return user;
  }

  const client = supabase();
  const { data, error } = await client
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, userMap) : null;
}

export async function fetchStore(organizationId) {
  if (!hasSupabase()) {
    return {
      organizations: memoryStore.organizations.filter((item) => item.id === organizationId),
      users: memoryStore.users.filter((item) => item.organizationId === organizationId),
      events: memoryStore.events.filter((item) => item.organizationId === organizationId),
      opportunities: memoryStore.opportunities.filter((item) => item.organizationId === organizationId),
      tasks: memoryStore.tasks.filter((item) => item.organizationId === organizationId),
      vendors: memoryStore.vendors.filter((item) => item.organizationId === organizationId),
      budgets: memoryStore.budgets.filter((item) => item.organizationId === organizationId),
      leads: memoryStore.leads.filter((item) => item.organizationId === organizationId),
      booths: memoryStore.booths.filter((item) => item.organizationId === organizationId),
      boothChecklistItems: memoryStore.boothChecklistItems,
      attendees: memoryStore.attendees.filter((item) => item.organizationId === organizationId),
      checkins: memoryStore.checkins.filter((item) => item.organizationId === organizationId),
      assets: memoryStore.assets.filter((item) => item.organizationId === organizationId),
      activities: memoryStore.activities.filter((item) => item.organizationId === organizationId)
    };
  }

  const client = supabase();
  const safeSelect = async (table, queryBuilder) => {
    const result = await queryBuilder(client.from(table));
    if (result.error && result.error.code === "42P01") {
      return { data: [], error: null };
    }
    return result;
  };
  const [
    organizationsResult,
    usersResult,
    eventsResult,
    opportunitiesResult,
    tasksResult,
    vendorsResult,
    budgetsResult,
    leadsResult,
    boothsResult,
    checklistResult,
    attendeesResult,
    checkinsResult,
    assetsResult,
    activitiesResult
  ] = await Promise.all([
    client.from("organizations").select("*").eq("id", organizationId),
    client.from("users").select("*").eq("organization_id", organizationId),
    client.from("events").select("*").eq("organization_id", organizationId),
    client.from("opportunities").select("*").eq("organization_id", organizationId),
    client.from("tasks").select("*").eq("organization_id", organizationId),
    client.from("vendors").select("*").eq("organization_id", organizationId),
    client.from("budgets").select("*").eq("organization_id", organizationId),
    client.from("leads").select("*").eq("organization_id", organizationId),
    client.from("booths").select("*").eq("organization_id", organizationId),
    client.from("booth_checklist_items").select("*"),
    safeSelect("attendees", (query) => query.select("*").eq("organization_id", organizationId)),
    safeSelect("checkins", (query) => query.select("*").eq("organization_id", organizationId)),
    safeSelect("assets", (query) => query.select("*").eq("organization_id", organizationId)),
    client.from("activities").select("*").eq("organization_id", organizationId)
  ]);

  for (const result of [organizationsResult, usersResult, eventsResult, opportunitiesResult, tasksResult, vendorsResult, budgetsResult, leadsResult, boothsResult, checklistResult, attendeesResult, checkinsResult, assetsResult, activitiesResult]) {
    if (result.error) throw result.error;
  }

  return {
    organizations: mapCollection(organizationsResult.data, orgMap),
    users: mapCollection(usersResult.data, userMap),
    events: mapCollection(eventsResult.data, eventMap),
    opportunities: mapCollection(opportunitiesResult.data, opportunityMap),
    tasks: mapCollection(tasksResult.data, taskMap),
    vendors: mapCollection(vendorsResult.data, vendorMap),
    budgets: mapCollection(budgetsResult.data, budgetMap),
    leads: mapCollection(leadsResult.data, leadMap),
    booths: mapCollection(boothsResult.data, boothMap),
    boothChecklistItems: mapCollection(checklistResult.data, checklistMap),
    attendees: mapCollection(attendeesResult.data, attendeeMap).map((item) => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [] })),
    checkins: mapCollection(checkinsResult.data, checkinMap),
    assets: mapCollection(assetsResult.data, assetMap),
    activities: mapCollection(activitiesResult.data, activityMap)
  };
}

function mergeUpdate(record, body, keys) {
  for (const key of keys) {
    if (body[key] !== undefined) {
      record[key] = body[key];
    }
  }
  return record;
}

export async function getSetupStatus() {
  const existingUsers = await countUsers();
  const organization = await getPrimaryOrganization();
  return {
    setupRequired: existingUsers === 0,
    organizationName: organization?.name ?? null,
    existingUsers
  };
}

export async function createEventForOrg(auth, body) {
  const event = {
    id: uuid("evt"),
    organizationId: auth.organizationId,
    name: body.name,
    type: body.type,
    city: body.city,
    country: body.country,
    venue: body.venue,
    startDate: body.startDate,
    endDate: body.endDate,
    ownerUserId: auth.userId,
    status: "Draft",
    health: 42,
    expectedAttendees: Number(body.expectedAttendees || 0),
    expectedLeads: Number(body.expectedLeads || 0),
    budgetTotal: Number(body.budgetTotal || 0),
    budgetSpent: 0,
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.events.unshift(event);
    return event;
  }

  const client = supabase();
  const { data, error } = await client.from("events").insert({
    id: event.id,
    organization_id: event.organizationId,
    name: event.name,
    type: event.type,
    city: event.city,
    country: event.country,
    venue: event.venue,
    start_date: event.startDate,
    end_date: event.endDate,
    owner_user_id: event.ownerUserId,
    status: event.status,
    health: event.health,
    expected_attendees: event.expectedAttendees,
    expected_leads: event.expectedLeads,
    budget_total: event.budgetTotal,
    budget_spent: event.budgetSpent,
    created_at: event.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, eventMap);
}

export async function createLeadForOrg(auth, body) {
  const lead = {
    id: uuid("lead"),
    organizationId: auth.organizationId,
    fullName: body.fullName,
    company: body.company,
    title: body.title,
    email: body.email,
    phone: body.phone,
    eventId: body.eventId,
    ownerUserId: auth.userId,
    priority: body.priority,
    qualificationStatus: "New",
    nextAction: body.nextAction,
    nextFollowUpDate: body.nextFollowUpDate,
    notes: body.notes,
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.leads.unshift(lead);
    return lead;
  }

  const client = supabase();
  const { data, error } = await client.from("leads").insert({
    id: lead.id,
    organization_id: lead.organizationId,
    full_name: lead.fullName,
    company: lead.company,
    title: lead.title,
    email: lead.email,
    phone: lead.phone,
    event_id: lead.eventId,
    owner_user_id: lead.ownerUserId,
    priority: lead.priority,
    qualification_status: lead.qualificationStatus,
    next_action: lead.nextAction,
    next_follow_up_date: lead.nextFollowUpDate,
    notes: lead.notes,
    created_at: lead.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, leadMap);
}

export async function createOpportunityForOrg(auth, body) {
  const opportunity = {
    id: uuid("opp"),
    organizationId: auth.organizationId,
    name: body.name,
    eventType: body.eventType,
    industry: body.industry,
    organizer: body.organizer,
    city: body.city,
    country: body.country,
    startDate: body.startDate,
    endDate: body.endDate,
    participationType: body.participationType,
    boothNeeded: Boolean(body.boothNeeded),
    expectedReach: Number(body.expectedReach || 0),
    expectedLeads: Number(body.expectedLeads || 0),
    strategicFitScore: Number(body.strategicFitScore || 0),
    estimatedCost: Number(body.estimatedCost || 0),
    priority: body.priority || "Medium",
    decision: body.decision || "Proposed",
    ownerUserId: auth.userId,
    notes: body.notes || "",
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.opportunities.unshift(opportunity);
    return opportunity;
  }

  const client = supabase();
  const { data, error } = await client.from("opportunities").insert({
    id: opportunity.id,
    organization_id: opportunity.organizationId,
    name: opportunity.name,
    event_type: opportunity.eventType,
    industry: opportunity.industry,
    organizer: opportunity.organizer,
    city: opportunity.city,
    country: opportunity.country,
    start_date: opportunity.startDate,
    end_date: opportunity.endDate,
    participation_type: opportunity.participationType,
    booth_needed: opportunity.boothNeeded,
    expected_reach: opportunity.expectedReach,
    expected_leads: opportunity.expectedLeads,
    strategic_fit_score: opportunity.strategicFitScore,
    estimated_cost: opportunity.estimatedCost,
    priority: opportunity.priority,
    decision: opportunity.decision,
    owner_user_id: opportunity.ownerUserId,
    notes: opportunity.notes,
    created_at: opportunity.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, opportunityMap);
}

export async function createTaskForOrg(auth, body) {
  const task = {
    id: uuid("task"),
    organizationId: auth.organizationId,
    title: body.title,
    eventId: body.eventId,
    assigneeUserId: body.assigneeUserId || auth.userId,
    dueDate: body.dueDate,
    priority: body.priority || "Medium",
    status: body.status || "Planned",
    notes: body.notes || "",
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.tasks.unshift(task);
    return task;
  }

  const client = supabase();
  const { data, error } = await client.from("tasks").insert({
    id: task.id,
    organization_id: task.organizationId,
    title: task.title,
    event_id: task.eventId,
    assignee_user_id: task.assigneeUserId,
    due_date: task.dueDate,
    priority: task.priority,
    status: task.status,
    notes: task.notes,
    created_at: task.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, taskMap);
}

export async function createVendorForOrg(auth, body) {
  const vendor = {
    id: uuid("vendor"),
    organizationId: auth.organizationId,
    eventId: body.eventId,
    name: body.name,
    category: body.category,
    deliverable: body.deliverable,
    ownerUserId: body.ownerUserId || auth.userId,
    status: body.status || "Planning",
    paymentStatus: body.paymentStatus || "Pending",
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.vendors.unshift(vendor);
    return vendor;
  }

  const client = supabase();
  const { data, error } = await client.from("vendors").insert({
    id: vendor.id,
    organization_id: vendor.organizationId,
    event_id: vendor.eventId,
    name: vendor.name,
    category: vendor.category,
    deliverable: vendor.deliverable,
    owner_user_id: vendor.ownerUserId,
    status: vendor.status,
    payment_status: vendor.paymentStatus,
    created_at: vendor.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, vendorMap);
}

export async function createBudgetForOrg(auth, body) {
  const budget = {
    id: uuid("budget"),
    organizationId: auth.organizationId,
    eventId: body.eventId,
    category: body.category,
    budgeted: Number(body.budgeted || 0),
    actual: Number(body.actual || 0),
    committed: Number(body.committed || 0),
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.budgets.unshift(budget);
    return budget;
  }

  const client = supabase();
  const { data, error } = await client.from("budgets").insert({
    id: budget.id,
    organization_id: budget.organizationId,
    event_id: budget.eventId,
    category: budget.category,
    budgeted: budget.budgeted,
    actual: budget.actual,
    committed: budget.committed,
    created_at: budget.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, budgetMap);
}

export async function updateEventForOrg(auth, eventId, body) {
  if (!hasSupabase()) {
    const event = memoryStore.events.find((item) => item.id === eventId && item.organizationId === auth.organizationId);
    if (!event) return null;
    mergeUpdate(event, body, ["name", "type", "city", "country", "venue", "startDate", "endDate", "ownerUserId", "status", "health", "expectedAttendees", "expectedLeads", "budgetTotal", "budgetSpent"]);
    return event;
  }

  const client = supabase();
  const payload = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.type !== undefined ? { type: body.type } : {}),
    ...(body.city !== undefined ? { city: body.city } : {}),
    ...(body.country !== undefined ? { country: body.country } : {}),
    ...(body.venue !== undefined ? { venue: body.venue } : {}),
    ...(body.startDate !== undefined ? { start_date: body.startDate } : {}),
    ...(body.endDate !== undefined ? { end_date: body.endDate } : {}),
    ...(body.ownerUserId !== undefined ? { owner_user_id: body.ownerUserId } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.health !== undefined ? { health: Number(body.health) } : {}),
    ...(body.expectedAttendees !== undefined ? { expected_attendees: Number(body.expectedAttendees) } : {}),
    ...(body.expectedLeads !== undefined ? { expected_leads: Number(body.expectedLeads) } : {}),
    ...(body.budgetTotal !== undefined ? { budget_total: Number(body.budgetTotal) } : {}),
    ...(body.budgetSpent !== undefined ? { budget_spent: Number(body.budgetSpent) } : {})
  };
  const { data, error } = await client.from("events").update(payload).eq("id", eventId).eq("organization_id", auth.organizationId).select("*").maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, eventMap) : null;
}

export async function deleteEventForOrg(auth, eventId) {
  if (!hasSupabase()) {
    const index = memoryStore.events.findIndex((item) => item.id === eventId && item.organizationId === auth.organizationId);
    if (index === -1) return false;
    memoryStore.events.splice(index, 1);
    return true;
  }

  const client = supabase();
  const { error, count } = await client.from("events").delete({ count: "exact" }).eq("id", eventId).eq("organization_id", auth.organizationId);
  if (error) throw error;
  return Boolean(count);
}

export async function updateOpportunityForOrg(auth, opportunityId, body) {
  if (!hasSupabase()) {
    const opportunity = memoryStore.opportunities.find((item) => item.id === opportunityId && item.organizationId === auth.organizationId);
    if (!opportunity) return null;
    mergeUpdate(opportunity, body, ["name", "eventType", "industry", "organizer", "city", "country", "startDate", "endDate", "participationType", "boothNeeded", "expectedReach", "expectedLeads", "strategicFitScore", "estimatedCost", "priority", "decision", "ownerUserId", "notes"]);
    return opportunity;
  }

  const client = supabase();
  const payload = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.eventType !== undefined ? { event_type: body.eventType } : {}),
    ...(body.industry !== undefined ? { industry: body.industry } : {}),
    ...(body.organizer !== undefined ? { organizer: body.organizer } : {}),
    ...(body.city !== undefined ? { city: body.city } : {}),
    ...(body.country !== undefined ? { country: body.country } : {}),
    ...(body.startDate !== undefined ? { start_date: body.startDate } : {}),
    ...(body.endDate !== undefined ? { end_date: body.endDate } : {}),
    ...(body.participationType !== undefined ? { participation_type: body.participationType } : {}),
    ...(body.boothNeeded !== undefined ? { booth_needed: Boolean(body.boothNeeded) } : {}),
    ...(body.expectedReach !== undefined ? { expected_reach: Number(body.expectedReach) } : {}),
    ...(body.expectedLeads !== undefined ? { expected_leads: Number(body.expectedLeads) } : {}),
    ...(body.strategicFitScore !== undefined ? { strategic_fit_score: Number(body.strategicFitScore) } : {}),
    ...(body.estimatedCost !== undefined ? { estimated_cost: Number(body.estimatedCost) } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.decision !== undefined ? { decision: body.decision } : {}),
    ...(body.ownerUserId !== undefined ? { owner_user_id: body.ownerUserId } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {})
  };
  const { data, error } = await client.from("opportunities").update(payload).eq("id", opportunityId).eq("organization_id", auth.organizationId).select("*").maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, opportunityMap) : null;
}

export async function deleteOpportunityForOrg(auth, opportunityId) {
  if (!hasSupabase()) {
    const index = memoryStore.opportunities.findIndex((item) => item.id === opportunityId && item.organizationId === auth.organizationId);
    if (index === -1) return false;
    memoryStore.opportunities.splice(index, 1);
    return true;
  }
  const client = supabase();
  const { error, count } = await client.from("opportunities").delete({ count: "exact" }).eq("id", opportunityId).eq("organization_id", auth.organizationId);
  if (error) throw error;
  return Boolean(count);
}

export async function updateTaskForOrg(auth, taskId, body) {
  if (!hasSupabase()) {
    const task = memoryStore.tasks.find((item) => item.id === taskId && item.organizationId === auth.organizationId);
    if (!task) return null;
    mergeUpdate(task, body, ["title", "eventId", "assigneeUserId", "dueDate", "priority", "status", "notes"]);
    return task;
  }
  const client = supabase();
  const payload = {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.eventId !== undefined ? { event_id: body.eventId } : {}),
    ...(body.assigneeUserId !== undefined ? { assignee_user_id: body.assigneeUserId } : {}),
    ...(body.dueDate !== undefined ? { due_date: body.dueDate } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {})
  };
  const { data, error } = await client.from("tasks").update(payload).eq("id", taskId).eq("organization_id", auth.organizationId).select("*").maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, taskMap) : null;
}

export async function deleteTaskForOrg(auth, taskId) {
  if (!hasSupabase()) {
    const index = memoryStore.tasks.findIndex((item) => item.id === taskId && item.organizationId === auth.organizationId);
    if (index === -1) return false;
    memoryStore.tasks.splice(index, 1);
    return true;
  }
  const client = supabase();
  const { error, count } = await client.from("tasks").delete({ count: "exact" }).eq("id", taskId).eq("organization_id", auth.organizationId);
  if (error) throw error;
  return Boolean(count);
}

export async function updateVendorForOrg(auth, vendorId, body) {
  if (!hasSupabase()) {
    const vendor = memoryStore.vendors.find((item) => item.id === vendorId && item.organizationId === auth.organizationId);
    if (!vendor) return null;
    mergeUpdate(vendor, body, ["eventId", "name", "category", "deliverable", "ownerUserId", "status", "paymentStatus"]);
    return vendor;
  }
  const client = supabase();
  const payload = {
    ...(body.eventId !== undefined ? { event_id: body.eventId } : {}),
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.category !== undefined ? { category: body.category } : {}),
    ...(body.deliverable !== undefined ? { deliverable: body.deliverable } : {}),
    ...(body.ownerUserId !== undefined ? { owner_user_id: body.ownerUserId } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.paymentStatus !== undefined ? { payment_status: body.paymentStatus } : {})
  };
  const { data, error } = await client.from("vendors").update(payload).eq("id", vendorId).eq("organization_id", auth.organizationId).select("*").maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, vendorMap) : null;
}

export async function deleteVendorForOrg(auth, vendorId) {
  if (!hasSupabase()) {
    const index = memoryStore.vendors.findIndex((item) => item.id === vendorId && item.organizationId === auth.organizationId);
    if (index === -1) return false;
    memoryStore.vendors.splice(index, 1);
    return true;
  }
  const client = supabase();
  const { error, count } = await client.from("vendors").delete({ count: "exact" }).eq("id", vendorId).eq("organization_id", auth.organizationId);
  if (error) throw error;
  return Boolean(count);
}

export async function updateBudgetForOrg(auth, budgetId, body) {
  if (!hasSupabase()) {
    const budget = memoryStore.budgets.find((item) => item.id === budgetId && item.organizationId === auth.organizationId);
    if (!budget) return null;
    mergeUpdate(budget, body, ["eventId", "category", "budgeted", "actual", "committed"]);
    return budget;
  }
  const client = supabase();
  const payload = {
    ...(body.eventId !== undefined ? { event_id: body.eventId } : {}),
    ...(body.category !== undefined ? { category: body.category } : {}),
    ...(body.budgeted !== undefined ? { budgeted: Number(body.budgeted) } : {}),
    ...(body.actual !== undefined ? { actual: Number(body.actual) } : {}),
    ...(body.committed !== undefined ? { committed: Number(body.committed) } : {})
  };
  const { data, error } = await client.from("budgets").update(payload).eq("id", budgetId).eq("organization_id", auth.organizationId).select("*").maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, budgetMap) : null;
}

export async function deleteBudgetForOrg(auth, budgetId) {
  if (!hasSupabase()) {
    const index = memoryStore.budgets.findIndex((item) => item.id === budgetId && item.organizationId === auth.organizationId);
    if (index === -1) return false;
    memoryStore.budgets.splice(index, 1);
    return true;
  }
  const client = supabase();
  const { error, count } = await client.from("budgets").delete({ count: "exact" }).eq("id", budgetId).eq("organization_id", auth.organizationId);
  if (error) throw error;
  return Boolean(count);
}

export async function updateLeadForOrg(auth, leadId, body) {
  if (!hasSupabase()) {
    const lead = memoryStore.leads.find((item) => item.id === leadId && item.organizationId === auth.organizationId);
    if (!lead) return null;
    mergeUpdate(lead, body, ["fullName", "company", "title", "email", "phone", "eventId", "ownerUserId", "priority", "qualificationStatus", "nextAction", "nextFollowUpDate", "notes"]);
    return lead;
  }
  const client = supabase();
  const payload = {
    ...(body.fullName !== undefined ? { full_name: body.fullName } : {}),
    ...(body.company !== undefined ? { company: body.company } : {}),
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.email !== undefined ? { email: body.email } : {}),
    ...(body.phone !== undefined ? { phone: body.phone } : {}),
    ...(body.eventId !== undefined ? { event_id: body.eventId } : {}),
    ...(body.ownerUserId !== undefined ? { owner_user_id: body.ownerUserId } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.qualificationStatus !== undefined ? { qualification_status: body.qualificationStatus } : {}),
    ...(body.nextAction !== undefined ? { next_action: body.nextAction } : {}),
    ...(body.nextFollowUpDate !== undefined ? { next_follow_up_date: body.nextFollowUpDate } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {})
  };
  const { data, error } = await client.from("leads").update(payload).eq("id", leadId).eq("organization_id", auth.organizationId).select("*").maybeSingle();
  if (error) throw error;
  return data ? mapRow(data, leadMap) : null;
}

export async function deleteLeadForOrg(auth, leadId) {
  if (!hasSupabase()) {
    const index = memoryStore.leads.findIndex((item) => item.id === leadId && item.organizationId === auth.organizationId);
    if (index === -1) return false;
    memoryStore.leads.splice(index, 1);
    return true;
  }
  const client = supabase();
  const { error, count } = await client.from("leads").delete({ count: "exact" }).eq("id", leadId).eq("organization_id", auth.organizationId);
  if (error) throw error;
  return Boolean(count);
}

export async function createAttendeeForOrg(auth, body) {
  const attendee = {
    id: uuid("attendee"),
    organizationId: auth.organizationId,
    eventId: body.eventId,
    fullName: body.fullName,
    email: normalizeEmail(body.email),
    phone: body.phone || "-",
    company: body.company || "",
    city: body.city || "",
    ticketType: body.ticketType || "General",
    registrationStatus: body.registrationStatus || "Confirmed",
    checkInStatus: body.checkInStatus || "Pending",
    source: body.source || "Manual",
    tags: Array.isArray(body.tags) ? body.tags : [],
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.attendees.unshift(attendee);
    return attendee;
  }
  const client = supabase();
  const { data, error } = await client.from("attendees").insert({
    id: attendee.id,
    organization_id: attendee.organizationId,
    event_id: attendee.eventId,
    full_name: attendee.fullName,
    email: attendee.email,
    phone: attendee.phone,
    company: attendee.company,
    city: attendee.city,
    ticket_type: attendee.ticketType,
    registration_status: attendee.registrationStatus,
    check_in_status: attendee.checkInStatus,
    source: attendee.source,
    tags: attendee.tags,
    created_at: attendee.createdAt
  }).select("*").single();
  if (error) throw error;
  return { ...mapRow(data, attendeeMap), tags: Array.isArray(data.tags) ? data.tags : [] };
}

export async function importAttendeesForOrg(auth, rows) {
  const created = [];
  for (const row of rows) {
    if (!row.fullName || !row.email || !row.eventId) continue;
    created.push(await createAttendeeForOrg(auth, row));
  }
  return created;
}

export async function mergeAttendeesForOrg(auth, sourceAttendeeId, targetAttendeeId) {
  if (sourceAttendeeId === targetAttendeeId) return null;

  if (!hasSupabase()) {
    const source = memoryStore.attendees.find((item) => item.id === sourceAttendeeId && item.organizationId === auth.organizationId);
    const target = memoryStore.attendees.find((item) => item.id === targetAttendeeId && item.organizationId === auth.organizationId);
    if (!source || !target) return null;

    target.phone = target.phone || source.phone;
    target.company = target.company || source.company;
    target.city = target.city || source.city;
    target.tags = Array.from(new Set([...(target.tags || []), ...(source.tags || [])]));
    if (source.checkInStatus === "Checked In") {
      target.checkInStatus = "Checked In";
    }

    for (const checkin of memoryStore.checkins.filter((item) => item.attendeeId === source.id)) {
      checkin.attendeeId = target.id;
    }

    memoryStore.attendees = memoryStore.attendees.filter((item) => item.id !== source.id);
    globalThis.__partyScriptDb = memoryStore;
    return target;
  }

  const client = supabase();
  const { data: sourceRow, error: sourceError } = await client.from("attendees").select("*").eq("id", sourceAttendeeId).eq("organization_id", auth.organizationId).maybeSingle();
  if (sourceError) throw sourceError;
  const { data: targetRow, error: targetError } = await client.from("attendees").select("*").eq("id", targetAttendeeId).eq("organization_id", auth.organizationId).maybeSingle();
  if (targetError) throw targetError;
  if (!sourceRow || !targetRow) return null;

  const mergedTags = Array.from(new Set([...(targetRow.tags || []), ...(sourceRow.tags || [])]));
  const { data: updatedTarget, error: updateError } = await client.from("attendees").update({
    phone: targetRow.phone || sourceRow.phone || "",
    company: targetRow.company || sourceRow.company || "",
    city: targetRow.city || sourceRow.city || "",
    tags: mergedTags,
    check_in_status: sourceRow.check_in_status === "Checked In" ? "Checked In" : targetRow.check_in_status
  }).eq("id", targetAttendeeId).eq("organization_id", auth.organizationId).select("*").maybeSingle();
  if (updateError) throw updateError;

  const { error: reassignError } = await client.from("checkins").update({ attendee_id: targetAttendeeId }).eq("attendee_id", sourceAttendeeId).eq("organization_id", auth.organizationId);
  if (reassignError) throw reassignError;

  const { error: deleteError } = await client.from("attendees").delete().eq("id", sourceAttendeeId).eq("organization_id", auth.organizationId);
  if (deleteError) throw deleteError;

  return updatedTarget ? { ...mapRow(updatedTarget, attendeeMap), tags: Array.isArray(updatedTarget.tags) ? updatedTarget.tags : [] } : null;
}

export async function createCheckinForOrg(auth, body) {
  const baseCheckin = {
    id: uuid("checkin"),
    organizationId: auth.organizationId,
    attendeeId: body.attendeeId,
    eventId: body.eventId,
    status: "success",
    checkedInAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    const attendee = memoryStore.attendees.find((item) => item.id === baseCheckin.attendeeId && item.organizationId === auth.organizationId);
    const alreadyCheckedIn = memoryStore.checkins.some((item) => item.attendeeId === baseCheckin.attendeeId && item.eventId === baseCheckin.eventId && item.status !== "duplicate");
    const checkin = {
      ...baseCheckin,
      status: alreadyCheckedIn ? "duplicate" : hasVipTag(attendee || { tags: [] }) ? "VIP" : "success"
    };
    memoryStore.checkins.unshift(checkin);
    if (attendee && checkin.status !== "duplicate") attendee.checkInStatus = "Checked In";
    return checkin;
  }
  const client = supabase();
  const { data: attendeeRow, error: attendeeError } = await client.from("attendees").select("*").eq("id", baseCheckin.attendeeId).eq("organization_id", auth.organizationId).maybeSingle();
  if (attendeeError) throw attendeeError;
  const { data: existingCheckinRows, error: existingCheckinError } = await client.from("checkins").select("id,status").eq("attendee_id", baseCheckin.attendeeId).eq("event_id", baseCheckin.eventId).eq("organization_id", auth.organizationId);
  if (existingCheckinError) throw existingCheckinError;
  const alreadyCheckedIn = (existingCheckinRows || []).some((item) => item.status !== "duplicate");
  const checkin = {
    ...baseCheckin,
    status: alreadyCheckedIn ? "duplicate" : hasVipTag({ tags: attendeeRow?.tags || [] }) ? "VIP" : "success"
  };
  const { data, error } = await client.from("checkins").insert({
    id: checkin.id,
    organization_id: checkin.organizationId,
    attendee_id: checkin.attendeeId,
    event_id: checkin.eventId,
    status: checkin.status,
    checked_in_at: checkin.checkedInAt,
    created_at: checkin.createdAt
  }).select("*").single();
  if (error) throw error;
  if (attendeeRow && checkin.status !== "duplicate") {
    const { error: attendeeUpdateError } = await client.from("attendees").update({ check_in_status: "Checked In" }).eq("id", attendeeRow.id).eq("organization_id", auth.organizationId);
    if (attendeeUpdateError) throw attendeeUpdateError;
  }
  return mapRow(data, checkinMap);
}

export async function createAssetForOrg(auth, body) {
  const asset = {
    id: uuid("asset"),
    organizationId: auth.organizationId,
    eventId: body.eventId,
    name: body.name,
    category: body.category || "general",
    fileUrl: body.fileUrl,
    createdByUserId: auth.userId,
    createdAt: new Date().toISOString()
  };

  if (!hasSupabase()) {
    memoryStore.assets.unshift(asset);
    return asset;
  }
  const client = supabase();
  const { data, error } = await client.from("assets").insert({
    id: asset.id,
    organization_id: asset.organizationId,
    event_id: asset.eventId,
    name: asset.name,
    category: asset.category,
    file_url: asset.fileUrl,
    created_by_user_id: asset.createdByUserId,
    created_at: asset.createdAt
  }).select("*").single();
  if (error) throw error;
  return mapRow(data, assetMap);
}

export async function uploadAssetForOrg(auth, body) {
  const fileName = String(body.fileName || "asset.bin");
  const mimeType = String(body.mimeType || "application/octet-stream");
  const contentBase64 = String(body.contentBase64 || "");
  const assetName = String(body.name || fileName);
  const category = String(body.category || "general");
  const eventId = String(body.eventId || "");
  const bucketName = "party-script-assets";
  const path = `${auth.organizationId}/${eventId || "unassigned"}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;

  if (!hasSupabase()) {
    return createAssetForOrg(auth, {
      eventId,
      name: assetName,
      category,
      fileUrl: `data:${mimeType};base64,${contentBase64}`
    });
  }

  const client = supabase();
  const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
  if (bucketsError) throw bucketsError;
  if (!(buckets || []).some((bucket) => bucket.name === bucketName)) {
    const { error: createBucketError } = await client.storage.createBucket(bucketName, { public: true });
    if (createBucketError && !String(createBucketError.message || "").toLowerCase().includes("already")) throw createBucketError;
  }

  const fileBuffer = Buffer.from(contentBase64, "base64");
  const { error: uploadError } = await client.storage.from(bucketName).upload(path, fileBuffer, {
    contentType: mimeType,
    upsert: false
  });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(path);
  return createAssetForOrg(auth, {
    eventId,
    name: assetName,
    category,
    fileUrl: publicUrlData.publicUrl
  });
}

export async function convertOpportunity(auth, opportunityId) {
  if (!hasSupabase()) {
    const opportunity = memoryStore.opportunities.find((item) => item.id === opportunityId && item.organizationId === auth.organizationId);
    if (!opportunity) return null;
    opportunity.decision = "Converted to Event";
    const event = {
      id: uuid("evt"),
      organizationId: auth.organizationId,
      name: opportunity.name,
      type: opportunity.eventType,
      city: opportunity.city,
      country: opportunity.country,
      venue: opportunity.organizer,
      startDate: opportunity.startDate,
      endDate: opportunity.endDate,
      ownerUserId: opportunity.ownerUserId,
      status: "Planning",
      health: 55,
      expectedAttendees: 0,
      expectedLeads: opportunity.expectedLeads,
      budgetTotal: opportunity.estimatedCost,
      budgetSpent: 0,
      createdAt: new Date().toISOString()
    };
    memoryStore.events.unshift(event);
    return { event, opportunity };
  }

  const client = supabase();
  const { data: opportunityRow, error: opportunityError } = await client
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();
  if (opportunityError) throw opportunityError;
  if (!opportunityRow) return null;

  const opportunity = mapRow(opportunityRow, opportunityMap);
  const { error: updateError } = await client.from("opportunities").update({ decision: "Converted to Event" }).eq("id", opportunityId);
  if (updateError) throw updateError;

  const event = await createEventForOrg(auth, {
    name: opportunity.name,
    type: opportunity.eventType,
    city: opportunity.city,
    country: opportunity.country,
    venue: opportunity.organizer,
    startDate: opportunity.startDate,
    endDate: opportunity.endDate,
    expectedAttendees: 0,
    expectedLeads: opportunity.expectedLeads,
    budgetTotal: opportunity.estimatedCost
  });

  return { event, opportunity: { ...opportunity, decision: "Converted to Event" } };
}
