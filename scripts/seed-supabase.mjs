import { createClient } from "@supabase/supabase-js";
import { createSeedStore } from "../api/seed.js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const seed = createSeedStore();

async function upsert(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    throw error;
  }
}

async function main() {
  await upsert("organizations", seed.organizations.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    created_at: row.createdAt
  })));

  await upsert("users", seed.users.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    name: row.name,
    email: row.email,
    role: row.role,
    password_hash: row.passwordHash,
    created_at: row.createdAt
  })));

  await upsert("events", seed.events.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    name: row.name,
    type: row.type,
    city: row.city,
    country: row.country,
    venue: row.venue,
    start_date: row.startDate,
    end_date: row.endDate,
    owner_user_id: row.ownerUserId,
    status: row.status,
    health: row.health,
    expected_attendees: row.expectedAttendees,
    expected_leads: row.expectedLeads,
    budget_total: row.budgetTotal,
    budget_spent: row.budgetSpent,
    created_at: row.createdAt
  })));

  await upsert("opportunities", seed.opportunities.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    name: row.name,
    event_type: row.eventType,
    industry: row.industry,
    organizer: row.organizer,
    city: row.city,
    country: row.country,
    start_date: row.startDate,
    end_date: row.endDate,
    participation_type: row.participationType,
    booth_needed: row.boothNeeded,
    expected_reach: row.expectedReach,
    expected_leads: row.expectedLeads,
    strategic_fit_score: row.strategicFitScore,
    estimated_cost: row.estimatedCost,
    priority: row.priority,
    decision: row.decision,
    owner_user_id: row.ownerUserId,
    notes: row.notes,
    created_at: row.createdAt
  })));

  await upsert("tasks", seed.tasks.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    title: row.title,
    event_id: row.eventId,
    assignee_user_id: row.assigneeUserId,
    due_date: row.dueDate,
    priority: row.priority,
    status: row.status,
    notes: row.notes,
    created_at: row.createdAt
  })));

  await upsert("vendors", seed.vendors.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    event_id: row.eventId,
    name: row.name,
    category: row.category,
    deliverable: row.deliverable,
    owner_user_id: row.ownerUserId,
    status: row.status,
    payment_status: row.paymentStatus,
    created_at: row.createdAt
  })));

  await upsert("budgets", seed.budgets.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    event_id: row.eventId,
    category: row.category,
    budgeted: row.budgeted,
    actual: row.actual,
    committed: row.committed,
    created_at: row.createdAt
  })));

  await upsert("leads", seed.leads.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    full_name: row.fullName,
    company: row.company,
    title: row.title,
    email: row.email,
    phone: row.phone,
    event_id: row.eventId,
    owner_user_id: row.ownerUserId,
    priority: row.priority,
    qualification_status: row.qualificationStatus,
    next_action: row.nextAction,
    next_follow_up_date: row.nextFollowUpDate,
    notes: row.notes,
    created_at: row.createdAt
  })));

  await upsert("booths", seed.booths.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    event_id: row.eventId,
    status: row.status,
    setup_completion: row.setupCompletion,
    material_readiness: row.materialReadiness,
    staff_assigned: row.staffAssigned,
    meetings_booked: row.meetingsBooked,
    leads_captured: row.leadsCaptured,
    created_at: row.createdAt
  })));

  await upsert("booth_checklist_items", seed.boothChecklistItems.map((row) => ({
    id: row.id,
    booth_id: row.boothId,
    owner_user_id: row.ownerUserId,
    label: row.label,
    due_date: row.dueDate,
    status: row.status
  })));

  await upsert("activities", seed.activities.map((row) => ({
    id: row.id,
    organization_id: row.organizationId,
    actor_user_id: row.actorUserId,
    kind: row.kind,
    message: row.message,
    created_at: row.createdAt
  })));

  console.log("Supabase seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
