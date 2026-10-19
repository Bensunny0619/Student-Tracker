
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Printer } from "lucide-react";

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
  const [assessments, setAssessments] = useState([]);
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
        setAssessments(data.assessment_trend || []);
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

        
<div className="parent-report-toolbar">
  <button
    type="button"
    className="parent-report-print-btn"
    onClick={() => window.print()}
  >
    <Printer size={18} />
    Print / Save as PDF
  </button>
</div>

      </main>
    );
  }

  
const topicGroups = {};

assessments.forEach((assessment) => {
  const topic = assessment.topic?.trim() || "Unspecified Topic";
  const score = Number(assessment.percentage);

  if (
    assessment.percentage === null ||
    assessment.percentage === undefined ||
    !Number.isFinite(score)
  ) {
    return;
  }

  const key = `${assessment.subject || ""}:${topic}`.toLowerCase();

  if (!topicGroups[key]) {
    topicGroups[key] = {
      topic,
      subject: assessment.subject || "Unspecified Subject",
      scores: [],
    };
  }

  topicGroups[key].scores.push(score);
});

const topicPerformance = Object.values(topicGroups).map(
  ({ topic, subject, scores }) => {
    const average =
      scores.reduce((sum, score) => sum + score, 0) /
      scores.length;

    return {
      topic,
      subject,
      average,
      count: scores.length,
    };
  }
);

const strongTopics = topicPerformance
  .filter((item) => item.average >= 80)
  .sort((a, b) => b.average - a.average);

const weakTopics = topicPerformance
  .filter((item) => item.average < 60)
  .sort((a, b) => a.average - b.average);

const developingTopics = topicPerformance
  .filter(
    (item) => item.average >= 60 && item.average < 80
  )
  .sort((a, b) => a.average - b.average);


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

        
<div className="parent-report-analysis">
  <section className="parent-report-analysis-section">
    <h2>Areas of Strength</h2>

    {strongTopics.length === 0 ? (
      <p>
        No topics have reached the strong performance
        threshold yet.
      </p>
    ) : (
      <ul>
        {strongTopics.map((item) => (
          <li key={`${item.subject}-${item.topic}`}>
            <strong>{item.topic}</strong>
            {" ("}{item.subject}{")"}
            {" — "}
            {formatPercentage(item.average)}
            {" average across "}
            {item.count}
            {" assessment"}
            {item.count === 1 ? "" : "s"}
          </li>
        ))}
      </ul>
    )}
  </section>

  <section className="parent-report-analysis-section">
    <h2>Areas Needing Improvement</h2>

    {weakTopics.length === 0 ? (
      <p>
        No topics currently fall below the
        60% performance threshold.
      </p>
    ) : (
      <ul>
        {weakTopics.map((item) => (
          <li key={`${item.subject}-${item.topic}`}>
            <strong>{item.topic}</strong>
            {" ("}{item.subject}{")"}
            {" — "}
            {formatPercentage(item.average)}
            {" average"}
          </li>
        ))}
      </ul>
    )}
  </section>

  <section className="parent-report-analysis-section">
    <h2>Recommended Next Steps</h2>

    {weakTopics.length > 0 ? (
      <ul>
        {weakTopics.map((item) => (
          <li key={`${item.subject}-${item.topic}`}>
            Review <strong>{item.topic}</strong> using
            guided examples, targeted practice,
            and a follow-up assessment.
          </li>
        ))}
      </ul>
    ) : developingTopics.length > 0 ? (
      <ul>
        {developingTopics.map((item) => (
          <li key={`${item.subject}-${item.topic}`}>
            Continue practising{" "}
            <strong>{item.topic}</strong> with
            mixed exercises and short quizzes.
          </li>
        ))}
      </ul>
    ) : strongTopics.length > 0 ? (
      <p>
        Continue introducing challenging questions,
        real-world applications, and periodic revision
        to maintain strong performance.
      </p>
    ) : (
      <p>
        Record additional assessments to generate
        personalized learning recommendations.
      </p>
    )}
  </section>
</div>


        <p className="parent-report-note">
          This report summarizes the student's recorded
          lessons and assessments across all available dates.
        </p>
      </section>
    </main>
  );
}
