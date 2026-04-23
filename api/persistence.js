import { createClient } from "@supabase/supabase-js";
import { createSeedStore } from "./seed.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const memoryStore = globalThis.__partyScriptDb || createSeedStore();
globalThis.__partyScriptDb = memoryStore;

function hasSupabase() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function supabase() {
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
const activityMap = { id: "id", organizationId: "organization_id", actorUserId: "actor_user_id", kind: "kind", message: "message", createdAt: "created_at" };

function mapCollection(rows, mapping) {
  return (rows ?? []).map((row) => mapRow(row, mapping));
}

function uuid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function persistenceMode() {
  return hasSupabase() ? "supabase" : "seed";
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

export async function createUser({ name, email, passwordHash }) {
  const createdAt = new Date().toISOString();
  const organizationId = "org_partyscript";
  const user = { id: uuid("user"), organizationId, name, email: email.toLowerCase(), role: "Admin", passwordHash, createdAt };

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
      activities: memoryStore.activities.filter((item) => item.organizationId === organizationId)
    };
  }

  const client = supabase();
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
    client.from("activities").select("*").eq("organization_id", organizationId)
  ]);

  for (const result of [organizationsResult, usersResult, eventsResult, opportunitiesResult, tasksResult, vendorsResult, budgetsResult, leadsResult, boothsResult, checklistResult, activitiesResult]) {
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
    activities: mapCollection(activitiesResult.data, activityMap)
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
