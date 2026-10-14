
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Users } from "lucide-react";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {loading && <p>Loading students...</p>}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="empty-state">
          <Users size={38} />
          <h2>No students yet</h2>
          <p>Add your first student to get started.</p>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="student-grid">
          {students.map((student) => (
            <div className="student-card" key={student.id}>
              <div className="student-card-top">
                <h2>{student.first_name}</h2>
                <span className={`status-badge ${student.status}`}>
                  {student.status}
                </span>
              </div>

              <p>Grade {student.grade}</p>
              <p>{student.province || "Province not specified"}</p>
              <p className="student-timezone">
                {student.timezone}
              </p>
              <Link
                to={`/students/${student.id}/edit`}
                className="edit-student-link"
                >
                Edit Student
                </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
