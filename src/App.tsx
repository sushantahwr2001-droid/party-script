import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
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
import { LoginPage } from "./pages/LoginPage";

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
  { path: "/", element: <Navigate to="/app/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/app",
    element: <ProtectedApp />,
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
