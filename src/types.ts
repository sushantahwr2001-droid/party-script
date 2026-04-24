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

export interface BoothStaffingRecord {
  id: string;
  boothId: string;
  userId: string;
  role: string;
  shiftStart: string;
  shiftEnd: string;
  onsiteResponsibility: string;
  backupOwnerUserId: string;
  notes: string;
}

export interface BoothInventoryItem {
  id: string;
  boothId: string;
  name: string;
  category: string;
  quantityPlanned: number;
  quantityPacked: number;
  quantityOnsite: number;
  ownerUserId: string;
  status: string;
  notes: string;
}

export interface BoothMeetingRecord {
  id: string;
  boothId: string;
  leadId: string;
  company: string;
  contactName: string;
  meetingTime: string;
  ownerUserId: string;
  objective: string;
  status: string;
  notes: string;
  followUpRequired: boolean;
}

export interface BoothIssueRecord {
  id: string;
  boothId: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  ownerUserId: string;
  notes: string;
  createdAt: string;
}

export interface AttendeeRecord {
  id: string;
  organizationId: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  ticketType: string;
  registrationStatus: string;
  checkInStatus: string;
  source: string;
  tags: string[];
  createdAt: string;
}

export interface TicketRecord {
  id: string;
  organizationId: string;
  eventId: string;
  name: string;
  price: number;
  inventory: number;
  soldCount: number;
  status: string;
  createdAt: string;
}

export interface CheckinRecord {
  id: string;
  organizationId: string;
  attendeeId: string;
  eventId: string;
  status: string;
  checkedInAt: string;
  createdAt: string;
}

export interface AssetRecord {
  id: string;
  organizationId: string;
  eventId: string;
  name: string;
  category: string;
  fileUrl: string;
  createdByUserId: string;
  createdAt: string;
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
  boothStaffing: BoothStaffingRecord[];
  boothInventoryItems: BoothInventoryItem[];
  boothMeetings: BoothMeetingRecord[];
  boothIssues: BoothIssueRecord[];
  attendees: AttendeeRecord[];
  tickets: TicketRecord[];
  checkins: CheckinRecord[];
  assets: AssetRecord[];
  activities: ActivityRecord[];
  dashboard: DashboardPayload;
}

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

export interface SetupStatusResponse {
  setupRequired: boolean;
  organizationName: string | null;
  existingUsers: number;
  persistence: string;
}

export interface ForgotPasswordResponse {
  ok: boolean;
  resetUrl?: string;
}

export interface InviteAcceptanceResponse {
  token: string;
  user: UserSummary;
}

export interface AuthContextValue {
  token: string | null;
  user: UserSummary | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (token: string, password: string) => Promise<void>;
  acceptInvite: (token: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

export type QuickCreateType = "event" | "opportunity" | "task" | "vendor" | "expense" | "lead";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "event" | "opportunity" | "task" | "vendor" | "lead";
  href: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  href: string;
  tone: StatusTone;
  createdAt: string;
}

export interface ConsoleOutletContext {
  data: BootstrapPayload;
  refresh: () => Promise<void>;
  openCreate: (type: QuickCreateType, defaults?: Record<string, string>) => void;
  openSearch: () => void;
  openCommand: () => void;
  openNotifications: () => void;
}
