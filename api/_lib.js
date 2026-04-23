import jwt from "jsonwebtoken";
import { fetchStore, persistenceMode } from "./persistence.js";

export const JWT_SECRET = process.env.PARTY_SCRIPT_JWT_SECRET || "party-script-dev-secret";

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.end(JSON.stringify(body));
}

export function sanitizeUser(user) {
  return { id: user.id, organizationId: user.organizationId, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

export function verifyAuth(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export async function buildBootstrap(organizationId) {
  const store = await fetchStore(organizationId);
  const organization = store.organizations.find((item) => item.id === organizationId);
  const activities = store.activities.map((item) => ({
    ...item,
    actor: store.users.find((user) => user.id === item.actorUserId)?.name || "Team Member"
  }));
  const totalBudget = store.budgets.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = store.budgets.reduce((sum, item) => sum + item.actual, 0);
  const totalCommitted = store.budgets.reduce((sum, item) => sum + item.committed, 0);
  const openTasks = store.tasks.filter((item) => item.status !== "Done").length;
  const hotLeads = store.leads.filter((item) => item.qualificationStatus === "Hot").length;
  const qualifiedLeads = store.leads.filter((item) => item.qualificationStatus === "Qualified").length;

  return {
    organization,
    users: store.users.map(sanitizeUser),
    events: store.events,
    opportunities: store.opportunities,
    tasks: store.tasks,
    vendors: store.vendors,
    budgets: store.budgets,
    leads: store.leads,
    booths: store.booths,
    boothChecklistItems: store.boothChecklistItems.filter((item) => store.booths.some((booth) => booth.id === item.boothId)),
    attendees: store.attendees,
    checkins: store.checkins,
    assets: store.assets,
    activities,
    persistenceMode: persistenceMode(),
    dashboard: {
      heroEventId: store.events[0]?.id || null,
      kpis: [
        { label: "Live Events", value: String(store.events.filter((item) => item.status === "Live").length), delta: `${store.events.length} tracked`, tone: "accent" },
        { label: "Open Tasks", value: String(openTasks), delta: `${store.tasks.filter((item) => item.priority === "High").length} high priority`, tone: openTasks > 5 ? "warning" : "success" },
        { label: "Qualified / Hot Leads", value: `${qualifiedLeads} / ${hotLeads}`, delta: `${store.leads.length} total tracked`, tone: "info" },
        { label: "Budget Utilization", value: `${Math.round((totalActual / Math.max(totalBudget, 1)) * 100)}%`, delta: `${currency(totalActual)} spent of ${currency(totalBudget)}`, tone: totalActual > totalBudget ? "danger" : "success" }
      ],
      today: [
        { title: "Vendor approvals pending", meta: `${store.vendors.filter((item) => item.status === "At Risk").length} blockers need review today`, tone: "warning" },
        { title: "Follow-ups due", meta: `${store.leads.filter((item) => item.nextFollowUpDate <= "2026-04-24").length} lead actions due now`, tone: "info" },
        { title: "Tasks closing this week", meta: `${openTasks} active execution threads`, tone: "accent" }
      ],
      metrics: {
        totalBudget,
        totalActual,
        totalCommitted,
        projectedMargin: Math.max(totalBudget - totalActual - totalCommitted, 0)
      }
    }
  };
}
