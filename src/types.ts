import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type ModuleId =
  | "dashboard"
  | "events"
  | "opportunities"
  | "calendar"
  | "tasks"
  | "attendees"
  | "tickets"
  | "checkins"
  | "vendors"
  | "booth"
  | "budget"
  | "leads"
  | "reports"
  | "assets"
  | "team"
  | "settings";

export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export interface NavItem {
  id: ModuleId;
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (row: T) => ReactNode;
}

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export interface UserSummary {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
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
  status: string;
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
  decision: string;
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
  status: string;
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
  qualificationStatus: string;
  nextAction: string;
  nextFollowUpDate: string;
  notes: string;
  createdAt: string;
}

export interface BoothRecord {
  id: string;
  organizationId: string;
  eventId: string;
  status: string;
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
  actor: string;
  kind: string;
  message: string;
  createdAt: string;
}

export interface DashboardKpi {
  label: string;
  value: string;
  delta: string;
  tone: StatusTone;
}

export interface DashboardTodayItem {
  title: string;
  meta: string;
  tone: StatusTone;
}

export interface DashboardMetrics {
  totalBudget: number;
  totalActual: number;
  totalCommitted: number;
  projectedMargin: number;
}

export interface DashboardPayload {
  heroEventId: string | null;
  kpis: DashboardKpi[];
  today: DashboardTodayItem[];
  metrics: DashboardMetrics;
}

export interface BootstrapPayload {
  organization: Organization | undefined;
  users: UserSummary[];
  events: EventRecord[];
  opportunities: OpportunityRecord[];
  tasks: TaskRecord[];
  vendors: VendorRecord[];
  budgets: BudgetItem[];
  leads: LeadRecord[];
  booths: BoothRecord[];
  boothChecklistItems: BoothChecklistItem[];
  activities: ActivityRecord[];
  dashboard: DashboardPayload;
}

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

export interface AuthContextValue {
  token: string | null;
  user: UserSummary | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface ConsoleOutletContext {
  data: BootstrapPayload;
  refresh: () => Promise<void>;
}
