
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

function formatPercentage(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${Number(value).toFixed(2)}%`;
}

export default function ParentReport() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/students/${id}/progress?period=all`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load parent report"
          );
        }

        setStudent(data.student);
        setSummary(data.summary);
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

    loadReport();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <main className="students-page">
        <p>Loading parent report...</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="students-page">
        <p className="error-message" role="alert">
          {error || "Report unavailable"}
        </p>

        <Link to={`/students/${id}/progress`}>
          Back to Student Progress
        </Link>
      </main>
    );
  }

  return (
    <main className="students-page">
      <Link
        to={`/students/${id}/progress`}
        className="back-link"
      >
        <ArrowLeft size={18} />
        Back to Student Progress
      </Link>

      <section className="parent-report">
        <div className="parent-report-header">
          <FileText size={30} />

          <div>
            <p className="eyebrow">PARENT PROGRESS REPORT</p>
            <h1>{student?.first_name}</h1>
            <p>Grade {student?.grade}</p>
          </div>
        </div>

        <h2>Performance Summary</h2>

        <div className="parent-report-stats">
          <div>
            <span>Total Lessons</span>
            <strong>{summary.total_lessons}</strong>
          </div>

          <div>
            <span>Total Assessments</span>
            <strong>{summary.total_assessments}</strong>
          </div>

          <div>
            <span>Average Score</span>
            <strong>
              {formatPercentage(summary.average_score)}
            </strong>
          </div>

          <div>
            <span>Highest Score</span>
            <strong>
              {formatPercentage(summary.highest_score)}
            </strong>
          </div>

          <div>
            <span>Lowest Score</span>
            <strong>
              {formatPercentage(summary.lowest_score)}
            </strong>
          </div>
        </div>

        <p className="parent-report-note">
          This report summarizes the student's recorded
          lessons and assessments across all available dates.
        </p>
      </section>
    </main>
  );
}
