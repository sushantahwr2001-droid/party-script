import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  ScanLine,
  Settings,
  Ticket,
  UserPlus,
  Users
} from "lucide-react";
import type { ModuleId, NavItem, StatusTone } from "./types";

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
  { id: "events", label: "Events", path: "/app/events", icon: CalendarDays },
  { id: "opportunities", label: "Opportunities", path: "/app/opportunities", icon: Activity },
  { id: "calendar", label: "Calendar", path: "/app/calendar", icon: CalendarDays },
  { id: "tasks", label: "Tasks", path: "/app/tasks", icon: ClipboardList },
  { id: "attendees", label: "Attendees", path: "/app/attendees", icon: Users },
  { id: "tickets", label: "Tickets", path: "/app/tickets", icon: Ticket },
  { id: "checkins", label: "Check-ins", path: "/app/checkins", icon: ScanLine },
  { id: "vendors", label: "Vendors", path: "/app/vendors", icon: BriefcaseBusiness },
  { id: "booth", label: "Booth", path: "/app/booth", icon: CheckCheck },
  { id: "budget", label: "Budget", path: "/app/budget", icon: DollarSign },
  { id: "leads", label: "Leads", path: "/app/leads", icon: UserPlus },
  { id: "reports", label: "Reports", path: "/app/reports", icon: FileText },
  { id: "assets", label: "Assets", path: "/app/assets", icon: FileText },
  { id: "team", label: "Team", path: "/app/team", icon: Users },
  { id: "settings", label: "Settings", path: "/app/settings", icon: Settings }
];

export function statusTone(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (["done", "live", "approved", "hot", "won", "paid", "confirmed"].includes(normalized)) return "success";
  if (["planning", "upcoming", "in progress", "qualified", "registered", "in production", "new"].includes(normalized)) return "accent";
  if (["warning", "waiting", "at risk", "warm", "maybe"].includes(normalized)) return "warning";
  if (["draft", "blocked", "lost", "cancelled", "skip"].includes(normalized)) return "danger";
  return "info";
}

export function routeToModule(pathname: string): ModuleId {
  const match = navItems.find((item) => pathname.startsWith(item.path));
  return match?.id ?? "dashboard";
}
