import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import RouteFallback from "./RouteFallback";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
