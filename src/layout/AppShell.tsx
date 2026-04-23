import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronDown, Command, LifeBuoy, LogOut, Menu, Plus, Search, Sparkles } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Badge, Button, Card } from "../components/ui";
import { navItems, routeToModule } from "../data";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import type { BootstrapPayload, ConsoleOutletContext } from "../types";

export function AppShell() {
  const { token, user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const activeModule = useMemo(() => routeToModule(location.pathname), [location.pathname]);
  const activeMeta = navItems.find((item) => item.id === activeModule) ?? navItems[0];

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

  const outletContext: ConsoleOutletContext = { data, refresh };

  return (
    <div className="min-h-screen bg-app text-text">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(124,92,255,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.08),_transparent_24%)]" />
      <div className="relative flex min-h-screen">
        <aside
          className={cn(
            "hidden min-h-screen shrink-0 border-r border-white/5 bg-elevated/95 px-4 py-5 backdrop-blur md:flex md:flex-col",
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

          <Button className="mt-5 w-full justify-center" onClick={() => navigate("/app/events")}>
            <Plus className="h-4 w-4" />
            {!collapsed ? "Quick Create" : null}
          </Button>

          <nav className="mt-6 flex-1 space-y-1">
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

          <div className="space-y-3">
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

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-app/90 px-6 backdrop-blur">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Party Script Console</p>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="font-semibold text-text">{activeMeta.label}</span>
                <span className="text-textMuted">/</span>
                <span className="truncate text-textSecondary">Production event OS with routing, auth, backend models, and persisted operations data</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-[280px] items-center gap-3 rounded-xl border border-white/5 bg-elevated px-3 lg:flex">
                <Search className="h-4 w-4 text-textMuted" />
                <span className="flex-1 text-sm text-textMuted">Search events, leads, vendors...</span>
                <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-textMuted">Ctrl K</span>
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-elevated text-textSecondary transition hover:bg-hover hover:text-text">
                <Bell className="h-4 w-4" />
              </button>
              <button className="hidden h-9 items-center gap-2 rounded-xl border border-white/5 bg-elevated px-3 text-sm font-semibold text-textSecondary transition hover:bg-hover hover:text-text lg:inline-flex">
                <Command className="h-4 w-4" />
                Command
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

          <main className="mx-auto w-full max-w-[1360px] flex-1 px-6 py-6">
            <Outlet context={outletContext} />
          </main>
        </div>
      </div>
    </div>
  );
}
