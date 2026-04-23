import { useMemo, useState, type ComponentType } from "react";
import { Activity, ArrowRightLeft, CalendarRange, CheckCircle2, CircleDollarSign, FolderKanban, LayoutGrid, Plus, Users } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label, Textarea } from "../components/forms";
import { Badge, Bars, Button, Card, CardHeader, MetricTile, MiniList, PageIntro, ProgressBar, SectionTitle, SimpleTable } from "../components/ui";
import { statusTone } from "../data";
import { api } from "../lib/api";
import { formatCurrency, formatDateRange } from "../lib/format";
import type { BudgetItem, ConsoleOutletContext, EventRecord, LeadRecord, ModuleId, OpportunityRecord, TableColumn, TaskRecord, VendorRecord } from "../types";

function useConsoleData() {
  return useOutletContext<ConsoleOutletContext>();
}

function userName(userId: string, context: ConsoleOutletContext) {
  return context.data.users.find((item) => item.id === userId)?.name ?? "Unassigned";
}

function eventName(eventId: string, context: ConsoleOutletContext) {
  return context.data.events.find((item) => item.id === eventId)?.name ?? "Unknown event";
}

export function DashboardPage() {
  const context = useConsoleData();
  const heroEvent = context.data.events.find((item) => item.id === context.data.dashboard.heroEventId) ?? context.data.events[0];
  const heroBooth = context.data.booths.find((item) => item.eventId === heroEvent?.id);
  const openTasks = context.data.tasks.filter((item) => item.status !== "Done");

  return (
    <div className="space-y-6">
      <PageIntro
        title="Command Center"
        description="Live operating surface powered by persisted backend data across events, booths, budgets, tasks, vendors, and lead follow-up."
        actions={<Button><Plus className="h-4 w-4" />Quick Create</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader title="Current Event Focus" subtitle="Real backend record" trailing={<Badge label={heroEvent?.status ?? "Draft"} tone="accent" />} />
          <div className="grid gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted">Selected event</p>
                <h2 className="mt-2 text-2xl font-bold text-text">{heroEvent?.name}</h2>
                <p className="mt-2 text-sm text-textSecondary">
                  {heroEvent ? `${formatDateRange(heroEvent.startDate, heroEvent.endDate)} - ${heroEvent.venue} - ${heroEvent.city}` : "No event"}
                </p>
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-textMuted">
                    <span>Event health</span>
                    <span>{heroEvent?.health ?? 0}%</span>
                  </div>
                  <ProgressBar value={heroEvent?.health ?? 0} tone={heroEvent && heroEvent.health > 75 ? "success" : "warning"} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Budget tracked</p>
                  <p className="mt-3 text-lg font-semibold text-text">{formatCurrency(heroEvent?.budgetTotal ?? 0)}</p>
                  <p className="mt-1 text-xs text-textSecondary">{formatCurrency(heroEvent?.budgetSpent ?? 0)} already spent</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Lead target</p>
                  <p className="mt-3 text-lg font-semibold text-text">{heroEvent?.expectedLeads ?? 0}</p>
                  <p className="mt-1 text-xs text-textSecondary">Expected from the event lifecycle</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Booth readiness</p>
                  <p className="mt-3 text-lg font-semibold text-text">{heroBooth?.setupCompletion ?? 0}%</p>
                  <p className="mt-1 text-xs text-textSecondary">{heroBooth?.meetingsBooked ?? 0} meetings booked</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle title="Today" detail="Pulled from live task and lead data" />
              <div className="space-y-3">
                {context.data.dashboard.today.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{item.title}</p>
                      <Badge label="Now" tone={item.tone} />
                    </div>
                    <p className="mt-2 text-xs text-textSecondary">{item.meta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="Recent Activity" detail="Persisted organization feed" />
          <div className="mt-5">
            <MiniList
              items={context.data.activities.map((activity) => ({
                title: activity.actor,
                meta: activity.message,
                trailing: <Badge label={activity.kind} tone={statusTone(activity.kind)} />
              }))}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {context.data.dashboard.kpis.map((kpi) => (
          <MetricTile key={kpi.label} label={kpi.label} value={kpi.value} detail={kpi.delta} tone={kpi.tone} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title="Execution Pulse" detail="Event health distribution across the current portfolio" />
          <div className="mt-6">
            <Bars values={context.data.events.map((item) => item.health)} colors={["#7C5CFF", "#9B8CFF", "#38BDF8", "#23C16B", "#F5A524"]} />
          </div>
        </Card>
        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="Follow-ups" detail="Open execution threads" />
          <MiniList
            items={openTasks.map((task) => ({
              title: task.title,
              meta: `${eventName(task.eventId, context)} - ${task.dueDate}`,
              trailing: <Badge label={task.status} tone={statusTone(task.status)} />
            }))}
          />
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
      <div>
        <div className="font-semibold text-text">{row.name}</div>
        <div className="mt-1 text-xs text-textMuted">{row.type}</div>
      </div>
    )
  },
  { key: "city", label: "City" },
  {
    key: "dates",
    label: "Dates",
    render: (row) => formatDateRange(row.startDate, row.endDate)
  },
  {
    key: "owner",
    label: "Owner",
    render: (row) => userName(row.ownerUserId, context)
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <Badge label={row.status} tone={statusTone(row.status)} />
  },
  {
    key: "health",
    label: "Health",
    render: (row) => <div className="min-w-[140px] space-y-2"><div className="text-xs text-textMuted">{row.health}% ready</div><ProgressBar value={row.health} tone={row.health > 80 ? "success" : row.health > 65 ? "accent" : "warning"} /></div>
  }
];

export function EventsPage() {
  const context = useConsoleData();
  const { token } = useAuth();
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
    budgetTotal: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createEvent() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createEvent(token, form);
      setForm({ name: "", type: "Hosted Event", city: "", country: "India", venue: "", startDate: "", endDate: "", expectedAttendees: 0, expectedLeads: 0, budgetTotal: 0 });
      await context.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create event.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Events"
        description="Routed event portfolio backed by the API. Create real event records and persist them to the Party Script data store."
        actions={<Button onClick={() => void createEvent()}><Plus className="h-4 w-4" />Create Event</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title="Event Portfolio" detail="Hosted, attended, booth, conference, activation, and internal event records" />
          <div className="mt-5">
            <SimpleTable columns={eventColumns(context)} rows={context.data.events} />
          </div>
        </Card>
        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="New Event" detail="Persist a real event row" />
          <div className="mt-5 space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Type</Label><Input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} /></div>
              <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Venue</Label><Input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></div>
              <div className="space-y-2"><Label>End date</Label><Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Expected attendees</Label><Input type="number" value={form.expectedAttendees} onChange={(event) => setForm({ ...form, expectedAttendees: Number(event.target.value) })} /></div>
              <div className="space-y-2"><Label>Expected leads</Label><Input type="number" value={form.expectedLeads} onChange={(event) => setForm({ ...form, expectedLeads: Number(event.target.value) })} /></div>
            </div>
            <div className="space-y-2"><Label>Budget total</Label><Input type="number" value={form.budgetTotal} onChange={(event) => setForm({ ...form, budgetTotal: Number(event.target.value) })} /></div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button className="w-full" onClick={() => void createEvent()} disabled={submitting}>{submitting ? "Saving..." : "Save event"}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

const opportunityColumns = (context: ConsoleOutletContext): TableColumn<OpportunityRecord>[] => [
  {
    key: "name",
    label: "Opportunity",
    render: (row) => <div><div className="font-semibold text-text">{row.name}</div><div className="mt-1 text-xs text-textMuted">{row.industry}</div></div>
  },
  { key: "city", label: "City" },
  { key: "dates", label: "Dates", render: (row) => formatDateRange(row.startDate, row.endDate) },
  { key: "score", label: "Fit", render: (row) => `${row.strategicFitScore}/100` },
  { key: "owner", label: "Owner", render: (row) => userName(row.ownerUserId, context) },
  { key: "decision", label: "Decision", render: (row) => <Badge label={row.decision} tone={statusTone(row.decision)} /> }
];

export function OpportunitiesPage() {
  const context = useConsoleData();
  const { token } = useAuth();
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

  return (
    <div className="space-y-6">
      <PageIntro
        title="Opportunities"
        description="Real exhibition planning records with a convert-to-event workflow wired into the backend."
        actions={<Button variant="secondary"><ArrowRightLeft className="h-4 w-4" />Import flow later</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title="Scoring View" detail="Strategic fit, cost, reach, and decision state" />
          <div className="mt-5">
            <SimpleTable columns={opportunityColumns(context)} rows={context.data.opportunities} />
          </div>
        </Card>
        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="Convert to Event" detail="Create executable event records from approved opportunities" />
          <div className="mt-5 space-y-3">
            {context.data.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-text">{opportunity.name}</p>
                <p className="mt-1 text-xs text-textSecondary">{opportunity.organizer} - {formatCurrency(opportunity.estimatedCost)}</p>
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
  { key: "variance", label: "Variance", render: (row) => <span className={row.actual > row.budgeted ? "text-warning" : "text-success"}>{formatCurrency(row.budgeted - row.actual - row.committed)}</span> }
];

export function BudgetPage() {
  const context = useConsoleData();
  return (
    <div className="space-y-6">
      <PageIntro title="Budget" description="Tracked spending, commitments, and projected margin sourced from persisted budget items." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total budget" value={formatCurrency(context.data.dashboard.metrics.totalBudget)} detail="Allocated across active events" tone="accent" />
        <MetricTile label="Spent" value={formatCurrency(context.data.dashboard.metrics.totalActual)} detail="Already incurred" tone="warning" />
        <MetricTile label="Committed" value={formatCurrency(context.data.dashboard.metrics.totalCommitted)} detail="Awaiting invoice or payment" tone="info" />
        <MetricTile label="Projected margin" value={formatCurrency(context.data.dashboard.metrics.projectedMargin)} detail="Available operating headroom" tone="success" />
      </div>
      <Card className="p-5">
        <SectionTitle title="Budget Table" detail="Category-level tracking without accounting complexity" />
        <div className="mt-5">
          <SimpleTable columns={budgetColumns} rows={context.data.budgets} />
        </div>
      </Card>
    </div>
  );
}

const leadColumns = (context: ConsoleOutletContext): TableColumn<LeadRecord>[] => [
  { key: "fullName", label: "Lead", render: (row) => <div><div className="font-semibold text-text">{row.fullName}</div><div className="mt-1 text-xs text-textMuted">{row.company}</div></div> },
  { key: "event", label: "Event", render: (row) => eventName(row.eventId, context) },
  { key: "owner", label: "Owner", render: (row) => userName(row.ownerUserId, context) },
  { key: "status", label: "Stage", render: (row) => <Badge label={row.qualificationStatus} tone={statusTone(row.qualificationStatus)} /> },
  { key: "nextAction", label: "Next Action", render: (row) => row.nextAction },
  { key: "followup", label: "Follow-up", render: (row) => row.nextFollowUpDate }
];

export function LeadsPage() {
  const context = useConsoleData();
  const { token } = useAuth();
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
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const stages = useMemo(() => {
    return ["New", "Contacted", "Qualified", "Hot", "Warm", "Cold", "Won", "Lost", "Archived"].map((stage) => ({
      stage,
      count: context.data.leads.filter((item) => item.qualificationStatus === stage).length
    }));
  }, [context.data.leads]);

  async function createLead() {
    if (!token) return;
    setSubmitting(true);
    try {
      await api.createLead(token, form);
      setForm({ fullName: "", company: "", title: "", email: "", phone: "", eventId: context.data.events[0]?.id ?? "", priority: "High", nextAction: "", nextFollowUpDate: "", notes: "" });
      await context.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Leads"
        description="A live event CRM view with persisted lead records, qualification stages, and follow-up actions."
        actions={<Button onClick={() => void createLead()}><Plus className="h-4 w-4" />Add Lead</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8 p-5">
          <SectionTitle title="Lead Pipeline" detail="All leads, by event, with real ownership and next action fields" />
          <div className="mt-5">
            <SimpleTable columns={leadColumns(context)} rows={context.data.leads} />
          </div>
        </Card>
        <Card className="xl:col-span-4 p-5">
          <SectionTitle title="Stage Totals" detail="Aggregated from persisted lead records" />
          <div className="mt-5 grid gap-3">
            {stages.map((item) => (
              <div key={item.stage} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <span className="text-sm font-semibold text-text">{item.stage}</span>
                <Badge label={`${item.count}`} tone={statusTone(item.stage)} />
              </div>
            ))}
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
          <div className="space-y-2"><Label>Event ID</Label><Input value={form.eventId} onChange={(event) => setForm({ ...form, eventId: event.target.value })} /></div>
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
  const booth = context.data.booths[0];

  return (
    <div className="space-y-6">
      <PageIntro title="Booth" description="Live booth execution model with checklist, setup, meetings, and captured lead totals." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Booth Status" value={booth?.status ?? "Planned"} detail="Current execution phase" tone="accent" />
        <MetricTile label="Setup Completion" value={`${booth?.setupCompletion ?? 0}%`} detail="Operational readiness" tone="warning" />
        <MetricTile label="Meetings Booked" value={`${booth?.meetingsBooked ?? 0}`} detail="Scheduled with prospects" tone="success" />
        <MetricTile label="Leads Captured" value={`${booth?.leadsCaptured ?? 0}`} detail="Running expo total" tone="info" />
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7 p-5">
          <SectionTitle title="Checklist" detail="Persisted booth checklist items" />
          <div className="mt-5">
            <SimpleTable
              columns={[
                { key: "label", label: "Item" },
                { key: "owner", label: "Owner", render: (row) => userName(row.ownerUserId, context) },
                { key: "due", label: "Due", render: (row) => row.dueDate },
                { key: "status", label: "Status", render: (row) => <Badge label={row.status} tone={statusTone(row.status)} /> }
              ]}
              rows={context.data.boothChecklistItems}
            />
          </div>
        </Card>
        <Card className="xl:col-span-5 p-5">
          <SectionTitle title="Snapshot" detail="Operational highlights" />
          <MiniList
            items={[
              { title: "Material readiness", meta: `${booth?.materialReadiness ?? 0}% ready for dispatch`, trailing: <Badge label="Booth" tone="accent" /> },
              { title: "Staff assigned", meta: `${booth?.staffAssigned ?? 0} people planned on-site`, trailing: <Badge label="Team" tone="info" /> },
              { title: "Linked event", meta: eventName(booth?.eventId ?? "", context), trailing: <Badge label="Live sync" tone="success" /> }
            ]}
          />
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
  { key: "status", label: "Status", render: (row) => <Badge label={row.status} tone={statusTone(row.status)} /> }
];

export function VendorsPage() {
  const context = useConsoleData();
  return (
    <div className="space-y-6">
      <PageIntro title="Vendors" description="External partners linked to real event records and payment states." />
      <Card className="p-5">
        <SectionTitle title="Vendor Tracker" detail="Operationally usable vendor records" />
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
  { key: "status", label: "Status", render: (row) => <Badge label={row.status} tone={statusTone(row.status)} /> }
];

function GenericModulePage({
  title,
  description,
  moduleId,
  blocks
}: {
  title: string;
  description: string;
  moduleId: ModuleId;
  blocks: Array<{ title: string; description: string; icon: ComponentType<{ className?: string }> }>;
}) {
  const context = useConsoleData();
  const summaries: Record<ModuleId, string> = {
    dashboard: `${context.data.events.length} events active across the organization`,
    events: `${context.data.events.length} events stored`,
    opportunities: `${context.data.opportunities.length} opportunities tracked`,
    calendar: `${context.data.tasks.length} tasks and event dates ready for timeline views`,
    tasks: `${context.data.tasks.length} tasks assigned`,
    attendees: "Attendee CRM can sit on top of this same backend structure next",
    tickets: "Ticketing analytics can be layered onto event and finance entities",
    checkins: "Check-in mode can reuse attendee and event authentication flows",
    vendors: `${context.data.vendors.length} vendors linked`,
    booth: `${context.data.booths.length} booth execution records`,
    budget: `${context.data.budgets.length} budget items persisted`,
    leads: `${context.data.leads.length} leads in the event CRM`,
    reports: "Executive reports can aggregate the same persisted records",
    assets: "Assets can be attached to events, vendors, and booths",
    team: `${context.data.users.length} users in the workspace`,
    settings: context.data.organization?.name ?? "Organization settings"
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
      {moduleId === "tasks" ? (
        <Card className="p-5">
          <SectionTitle title="Task Feed" detail="Pulled from backend tasks" />
          <div className="mt-5">
            <SimpleTable columns={taskColumns(context)} rows={context.data.tasks} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export function CalendarPage() {
  return <GenericModulePage title="Calendar" description="Operational time map for events, deadlines, follow-ups, and vendor milestones." moduleId="calendar" blocks={[{ title: "Month / week / day", description: "Routing is live, and this page can be extended into a full calendar surface next.", icon: CalendarRange }, { title: "Drag scheduling", description: "Tasks and events already exist as real backend records ready for calendar placement.", icon: Activity }, { title: "Cross-team timing", description: "Leads, booth meetings, finance reminders, and deadlines can all layer onto the same time map.", icon: LayoutGrid }]} />;
}

export function TasksPage() {
  return <GenericModulePage title="Tasks" description="Execution engine with persisted task records, assignees, due dates, and statuses." moduleId="tasks" blocks={[{ title: "By event", description: "Tasks link directly to event records and can expand into kanban, timeline, or calendar views.", icon: FolderKanban }, { title: "By assignee", description: "Owners are real workspace users, not placeholder names.", icon: Users }, { title: "Operational statuses", description: "Backlog, planned, in progress, waiting, done, and blocked are already modeled in the backend.", icon: CheckCircle2 }]} />;
}

export function AttendeesPage() {
  return <GenericModulePage title="Attendees" description="Attendee CRM is the next natural backend layer on top of events, tickets, and check-ins." moduleId="attendees" blocks={[{ title: "Source of truth", description: "The event model is ready for attendee and registration entities.", icon: Users }, { title: "Segments and VIPs", description: "Segmented lists and confirmation states can slot into this routed module cleanly.", icon: LayoutGrid }, { title: "Messaging workflows", description: "Operational outreach can connect back into check-ins and post-event follow-up.", icon: Activity }]} />;
}

export function TicketsPage() {
  return <GenericModulePage title="Tickets" description="Ticketing can now grow on top of routed events and budget-aware reporting." moduleId="tickets" blocks={[{ title: "Ticket products", description: "Price phases, availability, and allocations can attach directly to event records.", icon: CircleDollarSign }, { title: "Revenue analytics", description: "Budget and event data already provide a base for margin-aware reporting.", icon: Activity }, { title: "Sales timeline", description: "Routing is already in place for a richer commercial workflow.", icon: CalendarRange }]} />;
}

export function CheckinsPage() {
  return <GenericModulePage title="Check-ins" description="Check-in mode now has a routed home and can extend into scanner flows with auth-protected operator views." moduleId="checkins" blocks={[{ title: "Gate mode", description: "JWT-protected routes make it easier to support staff-only check-in flows.", icon: CheckCircle2 }, { title: "Live stats", description: "Backend models can support duplicate, invalid, and VIP states next.", icon: Activity }, { title: "Right-side detail", description: "This page is ready for operator-first layouts and issue logging.", icon: LayoutGrid }]} />;
}

export function ReportsPage() {
  return <GenericModulePage title="Reports" description="Investor-ready reporting can now aggregate actual persisted events, leads, budgets, vendors, and booth data." moduleId="reports" blocks={[{ title: "Executive summary", description: "Use the same backend records powering the live console for leadership reporting.", icon: FolderKanban }, { title: "Event ROI", description: "Connect opportunities, event execution, and lead outcomes in one reporting layer.", icon: Activity }, { title: "Budget and readiness", description: "Budget variance and vendor readiness are already persisted and available for charts.", icon: CircleDollarSign }]} />;
}

export function AssetsPage() {
  return <GenericModulePage title="Assets" description="The routed asset module is ready for uploads, event attachments, and vendor-linked files." moduleId="assets" blocks={[{ title: "Event files", description: "Assets can attach to event, booth, and vendor entities without changing the routing model.", icon: FolderKanban }, { title: "Operational retrieval", description: "Search and previews can be layered on top of authenticated file access.", icon: LayoutGrid }, { title: "Centralized docs", description: "Venue docs, contracts, and print files can live in one structured layer.", icon: Activity }]} />;
}

export function TeamPage() {
  return <GenericModulePage title="Team" description="The workspace already has authenticated users and roles, giving the team module a real foundation." moduleId="team" blocks={[{ title: "Directory", description: "Users are real backend records with roles and organization scope.", icon: Users }, { title: "Assignments", description: "Tasks, events, vendors, and leads already point back to owners.", icon: FolderKanban }, { title: "Permissions", description: "Auth and organization scoping are in place for expanding role-based access.", icon: Activity }]} />;
}

export function SettingsPage() {
  return <GenericModulePage title="Settings" description="Organization-level settings now sit on top of real auth and organization data." moduleId="settings" blocks={[{ title: "Organization profile", description: "Workspace identity is now backed by persisted organization records.", icon: FolderKanban }, { title: "Templates", description: "Event templates and starter packs can now be saved against backend models.", icon: LayoutGrid }, { title: "Integrations", description: "The API foundation is in place for future integrations and sync workflows.", icon: Activity }]} />;
}
