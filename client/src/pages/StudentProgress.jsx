
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  ChartNoAxesCombined,
  Trophy,
  TrendingDown,
  Plus,
  History,
} from "lucide-react";

function formatPercentage(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${Number(value).toFixed(2)}%`;
}

export default function StudentProgress() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProgress() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/students/${id}/progress`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load student progress"
          );
        }

        setStudent(data.student);
        setSummary(data.summary);
        setRecentActivity(data.recent_activity);
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

    loadProgress();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <main className="students-page">
        <p>Loading student progress...</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="students-page">
        <p className="error-message" role="alert">
          {error || "Progress information unavailable"}
        </p>

        <Link to="/students">Back to Students</Link>
      </main>
    );
  }

  const cards = [
    {
      label: "Total Lessons",
      value: summary.total_lessons,
      icon: BookOpen,
    },
    {
      label: "Total Assessments",
      value: summary.total_assessments,
      icon: ClipboardList,
    },
    {
      label: "Average Score",
      value: formatPercentage(summary.average_score),
      icon: ChartNoAxesCombined,
    },
    {
      label: "Highest Score",
      value: formatPercentage(summary.highest_score),
      icon: Trophy,
    },
    {
      label: "Lowest Score",
      value: formatPercentage(summary.lowest_score),
      icon: TrendingDown,
    },
  ];

  const latestLesson = recentActivity?.latest_lesson;
  const latestAssessment = recentActivity?.latest_assessment;

  return (
    <main className="students-page">
      <Link to="/students" className="back-link">
        <ArrowLeft size={18} />
        Back to Students
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT PROGRESS</p>

          <h1>
            {student?.first_name}'s Progress Overview
          </h1>

          <p>Grade {student?.grade}</p>
        </div>
      </div>

      <section className="student-progress-section">
        <h2>Performance Summary</h2>

        <div className="student-progress-grid">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                className="student-progress-card"
                key={card.label}
              >
                <div className="student-progress-card-top">
                  <span>{card.label}</span>
                  <Icon size={20} />
                </div>

                <strong>{card.value}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="student-progress-section">
        <h2>Recent Activity</h2>

        <div className="student-recent-activity">
          <div className="student-activity-item">
            <div className="student-activity-icon">
              <BookOpen size={22} />
            </div>

            <div>
              <h3>Latest Lesson</h3>

              {latestLesson ? (
                <>
                  <p>
                    {latestLesson.topic ||
                      "Topic not specified"}
                  </p>

                  <span>
                    Most recently recorded lesson
                  </span>
                </>
              ) : (
                <p>No lessons recorded yet.</p>
              )}
            </div>
          </div>

          <div className="student-activity-item">
            <div className="student-activity-icon">
              <ClipboardList size={22} />
            </div>

            <div>
              <h3>Latest Assessment</h3>

              {latestAssessment ? (
                <>
                  <p>
                    {latestAssessment.topic} —{" "}
                    {formatPercentage(
                      latestAssessment.percentage
                    )}
                  </p>

                  <span>
                    {latestAssessment.subject} ·{" "}
                    {latestAssessment.assessment_type}
                  </span>
                </>
              ) : (
                <p>No assessments recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="student-progress-section">
        <h2>Quick Actions</h2>

        <div className="student-progress-actions">
          <Link
            to={`/students/${id}/lessons`}
            className="student-action-link"
          >
            <History size={18} />
            View Lessons
          </Link>

          <Link
            to={`/students/${id}/lessons/new`}
            className="student-action-link"
          >
            <Plus size={18} />
            Log Lesson
          </Link>

          <Link
            to={`/students/${id}/assessments`}
            className="student-action-link"
          >
            <ClipboardList size={18} />
            View Assessments
          </Link>

          <Link
            to={`/students/${id}/assessments/new`}
            className="student-action-link"
          >
            <Plus size={18} />
            Record Assessment
          </Link>
        </div>
      </section>
    </main>
  );
}
