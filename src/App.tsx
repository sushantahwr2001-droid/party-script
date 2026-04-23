import { AlertTriangle } from "lucide-react";
import { Navigate, RouterProvider, createBrowserRouter, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { Button, Card } from "./components/ui";
import { AppShell } from "./layout/AppShell";
import {
  AssetsPage,
  AttendeesPage,
  BoothPage,
  BudgetPage,
  CalendarPage,
  CheckinsPage,
  DashboardPage,
  EventOverviewPage,
  EventsPage,
  LeadsPage,
  OpportunitiesPage,
  ReportsPage,
  SettingsPage,
  TasksPage,
  TeamPage,
  TicketsPage,
  VendorsPage
} from "./pages/AppPages";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SignupPage } from "./pages/SignupPage";

function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Something unexpected happened while loading Party Script.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-6 text-text">
      <Card className="w-full max-w-xl p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.04]">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <h1 className="mt-5 text-3xl font-bold">Party Script hit a page error</h1>
        <p className="mt-3 text-sm text-textSecondary">{message}</p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => window.location.assign("/login")}>Go to Login</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </Card>
    </div>
  );
}

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-app text-text">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app/dashboard" replace />, errorElement: <RouteErrorPage /> },
  { path: "/login", element: <LoginPage />, errorElement: <RouteErrorPage /> },
  { path: "/signup", element: <SignupPage />, errorElement: <RouteErrorPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage />, errorElement: <RouteErrorPage /> },
  { path: "/reset-password", element: <ResetPasswordPage />, errorElement: <RouteErrorPage /> },
  {
    path: "/app",
    element: <ProtectedApp />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "events", element: <EventsPage /> },
      { path: "events/:eventId", element: <EventOverviewPage /> },
      { path: "opportunities", element: <OpportunitiesPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "attendees", element: <AttendeesPage /> },
      { path: "tickets", element: <TicketsPage /> },
      { path: "checkins", element: <CheckinsPage /> },
      { path: "vendors", element: <VendorsPage /> },
      { path: "booth", element: <BoothPage /> },
      { path: "budget", element: <BudgetPage /> },
      { path: "leads", element: <LeadsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "assets", element: <AssetsPage /> },
      { path: "team", element: <TeamPage /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  }
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
