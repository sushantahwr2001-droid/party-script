import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { createToken, requireAuth, type AuthenticatedRequest } from "./auth.js";
import { readDatabase, writeDatabase } from "./database.js";
import type { BudgetItem, EventRecord, LeadRecord, OpportunityRecord, TaskRecord, User } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json());

function sanitizeUser(user: User) {
  return {
    id: user.id,
    organizationId: user.organizationId,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function buildBootstrap(database: Awaited<ReturnType<typeof readDatabase>>, organizationId: string) {
  const organization = database.organizations.find((item) => item.id === organizationId);
  const users = database.users.filter((item) => item.organizationId === organizationId).map(sanitizeUser);
  const events = database.events.filter((item) => item.organizationId === organizationId);
  const opportunities = database.opportunities.filter((item) => item.organizationId === organizationId);
  const tasks = database.tasks.filter((item) => item.organizationId === organizationId);
  const vendors = database.vendors.filter((item) => item.organizationId === organizationId);
  const budgets = database.budgets.filter((item) => item.organizationId === organizationId);
  const leads = database.leads.filter((item) => item.organizationId === organizationId);
  const booths = database.booths.filter((item) => item.organizationId === organizationId);
  const boothChecklistItems = database.boothChecklistItems.filter((item) => booths.some((booth) => booth.id === item.boothId));
  const activities = database.activities
    .filter((item) => item.organizationId === organizationId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8)
    .map((activity) => ({
      ...activity,
      actor: users.find((user) => user.id === activity.actorUserId)?.name ?? "Team Member"
    }));

  const totalBudget = budgets.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = budgets.reduce((sum, item) => sum + item.actual, 0);
  const totalCommitted = budgets.reduce((sum, item) => sum + item.committed, 0);
  const hotLeads = leads.filter((item) => item.qualificationStatus === "Hot").length;
  const qualifiedLeads = leads.filter((item) => item.qualificationStatus === "Qualified").length;
  const openTasks = tasks.filter((item) => item.status !== "Done").length;
  const atRiskVendors = vendors.filter((item) => item.status === "At Risk").length;

  const dashboard = {
    heroEventId: events[0]?.id ?? null,
    kpis: [
      {
        label: "Live Events",
        value: `${events.filter((item) => item.status === "Live").length}`,
        delta: `${events.filter((item) => item.status === "Upcoming" || item.status === "Planning").length} events in pipeline`,
        tone: "accent"
      },
      {
        label: "Open Tasks",
        value: `${openTasks}`,
        delta: `${tasks.filter((item) => item.priority === "High").length} high priority`,
        tone: openTasks > 5 ? "warning" : "success"
      },
      {
        label: "Qualified / Hot Leads",
        value: `${qualifiedLeads} / ${hotLeads}`,
        delta: `${leads.length} total tracked`,
        tone: "info"
      },
      {
        label: "Budget Utilization",
        value: `${Math.round((totalActual / Math.max(totalBudget, 1)) * 100)}%`,
        delta: `${currency(totalActual)} spent of ${currency(totalBudget)}`,
        tone: totalActual > totalBudget ? "danger" : "success"
      }
    ],
    today: [
      { title: "Vendor approvals pending", meta: `${atRiskVendors} blockers need review today`, tone: "warning" },
      { title: "Follow-ups due", meta: `${leads.filter((item) => item.nextFollowUpDate <= "2026-04-24").length} lead actions due now`, tone: "info" },
      { title: "Tasks closing this week", meta: `${tasks.filter((item) => item.status !== "Done").length} active execution threads`, tone: "accent" }
    ],
    metrics: {
      totalBudget,
      totalActual,
      totalCommitted,
      projectedMargin: Math.max(totalBudget - totalActual - totalCommitted, 0)
    }
  };

  return {
    organization,
    users,
    events,
    opportunities,
    tasks,
    vendors,
    budgets,
    leads,
    booths,
    boothChecklistItems,
    activities,
    dashboard
  };
}

app.get("/api/health", async (_request, response) => {
  const database = await readDatabase();
  response.json({
    ok: true,
    organizations: database.organizations.length,
    users: database.users.length,
    events: database.events.length
  });
});

app.post("/api/auth/login", async (request, response) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });

  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid login payload." });
    return;
  }

  const database = await readDatabase();
  const user = database.users.find((item) => item.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user) {
    response.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    response.status(401).json({ message: "Invalid email or password." });
    return;
  }

  response.json({
    token: createToken({ userId: user.id, organizationId: user.organizationId, email: user.email }),
    user: sanitizeUser(user)
  });
});

app.post("/api/auth/register", async (request, response) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8)
  });

  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid registration payload." });
    return;
  }

  const database = await readDatabase();
  const existingUser = database.users.find((item) => item.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (existingUser) {
    response.status(409).json({ message: "An account with that email already exists." });
    return;
  }

  const organizationId = database.organizations[0]?.id ?? "org_partyscript";
  const user: User = {
    id: uuid(),
    organizationId,
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    role: "Admin",
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
    createdAt: new Date().toISOString()
  };

  database.users.push(user);
  await writeDatabase(database);

  response.status(201).json({
    token: createToken({ userId: user.id, organizationId: user.organizationId, email: user.email }),
    user: sanitizeUser(user)
  });
});

app.get("/api/auth/me", requireAuth, async (request: AuthenticatedRequest, response) => {
  const database = await readDatabase();
  const user = database.users.find((item) => item.id === request.auth?.userId);
  if (!user) {
    response.status(404).json({ message: "User not found." });
    return;
  }

  response.json({ user: sanitizeUser(user) });
});

app.get("/api/bootstrap", requireAuth, async (request: AuthenticatedRequest, response) => {
  const database = await readDatabase();
  response.json(buildBootstrap(database, request.auth!.organizationId));
});

app.post("/api/events", requireAuth, async (request: AuthenticatedRequest, response) => {
  const schema = z.object({
    name: z.string().min(3),
    type: z.string().min(3),
    city: z.string().min(2),
    country: z.string().min(2),
    venue: z.string().min(2),
    startDate: z.string().min(4),
    endDate: z.string().min(4),
    expectedAttendees: z.number().int().min(0),
    expectedLeads: z.number().int().min(0),
    budgetTotal: z.number().int().min(0)
  });

  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid event payload." });
    return;
  }

  const database = await readDatabase();
  const event: EventRecord = {
    id: uuid(),
    organizationId: request.auth!.organizationId,
    ownerUserId: request.auth!.userId,
    status: "Draft",
    health: 42,
    budgetSpent: 0,
    createdAt: new Date().toISOString(),
    ...parsed.data
  };

  database.events.unshift(event);
  await writeDatabase(database);
  response.status(201).json({ event });
});

app.post("/api/leads", requireAuth, async (request: AuthenticatedRequest, response) => {
  const schema = z.object({
    fullName: z.string().min(2),
    company: z.string().min(2),
    title: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    eventId: z.string().min(2),
    priority: z.string().min(2),
    nextAction: z.string().min(2),
    nextFollowUpDate: z.string().min(4),
    notes: z.string().min(2)
  });

  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid lead payload." });
    return;
  }

  const database = await readDatabase();
  const lead: LeadRecord = {
    id: uuid(),
    organizationId: request.auth!.organizationId,
    ownerUserId: request.auth!.userId,
    qualificationStatus: "New",
    createdAt: new Date().toISOString(),
    ...parsed.data
  };

  database.leads.unshift(lead);
  await writeDatabase(database);
  response.status(201).json({ lead });
});

app.post("/api/opportunities/:id/convert", requireAuth, async (request: AuthenticatedRequest, response) => {
  const database = await readDatabase();
  const opportunity = database.opportunities.find((item) => item.id === request.params.id && item.organizationId === request.auth!.organizationId);

  if (!opportunity) {
    response.status(404).json({ message: "Opportunity not found." });
    return;
  }

  opportunity.decision = "Converted to Event";
  const event: EventRecord = {
    id: uuid(),
    organizationId: request.auth!.organizationId,
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

  database.events.unshift(event);
  await writeDatabase(database);
  response.json({ event, opportunity });
});

app.listen(port, () => {
  console.log(`Party Script API listening on http://localhost:${port}`);
});
