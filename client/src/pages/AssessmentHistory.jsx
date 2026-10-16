
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  CalendarDays,
  Plus,
  BookOpen,
} from "lucide-react";

function formatAssessmentDate(value) {
  if (!value) return "Date unavailable";

  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return datePart;
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function AssessmentHistory() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAssessments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/students/${id}/assessments`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load assessments"
          );
        }

        setStudent(data.student);
        setAssessments(data.assessments);
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

    loadAssessments();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <main className="students-page">
        <p>Loading assessment history...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="students-page">
        <p className="error-message" role="alert">
          {error}
        </p>
        <Link to="/students">Back to students</Link>
      </main>
    );
  }

  return (
    <main className="students-page">
      <Link to="/students" className="back-link">
        <ArrowLeft size={18} />
        Back to students
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT PERFORMANCE</p>
          <h1>Assessment History</h1>
          <p>
            {student?.first_name} · Grade {student?.grade}
          </p>
        </div>

        <Link
          to={`/students/${id}/assessments/new`}
          className="primary-link"
        >
          <Plus size={18} />
          Record Assessment
        </Link>
      </div>

      <p className="student-results-count">
        {assessments.length} recorded{" "}
        {assessments.length === 1
          ? "assessment"
          : "assessments"}
      </p>

      {assessments.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={38} />
          <h2>No assessments recorded yet</h2>
          <p>
            Record a quiz or test to begin tracking
            this student's performance.
          </p>
        </div>
      ) : (
        <div className="assessment-list">
          {assessments.map((assessment) => (
            <article
              className="assessment-card"
              key={assessment.id}
            >
              <div className="assessment-card-header">
                <div>
                  <p className="assessment-type">
                    {assessment.assessment_type}
                  </p>

                  <h2>{assessment.topic}</h2>
                  <p>{assessment.subject}</p>
                </div>

                <div className="assessment-score">
                  <strong>
                    {Number(assessment.percentage).toFixed(2)}%
                  </strong>

                  <span>
                    {assessment.score} / {assessment.total_marks}
                  </span>
                </div>
              </div>

              <div className="lesson-meta">
                <span>
                  <CalendarDays size={16} />
                  {formatAssessmentDate(
                    assessment.assessment_date
                  )}
                </span>

                <span>
                  <BookOpen size={16} />
                  {assessment.assessment_type}
                </span>
              </div>

              {assessment.remarks && (
                <div className="lesson-detail">
                  <h3>Tutor's Remarks</h3>
                  <p>{assessment.remarks}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
