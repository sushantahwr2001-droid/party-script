export type EventStatus = "Draft" | "Planning" | "Upcoming" | "Live" | "Completed" | "Archived" | "Cancelled";
export type OpportunityDecision = "Proposed" | "Watchlist" | "Researching" | "Maybe" | "Skip" | "Approved" | "Registered" | "Converted to Event";
export type BoothStatus = "Planned" | "In Production" | "Ready to Ship" | "On Site" | "Live" | "Wrap Up" | "Closed";
export type LeadQualification = "New" | "Contacted" | "Qualified" | "Hot" | "Warm" | "Cold" | "Won" | "Lost" | "Archived";
export type TaskStatus = "Backlog" | "Planned" | "In Progress" | "Waiting" | "Done" | "Blocked";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  city: string;
  country: string;
  venue: string;
  startDate: string;
  endDate: string;
  ownerUserId: string;
  status: EventStatus;
  health: number;
  expectedAttendees: number;
  expectedLeads: number;
  budgetTotal: number;
  budgetSpent: number;
  createdAt: string;
}

export interface OpportunityRecord {
  id: string;
  organizationId: string;
  name: string;
  eventType: string;
  industry: string;
  organizer: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  participationType: string;
  boothNeeded: boolean;
  expectedReach: number;
  expectedLeads: number;
  strategicFitScore: number;
  estimatedCost: number;
  priority: string;
  decision: OpportunityDecision;
  ownerUserId: string;
  notes: string;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  organizationId: string;
  title: string;
  eventId: string;
  assigneeUserId: string;
  dueDate: string;
  priority: string;
  status: TaskStatus;
  notes: string;
  createdAt: string;
}

export interface VendorRecord {
  id: string;
  organizationId: string;
  eventId: string;
  name: string;
  category: string;
  deliverable: string;
  ownerUserId: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  organizationId: string;
  eventId: string;
  category: string;
  budgeted: number;
  actual: number;
  committed: number;
  createdAt: string;
}

export interface LeadRecord {
  id: string;
  organizationId: string;
  fullName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  eventId: string;
  ownerUserId: string;
  priority: string;
  qualificationStatus: LeadQualification;
  nextAction: string;
  nextFollowUpDate: string;
  notes: string;
  createdAt: string;
}

export interface BoothRecord {
  id: string;
  organizationId: string;
  eventId: string;
  status: BoothStatus;
  setupCompletion: number;
  materialReadiness: number;
  staffAssigned: number;
  meetingsBooked: number;
  leadsCaptured: number;
  createdAt: string;
}

export interface BoothChecklistItem {
  id: string;
  boothId: string;
  ownerUserId: string;
  label: string;
  dueDate: string;
  status: string;
}

export interface ActivityRecord {
  id: string;
  organizationId: string;
  actorUserId: string;
  kind: string;
  message: string;
  createdAt: string;
}

export interface Database {
  organizations: Organization[];
  users: User[];
  events: EventRecord[];
  opportunities: OpportunityRecord[];
  tasks: TaskRecord[];
  vendors: VendorRecord[];
  budgets: BudgetItem[];
  leads: LeadRecord[];
  booths: BoothRecord[];
  boothChecklistItems: BoothChecklistItem[];
  activities: ActivityRecord[];
}
