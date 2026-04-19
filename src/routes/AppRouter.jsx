import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import RouteFallback from "../components/RouteFallback";

const MainLayout = lazy(() => import("../layout/MainLayout"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const EventDetails = lazy(() => import("../pages/EventDetails"));
const Events = lazy(() => import("../pages/Events"));
const Tasks = lazy(() => import("../pages/Tasks"));
const Vendors = lazy(() => import("../pages/Vendors"));
const Budget = lazy(() => import("../pages/Budget"));
const Timeline = lazy(() => import("../pages/Timeline"));
const Login = lazy(() => import("../pages/Login"));

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="budget" element={<Budget />} />
          <Route path="calendar" element={<Timeline />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
