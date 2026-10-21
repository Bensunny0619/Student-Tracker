
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
  FileText,
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

const validAssessments = filteredAssessments.filter(
  (assessment) =>
    Number.isFinite(Number(assessment.percentage)) &&
    assessment.percentage !== null
);

function calculateAverage(items) {
  if (items.length === 0) return null;

  const total = items.reduce(
    (sum, assessment) => sum + Number(assessment.percentage),
    0
  );

  return total / items.length;
}

function calculatePerformanceInsight(assessments) {
  if (assessments.length < 2) {
    return {
      status: "Insufficient Data",
      change: null,
      message:
        "Record at least two assessments to generate a performance insight.",
    };
  }

  const midpoint = Math.floor(assessments.length / 2);

  const earlierAssessments = assessments.slice(0, midpoint);
  const recentAssessments = assessments.slice(midpoint);

  const earlierAverage = calculateAverage(earlierAssessments);
  const recentAverage = calculateAverage(recentAssessments);

  const change = recentAverage - earlierAverage;

  if (change > 5) {
    return {
      status: "Improving",
      change,
      message:
        "Recent assessment scores are higher than earlier scores. Keep reinforcing the student's progress.",
    };
  }

  if (change < -5) {
    return {
      status: "Declining",
      change,
      message:
        "Recent assessment scores are lower than earlier scores. Review difficult topics and consider additional practice.",
    };
  }

  return {
    status: "Stable",
    change,
    message:
      "Assessment scores are relatively consistent. Continue monitoring progress and introducing appropriate challenges.",
  };
}

const performanceInsight =
  calculatePerformanceInsight(validAssessments);


const topicGroups = {};

filteredAssessments.forEach((assessment) => {
  const topic = assessment.topic?.trim() || "Unspecified Topic";
  const score = Number(assessment.percentage);

  if (
    assessment.percentage === null ||
    assessment.percentage === undefined ||
    !Number.isFinite(score)
  ) {
    return;
  }

  const key = topic.toLowerCase();

  if (!topicGroups[key]) {
    topicGroups[key] = {
      topic,
      scores: [],
    };
  }

  topicGroups[key].scores.push(score);
});

const topicPerformance = Object.values(topicGroups)
  .map(({ topic, scores }) => {
    const average =
      scores.reduce((sum, score) => sum + score, 0) /
      scores.length;

    let status = "Needs Attention";

    if (average >= 80) {
      status = "Strong";
    } else if (average >= 60) {
      status = "Developing";
    }

    return {
      topic,
      average: Number(average.toFixed(2)),
      count: scores.length,
      status,
    };
  })
  .sort((a, b) => a.average - b.average);

  
const tutorRecommendations = topicPerformance.map((item) => {
  let priority;
  let recommendation;

  if (item.status === "Needs Attention") {
    priority = "High";
    recommendation =
      "Revisit the fundamentals of this topic. Use guided examples, " +
      "assign targeted practice questions, and reassess the student " +
      "after additional instruction.";
  } else if (item.status === "Developing") {
    priority = "Medium";
    recommendation =
      "Review common mistakes and provide mixed practice questions. " +
      "Use a short follow-up quiz to check understanding.";
  } else {
    priority = "Low";
    recommendation =
      "Introduce more challenging questions and real-world applications. " +
      "Periodically revisit this topic to maintain mastery.";
  }

  return {
    topic: item.topic,
    average: item.average,
    count: item.count,
    status: item.status,
    priority,
    recommendation,
  };
});



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

<div className="performance-insight-card">
  <div className="performance-insight-header">
    <h3>Performance Insight</h3>

    <span
      className={`performance-insight-status ${
        performanceInsight.status
          .toLowerCase()
          .replace(/\s+/g, "-")
      }`}
    >
      {performanceInsight.status}
    </span>
  </div>

  {performanceInsight.change !== null && (
    <p className="performance-insight-change">
      {performanceInsight.change > 0 ? "+" : ""}
      {performanceInsight.change.toFixed(2)}
      {" percentage points"}
    </p>
  )}

  <p>{performanceInsight.message}</p>
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
  <h2>Topic Performance Analysis</h2>

  <p>
    Identify topics that need more practice based on
    assessment performance.
  </p>

  {topicPerformance.length === 0 ? (
    <p>
      No topic performance data available for the
      selected filters.
    </p>
  ) : (
    <div className="topic-performance-list">
      {topicPerformance.map((item) => (
        <div
          className="topic-performance-item"
          key={item.topic.toLowerCase()}
        >
          <div className="topic-performance-heading">
            <h3>{item.topic}</h3>

            <strong>
              {formatPercentage(item.average)}
            </strong>
          </div>

          <div className="topic-progress-track">
            <div
              className={`topic-progress-fill ${
                item.status === "Strong"
                  ? "strong"
                  : item.status === "Developing"
                  ? "developing"
                  : "needs-attention"
              }`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, item.average)
                )}%`,
              }}
            />
          </div>

          <div className="topic-performance-footer">
            <span>
              {item.count} assessment
              {item.count === 1 ? "" : "s"}
            </span>

            <span>{item.status}</span>
          </div>
        </div>
      ))}
    </div>
  )}
</section>






<section className="student-progress-section">
  <h2>Personalized Tutor Recommendations</h2>

  <p>
    Suggested teaching actions based on the student's
    assessment performance.
  </p>

  {tutorRecommendations.length === 0 ? (
    <p>
      No recommendations available for the selected filters.
      Record assessments to generate teaching suggestions.
    </p>
  ) : (
    <div className="tutor-recommendations-list">
      {tutorRecommendations.map((item) => (
        <div
          className="tutor-recommendation-card"
          key={item.topic.toLowerCase()}
        >
          <div className="tutor-recommendation-header">
            <h3>{item.topic}</h3>

            <span
              className={`tutor-priority ${
                item.priority.toLowerCase()
              }`}
            >
              {item.priority} Priority
            </span>
          </div>

          <p className="tutor-recommendation-meta">
            Average: {formatPercentage(item.average)}
            {" · "}
            {item.count} assessment
            {item.count === 1 ? "" : "s"}
            {" · "}
            {item.status}
          </p>

          <p>{item.recommendation}</p>
        </div>
      ))}
    </div>
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

          <Link
  to={`/students/${id}/parent-report`}
  className="student-action-link"
>
  <FileText size={18} />
  Parent Progress Report
</Link>

<Link
  to={`/students/${id}/parent-report/history`}
  className="student-action-link"
>
  <History size={18} />
  View Report History
</Link>
        </div>
      </section>
    </main>
  );
}
