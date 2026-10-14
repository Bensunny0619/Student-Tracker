
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { tutor, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        Checking your session...
      </div>
    );
  }

  if (!tutor) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
