import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import type { ActivityRecord, BoothChecklistItem, BoothRecord, BudgetItem, Database, EventRecord, LeadRecord, OpportunityRecord, Organization, TaskRecord, User, VendorRecord } from "./types.js";

const now = new Date().toISOString();

const organization: Organization = {
  id: "org_partyscript",
  name: "Party Script Labs",
  slug: "party-script-labs",
  createdAt: now
};

const users: User[] = [
  {
    id: "user_aarav",
    organizationId: organization.id,
    name: "Aarav Mehta",
    email: "founder@partyscript.app",
    role: "Founder",
    passwordHash: bcrypt.hashSync("partyscript123", 10),
    createdAt: now
  },
  {
    id: "user_diya",
    organizationId: organization.id,
    name: "Diya Kapoor",
    email: "ops@partyscript.app",
    role: "Operations Lead",
    passwordHash: bcrypt.hashSync("partyscript123", 10),
    createdAt: now
  },
  {
    id: "user_rhea",
    organizationId: organization.id,
    name: "Rhea Nair",
    email: "growth@partyscript.app",
    role: "Growth Lead",
    passwordHash: bcrypt.hashSync("partyscript123", 10),
    createdAt: now
  }
];

const events: EventRecord[] = [
  {
    id: "evt_gtm_summit",
    organizationId: organization.id,
    name: "SaaS GTM Summit 2026",
    type: "Hosted Event",
    city: "Bengaluru",
    country: "India",
    venue: "Sheraton Grand",
    startDate: "2026-05-12",
    endDate: "2026-05-13",
    ownerUserId: "user_aarav",
    status: "Upcoming",
    health: 86,
    expectedAttendees: 1400,
    expectedLeads: 180,
    budgetTotal: 2250000,
    budgetSpent: 1480000,
    createdAt: now
  },
  {
    id: "evt_startup_expo",
    organizationId: organization.id,
    name: "India Startup Expo 2026",
    type: "Exhibition Booth",
    city: "Mumbai",
    country: "India",
    venue: "NESCO Hall 2",
    startDate: "2026-06-04",
    endDate: "2026-06-06",
    ownerUserId: "user_diya",
    status: "Planning",
    health: 71,
    expectedAttendees: 0,
    expectedLeads: 320,
    budgetTotal: 3180000,
    budgetSpent: 2140000,
    createdAt: now
  },
  {
    id: "evt_fintech_meetup",
    organizationId: organization.id,
    name: "Fintech Circle Meetup",
    type: "Community Event",
    city: "Delhi",
    country: "India",
    venue: "91Springboard",
    startDate: "2026-04-30",
    endDate: "2026-04-30",
    ownerUserId: "user_rhea",
    status: "Live",
    health: 92,
    expectedAttendees: 388,
    expectedLeads: 54,
    budgetTotal: 620000,
    budgetSpent: 470000,
    createdAt: now
  }
];

const opportunities: OpportunityRecord[] = [
  {
    id: "opp_retailx",
    organizationId: organization.id,
    name: "RetailX Asia",
    eventType: "Exhibition Booth",
    industry: "Retail Tech",
    organizer: "RetailX Group",
    city: "Singapore",
    country: "Singapore",
    startDate: "2026-08-14",
    endDate: "2026-08-16",
    participationType: "Booth",
    boothNeeded: true,
    expectedReach: 12000,
    expectedLeads: 240,
    strategicFitScore: 84,
    estimatedCost: 2800000,
    priority: "High",
    decision: "Approved",
    ownerUserId: "user_aarav",
    notes: "Strong enterprise buyer mix and investor visibility.",
    createdAt: now
  },
  {
    id: "opp_ai_growth",
    organizationId: organization.id,
    name: "AI Growth Week",
    eventType: "Conference Visit",
    industry: "SaaS",
    organizer: "ScaleGrid Media",
    city: "Bengaluru",
    country: "India",
    startDate: "2026-07-03",
    endDate: "2026-07-04",
    participationType: "Sponsor",
    boothNeeded: true,
    expectedReach: 8500,
    expectedLeads: 190,
    strategicFitScore: 91,
    estimatedCost: 1900000,
    priority: "Critical",
    decision: "Registered",
    ownerUserId: "user_rhea",
    notes: "High founder density and strong GTM fit.",
    createdAt: now
  }
];

const tasks: TaskRecord[] = [
  {
    id: uuid(),
    organizationId: organization.id,
    title: "Approve final booth print collateral",
    eventId: "evt_startup_expo",
    assigneeUserId: "user_diya",
    dueDate: "2026-04-24",
    priority: "High",
    status: "Waiting",
    notes: "Awaiting final marketing sign-off before dispatch.",
    createdAt: now
  },
  {
    id: uuid(),
    organizationId: organization.id,
    title: "Confirm VIP roundtable guest list",
    eventId: "evt_gtm_summit",
    assigneeUserId: "user_rhea",
    dueDate: "2026-04-25",
    priority: "Medium",
    status: "In Progress",
    notes: "Need founder approvals on final 12 invitees.",
    createdAt: now
  },
  {
    id: uuid(),
    organizationId: organization.id,
    title: "Test lead capture tablets on venue Wi-Fi",
    eventId: "evt_startup_expo",
    assigneeUserId: "user_aarav",
    dueDate: "2026-04-28",
    priority: "High",
    status: "Planned",
    notes: "Validate offline fallback before ship date.",
    createdAt: now
  }
];

const vendors: VendorRecord[] = [
  {
    id: uuid(),
    organizationId: organization.id,
    eventId: "evt_startup_expo",
    name: "PixelForge Studio",
    category: "Booth fabrication",
    deliverable: "Final booth build",
    ownerUserId: "user_diya",
    status: "In Production",
    paymentStatus: "60% paid",
    createdAt: now
  },
  {
    id: uuid(),
    organizationId: organization.id,
    eventId: "evt_startup_expo",
    name: "PrimePrint Works",
    category: "Printing",
    deliverable: "Backdrops and leaflets",
    ownerUserId: "user_rhea",
    status: "At Risk",
    paymentStatus: "PO sent",
    createdAt: now
  }
];

const budgets: BudgetItem[] = [
  { id: uuid(), organizationId: organization.id, eventId: "evt_startup_expo", category: "Booth fabrication", budgeted: 1200000, actual: 860000, committed: 210000, createdAt: now },
  { id: uuid(), organizationId: organization.id, eventId: "evt_startup_expo", category: "Travel and stay", budgeted: 440000, actual: 380000, committed: 20000, createdAt: now },
  { id: uuid(), organizationId: organization.id, eventId: "evt_startup_expo", category: "Printing", budgeted: 220000, actual: 250000, committed: 0, createdAt: now },
  { id: uuid(), organizationId: organization.id, eventId: "evt_gtm_summit", category: "Venue", budgeted: 900000, actual: 650000, committed: 180000, createdAt: now }
];

const leads: LeadRecord[] = [
  {
    id: uuid(),
    organizationId: organization.id,
    fullName: "Niharika Shah",
    company: "CloudMint",
    title: "Revenue Operations Lead",
    email: "niharika@cloudmint.ai",
    phone: "+91 9876501234",
    eventId: "evt_fintech_meetup",
    ownerUserId: "user_rhea",
    priority: "High",
    qualificationStatus: "Hot",
    nextAction: "Book product demo",
    nextFollowUpDate: "2026-04-24",
    notes: "Interested in replacing current event ops stack before Q3.",
    createdAt: now
  },
  {
    id: uuid(),
    organizationId: organization.id,
    fullName: "Arjun Bedi",
    company: "ScaleForge",
    title: "Founder",
    email: "arjun@scaleforge.io",
    phone: "+91 9988776655",
    eventId: "evt_startup_expo",
    ownerUserId: "user_aarav",
    priority: "Medium",
    qualificationStatus: "Qualified",
    nextAction: "Share booth recap",
    nextFollowUpDate: "2026-04-25",
    notes: "Wants a team rollout after expo season.",
    createdAt: now
  }
];

const booths: BoothRecord[] = [
  {
    id: "booth_startup_expo",
    organizationId: organization.id,
    eventId: "evt_startup_expo",
    status: "In Production",
    setupCompletion: 71,
    materialReadiness: 78,
    staffAssigned: 8,
    meetingsBooked: 36,
    leadsCaptured: 184,
    createdAt: now
  }
];

const boothChecklistItems: BoothChecklistItem[] = [
  { id: uuid(), boothId: "booth_startup_expo", ownerUserId: "user_aarav", label: "Organizer formalities submitted", dueDate: "2026-04-24", status: "Done" },
  { id: uuid(), boothId: "booth_startup_expo", ownerUserId: "user_diya", label: "Booth design approval", dueDate: "2026-04-25", status: "Waiting" },
  { id: uuid(), boothId: "booth_startup_expo", ownerUserId: "user_rhea", label: "Shipping labels printed", dueDate: "2026-04-27", status: "Planned" },
  { id: uuid(), boothId: "booth_startup_expo", ownerUserId: "user_aarav", label: "Lead capture tablets tested", dueDate: "2026-04-28", status: "In Progress" }
];

const activities: ActivityRecord[] = [
  { id: uuid(), organizationId: organization.id, actorUserId: "user_rhea", kind: "lead", message: "Qualified 12 expo leads into active follow-up.", createdAt: now },
  { id: uuid(), organizationId: organization.id, actorUserId: "user_diya", kind: "vendor", message: "Flagged print collateral delay for PrimePrint Works.", createdAt: now },
  { id: uuid(), organizationId: organization.id, actorUserId: "user_aarav", kind: "booth", message: "Updated day one staffing roster for the expo booth.", createdAt: now }
];

export function createSeedDatabase(): Database {
  return {
    organizations: [organization],
    users,
    events,
    opportunities,
    tasks,
    vendors,
    budgets,
    leads,
    booths,
    boothChecklistItems,
    activities
  };
}
