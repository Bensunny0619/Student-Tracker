
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Users } from "lucide-react";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch students when the page loads
  useEffect(() => {
    const controller = new AbortController();

    async function fetchStudents() {
      try {
        const response = await fetch("/api/students", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load students");
        }

        const data = await response.json();
        setStudents(data.students);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchStudents();

    return () => controller.abort();
  }, []);

  // Filter students whenever search or status changes
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.first_name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="students-page">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={18} />
        Back to dashboard
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT MANAGEMENT</p>
          <h1>My Students</h1>
          <p>View and manage your tutoring students.</p>
        </div>

        <Link to="/students/new" className="primary-link">
          <Plus size={18} />
          Add Student
        </Link>
      </div>

      {/* Search and status filters */}
      <div className="student-filters">
        <div className="search-field">
          <input
            type="search"
            placeholder="Search students by name..."
            aria-label="Search students by name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter students by status"
        >
          <option value="all">All Students</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="student-results-count">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      )}

      {loading && <p>Loading students...</p>}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* No students in database */}
      {!loading && !error && students.length === 0 && (
        <div className="empty-state">
          <Users size={38} />
          <h2>No students yet</h2>
          <p>Add your first student to get started.</p>
        </div>
      )}

      {/* No students match search/filter */}
      {!loading &&
        !error &&
        students.length > 0 &&
        filteredStudents.length === 0 && (
          <div className="empty-state">
            <h2>No matching students</h2>
            <p>Try another name or change the status filter.</p>
          </div>
        )}

      {/* Student cards */}
      {!loading && !error && filteredStudents.length > 0 && (
        <div className="student-grid">
          {filteredStudents.map((student) => (
            <div className="student-card" key={student.id}>
              <div className="student-card-top">
                <h2>{student.first_name}</h2>

                <span className={`status-badge ${student.status}`}>
                  {student.status}
                </span>
              </div>

              <p>Grade {student.grade}</p>
              <p>
                {student.province || "Province not specified"}
              </p>
              <p className="student-timezone">
                {student.timezone}
              </p>

             
<div className="student-card-actions">
  <Link
    to={`/students/${student.id}/edit`}
    className="edit-student-link"
  >
    Edit Student
  </Link>

  <Link
    to={`/students/${student.id}/lessons/new`}
    className="log-lesson-link"
  >
    Log Lesson
  </Link>

  <Link
    to={`/students/${student.id}/lessons`}
    className="view-lessons-link"
  >
    View Lessons
  </Link>
</div>

            </div>
          ))}
        </div>
      )}
    </main>
  );
}
