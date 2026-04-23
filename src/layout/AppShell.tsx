import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  Command,
  LifeBuoy,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Input, Label, Textarea } from "../components/forms";
import { Badge, Button, Card } from "../components/ui";
import { navItems, routeToModule } from "../data";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import type { BootstrapPayload, ConsoleOutletContext, NotificationItem, QuickCreateType, SearchResult } from "../types";

const quickCreateItems: Array<{ type: QuickCreateType; label: string }> = [
  { type: "event", label: "New Event" },
  { type: "opportunity", label: "New Opportunity" },
  { type: "task", label: "New Task" },
  { type: "vendor", label: "Add Vendor" },
  { type: "expense", label: "Add Expense" },
  { type: "lead", label: "Add Lead" },
];

export function AppShell() {
  const { token, user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<QuickCreateType>("event");
  const [createDefaults, setCreateDefaults] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [createState, setCreateState] = useState({
    event: {
      name: "",
      type: "Hosted Event",
      city: "",
      country: "India",
      venue: "",
      startDate: "",
      endDate: "",
      expectedAttendees: "0",
      expectedLeads: "0",
      budgetTotal: "0",
    },
    opportunity: {
      name: "",
      eventType: "Exhibition Booth",
      industry: "",
      organizer: "",
      city: "",
      country: "India",
      startDate: "",
      endDate: "",
      participationType: "Booth",
      boothNeeded: "true",
      expectedReach: "0",
      expectedLeads: "0",
      strategicFitScore: "75",
      estimatedCost: "0",
      priority: "Medium",
      decision: "Proposed",
      notes: "",
    },
    task: {
      title: "",
      eventId: "",
      dueDate: "",
      priority: "Medium",
      status: "Planned",
      notes: "",
    },
    vendor: {
      eventId: "",
      name: "",
      category: "Logistics",
      deliverable: "",
      status: "Planning",
      paymentStatus: "Pending",
    },
    expense: {
      eventId: "",
      category: "",
      budgeted: "0",
      actual: "0",
      committed: "0",
    },
    lead: {
      fullName: "",
      company: "",
      title: "",
      email: "",
      phone: "",
      eventId: "",
      priority: "High",
      nextAction: "",
      nextFollowUpDate: "",
      notes: "",
    },
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  async function refresh() {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const nextData = await api.bootstrap(token);
      setData(nextData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load Party Script.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [token]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setNotificationsOpen(false);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setQuickCreateOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeModule = useMemo(() => routeToModule(location.pathname), [location.pathname]);
  const activeMeta = navItems.find((item) => item.id === activeModule) ?? navItems[0];

  const notifications: NotificationItem[] = useMemo(() => {
    if (!data) return [];

    const taskNotifications = data.tasks
      .filter((item) => item.status !== "Done")
      .slice(0, 3)
      .map((task) => ({
        id: `task-${task.id}`,
        title: "Task due soon",
        message: `${task.title} closes on ${task.dueDate}`,
        href: "/app/tasks",
        tone: "warning" as const,
        createdAt: task.createdAt,
      }));

    const leadNotifications = data.leads.slice(0, 3).map((lead) => ({
      id: `lead-${lead.id}`,
      title: "Lead follow-up due",
      message: `${lead.fullName} needs: ${lead.nextAction}`,
      href: `/app/leads`,
      tone: "info" as const,
      createdAt: lead.createdAt,
    }));

    const vendorNotifications = data.vendors
      .filter((item) => item.status === "At Risk")
      .map((vendor) => ({
        id: `vendor-${vendor.id}`,
        title: "Vendor at risk",
        message: `${vendor.name} is blocking ${vendor.deliverable}`,
        href: `/app/vendors`,
        tone: "danger" as const,
        createdAt: vendor.createdAt,
      }));

    const budgetNotifications = data.budgets
      .filter((item) => item.actual + item.committed > item.budgeted)
      .map((budget) => ({
        id: `budget-${budget.id}`,
        title: "Budget threshold warning",
        message: `${budget.category} is above plan`,
        href: `/app/budget`,
        tone: "warning" as const,
        createdAt: budget.createdAt,
      }));

    const activityNotifications = data.activities.slice(0, 2).map((activity) => ({
      id: `activity-${activity.id}`,
      title: "Workspace activity",
      message: activity.message,
      href: "/app/dashboard",
      tone: "accent" as const,
      createdAt: activity.createdAt,
    }));

    return [...taskNotifications, ...leadNotifications, ...vendorNotifications, ...budgetNotifications, ...activityNotifications]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 10);
  }, [data]);

  const searchResults: SearchResult[] = useMemo(() => {
    if (!data || !searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    const contains = (value: string) => value.toLowerCase().includes(query);

    return [
      ...data.events.filter((item) => contains(item.name) || contains(item.city)).map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: `${item.type} • ${item.city}`,
        type: "event" as const,
        href: `/app/events/${item.id}`,
      })),
      ...data.opportunities.filter((item) => contains(item.name) || contains(item.organizer)).map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: `${item.organizer} • ${item.city}`,
        type: "opportunity" as const,
        href: "/app/opportunities",
      })),
      ...data.tasks.filter((item) => contains(item.title)).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: `Task • ${item.dueDate}`,
        type: "task" as const,
        href: "/app/tasks",
      })),
      ...data.vendors.filter((item) => contains(item.name) || contains(item.deliverable)).map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: `${item.category} • ${item.deliverable}`,
        type: "vendor" as const,
        href: "/app/vendors",
      })),
      ...data.leads.filter((item) => contains(item.fullName) || contains(item.company)).map((item) => ({
        id: item.id,
        title: item.fullName,
        subtitle: `${item.company} • ${item.nextAction}`,
        type: "lead" as const,
        href: "/app/leads",
      })),
    ].slice(0, 20);
  }, [data, searchQuery]);

  function openCreate(type: QuickCreateType, defaults: Record<string, string> = {}) {
    setCreateType(type);
    setCreateDefaults(defaults);
    setCreateError(null);
    setQuickCreateOpen(true);
    setSearchOpen(false);
    setNotificationsOpen(false);

    setCreateState((current) => ({
      ...current,
      task: { ...current.task, eventId: defaults.eventId ?? current.task.eventId },
      vendor: { ...current.vendor, eventId: defaults.eventId ?? current.vendor.eventId },
      expense: { ...current.expense, eventId: defaults.eventId ?? current.expense.eventId },
      lead: { ...current.lead, eventId: defaults.eventId ?? current.lead.eventId },
    }));
  }

  function openSearch() {
    setSearchOpen(true);
    setNotificationsOpen(false);
  }

  function openCommand() {
    setSearchOpen(true);
    setNotificationsOpen(false);
  }

  function openNotifications() {
    setNotificationsOpen(true);
    setSearchOpen(false);
  }

  async function submitCreate() {
    if (!token || !data) return;
    setCreateSubmitting(true);
    setCreateError(null);
    const defaultEventId = createDefaults.eventId || data.events[0]?.id || "";
    const today = new Date().toISOString().slice(0, 10);

    try {
      if (createType === "event") {
        const form = createState.event;
        if (!form.name || !form.city || !form.venue || !form.startDate || !form.endDate) {
          throw new Error("Event name, city, venue, start date, and end date are required.");
        }
        await api.createEvent(token, {
          name: form.name,
          type: form.type,
          city: form.city,
          country: form.country,
          venue: form.venue,
          startDate: form.startDate,
          endDate: form.endDate,
          expectedAttendees: Number(form.expectedAttendees),
          expectedLeads: Number(form.expectedLeads),
          budgetTotal: Number(form.budgetTotal),
        });
      }

      if (createType === "opportunity") {
        const form = createState.opportunity;
        if (!form.name || !form.organizer || !form.city || !form.startDate || !form.endDate) {
          throw new Error("Opportunity name, organizer, city, start date, and end date are required.");
        }
        await api.createOpportunity(token, {
          name: form.name,
          eventType: form.eventType,
          industry: form.industry,
          organizer: form.organizer,
          city: form.city,
          country: form.country,
          startDate: form.startDate,
          endDate: form.endDate,
          participationType: form.participationType,
          boothNeeded: form.boothNeeded === "true",
          expectedReach: Number(form.expectedReach),
          expectedLeads: Number(form.expectedLeads),
          strategicFitScore: Number(form.strategicFitScore),
          estimatedCost: Number(form.estimatedCost),
          priority: form.priority,
          decision: form.decision,
          notes: form.notes,
        });
      }

      if (createType === "task") {
        const form = createState.task;
        if (!form.title) {
          throw new Error("Task title is required.");
        }
        await api.createTask(token, {
          title: form.title,
          eventId: form.eventId || defaultEventId,
          dueDate: form.dueDate || today,
          priority: form.priority,
          status: form.status,
          notes: form.notes,
        });
      }

      if (createType === "vendor") {
        const form = createState.vendor;
        if (!form.name || !form.deliverable) {
          throw new Error("Vendor name and deliverable are required.");
        }
        await api.createVendor(token, {
          eventId: form.eventId || defaultEventId,
          name: form.name,
          category: form.category,
          deliverable: form.deliverable,
          status: form.status,
          paymentStatus: form.paymentStatus,
        });
      }

      if (createType === "expense") {
        const form = createState.expense;
        if (!form.category) {
          throw new Error("Expense category is required.");
        }
        await api.createBudgetItem(token, {
          eventId: form.eventId || defaultEventId,
          category: form.category,
          budgeted: Number(form.budgeted),
          actual: Number(form.actual),
          committed: Number(form.committed),
        });
      }

      if (createType === "lead") {
        const form = createState.lead;
        if (!form.fullName || !form.company || !form.email) {
          throw new Error("Lead name, company, and email are required.");
        }
        await api.createLead(token, {
          fullName: form.fullName,
          company: form.company,
          title: form.title,
          email: form.email,
          phone: form.phone || "-",
          eventId: form.eventId || defaultEventId,
          priority: form.priority,
          nextAction: form.nextAction,
          nextFollowUpDate: form.nextFollowUpDate || today,
          notes: form.notes,
        });
      }

      await refresh();
      setQuickCreateOpen(false);
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : "Unable to create record.");
    } finally {
      setCreateSubmitting(false);
    }
  }

  if (loading && !data) {
    return <div className="flex min-h-screen items-center justify-center bg-app text-text">Loading Party Script...</div>;
  }

  if (!data || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-6 text-text">
        <Card className="w-full max-w-xl p-6">
          <h1 className="text-2xl font-bold">Party Script could not load</h1>
          <p className="mt-3 text-sm text-textSecondary">{error ?? "The console data is unavailable right now."}</p>
          <div className="mt-5 flex gap-3">
            <Button onClick={() => void refresh()}>Retry</Button>
            <Button variant="secondary" onClick={() => { logout(); navigate("/login"); }}>Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  const outletContext: ConsoleOutletContext = { data, refresh, openCreate, openSearch, openCommand, openNotifications };
  const sidebarWidth = collapsed ? "md:ml-20" : "md:ml-[248px]";

  return (
    <div className="h-screen overflow-hidden bg-app text-text">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(124,92,255,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.08),_transparent_24%)]" />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-white/5 bg-elevated/95 px-4 py-5 backdrop-blur md:flex md:flex-col",
          collapsed ? "w-20" : "w-[248px]",
        )}
      >
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-white shadow-panel">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div>
              <p className="text-sm font-semibold text-text">Party Script</p>
              <p className="text-xs text-textMuted">Run Events. Without Chaos.</p>
            </div>
          ) : null}
        </div>

        {!collapsed ? (
          <button className="mt-6 flex items-center justify-between rounded-2xl border border-white/5 bg-card px-4 py-3 text-left">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Workspace</p>
              <p className="mt-1 text-sm font-semibold text-text">{data.organization?.name ?? "Party Script"}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-textMuted" />
          </button>
        ) : null}

        <Button className="mt-5 w-full justify-center" onClick={() => setQuickCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {!collapsed ? "Quick Create" : null}
        </Button>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                  isActive
                    ? "border border-accent/20 bg-accentSoft text-text"
                    : "text-textSecondary hover:bg-hover hover:text-text",
                  collapsed ? "justify-center px-0" : "",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-[#C8BDFF]" : "text-textMuted")} />
                  {!collapsed ? item.label : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 pt-3">
          {!collapsed && data.events[0] ? (
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Pinned event</p>
              <p className="mt-2 text-sm font-semibold text-text">{data.events[0].name}</p>
              <p className="mt-1 text-xs text-textSecondary">{data.events[0].city} - {data.events[0].health}% health</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge label={data.events[0].status} tone="accent" />
                <span className="text-xs text-textMuted">{data.events[0].startDate}</span>
              </div>
            </Card>
          ) : null}

          <button className={cn("flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-textSecondary transition hover:bg-hover hover:text-text", collapsed ? "justify-center px-0" : "")}>
            <LifeBuoy className="h-[18px] w-[18px] text-textMuted" />
            {!collapsed ? "Help" : null}
          </button>

          <button
            onClick={() => setCollapsed((current) => !current)}
            className={cn("flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-textSecondary transition hover:bg-hover hover:text-text", collapsed ? "justify-center px-0" : "")}
          >
            <Menu className="h-[18px] w-[18px] text-textMuted" />
            {!collapsed ? "Collapse" : null}
          </button>
        </div>
      </aside>

      <div className={cn("relative h-screen overflow-hidden", sidebarWidth)}>
        <div className="flex h-screen flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/5 bg-app/90 px-6 backdrop-blur">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Party Script Console</p>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="font-semibold text-text">{activeMeta.label}</span>
                <span className="text-textMuted">/</span>
                <span className="truncate text-textSecondary">Connected Event OS with real auth, routing, and CRUD foundations</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openSearch}
                className="hidden h-10 w-[280px] items-center gap-3 rounded-xl border border-white/5 bg-elevated px-3 lg:flex"
              >
                <Search className="h-4 w-4 text-textMuted" />
                <span className="flex-1 text-left text-sm text-textMuted">Search events, leads, vendors...</span>
                <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-textMuted">Ctrl K</span>
              </button>
              <button
                onClick={openNotifications}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-elevated text-textSecondary transition hover:bg-hover hover:text-text"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <button
                onClick={openCommand}
                className="hidden h-9 items-center gap-2 rounded-xl border border-white/5 bg-elevated px-3 text-sm font-semibold text-textSecondary transition hover:bg-hover hover:text-text lg:inline-flex"
              >
                <Command className="h-4 w-4" />
                Command
              </button>
              <button
                onClick={() => setQuickCreateOpen(true)}
                className="hidden h-9 items-center gap-2 rounded-xl border border-white/5 bg-elevated px-3 text-sm font-semibold text-textSecondary transition hover:bg-hover hover:text-text lg:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
              <div className="hidden rounded-full border border-white/10 px-3 py-2 text-sm text-textSecondary lg:block">
                {user?.name}
              </div>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-elevated text-textSecondary transition hover:bg-hover hover:text-text"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="h-[calc(100vh-64px)] overflow-y-auto">
            <main className="mx-auto w-full max-w-[1360px] px-6 py-6">
              <Outlet context={outletContext} />
            </main>
          </div>
        </div>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/55 px-6 pt-24 backdrop-blur-sm">
          <Card className="w-full max-w-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">Search + Command</p>
                <p className="mt-1 text-xs text-textSecondary">Find records or launch creation flows from anywhere.</p>
              </div>
              <button className="rounded-xl p-2 text-textMuted transition hover:bg-hover hover:text-text" onClick={() => setSearchOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <Input autoFocus placeholder="Search events, opportunities, tasks, vendors, leads..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            </div>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                {searchResults.length ? searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(result.href);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-hover"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">{result.title}</p>
                      <p className="mt-1 text-xs text-textSecondary">{result.subtitle}</p>
                    </div>
                    <Badge label={result.type} tone="accent" />
                  </button>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-textMuted">
                    Search for events, opportunities, tasks, vendors, or leads.
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Quick Actions</p>
                <div className="mt-3 grid gap-2">
                  {quickCreateItems.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => openCreate(item.type)}
                      className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-left text-sm font-semibold text-textSecondary transition hover:bg-hover hover:text-text"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {notificationsOpen ? (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setNotificationsOpen(false)}>
          <div className="absolute right-4 top-20 w-full max-w-md" onClick={(event) => event.stopPropagation()}>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">Notifications</p>
                  <p className="mt-1 text-xs text-textSecondary">Tasks, follow-ups, vendor risk, and budget warnings.</p>
                </div>
                <button className="rounded-xl p-2 text-textMuted transition hover:bg-hover hover:text-text" onClick={() => setNotificationsOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {notifications.length ? notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate(item.href);
                    }}
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-hover"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{item.title}</p>
                      <Badge label={item.tone} tone={item.tone} />
                    </div>
                    <p className="mt-2 text-xs text-textSecondary">{item.message}</p>
                  </button>
                )) : (
                  <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-sm text-textMuted">No notifications right now.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {quickCreateOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-6 py-10 backdrop-blur-sm">
          <Card className="w-full max-w-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">Quick Create</p>
                <p className="mt-1 text-xs text-textSecondary">Create the most important records without leaving your current workflow.</p>
              </div>
              <button className="rounded-xl p-2 text-textMuted transition hover:bg-hover hover:text-text" onClick={() => setQuickCreateOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickCreateItems.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setCreateType(item.type)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    createType === item.type ? "border-accent/30 bg-accentSoft text-text" : "border-white/5 bg-white/[0.03] text-textSecondary hover:bg-hover hover:text-text",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {createType === "event" ? (
                <>
                  <div className="space-y-2"><Label>Event name</Label><Input value={createState.event.name} onChange={(event) => setCreateState((current) => ({ ...current, event: { ...current.event, name: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Type</Label><Input value={createState.event.type} onChange={(event) => setCreateState((current) => ({ ...current, event: { ...current.event, type: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>City</Label><Input value={createState.event.city} onChange={(event) => setCreateState((current) => ({ ...current, event: { ...current.event, city: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Venue</Label><Input value={createState.event.venue} onChange={(event) => setCreateState((current) => ({ ...current, event: { ...current.event, venue: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Start date</Label><Input type="date" value={createState.event.startDate} onChange={(event) => setCreateState((current) => ({ ...current, event: { ...current.event, startDate: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>End date</Label><Input type="date" value={createState.event.endDate} onChange={(event) => setCreateState((current) => ({ ...current, event: { ...current.event, endDate: event.target.value } }))} /></div>
                </>
              ) : null}

              {createType === "opportunity" ? (
                <>
                  <div className="space-y-2"><Label>Name</Label><Input value={createState.opportunity.name} onChange={(event) => setCreateState((current) => ({ ...current, opportunity: { ...current.opportunity, name: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Organizer</Label><Input value={createState.opportunity.organizer} onChange={(event) => setCreateState((current) => ({ ...current, opportunity: { ...current.opportunity, organizer: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Industry</Label><Input value={createState.opportunity.industry} onChange={(event) => setCreateState((current) => ({ ...current, opportunity: { ...current.opportunity, industry: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>City</Label><Input value={createState.opportunity.city} onChange={(event) => setCreateState((current) => ({ ...current, opportunity: { ...current.opportunity, city: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Start date</Label><Input type="date" value={createState.opportunity.startDate} onChange={(event) => setCreateState((current) => ({ ...current, opportunity: { ...current.opportunity, startDate: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>End date</Label><Input type="date" value={createState.opportunity.endDate} onChange={(event) => setCreateState((current) => ({ ...current, opportunity: { ...current.opportunity, endDate: event.target.value } }))} /></div>
                </>
              ) : null}

              {createType === "task" ? (
                <>
                  <div className="space-y-2 md:col-span-2"><Label>Task title</Label><Input value={createState.task.title} onChange={(event) => setCreateState((current) => ({ ...current, task: { ...current.task, title: event.target.value } }))} /></div>
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <select value={createState.task.eventId || createDefaults.eventId || data.events[0]?.id || ""} onChange={(event) => setCreateState((current) => ({ ...current, task: { ...current.task, eventId: event.target.value } }))} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-text outline-none transition focus:border-accent">
                      {data.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Due date</Label><Input type="date" value={createState.task.dueDate} onChange={(event) => setCreateState((current) => ({ ...current, task: { ...current.task, dueDate: event.target.value } }))} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea value={createState.task.notes} onChange={(event) => setCreateState((current) => ({ ...current, task: { ...current.task, notes: event.target.value } }))} /></div>
                </>
              ) : null}

              {createType === "vendor" ? (
                <>
                  <div className="space-y-2"><Label>Vendor name</Label><Input value={createState.vendor.name} onChange={(event) => setCreateState((current) => ({ ...current, vendor: { ...current.vendor, name: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Category</Label><Input value={createState.vendor.category} onChange={(event) => setCreateState((current) => ({ ...current, vendor: { ...current.vendor, category: event.target.value } }))} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Deliverable</Label><Input value={createState.vendor.deliverable} onChange={(event) => setCreateState((current) => ({ ...current, vendor: { ...current.vendor, deliverable: event.target.value } }))} /></div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Event</Label>
                    <select value={createState.vendor.eventId || createDefaults.eventId || data.events[0]?.id || ""} onChange={(event) => setCreateState((current) => ({ ...current, vendor: { ...current.vendor, eventId: event.target.value } }))} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-text outline-none transition focus:border-accent">
                      {data.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                    </select>
                  </div>
                </>
              ) : null}

              {createType === "expense" ? (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Event</Label>
                    <select value={createState.expense.eventId || createDefaults.eventId || data.events[0]?.id || ""} onChange={(event) => setCreateState((current) => ({ ...current, expense: { ...current.expense, eventId: event.target.value } }))} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-text outline-none transition focus:border-accent">
                      {data.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Category</Label><Input value={createState.expense.category} onChange={(event) => setCreateState((current) => ({ ...current, expense: { ...current.expense, category: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Budgeted</Label><Input type="number" value={createState.expense.budgeted} onChange={(event) => setCreateState((current) => ({ ...current, expense: { ...current.expense, budgeted: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Actual</Label><Input type="number" value={createState.expense.actual} onChange={(event) => setCreateState((current) => ({ ...current, expense: { ...current.expense, actual: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Committed</Label><Input type="number" value={createState.expense.committed} onChange={(event) => setCreateState((current) => ({ ...current, expense: { ...current.expense, committed: event.target.value } }))} /></div>
                </>
              ) : null}

              {createType === "lead" ? (
                <>
                  <div className="space-y-2"><Label>Full name</Label><Input value={createState.lead.fullName} onChange={(event) => setCreateState((current) => ({ ...current, lead: { ...current.lead, fullName: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Company</Label><Input value={createState.lead.company} onChange={(event) => setCreateState((current) => ({ ...current, lead: { ...current.lead, company: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Title</Label><Input value={createState.lead.title} onChange={(event) => setCreateState((current) => ({ ...current, lead: { ...current.lead, title: event.target.value } }))} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={createState.lead.email} onChange={(event) => setCreateState((current) => ({ ...current, lead: { ...current.lead, email: event.target.value } }))} /></div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Event</Label>
                    <select value={createState.lead.eventId || createDefaults.eventId || data.events[0]?.id || ""} onChange={(event) => setCreateState((current) => ({ ...current, lead: { ...current.lead, eventId: event.target.value } }))} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-text outline-none transition focus:border-accent">
                      {data.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2"><Label>Next action</Label><Input value={createState.lead.nextAction} onChange={(event) => setCreateState((current) => ({ ...current, lead: { ...current.lead, nextAction: event.target.value } }))} /></div>
                </>
              ) : null}
            </div>

            {createError ? <p className="mt-4 text-sm text-danger">{createError}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setQuickCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => void submitCreate()} disabled={createSubmitting}>
                {createSubmitting ? "Saving..." : "Create"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
