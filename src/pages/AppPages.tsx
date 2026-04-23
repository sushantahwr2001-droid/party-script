import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Activity,
  ArrowRightLeft,
  BadgeCheck,
  Banknote,
  Boxes,
  BriefcaseBusiness,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Command,
  ContactRound,
  DollarSign,
  FolderKanban,
  Gauge,
  HandCoins,
  LayoutGrid,
  ListTodo,
  LucideIcon,
  MailPlus,
  Megaphone,
  Plus,
  Receipt,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label, Textarea } from "../components/forms";
import {
  Badge,
  Bars,
  Button,
  Card,
  CardHeader,
  MetricTile,
  MiniList,
  PageIntro,
  ProgressBar,
  SectionTitle,
  SegmentedTabs,
  SimpleTable,
} from "../components/ui";
import { statusTone } from "../data";
import { api } from "../lib/api";
import { formatCurrency, formatDateRange } from "../lib/format";
import { cn } from "../lib/utils";
import type {
  BoothChecklistItem,
  BoothRecord,
  BudgetItem,
  ConsoleOutletContext,
  EventRecord,
  LeadRecord,
  ModuleId,
  OpportunityRecord,
  TableColumn,
  TaskRecord,
  VendorRecord,
} from "../types";

function useConsoleData() {
  return useOutletContext<ConsoleOutletContext>();
}

function userName(userId: string, context: ConsoleOutletContext) {
  return context.data.users.find((item) => item.id === userId)?.name ?? "Unassigned";
}

function eventName(eventId: string, context: ConsoleOutletContext) {
  return context.data.events.find((item) => item.id === eventId)?.name ?? "Unknown event";
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function toDateValue(value: string) {
  return new Date(value).getTime();
}

function sortByDateAsc<T>(items: T[], getter: (item: T) => string) {
  return [...items].sort((left, right) => toDateValue(getter(left)) - toDateValue(getter(right)));
}

function ringOffset(value: number, circumference: number) {
  return circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
}

function InsightCard({
  title,
  detail,
  icon: Icon,
  children,
}: {
  title: string;
  detail: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-textMuted">{title}</p>
          <p className="mt-1 text-sm text-textSecondary">{detail}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04]">
          <Icon className="h-4 w-4 text-[#C9BDFF]" />
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.04]">
        <Sparkles className="h-5 w-5 text-[#C9BDFF]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-textSecondary">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Card>
  );
}

function LegendRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
        <span className="text-textSecondary">{label}</span>
      </div>
      <span className="font-semibold text-text">{value}</span>
    </div>
  );
}

function Donut({
  value,
  label,
  caption,
  tone = "#7C5CFF",
}: {
  value: number;
  label: string;
  caption: string;
  tone?: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={ringOffset(value, circumference)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-text">{value}%</span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-textMuted">{label}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-text">{caption}</p>
        <p className="mt-1 text-xs text-textSecondary">Built for fast operational decision-making.</p>
      </div>
    </div>
  );
}

function EventStatusBoard({
  events,
  context,
}: {
  events: EventRecord[];
  context: ConsoleOutletContext;
}) {
  const groups = ["Draft", "Planning", "Upcoming", "Live", "Completed"];

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {groups.map((group) => {
        const rows = events.filter((event) => event.status === group);
        return (
          <div key={group} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-text">{group}</h3>
              <Badge label={`${rows.length}`} tone={statusTone(group)} />
            </div>
            <div className="mt-4 space-y-3">
              {rows.length ? (
                rows.map((event) => (
                  <Link
                    key={event.id}
                    to={`/app/events/${event.id}`}
                    className="block rounded-xl border border-white/5 bg-app/40 p-3 transition hover:border-white/10 hover:bg-hover"
                  >
                    <p className="text-sm font-semibold text-text">{event.name}</p>
                    <p className="mt-1 text-xs text-textSecondary">{event.city} • {formatDateRange(event.startDate, event.endDate)}</p>
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-textMuted">
                        <span>Health</span>
                        <span>{event.health}%</span>
                      </div>
                      <ProgressBar value={event.health} tone={event.health > 80 ? "success" : event.health > 60 ? "accent" : "warning"} />
                    </div>
                    <p className="mt-3 text-xs text-textMuted">Owner: {userName(event.ownerUserId, context)}</p>
                  </Link>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-textMuted">No events in this lane.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const context = useConsoleData();
  const [persona, setPersona] = useState("Operations");
  const navigate = useNavigate();
  const heroEvent = context.data.events.find((item) => item.id === context.data.dashboard.heroEventId) ?? context.data.events[0];
  const heroBooth = context.data.booths.find((item) => item.eventId === heroEvent?.id) ?? context.data.booths[0];
  const events = sortByDateAsc(context.data.events, (item) => item.startDate);
  const leads = context.data.leads;
  const tasks = context.data.tasks;
  const vendors = context.data.vendors;
  const budgets = context.data.budgets;
  const opportunities = context.data.opportunities;
  const openTasks = tasks.filter((item) => item.status !== "Done");
  const hotOrQualified = leads.filter((item) => ["Hot", "Qualified"].includes(item.qualificationStatus));
  const dueFollowUps = sortByDateAsc(
    leads.filter((item) => item.nextFollowUpDate),
    (item) => item.nextFollowUpDate,
  ).slice(0, 5);
  const tasksDue = sortByDateAsc(openTasks, (item) => item.dueDate).slice(0, 5);
  const atRiskEvents = [...events].sort((left, right) => left.health - right.health).slice(0, 4);
  const vendorRisk = vendors.filter((item) => item.status === "At Risk").length;
  const liveEvents = events.filter((item) => item.status === "Live").length;
  const totalMeetings = heroBooth?.meetingsBooked ?? 0;
  const budgetSpent = context.data.dashboard.metrics.totalActual;
  const budgetTotal = context.data.dashboard.metrics.totalBudget;
  const budgetCommitted = context.data.dashboard.metrics.totalCommitted;
  const boothReadiness = heroBooth ? Math.round((heroBooth.setupCompletion + heroBooth.materialReadiness) / 2) : 0;
  const funnel = [
    { label: "New", count: leads.filter((item) => item.qualificationStatus === "New").length, color: "#38BDF8" },
    { label: "Qualified", count: leads.filter((item) => item.qualificationStatus === "Qualified").length, color: "#7C5CFF" },
    { label: "Hot", count: leads.filter((item) => item.qualificationStatus === "Hot").length, color: "#23C16B" },
    { label: "Won", count: leads.filter((item) => item.qualificationStatus === "Won").length, color: "#F5A524" },
  ];
  const personaSecondary = {
    Operations: {
      title: "Event Health",
      detail: "Priority events that need operator attention first",
      items: atRiskEvents.map((event) => ({
        title: event.name,
        meta: `${event.city} • ${event.health}% health`,
        trailing: <Badge label={event.status} tone={statusTone(event.status)} />,
      })),
    },
    Marketing: {
      title: "Source Funnel",
      detail: "Lead flow for current event portfolio",
      items: funnel.map((item) => ({
        title: item.label,
        meta: `${item.count} leads mapped in CRM`,
        trailing: <span className="text-sm font-semibold text-text">{percentage(item.count, leads.length)}%</span>,
      })),
    },
    Finance: {
      title: "Budget Control",
      detail: "Expense posture across active events",
      items: [
        { title: "Budgeted", meta: formatCurrency(budgetTotal), trailing: <Badge label="Plan" tone="accent" /> },
        { title: "Actual", meta: formatCurrency(budgetSpent), trailing: <Badge label="Spent" tone="warning" /> },
        { title: "Committed", meta: formatCurrency(budgetCommitted), trailing: <Badge label="Pending" tone="info" /> },
      ],
    },
    Leadership: {
      title: "Opportunity Pipeline",
      detail: "Which exhibitions are worth converting next",
      items: opportunities.slice(0, 4).map((item) => ({
        title: item.name,
        meta: `${item.strategicFitScore}/100 fit • ${formatCurrency(item.estimatedCost)}`,
        trailing: <Badge label={item.decision} tone={statusTone(item.decision)} />,
      })),
    },
    "Booth Team": {
      title: "Booth Readiness",
      detail: "What the floor team needs before go-live",
      items: [
        { title: "Setup completion", meta: `${heroBooth?.setupCompletion ?? 0}% ready`, trailing: <Badge label="Setup" tone="warning" /> },
        { title: "Material readiness", meta: `${heroBooth?.materialReadiness ?? 0}% packed`, trailing: <Badge label="Assets" tone="accent" /> },
        { title: "Staff assigned", meta: `${heroBooth?.staffAssigned ?? 0} on roster`, trailing: <Badge label="Roster" tone="info" /> },
      ],
    },
  } as const;

  const activeSecondary = personaSecondary[persona as keyof typeof personaSecondary];

  return (
    <div className="space-y-6">
      <PageIntro
        title="Command Center"
        description="Within one screen, operators can see what is happening now, what is at risk, what the team should do next, and how events, leads, budget, and booth readiness are performing."
        actions={
          <>
            <SegmentedTabs tabs={["Operations", "Marketing", "Finance", "Leadership", "Booth Team"]} active={persona} onChange={setPersona} />
            <Button onClick={() => navigate(heroEvent ? `/app/events/${heroEvent.id}` : "/app/events")}>
              <Command className="h-4 w-4" />
              Open Event Command Center
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader
            title="Command Center Hero"
            subtitle="Current event selector, health strip, and role-based quick actions"
            trailing={<Badge label={heroEvent?.status ?? "Draft"} tone={statusTone(heroEvent?.status ?? "Draft")} />}
          />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/5 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(17,19,26,0.2)_55%)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-textMuted">Current event focus</p>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[28px] font-bold leading-tight text-text">{heroEvent?.name ?? "No active event"}</h2>
                    <p className="mt-2 text-sm text-textSecondary">
                      {heroEvent ? `${formatDateRange(heroEvent.startDate, heroEvent.endDate)} • ${heroEvent.venue}, ${heroEvent.city}` : "Create or convert an event to begin."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge label={heroEvent?.type ?? "Event"} tone="info" />
                    <Badge label={`${heroEvent?.expectedLeads ?? 0} lead target`} tone="accent" />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-textMuted">
                    <span>Overall readiness</span>
                    <span>{heroEvent?.health ?? 0}%</span>
                  </div>
                  <ProgressBar value={heroEvent?.health ?? 0} tone={(heroEvent?.health ?? 0) > 80 ? "success" : (heroEvent?.health ?? 0) > 60 ? "accent" : "warning"} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/5 bg-app/40 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Budget</p>
                    <p className="mt-2 text-lg font-semibold text-text">{formatCurrency(heroEvent?.budgetTotal ?? 0)}</p>
                    <p className="mt-1 text-xs text-textSecondary">{formatCurrency(heroEvent?.budgetSpent ?? 0)} spent to date</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-app/40 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Leads target</p>
                    <p className="mt-2 text-lg font-semibold text-text">{heroEvent?.expectedLeads ?? 0}</p>
                    <p className="mt-1 text-xs text-textSecondary">{hotOrQualified.length} qualified or hot already tracked</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-app/40 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Booth readiness</p>
                    <p className="mt-2 text-lg font-semibold text-text">{boothReadiness}%</p>
                    <p className="mt-1 text-xs text-textSecondary">{totalMeetings} meetings booked</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Button className="justify-start" onClick={() => navigate("/app/attendees")}>
                  <Users className="h-4 w-4" />
                  Add attendee
                </Button>
                <Button variant="secondary" className="justify-start" onClick={() => navigate("/app/tasks")}>
                  <ListTodo className="h-4 w-4" />
                  Create task
                </Button>
                <Button variant="secondary" className="justify-start" onClick={() => navigate("/app/checkins")}>
                  <ScanLine className="h-4 w-4" />
                  Open check-in
                </Button>
                <Button variant="secondary" className="justify-start" onClick={() => navigate("/app/budget")}>
                  <Receipt className="h-4 w-4" />
                  Add expense
                </Button>
                <Button variant="secondary" className="justify-start" onClick={() => navigate("/app/leads")}>
                  <MailPlus className="h-4 w-4" />
                  Add lead
                </Button>
                <Button variant="secondary" className="justify-start" onClick={() => navigate("/app/booth")}>
                  <Boxes className="h-4 w-4" />
                  Open booth
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle title="Today Panel" detail="Agenda, approvals, follow-ups, and next operator moves" />
              <MiniList
                items={[
                  {
                    title: heroEvent ? `${heroEvent.name} team sync` : "Create first event",
                    meta: heroEvent ? `${heroEvent.city} • 09:30 today` : "Set your first execution timeline",
                    trailing: <Badge label="Agenda" tone="accent" />,
                  },
                  {
                    title: `${vendorRisk} pending approvals`,
                    meta: "Vendor blockers need owner decisions before event lock",
                    trailing: <Badge label="Approvals" tone="warning" />,
                  },
                  {
                    title: `${dueFollowUps.length} follow-ups due`,
                    meta: "Qualified leads waiting on next action",
                    trailing: <Badge label="Leads" tone="info" />,
                  },
                  {
                    title: `${tasksDue.length} urgent deadlines`,
                    meta: "Open tasks closing soon across live workstreams",
                    trailing: <Badge label="Tasks" tone="danger" />,
                  },
                  {
                    title: `${totalMeetings} meetings booked`,
                    meta: "Booth meeting calendar is active for the current portfolio",
                    trailing: <Badge label="Booth" tone="success" />,
                  },
                ]}
              />
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-4 p-5">
          <SectionTitle title={activeSecondary.title} detail={activeSecondary.detail} />
          <div className="mt-5">
            <MiniList items={activeSecondary.items} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Registrations / Leads" value={`${heroEvent?.expectedAttendees ?? 0} / ${leads.length}`} detail={`${hotOrQualified.length} pipeline-ready`} tone="accent" sparkline={[32, 38, 44, 58, 63, 72]} />
        <MetricTile label="Check-ins / Meetings" value={`${liveEvents} / ${totalMeetings}`} detail="Live events vs booked booth meetings" tone="info" sparkline={[10, 14, 18, 18, 24, 28]} />
        <MetricTile label="Revenue / Pipeline Value" value={formatCurrency(budgetTotal)} detail={`${formatCurrency(opportunities.reduce((sum, item) => sum + item.estimatedCost, 0))} opportunity cost pool`} tone="success" sparkline={[18, 22, 24, 31, 36, 40]} />
        <MetricTile label="Open Tasks / Risks" value={`${openTasks.length} / ${vendorRisk}`} detail={`${tasks.filter((item) => item.priority === "High").length} high priority`} tone={openTasks.length > 6 ? "warning" : "success"} sparkline={[26, 21, 20, 17, 15, 14]} />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title="Performance Chart" detail="Event health and execution strength across the active portfolio" />
          <div className="mt-6">
            <Bars values={events.map((item) => item.health)} colors={["#7C5CFF", "#9B8CFF", "#38BDF8", "#23C16B", "#F5A524", "#56607A"]} />
          </div>
        </Card>

        <InsightCard title="Booth Readiness" detail="Booth and expo setup state for the current spotlight event" icon={Boxes}>
          <div className="space-y-5">
            <Donut value={boothReadiness} label="Ready" caption="Floor-readiness score from setup plus material completion" />
            <LegendRow label="Setup completion" value={`${heroBooth?.setupCompletion ?? 0}%`} tone="#7C5CFF" />
            <LegendRow label="Material readiness" value={`${heroBooth?.materialReadiness ?? 0}%`} tone="#38BDF8" />
            <LegendRow label="Staff assigned" value={`${heroBooth?.staffAssigned ?? 0}`} tone="#23C16B" />
          </div>
        </InsightCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7 p-5">
          <SectionTitle title="Active Events" detail="Portfolio view for events currently being planned or executed" />
          <div className="mt-5">
            <SimpleTable columns={eventColumns(context)} rows={events.slice(0, 6)} />
          </div>
        </Card>
        <Card className="xl:col-span-5 p-5">
          <SectionTitle title="Team Activity + Follow-ups" detail="Recent team movement and lead actions that need attention" />
          <div className="mt-5 space-y-3">
            {context.data.activities.slice(0, 4).map((activityItem) => (
              <div key={activityItem.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text">{activityItem.actor}</p>
                  <Badge label={activityItem.kind} tone={statusTone(activityItem.kind)} />
                </div>
                <p className="mt-2 text-sm text-textSecondary">{activityItem.message}</p>
                <p className="mt-1 text-xs text-textMuted">{new Date(activityItem.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {dueFollowUps.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-dashed border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-text">{lead.fullName} • {lead.company}</p>
                <p className="mt-1 text-xs text-textSecondary">{lead.nextAction}</p>
                <p className="mt-2 text-xs text-textMuted">Due {lead.nextFollowUpDate}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <InsightCard title="Marketing Funnel" detail="Lead source-style funnel using CRM qualification stages" icon={Megaphone}>
          <div className="space-y-4">
            {funnel.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-textSecondary">{item.label}</span>
                  <span className="font-semibold text-text">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/6">
                  <div className="h-2 rounded-full" style={{ width: `${percentage(item.count, Math.max(leads.length, 1))}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="Budget vs Actual" detail="A fast operator read on event finance posture" icon={Wallet}>
          <div className="space-y-4">
            <LegendRow label="Budgeted" value={formatCurrency(budgetTotal)} tone="#7C5CFF" />
            <LegendRow label="Actual" value={formatCurrency(budgetSpent)} tone="#F5A524" />
            <LegendRow label="Committed" value={formatCurrency(budgetCommitted)} tone="#38BDF8" />
            <div className="pt-2">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-textMuted">
                <span>Utilization</span>
                <span>{percentage(budgetSpent, budgetTotal)}%</span>
              </div>
              <ProgressBar value={percentage(budgetSpent, Math.max(budgetTotal, 1))} tone={budgetSpent > budgetTotal ? "warning" : "accent"} />
            </div>
          </div>
        </InsightCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-6 p-5">
          <SectionTitle title="Vendor Status Tracker" detail="Delivery and payment confidence for key partners" />
          <div className="mt-5 space-y-3">
            {vendors.slice(0, 5).map((vendor) => (
              <div key={vendor.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{vendor.name}</p>
                    <p className="mt-1 text-xs text-textSecondary">{vendor.category} • {vendor.deliverable}</p>
                  </div>
                  <Badge label={vendor.status} tone={statusTone(vendor.status)} />
                </div>
                <p className="mt-3 text-xs text-textMuted">{eventName(vendor.eventId, context)} • Payment {vendor.paymentStatus}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-6 p-5">
          <SectionTitle title="Lead Qualification Breakdown" detail="Who the sales and partnerships teams should move next" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {["New", "Contacted", "Qualified", "Hot", "Warm", "Won"].map((stage) => {
              const count = leads.filter((item) => item.qualificationStatus === stage).length;
              return (
                <div key={stage} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text">{stage}</p>
                    <Badge label={`${count}`} tone={statusTone(stage)} />
                  </div>
                  <p className="mt-2 text-xs text-textSecondary">{percentage(count, Math.max(leads.length, 1))}% of the tracked event CRM pipeline</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

const eventColumns = (context: ConsoleOutletContext): TableColumn<EventRecord>[] => [
  {
    key: "name",
    label: "Event",
    render: (row) => (
      <Link to={`/app/events/${row.id}`} className="block">
        <div className="font-semibold text-text transition hover:text-[#C9BDFF]">{row.name}</div>
        <div className="mt-1 text-xs text-textMuted">{row.type}</div>
      </Link>
    ),
  },
  { key: "city", label: "City" },
  {
    key: "dates",
    label: "Dates",
    render: (row) => formatDateRange(row.startDate, row.endDate),
  },
  {
    key: "owner",
    label: "Owner",
    render: (row) => userName(row.ownerUserId, context),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <Badge label={row.status} tone={statusTone(row.status)} />,
  },
  {
    key: "health",
    label: "Health",
    render: (row) => (
      <div className="min-w-[140px] space-y-2">
        <div className="text-xs text-textMuted">{row.health}% ready</div>
        <ProgressBar value={row.health} tone={row.health > 80 ? "success" : row.health > 65 ? "accent" : "warning"} />
      </div>
    ),
  },
];

export function EventsPage() {
  const context = useConsoleData();
  const { token } = useAuth();
  const [view, setView] = useState("Table");
  const [form, setForm] = useState({
    name: "",
    type: "Hosted Event",
    city: "",
    country: "India",
    venue: "",
    startDate: "",
    endDate: "",
    expectedAttendees: 0,
    expectedLeads: 0,
    budgetTotal: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createEvent() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createEvent(token, form);
      setForm({
        name: "",
        type: "Hosted Event",
        city: "",
        country: "India",
        venue: "",
        startDate: "",
        endDate: "",
        expectedAttendees: 0,
        expectedLeads: 0,
        budgetTotal: 0,
      });
      await context.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create event.");
    } finally {
      setSubmitting(false);
    }
  }

  const upcoming = sortByDateAsc(context.data.events, (item) => item.startDate);
  const eventTypes = ["Hosted Event", "Attending Event", "Exhibition Booth", "Conference Visit", "Brand Activation", "Internal Event", "Community Event"];

  return (
    <div className="space-y-6">
      <PageIntro
        title="Events"
        description="Manage hosted and attended events with spreadsheet-comfortable views, real backend persistence, and direct drill-in to event-level operations."
        actions={
          <>
            <SegmentedTabs tabs={["Table", "Board", "Calendar", "Timeline"]} active={view} onChange={setView} />
            <Button onClick={() => void createEvent()}>
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title={`${view} View`} detail="Portfolio-wide event planning and execution coverage" />
          <div className="mt-5">
            {view === "Table" ? <SimpleTable columns={eventColumns(context)} rows={upcoming} /> : null}
            {view === "Board" ? <EventStatusBoard events={upcoming} context={context} /> : null}
            {view === "Calendar" ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((event) => (
                  <Link key={event.id} to={`/app/events/${event.id}`} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-hover">
                    <p className="text-xs uppercase tracking-[0.14em] text-textMuted">{new Date(event.startDate).toLocaleString("en-IN", { month: "short" })}</p>
                    <h3 className="mt-2 text-lg font-semibold text-text">{event.name}</h3>
                    <p className="mt-1 text-sm text-textSecondary">{formatDateRange(event.startDate, event.endDate)}</p>
                    <p className="mt-1 text-xs text-textMuted">{event.venue} • {event.city}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge label={event.status} tone={statusTone(event.status)} />
                      <span className="text-xs text-textMuted">{event.type}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
            {view === "Timeline" ? (
              <div className="space-y-4">
                {upcoming.map((event) => (
                  <div key={event.id} className="grid gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 md:grid-cols-[160px_1fr]">
                    <div>
                      <p className="text-sm font-semibold text-text">{new Date(event.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                      <p className="mt-1 text-xs text-textMuted">{formatDateRange(event.startDate, event.endDate)}</p>
                    </div>
                    <Link to={`/app/events/${event.id}`} className="rounded-xl border border-white/5 bg-app/30 p-4 transition hover:bg-hover">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text">{event.name}</p>
                          <p className="mt-1 text-xs text-textSecondary">{event.type} • {event.city}</p>
                        </div>
                        <Badge label={`${event.health}% health`} tone={statusTone(event.status)} />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="New Event Flow" detail="Basics, scale, structure, and confirmation in one compact operator form" />
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.14em] text-textMuted">Wizard</span>
                <Badge label="Step 1 of 4" tone="accent" />
              </div>
              <div className="grid gap-2 text-sm text-textSecondary">
                <p>1. Basics</p>
                <p>2. Scale</p>
                <p>3. Structure</p>
                <p>4. Confirmation</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Event name</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-text outline-none transition focus:border-accent"
                >
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Expected attendees</Label>
                <Input type="number" value={form.expectedAttendees} onChange={(event) => setForm({ ...form, expectedAttendees: Number(event.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Expected leads</Label>
                <Input type="number" value={form.expectedLeads} onChange={(event) => setForm({ ...form, expectedLeads: Number(event.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget skeleton</Label>
              <Input type="number" value={form.budgetTotal} onChange={(event) => setForm({ ...form, budgetTotal: Number(event.target.value) })} />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button className="w-full" onClick={() => void createEvent()} disabled={submitting}>
              {submitting ? "Saving..." : "Save event"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function eventOverviewTabs() {
  return ["Overview", "Attendees", "Tickets", "Check-ins", "Agenda", "Tasks", "Vendors", "Booth", "Budget", "Marketing", "Leads", "Assets", "Reports", "Settings"];
}

export function EventOverviewPage() {
  const context = useConsoleData();
  const { eventId } = useParams();
  const [tab, setTab] = useState("Overview");
  const event = context.data.events.find((item) => item.id === eventId);

  if (!event) {
    return <EmptyState title="Event not found" description="This event record is missing or no longer available in the workspace." action={<Link to="/app/events"><Button>Back to Events</Button></Link>} />;
  }

  const eventTasks = context.data.tasks.filter((item) => item.eventId === event.id);
  const eventLeads = context.data.leads.filter((item) => item.eventId === event.id);
  const eventVendors = context.data.vendors.filter((item) => item.eventId === event.id);
  const eventBudget = context.data.budgets.filter((item) => item.eventId === event.id);
  const booth = context.data.booths.find((item) => item.eventId === event.id);
  const checklist = context.data.boothChecklistItems.filter((item) => item.boothId === booth?.id);
  const spent = eventBudget.reduce((sum, item) => sum + item.actual, 0);
  const committed = eventBudget.reduce((sum, item) => sum + item.committed, 0);

  return (
    <div className="space-y-6">
      <PageIntro
        title={event.name}
        description={`${event.type} • ${formatDateRange(event.startDate, event.endDate)} • ${event.venue}, ${event.city}`}
        actions={
          <>
            <Badge label={event.status} tone={statusTone(event.status)} />
            <Button variant="secondary">
              <Plus className="h-4 w-4" />
              Quick Action
            </Button>
          </>
        }
      />

      <Card className="p-5">
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge label={`Owner: ${userName(event.ownerUserId, context)}`} tone="info" />
              <Badge label={`${event.health}% health`} tone={event.health > 80 ? "success" : event.health > 60 ? "accent" : "warning"} />
              <Badge label={`${event.expectedLeads} expected leads`} tone="accent" />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <MetricTile label="Readiness" value={`${event.health}%`} detail="Event health score" tone={event.health > 80 ? "success" : "warning"} />
              <MetricTile label="Tasks" value={`${eventTasks.filter((item) => item.status !== "Done").length}`} detail={`${eventTasks.length} total`} tone="accent" />
              <MetricTile label="Vendors" value={`${eventVendors.length}`} detail={`${eventVendors.filter((item) => item.status === "At Risk").length} at risk`} tone="warning" />
              <MetricTile label="Budget" value={formatCurrency(event.budgetTotal)} detail={`${formatCurrency(spent)} spent`} tone="info" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Quick actions</p>
            <div className="mt-4 grid gap-3">
              {["Add attendee", "Create task", "Open booth", "Add expense", "Add lead", "Run report"].map((label) => (
                <button key={label} className="rounded-xl border border-white/5 bg-app/40 px-3 py-3 text-left text-sm font-semibold text-textSecondary transition hover:bg-hover hover:text-text">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <SegmentedTabs tabs={eventOverviewTabs()} active={tab} onChange={setTab} />

      {tab === "Overview" ? (
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-7 p-5">
            <SectionTitle title="Readiness Summary" detail="Execution, budget, vendors, and lead motion for this event" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InsightCard title="Tasks" detail="Operational checklist state" icon={ListTodo}>
                <MiniList
                  items={sortByDateAsc(eventTasks, (item) => item.dueDate).slice(0, 4).map((task) => ({
                    title: task.title,
                    meta: `${task.dueDate} • ${userName(task.assigneeUserId, context)}`,
                    trailing: <Badge label={task.status} tone={statusTone(task.status)} />,
                  }))}
                />
              </InsightCard>
              <InsightCard title="Budget" detail="Allocated versus committed versus spent" icon={DollarSign}>
                <div className="space-y-4">
                  <LegendRow label="Budget total" value={formatCurrency(event.budgetTotal)} tone="#7C5CFF" />
                  <LegendRow label="Spent" value={formatCurrency(spent)} tone="#F5A524" />
                  <LegendRow label="Committed" value={formatCurrency(committed)} tone="#38BDF8" />
                  <ProgressBar value={percentage(spent + committed, Math.max(event.budgetTotal, 1))} tone="accent" />
                </div>
              </InsightCard>
              <InsightCard title="Vendors" detail="Execution confidence for suppliers and partners" icon={BriefcaseBusiness}>
                <MiniList
                  items={eventVendors.slice(0, 4).map((vendor) => ({
                    title: vendor.name,
                    meta: `${vendor.category} • ${vendor.paymentStatus}`,
                    trailing: <Badge label={vendor.status} tone={statusTone(vendor.status)} />,
                  }))}
                />
              </InsightCard>
              <InsightCard title="Lead Momentum" detail="Pipeline generated from this event" icon={ContactRound}>
                <MiniList
                  items={eventLeads.slice(0, 4).map((lead) => ({
                    title: `${lead.fullName} • ${lead.company}`,
                    meta: lead.nextAction,
                    trailing: <Badge label={lead.qualificationStatus} tone={statusTone(lead.qualificationStatus)} />,
                  }))}
                />
              </InsightCard>
            </div>
          </Card>
          <Card className="xl:col-span-5 p-5">
            <SectionTitle title="Booth + Lead Snapshot" detail="Only shown when the event is exhibition-oriented" />
            <div className="mt-5 space-y-4">
              {booth ? (
                <>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-text">Booth status</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge label={booth.status} tone={statusTone(booth.status)} />
                      <span className="text-sm font-semibold text-text">{booth.setupCompletion}% setup complete</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-textMuted">
                        <span>Material readiness</span>
                        <span>{booth.materialReadiness}%</span>
                      </div>
                      <ProgressBar value={booth.materialReadiness} tone="accent" />
                    </div>
                  </div>
                  <SimpleTable
                    columns={[
                      { key: "label", label: "Checklist" },
                      { key: "dueDate", label: "Due" },
                      { key: "status", label: "Status", render: (row: BoothChecklistItem) => <Badge label={row.status} tone={statusTone(row.status)} /> },
                    ]}
                    rows={checklist}
                  />
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-textMuted">No booth linked to this event yet.</p>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "Tasks" ? (
        <Card className="p-5">
          <SectionTitle title="Event Tasks" detail="Execution engine linked directly to this event" />
          <div className="mt-5">
            <SimpleTable columns={taskColumns(context)} rows={eventTasks} />
          </div>
        </Card>
      ) : null}

      {tab === "Vendors" ? (
        <Card className="p-5">
          <SectionTitle title="Event Vendors" detail="All suppliers, staffing, and external deliverables linked to this event" />
          <div className="mt-5">
            <SimpleTable columns={vendorColumns(context)} rows={eventVendors} />
          </div>
        </Card>
      ) : null}

      {tab === "Budget" ? (
        <Card className="p-5">
          <SectionTitle title="Event Budget" detail="Budget lines scoped to this event" />
          <div className="mt-5">
            <SimpleTable columns={budgetColumns} rows={eventBudget} />
          </div>
        </Card>
      ) : null}

      {tab === "Leads" ? (
        <Card className="p-5">
          <SectionTitle title="Event Leads" detail="CRM records captured or linked to this event" />
          <div className="mt-5">
            <SimpleTable columns={leadColumns(context)} rows={eventLeads} />
          </div>
        </Card>
      ) : null}

      {!["Overview", "Tasks", "Vendors", "Budget", "Leads"].includes(tab) ? (
        <EmptyState
          title={`${tab} view is ready for the next layer`}
          description={`This event-level route is now in place for ${tab.toLowerCase()} and already inherits the connected event data core. The customer-ready execution layers are polished first on Overview, Tasks, Vendors, Budget, and Leads.`}
        />
      ) : null}
    </div>
  );
}

const opportunityColumns = (context: ConsoleOutletContext): TableColumn<OpportunityRecord>[] => [
  {
    key: "name",
    label: "Opportunity",
    render: (row) => (
      <div>
        <div className="font-semibold text-text">{row.name}</div>
        <div className="mt-1 text-xs text-textMuted">{row.industry}</div>
      </div>
    ),
  },
  { key: "city", label: "City" },
  { key: "dates", label: "Dates", render: (row) => formatDateRange(row.startDate, row.endDate) },
  { key: "score", label: "Fit", render: (row) => `${row.strategicFitScore}/100` },
  { key: "owner", label: "Owner", render: (row) => userName(row.ownerUserId, context) },
  { key: "decision", label: "Decision", render: (row) => <Badge label={row.decision} tone={statusTone(row.decision)} /> },
];

export function OpportunitiesPage() {
  const context = useConsoleData();
  const { token } = useAuth();
  const [view, setView] = useState("Table");
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function convert(id: string) {
    if (!token) return;
    setWorkingId(id);
    try {
      await api.convertOpportunity(token, id);
      await context.refresh();
    } finally {
      setWorkingId(null);
    }
  }

  const grouped = ["Proposed", "Watchlist", "Researching", "Maybe", "Approved", "Registered", "Converted to Event"].map((decision) => ({
    decision,
    rows: context.data.opportunities.filter((item) => item.decision === decision),
  }));

  return (
    <div className="space-y-6">
      <PageIntro
        title="Opportunities"
        description="This is the spreadsheet replacement for evaluating which exhibitions, conferences, and booth opportunities deserve budget, team time, and conversion into execution."
        actions={
          <>
            <SegmentedTabs tabs={["Table", "Board", "Scoring", "Calendar"]} active={view} onChange={setView} />
            <Button variant="secondary">
              <ArrowRightLeft className="h-4 w-4" />
              Import CSV
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title={`${view} View`} detail="Strategic fit, expected reach, lead potential, and decision state" />
          <div className="mt-5">
            {view === "Table" ? <SimpleTable columns={opportunityColumns(context)} rows={context.data.opportunities} /> : null}
            {view === "Board" ? (
              <div className="grid gap-4 xl:grid-cols-4">
                {grouped.map((group) => (
                  <div key={group.decision} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{group.decision}</p>
                      <Badge label={`${group.rows.length}`} tone={statusTone(group.decision)} />
                    </div>
                    <div className="mt-4 space-y-3">
                      {group.rows.map((row) => (
                        <div key={row.id} className="rounded-xl border border-white/5 bg-app/30 p-3">
                          <p className="text-sm font-semibold text-text">{row.name}</p>
                          <p className="mt-1 text-xs text-textSecondary">{row.city} • {row.participationType}</p>
                          <p className="mt-3 text-xs text-textMuted">{row.strategicFitScore}/100 fit • {formatCurrency(row.estimatedCost)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {view === "Scoring" ? (
              <div className="space-y-4">
                {context.data.opportunities.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-text">{row.name}</h3>
                        <p className="mt-1 text-sm text-textSecondary">{row.organizer} • {row.city}, {row.country}</p>
                      </div>
                      <Badge label={row.decision} tone={statusTone(row.decision)} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      <div><p className="text-xs uppercase tracking-[0.14em] text-textMuted">Strategic fit</p><p className="mt-2 text-lg font-semibold text-text">{row.strategicFitScore}/100</p></div>
                      <div><p className="text-xs uppercase tracking-[0.14em] text-textMuted">Expected reach</p><p className="mt-2 text-lg font-semibold text-text">{row.expectedReach}</p></div>
                      <div><p className="text-xs uppercase tracking-[0.14em] text-textMuted">Expected leads</p><p className="mt-2 text-lg font-semibold text-text">{row.expectedLeads}</p></div>
                      <div><p className="text-xs uppercase tracking-[0.14em] text-textMuted">Estimated cost</p><p className="mt-2 text-lg font-semibold text-text">{formatCurrency(row.estimatedCost)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {view === "Calendar" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {sortByDateAsc(context.data.opportunities, (item) => item.startDate).map((row) => (
                  <div key={row.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-textMuted">{formatDateRange(row.startDate, row.endDate)}</p>
                    <h3 className="mt-2 text-lg font-semibold text-text">{row.name}</h3>
                    <p className="mt-1 text-sm text-textSecondary">{row.city} • {row.organizer}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge label={row.decision} tone={statusTone(row.decision)} />
                      <span className="text-xs text-textMuted">{row.participationType}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="Convert to Event" detail="Move approved opportunities directly into execution" />
          <div className="mt-5 space-y-3">
            {context.data.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{opportunity.name}</p>
                    <p className="mt-1 text-xs text-textSecondary">{opportunity.organizer} • {opportunity.city}</p>
                  </div>
                  <Badge label={`${opportunity.strategicFitScore}/100`} tone="accent" />
                </div>
                <div className="mt-4 grid gap-2 text-xs text-textMuted">
                  <p>{formatCurrency(opportunity.estimatedCost)} estimated cost</p>
                  <p>{opportunity.expectedLeads} expected leads</p>
                  <p>{opportunity.participationType} • {opportunity.boothNeeded ? "Booth needed" : "Attend only"}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Badge label={opportunity.decision} tone={statusTone(opportunity.decision)} />
                  <Button
                    variant="secondary"
                    className="h-9 px-3"
                    disabled={workingId === opportunity.id || opportunity.decision === "Converted to Event"}
                    onClick={() => void convert(opportunity.id)}
                  >
                    {workingId === opportunity.id ? "Converting..." : "Convert"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const budgetColumns: TableColumn<BudgetItem>[] = [
  { key: "category", label: "Category" },
  { key: "budgeted", label: "Budgeted", render: (row) => formatCurrency(row.budgeted) },
  { key: "actual", label: "Actual", render: (row) => formatCurrency(row.actual) },
  { key: "committed", label: "Committed", render: (row) => formatCurrency(row.committed) },
  { key: "variance", label: "Variance", render: (row) => <span className={row.actual + row.committed > row.budgeted ? "text-warning" : "text-success"}>{formatCurrency(row.budgeted - row.actual - row.committed)}</span> },
];

export function BudgetPage() {
  const context = useConsoleData();
  const budgetByEvent = context.data.events.map((event) => {
    const lines = context.data.budgets.filter((item) => item.eventId === event.id);
    const budgeted = lines.reduce((sum, item) => sum + item.budgeted, 0);
    const actual = lines.reduce((sum, item) => sum + item.actual, 0);
    const committed = lines.reduce((sum, item) => sum + item.committed, 0);
    return { event, budgeted, actual, committed };
  });

  return (
    <div className="space-y-6">
      <PageIntro title="Budget" description="Financial control without becoming an accounting app: budget lines, event summaries, vendor-linked spend posture, and margin visibility." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="Total Budget" value={formatCurrency(context.data.dashboard.metrics.totalBudget)} detail="Allocated across active events" tone="accent" />
        <MetricTile label="Total Spent" value={formatCurrency(context.data.dashboard.metrics.totalActual)} detail="Already incurred" tone="warning" />
        <MetricTile label="Committed" value={formatCurrency(context.data.dashboard.metrics.totalCommitted)} detail="Awaiting invoice or payment" tone="info" />
        <MetricTile label="Projected Margin" value={formatCurrency(context.data.dashboard.metrics.projectedMargin)} detail="Available operating headroom" tone="success" />
        <MetricTile label="Budget Utilization" value={`${percentage(context.data.dashboard.metrics.totalActual, Math.max(context.data.dashboard.metrics.totalBudget, 1))}%`} detail="Actual spend versus allocated plan" tone="accent" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7 p-5">
          <SectionTitle title="Budget by Event" detail="Which events are consuming the plan fastest" />
          <div className="mt-5 space-y-4">
            {budgetByEvent.map(({ event, budgeted, actual, committed }) => (
              <div key={event.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text">{event.name}</p>
                    <p className="mt-1 text-xs text-textSecondary">{event.city} • {event.type}</p>
                  </div>
                  <Badge label={`${percentage(actual + committed, Math.max(budgeted || event.budgetTotal, 1))}% used`} tone={actual + committed > budgeted ? "warning" : "accent"} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <LegendRow label="Budgeted" value={formatCurrency(budgeted || event.budgetTotal)} tone="#7C5CFF" />
                  <LegendRow label="Actual" value={formatCurrency(actual || event.budgetSpent)} tone="#F5A524" />
                  <LegendRow label="Committed" value={formatCurrency(committed)} tone="#38BDF8" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-5 p-5">
          <SectionTitle title="Budget vs Actual" detail="Category-level control" />
          <div className="mt-5">
            <SimpleTable columns={budgetColumns} rows={context.data.budgets} />
          </div>
        </Card>
      </div>
    </div>
  );
}

const leadColumns = (context: ConsoleOutletContext): TableColumn<LeadRecord>[] => [
  { key: "fullName", label: "Lead", render: (row) => <div><div className="font-semibold text-text">{row.fullName}</div><div className="mt-1 text-xs text-textMuted">{row.company}</div></div> },
  { key: "event", label: "Event", render: (row) => eventName(row.eventId, context) },
  { key: "owner", label: "Owner", render: (row) => userName(row.ownerUserId, context) },
  { key: "status", label: "Stage", render: (row) => <Badge label={row.qualificationStatus} tone={statusTone(row.qualificationStatus)} /> },
  { key: "nextAction", label: "Next Action", render: (row) => row.nextAction },
  { key: "followup", label: "Follow-up", render: (row) => row.nextFollowUpDate },
];

export function LeadsPage() {
  const context = useConsoleData();
  const { token } = useAuth();
  const [view, setView] = useState("All Leads");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    company: "",
    title: "",
    email: "",
    phone: "",
    eventId: context.data.events[0]?.id ?? "",
    priority: "High",
    nextAction: "",
    nextFollowUpDate: "",
    notes: "",
  });

  const stages = ["New", "Contacted", "Qualified", "Hot", "Warm", "Cold", "Won", "Lost", "Archived"];

  async function createLead() {
    if (!token) return;
    setSubmitting(true);
    try {
      await api.createLead(token, form);
      setForm({
        fullName: "",
        company: "",
        title: "",
        email: "",
        phone: "",
        eventId: context.data.events[0]?.id ?? "",
        priority: "High",
        nextAction: "",
        nextFollowUpDate: "",
        notes: "",
      });
      await context.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const companies = Array.from(new Map(context.data.leads.map((lead) => [lead.company, lead])).values());

  return (
    <div className="space-y-6">
      <PageIntro
        title="Leads"
        description="A lightweight event CRM for follow-up, qualification, meetings, and company-level opportunity context."
        actions={
          <>
            <SegmentedTabs tabs={["All Leads", "Follow-up Board", "Meetings Log", "Companies"]} active={view} onChange={setView} />
            <Button onClick={() => void createLead()}>
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="All Leads" value={`${context.data.leads.length}`} detail="Event CRM records tracked" tone="accent" />
        <MetricTile label="Qualified / Hot" value={`${context.data.leads.filter((item) => ["Qualified", "Hot"].includes(item.qualificationStatus)).length}`} detail="Ready for priority follow-up" tone="success" />
        <MetricTile label="Meetings Needed" value={`${context.data.leads.filter((item) => item.nextAction.toLowerCase().includes("meeting")).length}`} detail="Leads needing calendar movement" tone="info" />
        <MetricTile label="Won" value={`${context.data.leads.filter((item) => item.qualificationStatus === "Won").length}`} detail="CRM outcomes attributed to events" tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title={view} detail="Multiple views of the same connected lead records" />
          <div className="mt-5">
            {view === "All Leads" ? <SimpleTable columns={leadColumns(context)} rows={context.data.leads} /> : null}
            {view === "Follow-up Board" ? (
              <div className="grid gap-4 xl:grid-cols-4">
                {["New", "Contacted", "Qualified", "Hot"].map((stage) => (
                  <div key={stage} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{stage}</p>
                      <Badge label={`${context.data.leads.filter((lead) => lead.qualificationStatus === stage).length}`} tone={statusTone(stage)} />
                    </div>
                    <div className="mt-4 space-y-3">
                      {context.data.leads.filter((lead) => lead.qualificationStatus === stage).map((lead) => (
                        <div key={lead.id} className="rounded-xl border border-white/5 bg-app/30 p-3">
                          <p className="text-sm font-semibold text-text">{lead.fullName}</p>
                          <p className="mt-1 text-xs text-textSecondary">{lead.company}</p>
                          <p className="mt-3 text-xs text-textMuted">{lead.nextAction}</p>
                          <p className="mt-1 text-xs text-textMuted">Follow-up {lead.nextFollowUpDate}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {view === "Meetings Log" ? (
              <div className="space-y-4">
                {context.data.leads.filter((lead) => lead.nextAction).map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-text">{lead.fullName} • {lead.company}</p>
                        <p className="mt-1 text-xs text-textSecondary">{lead.title} • {eventName(lead.eventId, context)}</p>
                      </div>
                      <Badge label={lead.qualificationStatus} tone={statusTone(lead.qualificationStatus)} />
                    </div>
                    <p className="mt-3 text-sm text-textSecondary">{lead.nextAction}</p>
                    <p className="mt-2 text-xs text-textMuted">Next follow-up: {lead.nextFollowUpDate}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {view === "Companies" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {companies.map((lead) => (
                  <div key={lead.company} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{lead.company}</p>
                      <Badge label={`${context.data.leads.filter((item) => item.company === lead.company).length} contacts`} tone="accent" />
                    </div>
                    <p className="mt-2 text-xs text-textSecondary">Primary contact: {lead.fullName}</p>
                    <p className="mt-1 text-xs text-textMuted">Latest event: {eventName(lead.eventId, context)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="Qualification Status" detail="At-a-glance event CRM breakdown" />
          <div className="mt-5 grid gap-3">
            {stages.map((stage) => {
              const count = context.data.leads.filter((item) => item.qualificationStatus === stage).length;
              return (
                <div key={stage} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <span className="text-sm font-semibold text-text">{stage}</span>
                  <Badge label={`${count}`} tone={statusTone(stage)} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle title="Capture New Lead" detail="Write directly into the backend store" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2"><Label>Full name</Label><Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></div>
          <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></div>
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          <div className="space-y-2">
            <Label>Event</Label>
            <select
              value={form.eventId}
              onChange={(event) => setForm({ ...form, eventId: event.target.value })}
              className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-text outline-none transition focus:border-accent"
            >
              {context.data.events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2"><Label>Priority</Label><Input value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} /></div>
          <div className="space-y-2"><Label>Follow-up date</Label><Input type="date" value={form.nextFollowUpDate} onChange={(event) => setForm({ ...form, nextFollowUpDate: event.target.value })} /></div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Next action</Label><Input value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} /></div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
        </div>
        <div className="mt-4">
          <Button onClick={() => void createLead()} disabled={submitting}>{submitting ? "Saving..." : "Save lead"}</Button>
        </div>
      </Card>
    </div>
  );
}

export function BoothPage() {
  const context = useConsoleData();
  const [section, setSection] = useState("Overview");
  const booth = context.data.booths[0];
  const checklist = context.data.boothChecklistItems.filter((item) => item.boothId === booth?.id);
  const linkedLeads = context.data.leads.filter((lead) => lead.eventId === booth?.eventId);

  return (
    <div className="space-y-6">
      <PageIntro
        title="Booth"
        description="Booth planning and booth-day execution for teams that still usually run this through sheets, WhatsApp, and scattered docs."
        actions={<SegmentedTabs tabs={["Overview", "Checklist", "Staffing", "Inventory", "Meetings", "Issues", "Leads"]} active={section} onChange={setSection} />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Booth Status" value={booth?.status ?? "Planned"} detail="Current execution phase" tone="accent" />
        <MetricTile label="Setup Completion" value={`${booth?.setupCompletion ?? 0}%`} detail="Operational readiness" tone="warning" />
        <MetricTile label="Material Readiness" value={`${booth?.materialReadiness ?? 0}%`} detail="Fabrication, print, and logistics" tone="info" />
        <MetricTile label="Meetings / Leads" value={`${booth?.meetingsBooked ?? 0} / ${booth?.leadsCaptured ?? 0}`} detail="Booked meetings and captured leads" tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7 p-5">
          <SectionTitle title={section} detail="Structured booth execution instead of spreadsheet chaos" />
          <div className="mt-5">
            {section === "Overview" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <InsightCard title="Logistics" detail="Shipping, transport, and on-site readiness" icon={Boxes}>
                  <MiniList
                    items={[
                      { title: "Organizer formalities", meta: "Badges, booth forms, and venue deadlines", trailing: <Badge label="Ready" tone="success" /> },
                      { title: "Power and internet", meta: "Requirements captured for on-site setup", trailing: <Badge label="Pending" tone="warning" /> },
                      { title: "Travel and stay", meta: `${booth?.staffAssigned ?? 0} staff planned for onsite coverage`, trailing: <Badge label="Roster" tone="info" /> },
                    ]}
                  />
                </InsightCard>
                <InsightCard title="Lead Capture" detail="How the booth translates traffic into pipeline" icon={ContactRound}>
                  <MiniList
                    items={[
                      { title: "Meetings booked", meta: `${booth?.meetingsBooked ?? 0} confirmed onsite or near-event conversations`, trailing: <Badge label="Booked" tone="accent" /> },
                      { title: "Leads captured", meta: `${booth?.leadsCaptured ?? 0} total captured so far`, trailing: <Badge label="Tracked" tone="success" /> },
                      { title: "Follow-up ready", meta: `${linkedLeads.filter((lead) => ["Qualified", "Hot"].includes(lead.qualificationStatus)).length} priority leads in CRM`, trailing: <Badge label="CRM" tone="info" /> },
                    ]}
                  />
                </InsightCard>
              </div>
            ) : null}

            {section === "Checklist" ? (
              <SimpleTable
                columns={[
                  { key: "label", label: "Checklist item" },
                  { key: "owner", label: "Owner", render: (row: BoothChecklistItem) => userName(row.ownerUserId, context) },
                  { key: "due", label: "Due", render: (row: BoothChecklistItem) => row.dueDate },
                  { key: "status", label: "Status", render: (row: BoothChecklistItem) => <Badge label={row.status} tone={statusTone(row.status)} /> },
                ]}
                rows={checklist}
              />
            ) : null}

            {section === "Staffing" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: Math.max(booth?.staffAssigned ?? 0, 3) }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-text">Booth Staff {index + 1}</p>
                    <p className="mt-1 text-xs text-textSecondary">Shift owner • Demo / lead capture / relationship management</p>
                    <p className="mt-3 text-xs text-textMuted">Shift: 10:00 - 14:00</p>
                  </div>
                ))}
              </div>
            ) : null}

            {section === "Inventory" ? (
              <div className="space-y-3">
                {["Backdrop panels", "Lead capture tablets", "Printed collateral", "Demo kits", "Giveaway boxes"].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{item}</p>
                      <Badge label={index < 3 ? "Packed" : "Pending"} tone={index < 3 ? "success" : "warning"} />
                    </div>
                    <p className="mt-2 text-xs text-textSecondary">Planned {8 - index} • Packed {Math.max(2, 7 - index)} • On-site {Math.max(1, 5 - index)}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {section === "Meetings" ? (
              <div className="space-y-3">
                {linkedLeads.slice(0, 6).map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text">{lead.fullName} • {lead.company}</p>
                        <p className="mt-1 text-xs text-textSecondary">{lead.nextAction || "Discuss partnership, demo, and next follow-up"}</p>
                      </div>
                      <Badge label={lead.qualificationStatus} tone={statusTone(lead.qualificationStatus)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {section === "Issues" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {["Missing materials", "Vendor delay", "Internet / power issue", "Demo setup gap"].map((issue, index) => (
                  <div key={issue} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-text">{issue}</p>
                    <p className="mt-2 text-xs text-textSecondary">{index < 2 ? "Open and needs owner decision" : "Monitored with mitigation plan in place"}</p>
                    <div className="mt-3">
                      <Badge label={index < 2 ? "At Risk" : "Watching"} tone={index < 2 ? "warning" : "info"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {section === "Leads" ? <SimpleTable columns={leadColumns(context)} rows={linkedLeads} /> : null}
          </div>
        </Card>

        <Card className="xl:col-span-5 p-5">
          <SectionTitle title="Booth Snapshot" detail="The booth differentiator for Party Script" />
          <div className="mt-5 space-y-4">
            <Donut value={booth ? Math.round((booth.setupCompletion + booth.materialReadiness) / 2) : 0} label="Booth" caption="Combined execution score" />
            <MiniList
              items={[
                { title: "Linked event", meta: eventName(booth?.eventId ?? "", context), trailing: <Badge label="Connected" tone="accent" /> },
                { title: "Checklist coverage", meta: `${checklist.length} structured items tracked`, trailing: <Badge label="Checklist" tone="info" /> },
                { title: "Leads in CRM", meta: `${linkedLeads.length} associated event leads`, trailing: <Badge label="CRM" tone="success" /> },
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

const vendorColumns = (context: ConsoleOutletContext): TableColumn<VendorRecord>[] => [
  { key: "name", label: "Vendor", render: (row) => <div><div className="font-semibold text-text">{row.name}</div><div className="mt-1 text-xs text-textMuted">{row.category}</div></div> },
  { key: "event", label: "Event", render: (row) => eventName(row.eventId, context) },
  { key: "deliverable", label: "Deliverable" },
  { key: "owner", label: "Owner", render: (row) => userName(row.ownerUserId, context) },
  { key: "status", label: "Status", render: (row) => <Badge label={row.status} tone={statusTone(row.status)} /> },
];

export function VendorsPage() {
  const context = useConsoleData();
  return (
    <div className="space-y-6">
      <PageIntro title="Vendors" description="Track venues, production, design, printing, logistics, booth fabrication, staffing, and payment state in one connected vendor tracker." />
      <Card className="p-5">
        <SectionTitle title="Vendor Tracker" detail="Operationally usable vendor records linked to events" />
        <div className="mt-5">
          <SimpleTable columns={vendorColumns(context)} rows={context.data.vendors} />
        </div>
      </Card>
    </div>
  );
}

const taskColumns = (context: ConsoleOutletContext): TableColumn<TaskRecord>[] => [
  { key: "title", label: "Task" },
  { key: "event", label: "Event", render: (row) => eventName(row.eventId, context) },
  { key: "assignee", label: "Assignee", render: (row) => userName(row.assigneeUserId, context) },
  { key: "dueDate", label: "Due" },
  { key: "status", label: "Status", render: (row) => <Badge label={row.status} tone={statusTone(row.status)} /> },
];

function GenericModulePage({
  title,
  description,
  moduleId,
  blocks,
  children,
}: {
  title: string;
  description: string;
  moduleId: ModuleId;
  blocks: Array<{ title: string; description: string; icon: ComponentType<{ className?: string }> }>;
  children?: ReactNode;
}) {
  const context = useConsoleData();
  const summaries: Record<ModuleId, string> = {
    dashboard: `${context.data.events.length} events active across the organization`,
    events: `${context.data.events.length} events stored`,
    opportunities: `${context.data.opportunities.length} opportunities tracked`,
    calendar: `${context.data.tasks.length} tasks and event dates ready for timeline views`,
    tasks: `${context.data.tasks.length} tasks assigned`,
    attendees: "Attendee operations can attach cleanly to the event core",
    tickets: "Ticketing layers can now sit on top of routed events and budget logic",
    checkins: "Check-in mode is ready for operator-first execution flows",
    vendors: `${context.data.vendors.length} vendors linked`,
    booth: `${context.data.booths.length} booth execution records`,
    budget: `${context.data.budgets.length} budget items persisted`,
    leads: `${context.data.leads.length} leads in the event CRM`,
    reports: "Executive reports aggregate the same connected records",
    assets: "Assets can attach to events, vendors, and booths",
    team: `${context.data.users.length} users in the workspace`,
    settings: context.data.organization?.name ?? "Organization settings",
  };

  return (
    <div className="space-y-6">
      <PageIntro title={title} description={description} actions={<Badge label={summaries[moduleId]} tone="info" />} />
      <div className="grid gap-4 lg:grid-cols-3">
        {blocks.map((block) => (
          <Card key={block.title} className="p-5">
            <block.icon className="h-5 w-5 text-[#BBAFFF]" />
            <h3 className="mt-4 text-lg font-semibold text-text">{block.title}</h3>
            <p className="mt-2 text-sm text-textSecondary">{block.description}</p>
          </Card>
        ))}
      </div>
      {children}
    </div>
  );
}

export function CalendarPage() {
  const context = useConsoleData();
  const timeline = [
    ...context.data.events.map((event) => ({ id: event.id, kind: "Event", title: event.name, date: event.startDate, meta: `${event.city} • ${event.type}` })),
    ...context.data.tasks.map((task) => ({ id: task.id, kind: "Task", title: task.title, date: task.dueDate, meta: eventName(task.eventId, context) })),
    ...context.data.leads.filter((lead) => lead.nextFollowUpDate).map((lead) => ({ id: lead.id, kind: "Lead Follow-up", title: lead.fullName, date: lead.nextFollowUpDate, meta: lead.nextAction })),
  ].sort((left, right) => toDateValue(left.date) - toDateValue(right.date));

  return (
    <GenericModulePage
      title="Calendar"
      description="The operational time map for events, tasks, vendor deadlines, booth meetings, and lead follow-up dates."
      moduleId="calendar"
      blocks={[
        { title: "Month / week / day", description: "This routed surface is ready for multi-granularity scheduling and drag interactions.", icon: CalendarRange },
        { title: "Cross-functional planning", description: "Events, tasks, and follow-ups already coexist in one connected timeline.", icon: CalendarClock },
        { title: "Right-side detail flows", description: "This module can open drawers for edits without breaking operator flow.", icon: LayoutGrid },
      ]}
    >
      <Card className="p-5">
        <SectionTitle title="Agenda Timeline" detail="A connected view of what the team needs to hit next" />
        <div className="mt-5 space-y-3">
          {timeline.slice(0, 10).map((item) => (
            <div key={`${item.kind}-${item.id}`} className="grid gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 md:grid-cols-[140px_1fr]">
              <div>
                <p className="text-sm font-semibold text-text">{item.date}</p>
                <p className="mt-1 text-xs text-textMuted">{item.kind}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{item.title}</p>
                <p className="mt-1 text-xs text-textSecondary">{item.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </GenericModulePage>
  );
}

export function TasksPage() {
  const context = useConsoleData();
  return (
    <GenericModulePage
      title="Tasks"
      description="Execution engine with persisted tasks, owners, priorities, due dates, and statuses."
      moduleId="tasks"
      blocks={[
        { title: "By event", description: "Tasks already link directly to event records and can expand into kanban, timeline, and calendar views.", icon: FolderKanban },
        { title: "By assignee", description: "Owners are real workspace users with role-aware accountability.", icon: Users },
        { title: "Operational statuses", description: "Backlog, planned, in progress, waiting, done, and blocked are ready for execution at scale.", icon: CheckCircle2 },
      ]}
    >
      <Card className="p-5">
        <SectionTitle title="Task Feed" detail="Spreadsheet-comfortable and still operationally structured" />
        <div className="mt-5">
          <SimpleTable columns={taskColumns(context)} rows={context.data.tasks} />
        </div>
      </Card>
    </GenericModulePage>
  );
}

export function AttendeesPage() {
  return (
    <GenericModulePage
      title="Attendees"
      description="The attendee source of truth sits naturally on top of the event core, ticketing, and check-in operations."
      moduleId="attendees"
      blocks={[
        { title: "People system", description: "Registration status, check-in status, ticket type, and source fields fit the same structured data model.", icon: Users },
        { title: "Segments and VIPs", description: "Operational groups, VIP lists, and confirmation filters belong here rather than in sheets.", icon: BadgeCheck },
        { title: "Messaging and merge flows", description: "Import, export, tagging, dedupe, and operator messaging can layer on cleanly.", icon: MailPlus },
      ]}
    >
      <EmptyState title="Attendee module foundation is in place" description="The routed customer-facing shell is ready. The next implementation step is adding attendee tables, CSV import, and check-in linkage on top of the existing event model." />
    </GenericModulePage>
  );
}

export function TicketsPage() {
  return (
    <GenericModulePage
      title="Tickets"
      description="Ticket products, sales analytics, and allocation controls for hosted events."
      moduleId="tickets"
      blocks={[
        { title: "Ticket cards", description: "Ticket products, phases, and allocations can attach directly to event records.", icon: Ticket },
        { title: "Sales analytics", description: "Gross sales, sold count, conversion, and refund tracking can share the same reporting layer.", icon: TrendingUp },
        { title: "Revenue timeline", description: "Ticket sales can feed directly into budget, finance, and post-event reporting.", icon: Banknote },
      ]}
    >
      <EmptyState title="Ticketing layer is ready for build-out" description="The event, budget, and reporting foundations are already live, so ticket inventory and sales analytics can now be added as the next monetization workflow." />
    </GenericModulePage>
  );
}

export function CheckinsPage() {
  return (
    <GenericModulePage
      title="Check-ins"
      description="Fast gate operations with scanner/search workflows, live feed, duplicate detection, and issue tracking."
      moduleId="checkins"
      blocks={[
        { title: "Scanner / search", description: "The left-side fast operator flow is ready for QR and search-based check-ins.", icon: ScanLine },
        { title: "Live stats", description: "Checked-in count, no-show estimate, VIP arrivals, and issue logs belong in this module.", icon: Gauge },
        { title: "Protected operator mode", description: "Auth and routing are already in place for staff-only execution surfaces.", icon: ShieldCheck },
      ]}
    >
      <EmptyState title="Check-in mode is ready for the last-mile operator build" description="This module already sits inside the live authenticated console. The next pass is wiring attendee records, scanner input, and duplicate / VIP handling." />
    </GenericModulePage>
  );
}

export function ReportsPage() {
  const context = useConsoleData();
  const reports = [
    { title: "Executive Summary", description: "Top-line health, budget, lead volume, and event posture for leadership.", icon: Gauge },
    { title: "Lead Performance Report", description: "Qualification flow, company coverage, and follow-up ownership.", icon: ContactRound },
    { title: "Exhibition ROI Report", description: "Opportunity scoring, event conversion, booth outcomes, and lead capture.", icon: TrendingUp },
    { title: "Vendor Readiness Report", description: "Supplier confidence and blocker coverage before event day.", icon: BriefcaseBusiness },
    { title: "Budget Report", description: "Category control, event summary, actuals, commitments, and margin.", icon: Wallet },
    { title: "Booth Performance Report", description: "Setup readiness, staffing, meetings, and leads captured.", icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      <PageIntro title="Reports" description="Investor-ready and operator-useful reports that aggregate the same live connected records powering the console." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Events Reported" value={`${context.data.events.length}`} detail="Execution portfolio in reporting scope" tone="accent" />
        <MetricTile label="Leads Reported" value={`${context.data.leads.length}`} detail="CRM records available for attribution" tone="success" />
        <MetricTile label="Budget Coverage" value={`${context.data.budgets.length}`} detail="Category lines inside reporting" tone="info" />
        <MetricTile label="Vendor Coverage" value={`${context.data.vendors.length}`} detail="Readiness signals available" tone="warning" />
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title="Report Library" detail="The highest-value customer and investor-facing outputs first" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <div key={report.title} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <report.icon className="h-5 w-5 text-[#C9BDFF]" />
                <h3 className="mt-4 text-lg font-semibold text-text">{report.title}</h3>
                <p className="mt-2 text-sm text-textSecondary">{report.description}</p>
                <div className="mt-4">
                  <Button variant="secondary" className="h-9 px-3">Open report</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="Reporting Snapshot" detail="Current live data footprint" />
          <div className="mt-5 space-y-4">
            <LegendRow label="Open tasks" value={`${context.data.tasks.filter((item) => item.status !== "Done").length}`} tone="#F5A524" />
            <LegendRow label="Qualified / hot leads" value={`${context.data.leads.filter((item) => ["Qualified", "Hot"].includes(item.qualificationStatus)).length}`} tone="#23C16B" />
            <LegendRow label="Budget total" value={formatCurrency(context.data.dashboard.metrics.totalBudget)} tone="#7C5CFF" />
            <LegendRow label="At-risk vendors" value={`${context.data.vendors.filter((item) => item.status === "At Risk").length}`} tone="#38BDF8" />
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AssetsPage() {
  return (
    <GenericModulePage
      title="Assets"
      description="Central file layer for venue docs, branding, vendor files, invoices, marketing creatives, booth designs, print files, and contracts."
      moduleId="assets"
      blocks={[
        { title: "Event attachments", description: "Assets can attach directly to events, vendors, booths, and reports.", icon: FolderKanban },
        { title: "Operational retrieval", description: "Search, preview, and linked-document workflows belong here.", icon: Search },
        { title: "File governance", description: "Permissions, upload flows, and structured folders can build on the current auth foundation.", icon: ShieldCheck },
      ]}
    >
      <EmptyState title="Asset module shell is live" description="The next implementation layer is file upload and attachment logic, but the routed customer-facing structure is already in place." />
    </GenericModulePage>
  );
}

export function TeamPage() {
  const context = useConsoleData();
  return (
    <GenericModulePage
      title="Team"
      description="People, workload, assignments, permissions, and booth staffing visibility across the organization."
      moduleId="team"
      blocks={[
        { title: "Directory", description: "Users are already real authenticated backend records with organization scope.", icon: Users },
        { title: "Assignments", description: "Tasks, events, vendors, and leads already point back to owners.", icon: ClipboardList },
        { title: "Permissions matrix", description: "The auth foundation is ready for role-based expansion beyond admin-only access.", icon: ShieldCheck },
      ]}
    >
      <Card className="p-5">
        <SectionTitle title="Team Directory" detail="Current workspace members" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {context.data.users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-text">{user.name}</p>
              <p className="mt-1 text-xs text-textSecondary">{user.email}</p>
              <div className="mt-4 flex items-center justify-between">
                <Badge label={user.role} tone="accent" />
                <span className="text-xs text-textMuted">Created {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </GenericModulePage>
  );
}

export function SettingsPage() {
  const context = useConsoleData();
  return (
    <GenericModulePage
      title="Settings"
      description="Organization profile, branding, roles, templates, notifications, integrations, and billing."
      moduleId="settings"
      blocks={[
        { title: "Organization profile", description: "Workspace identity now sits on real organization records, not placeholder data.", icon: Sparkles },
        { title: "Templates", description: "Starter packs, event templates, and repeatable actions can be added cleanly next.", icon: FolderKanban },
        { title: "Integrations", description: "API-backed architecture is ready for future syncs and product integrations.", icon: HandCoins },
      ]}
    >
      <Card className="p-5">
        <SectionTitle title="Organization" detail="Current workspace identity" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Organization name</p>
            <p className="mt-2 text-lg font-semibold text-text">{context.data.organization?.name ?? "Party Script"}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Workspace size</p>
            <p className="mt-2 text-lg font-semibold text-text">{context.data.users.length} users</p>
          </div>
        </div>
      </Card>
    </GenericModulePage>
  );
}
