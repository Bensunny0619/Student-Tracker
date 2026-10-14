
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { tutor, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleLogout() {
    try {
      setError("");
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Unable to log out. Please try again.");
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand">
          <BookOpen size={24} />
          <span>Student Progress Tracker</span>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Log out
        </button>
      </header>

      <main className="dashboard-content">
        <p className="eyebrow">TUTOR DASHBOARD</p>

        <h1>Welcome, {tutor?.name}!</h1>

         <Link to="/students" className="primary-link dashboard-students-link">
        Manage Students
        </Link>

        <p>
          You're successfully logged into your Student
          Progress Tracker account.
        </p>

        {error && <p className="error-message">{error}</p>}

        <div className="welcome-panel">
          <h2>Your workspace is ready</h2>
          <p>
            Next, we'll build student management so you
            can add students and track their lessons.
          </p>
        </div>
      </main>
    </div>
  );
}
