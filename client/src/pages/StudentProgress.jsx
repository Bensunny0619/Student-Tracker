
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function formatPercentage(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${Number(value).toFixed(2)}%`;
}

export default function StudentProgress() {
  const { id } = useParams();

  const [period, setPeriod] = useState("all");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [filterError, setFilterError] = useState("");
const [assessmentTrend, setAssessmentTrend] = useState([]);
const [selectedSubject, setSelectedSubject] = useState("all");
const [appliedFilter, setAppliedFilter] = useState({
  period: "all",
});

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

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load student progress"
          );
        }

        setStudent(data.student);
        setSummary(data.summary);
        setRecentActivity(data.recent_activity);
        setAssessmentTrend(data.assessment_trend || []);
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
    setFilterError("Please select both start and end dates.");
    return;
  }

  if (startDate > endDate) {
    setFilterError("Start date cannot be after end date.");
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



const availableSubjects = [
  ...new Set(
    assessmentTrend
      .map((assessment) => assessment.subject)
      .filter(Boolean)
  ),
].sort((a, b) => a.localeCompare(b));

const filteredAssessments = assessmentTrend.filter(
  (assessment) =>
    selectedSubject === "all" ||
    assessment.subject === selectedSubject
);


const subjectScores = filteredAssessments
  .map((assessment) => Number(assessment.percentage))
  .filter((score) => Number.isFinite(score));

const subjectStats = {
  total: subjectScores.length,
  average:
    subjectScores.length > 0
      ? subjectScores.reduce((sum, score) => sum + score, 0) /
        subjectScores.length
      : null,
  highest:
    subjectScores.length > 0
      ? Math.max(...subjectScores)
      : null,
  lowest:
    subjectScores.length > 0
      ? Math.min(...subjectScores)
      : null,
};


const chartData = filteredAssessments.map((assessment, index) => ({
  ...assessment,
  label: `#${index + 1}`,
  score: assessment.percentage,
  displayDate: new Date(assessment.assessment_date).toLocaleDateString(
    "en-CA",
    {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ),
}));





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
  <h2>Filter Progress Report</h2>

  <div className="progress-filter-controls">
    <label htmlFor="progress-period">
      Report Period
    </label>

    <select
      id="progress-period"
      value={period}
      onChange={handlePeriodChange}
    >
      <option value="all">All Time</option>
      <option value="7">Last 7 Days</option>
      <option value="30">Last 30 Days</option>
      <option value="90">Last 90 Days</option>
      <option value="custom">Custom Date Range</option>
    </select>

    {period === "custom" && (
      <div className="progress-custom-dates">
        <div>
          <label htmlFor="progress-start-date">
            Start Date
          </label>

          <input
            id="progress-start-date"
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="progress-end-date">
            End Date
          </label>

          <input
            id="progress-end-date"
            type="date"
            value={endDate}
            onChange={(event) =>
              setEndDate(event.target.value)
            }
          />
        </div>

        <button
          type="button"
          onClick={handleApplyCustomFilter}
        >
          Apply Filter
        </button>
      </div>
    )}

    {filterError && (
      <p className="error-message" role="alert">
        {filterError}
      </p>
    )}
  </div>
</section>


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
  <h2>Assessment Performance Trend</h2>

  <p>
    Track assessment scores over time for the selected
    reporting period.
  </p>



<div className="progress-subject-filter">
  <label htmlFor="progress-subject">
    Filter by Subject
  </label>

  <select
    id="progress-subject"
    value={selectedSubject}
    onChange={(event) =>
      setSelectedSubject(event.target.value)
    }
  >
    <option value="all">All Subjects</option>

    {availableSubjects.map((subject) => (
      <option key={subject} value={subject}>
        {subject}
      </option>
    ))}
  </select>
</div>

<p>
  Showing {chartData.length} assessment
  {chartData.length === 1 ? "" : "s"}.
</p>



<div className="subject-stats-grid">
  <div className="subject-stat-card">
    <span>Total Assessments</span>
    <strong>{subjectStats.total}</strong>
  </div>

  <div className="subject-stat-card">
    <span>Average Score</span>
    <strong>{formatPercentage(subjectStats.average)}</strong>
  </div>

  <div className="subject-stat-card">
    <span>Highest Score</span>
    <strong>{formatPercentage(subjectStats.highest)}</strong>
  </div>

  <div className="subject-stat-card">
    <span>Lowest Score</span>
    <strong>{formatPercentage(subjectStats.lowest)}</strong>
  </div>
</div>



  {chartData.length > 0 ? (
    <div className="student-trend-chart">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 25,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="label"
            label={{
              value: "Assessment",
              position: "insideBottom",
              offset: -5,
            }}
          />

          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />

          <Tooltip
            formatter={(value) => [
              `${Number(value).toFixed(2)}%`,
              "Score",
            ]}
            labelFormatter={(_, payload) => {
              const assessment = payload?.[0]?.payload;

              return assessment
                ? `${assessment.topic} — ${assessment.displayDate}`
                : "Assessment";
            }}
          />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <p>
      No assessments available for this reporting period.
    </p>
  )}
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
