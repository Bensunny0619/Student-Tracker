
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

  
const [period, setPeriod] = useState("all");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [filterError, setFilterError] = useState("");

const [appliedFilter, setAppliedFilter] = useState({
  period: "all",
});


  const reportDate = new Date().toLocaleDateString("en-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

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

        
const params = new URLSearchParams({
  period: appliedFilter.period,
});

if (appliedFilter.period === "custom") {
  params.set("startDate", appliedFilter.startDate);
  params.set("endDate", appliedFilter.endDate);
}

const response = await fetch(
  `/api/students/${id}/progress?${params.toString()}`,
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
}, [id, appliedFilter]);


function handlePeriodChange(event) {
  const selectedPeriod = event.target.value;

  setPeriod(selectedPeriod);
  setFilterError("");

  if (selectedPeriod !== "custom") {
    setAppliedFilter({ period: selectedPeriod });
  }
}

function handleApplyCustomFilter() {
  if (!startDate || !endDate) {
    setFilterError("Please select both dates.");
    return;
  }

  if (startDate > endDate) {
    setFilterError(
      "Start date cannot be after end date."
    );
    return;
  }

  setFilterError("");

  setAppliedFilter({
    period: "custom",
    startDate,
    endDate,
  });
}


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

  const subject =
  assessment.subject?.trim() || "Unspecified Subject";

const key = `${subject}:${topic}`.toLowerCase();

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


<div className="parent-report-filters">
  <h2>Report Period</h2>

  <div className="parent-report-filter-controls">
    <div>
      <label htmlFor="parent-report-period">
        Select Period
      </label>

      <select
        id="parent-report-period"
        value={period}
        onChange={handlePeriodChange}
      >
        <option value="all">All Recorded Dates</option>
        <option value="7">Last 7 Days</option>
        <option value="30">Last 30 Days</option>
        <option value="90">Last 90 Days</option>
        <option value="custom">Custom Date Range</option>
      </select>
    </div>

    {period === "custom" && (
      <>
        <div>
          <label htmlFor="parent-report-start">
            Start Date
          </label>

          <input
            id="parent-report-start"
            type="date"
            value={startDate}
            onChange={(e) =>
              setStartDate(e.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="parent-report-end">
            End Date
          </label>

          <input
            id="parent-report-end"
            type="date"
            value={endDate}
            onChange={(e) =>
              setEndDate(e.target.value)
            }
          />
        </div>

        <button
          type="button"
          onClick={handleApplyCustomFilter}
          className="parent-report-apply-btn"
        >
          Apply Filter
        </button>
      </>
    )}
  </div>

  {filterError && (
    <p className="parent-report-filter-error" role="alert">
      {filterError}
    </p>
  )}
</div>


      
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


      <section className="parent-report">
        
<div className="parent-report-header">
  <div className="parent-report-brand">
    <FileText size={34} />

    <div>
      <p className="eyebrow">STUDENT PROGRESS TRACKER</p>
      <h1>Student Progress Report</h1>
      <p>Academic Performance & Learning Development</p>
    </div>
  </div>

  <div className="parent-report-details">
    <p>
      <strong>Student:</strong> {student?.first_name}
    </p>

    <p>
      <strong>Grade:</strong> {student?.grade}
    </p>

    <p>
      <strong>Report Date:</strong> {reportDate}
    </p>

    
const reportPeriodLabels = {
  all: "All Recorded Dates",
  7: "Last 7 Days",
  30: "Last 30 Days",
  90: "Last 90 Days",
};

const reportPeriodLabel =
  appliedFilter.period === "custom"
    ? `${appliedFilter.startDate} to ${appliedFilter.endDate}`
    : reportPeriodLabels[appliedFilter.period];


   <p>
  <strong>Reporting Period:</strong> {reportPeriodLabel}
</p>
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
  lessons and assessments for the selected reporting period.
</p>

        
<div className="parent-report-footer">
  <p>
    <strong>Understanding This Report</strong>
  </p>

  <p>
    Topic performance is classified as Strong (80% and above),
    Developing (60%–79.99%), or Needs Attention
    (below 60%). These categories are tutoring guidelines
    based on recorded assessments.
  </p>

  <p>
    This report is intended to support communication
    between tutors and parents. Assessment results
    should be considered alongside classroom participation,
    lesson observations, and individual learning needs.
  </p>

  <p className="parent-report-generated">
    Generated on {reportDate}
  </p>
</div>

      </section>
    </main>
  );
}
