import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { ArrowLeft, FileText, Printer, Download } from "lucide-react";
function formatPercentage(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }
  return `${Number(value).toFixed(2)}%`;
}
function formatDateRangeLabel(filter) {
  if (filter.reportType === "monthly") {
    const [year, month] = filter.month.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  }
  if (filter.period === "custom") {
    return `${filter.startDate} to ${filter.endDate}`;
  }
  const labels = {
    all: "All Recorded Dates",
    7: "Last 7 Days",
    30: "Last 30 Days",
    90: "Last 90 Days",
  };
  return labels[filter.period] || "All Recorded Dates";
}
function getReportDateRange(filter) {
  const today = new Date();
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  if (filter.period === "custom") {
    return {
      startDate: filter.startDate,
      endDate: filter.endDate,
    };
  }
  if (filter.period === "all") {
    return {
      startDate: "1000-01-01",
      endDate: "9999-12-31",
    };
  }
  const days = Number(filter.period);
  if (![7, 30, 90].includes(days)) {
    return null;
  }
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return {
    startDate: formatDate(start),
    endDate: formatDate(today),
  };
}
export default function ParentReport() {
  const { id } = useParams();
  const location = useLocation();
const returnMonth = location.state?.reportMonth;
  const [searchParams] = useSearchParams();

  const urlStartDate = searchParams.get("startDate");
  const urlEndDate = searchParams.get("endDate");

  const validDate = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const hasValidUrlDates =
    validDate(urlStartDate) &&
    validDate(urlEndDate) &&
    urlStartDate <= urlEndDate;

 
const urlMonth = hasValidUrlDates
  ? urlStartDate.slice(0, 7)
  : null;

const isFullMonth = (() => {
  if (!hasValidUrlDates || !urlMonth) return false;

  const [year, month] = urlMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();

  return (
    urlStartDate === `${urlMonth}-01` &&
    urlEndDate ===
      `${urlMonth}-${String(lastDay).padStart(2, "0")}`
  );
})();

const initialFilter = hasValidUrlDates
  ? {
      period: "custom",
      startDate: urlStartDate,
      endDate: urlEndDate,
      ...(isFullMonth
        ? {
            reportType: "monthly",
            month: urlMonth,
          }
        : {}),
    }
  : { period: "all" };



 const [period, setPeriod] = useState(
  isFullMonth ? "monthly" : hasValidUrlDates ? "custom" : "all"
);

const [selectedMonth, setSelectedMonth] = useState(() => {
  if (isFullMonth) return urlMonth;

  const now = new Date();
  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
});


const [startDate, setStartDate] = useState(
  hasValidUrlDates ? urlStartDate : ""
);


const [endDate, setEndDate] = useState(
  hasValidUrlDates ? urlEndDate : ""
);

const [filterError, setFilterError] = useState("");

  const [appliedFilter, setAppliedFilter] = useState(initialFilter);
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
  const [tutorComments, setTutorComments] = useState({
    observations: "",
    improvements: "",
    goals: "",
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackReady, setFeedbackReady] = useState(false);
  const [feedbackDirty, setFeedbackDirty] = useState(false);
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
          throw new Error(data.message || "Unable to load parent report");
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
  useEffect(() => {
    const controller = new AbortController();
    async function loadFeedback() {
      const range = getReportDateRange(appliedFilter);
      if (!range) return;
      setFeedbackLoading(true);
      setFeedbackReady(false);
      setFeedbackDirty(false);
      setFeedbackMessage("");
      setFeedbackError("");
      setTutorComments({
        observations: "",
        improvements: "",
        goals: "",
      });
      try {
        const params = new URLSearchParams(range);
        const response = await fetch(
          `/api/students/${id}/report-feedback?${params}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load saved feedback"
          );
        }
        if (!controller.signal.aborted) {
          setTutorComments({
            observations: data.feedback?.observations || "",
            improvements: data.feedback?.improvements || "",
            goals: data.feedback?.goals || "",
          });
          setFeedbackReady(true);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setFeedbackError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setFeedbackLoading(false);
        }
      }
    }
    loadFeedback();
    return () => controller.abort();
  }, [id, appliedFilter]);
  async function handleSaveFeedback() {
    const range = getReportDateRange(appliedFilter);
    if (!range || feedbackLoading || feedbackSaving || !feedbackReady) {
      return;
    }
    setFeedbackSaving(true);
    setFeedbackMessage("");
    setFeedbackError("");
    try {
      const response = await fetch(
        `/api/students/${id}/report-feedback`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...range,
            observations: tutorComments.observations,
            improvements: tutorComments.improvements,
            goals: tutorComments.goals,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save feedback"
        );
      }
      setFeedbackDirty(false);
      setFeedbackMessage("Feedback saved successfully.");
    } catch (error) {
      setFeedbackError(error.message);
    } finally {
      setFeedbackSaving(false);
    }
  }
  function handlePeriodChange(event) {
    const selectedPeriod = event.target.value;
    if (selectedPeriod !== period && !confirmDiscardChanges()) return;
    setPeriod(selectedPeriod);
    setFilterError("");
    if (selectedPeriod !== "custom" && selectedPeriod !== "monthly") {
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
    if (!confirmDiscardChanges()) return;
    setFilterError("");
    setAppliedFilter({
      period: "custom",
      startDate,
      endDate,
    });
  }
  function confirmDiscardChanges() {
    if (feedbackSaving || feedbackLoading || !feedbackReady) return false;
    return !feedbackDirty || window.confirm(
      "You have unsaved tutor feedback. Discard changes and switch reporting periods?"
    );
  }
  function handleApplyMonthlyFilter() {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
      setFilterError("Please select a valid month.");
      return;
    }
    if (!confirmDiscardChanges()) return;
    const [year, month] = selectedMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    setFilterError("");
    setAppliedFilter({
      period: "custom",
      startDate: `${selectedMonth}-01`,
      endDate: `${selectedMonth}-${String(lastDay).padStart(2, "0")}`,
      reportType: "monthly",
      month: selectedMonth,
    });
  }
  useEffect(() => {
    if (!feedbackDirty) return;
    function warnBeforeLeave(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [feedbackDirty]);
  function handleCommentChange(event) {
    const { name, value } = event.target;
    setFeedbackDirty(true);
    setFeedbackMessage("");
    setFeedbackError("");
    setTutorComments((previous) => ({
      ...previous,
      [name]: value,
    }));
  }
  const reportPeriodLabel = formatDateRangeLabel(appliedFilter);

  const studentName = [
  student?.first_name,
  student?.last_name,
]
  .filter(Boolean)
  .join(" ") || "Student";

const safeStudentName = studentName
  .trim()
  .replace(/[^a-zA-Z0-9 -]/g, "")
  .replace(/\s+/g, "_");

const safeReportPeriod = reportPeriodLabel
  .replace(/[^a-zA-Z0-9 -]/g, "")
  .trim()
  .replace(/\s+/g, "_");

const suggestedPdfFilename =
  `MathGenie_${safeStudentName}_${safeReportPeriod}.pdf`;

  const parentMessage = `Dear Parent/Guardian,

I hope you are doing well.

Please find attached the MathGenie Student Progress Report for ${studentName}.

Reporting Period: ${reportPeriodLabel}

This report provides an overview of your child's learning progress, assessment performance, areas of strength, areas requiring improvement, and recommended next steps.

We appreciate your continued support and commitment to your child's academic development.

Please feel free to reach out if you have any questions about the report.

Best regards,
MathGenie
Mathematics Tutoring`;

async function handleCopyParentMessage() {
  try {
    await navigator.clipboard.writeText(parentMessage);
    window.alert("Parent message copied successfully!");
  } catch (error) {
    window.alert("Unable to copy the parent message.");
  }
}

async function handleCopyFilename() {
  try {
    await navigator.clipboard.writeText(suggestedPdfFilename);
    window.alert("PDF filename copied successfully!");
  } catch (error) {
    window.alert("Unable to copy the PDF filename.");
  }
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
    const subject = assessment.subject?.trim() || "Unspecified Subject";
    const key = `${subject}:${topic}`.toLowerCase();
    if (!topicGroups[key]) {
      topicGroups[key] = {
        topic,
        subject,
        scores: [],
      };
    }
    topicGroups[key].scores.push(score);
  });
  const topicPerformance = Object.values(topicGroups).map(
    ({ topic, subject, scores }) => {
      const average =
        scores.reduce((sum, value) => sum + value, 0) / scores.length;
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
    .filter((item) => item.average >= 60 && item.average < 80)
    .sort((a, b) => a.average - b.average);
  return (
    <main className="students-page">
      <Link to={`/students/${id}/progress`} className="back-link"
        onClick={(event) => { if (!confirmDiscardChanges()) event.preventDefault(); }}>
        <ArrowLeft size={18} />
        Back to Student Progress
      </Link>

      <Link
 to={
  returnMonth
    ? `/reports/dashboard?month=${encodeURIComponent(returnMonth)}`
    : "/reports/dashboard"
}
  className="back-link"
  onClick={(event) => {
    if (!confirmDiscardChanges()) {
      event.preventDefault();
    }
  }}
>
  <ArrowLeft size={18} />
  Back to Report Dashboard
</Link>
      <div className="parent-report-filters">
        <h2>Report Period</h2>
        <div className="parent-report-filter-controls">
          <div>
            <label htmlFor="parent-report-period">Select Period</label>
            <select
  id="parent-report-period"
  value={period}
  onChange={handlePeriodChange}
  disabled={feedbackLoading || feedbackSaving}
>
              <option value="all">All Recorded Dates</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="monthly">Monthly Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
            {period === "monthly" && (
              <>
                <div>
                  <label htmlFor="parent-report-month">Select Month</label>
                  <input
                    id="parent-report-month"
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  />
                </div>
                <button type="button" className="parent-report-apply-btn"
                  onClick={handleApplyMonthlyFilter} disabled={feedbackSaving || feedbackLoading}>
                  Generate Monthly Report
                </button>
              </>
            )}
          {period === "custom" && (
            <>
              <div>
                <label htmlFor="parent-report-start">Start Date</label>
                <input
                  id="parent-report-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="parent-report-end">End Date</label>
                <input
                  id="parent-report-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
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
      <div className="parent-report-comment-editor">
        <h2>Tutor's Personalized Feedback</h2>
        <p>
          Add your observations before generating the parent report.
        </p>
        <label htmlFor="tutor-observations">
          Tutor's Observations
        </label>
        <textarea
          id="tutor-observations"
          name="observations"
          rows={4}
          value={tutorComments.observations}
          onChange={handleCommentChange}
          disabled={feedbackLoading || feedbackSaving || !feedbackReady}
          placeholder="Describe the student's participation, confidence, and progress..."
        />
        <label htmlFor="tutor-improvements">
          Areas for Improvement
        </label>
        <textarea
          id="tutor-improvements"
          name="improvements"
          rows={4}
          value={tutorComments.improvements}
          onChange={handleCommentChange}
          disabled={feedbackLoading || feedbackSaving || !feedbackReady}
          placeholder="Describe the areas requiring additional practice..."
        />
        <label htmlFor="tutor-goals">
          Goals for Next Month
        </label>
        <textarea
          id="tutor-goals"
          name="goals"
          rows={4}
          value={tutorComments.goals}
          onChange={handleCommentChange}
          disabled={feedbackLoading || feedbackSaving || !feedbackReady}
          placeholder="Describe the learning goals for the coming month..."
        />
        <div className="parent-report-feedback-actions">
          <button
            type="button"
            className="parent-report-apply-btn"
            onClick={handleSaveFeedback}
            disabled={feedbackLoading || feedbackSaving || !feedbackReady}
          >
            {feedbackSaving
              ? "Saving Feedback..."
              : feedbackLoading
              ? "Loading Feedback..."
              : "Save Feedback"}
          </button>
          {feedbackMessage && (
            <p className="parent-report-save-success" role="status">
              {feedbackMessage}
            </p>
          )}
          {feedbackError && (
            <p className="parent-report-filter-error" role="alert">
              {feedbackError}
            </p>
          )}
        </div>
      </div>
     <div className="parent-report-toolbar">
  <button
    type="button"
    className="parent-report-print-btn"
    onClick={() => window.print()}
    disabled={
      loading ||
      feedbackLoading ||
      feedbackSaving ||
      !feedbackReady ||
      feedbackDirty
    }
  >
    <Printer size={18} />
    Print Report
  </button>

  <button
    type="button"
    className="parent-report-download-btn"
    onClick={() => window.print()}
    disabled={
      loading ||
      feedbackLoading ||
      feedbackSaving ||
      !feedbackReady ||
      feedbackDirty
    }
  >
    <Download size={18} />
    Download PDF
  </button>
</div>


<div className="parent-report-sharing">
  <h2>Share Report with Parent</h2>

  <p>
    Save your report as a PDF, then attach it to
    your WhatsApp message or email.
  </p>

  <div className="parent-report-filename">
    <label>Suggested PDF Filename</label>

    <div className="parent-report-filename-row">
      <code>{suggestedPdfFilename}</code>

      <button
        type="button"
        onClick={handleCopyFilename}
      >
        Copy Filename
      </button>
    </div>
  </div>

  <div className="parent-report-share-actions">
    <button
      type="button"
      onClick={handleCopyParentMessage}
      disabled={
        loading ||
        feedbackLoading ||
        feedbackSaving ||
        !feedbackReady ||
        feedbackDirty
      }
    >
      Copy Parent Message
    </button>
  </div>
</div>


      <section className="parent-report">
        <div className="parent-report-header">
          <div className="parent-report-brand">
  <FileText size={34} />

  <div>
    <p className="eyebrow">MATHGENIE</p>

    <h1>Student Progress Report</h1>

    <p>Personalized Mathematics Education & Academic Excellence</p>
  </div>
</div>
          <div className="parent-report-details">
            <p>
              <strong>Student:</strong> {studentName}
            </p>
            <p>
              <strong>Grade:</strong> {student?.grade}
            </p>
            <p>
              <strong>Report Date:</strong> {reportDate}
            </p>
            <p>
              <strong>Reporting Period:</strong> {reportPeriodLabel}
            </p>
          </div>
        </div>
        {Number(summary.total_assessments) === 0 && (
          <div className="parent-report-empty-notice">
            <strong>No assessments recorded</strong>
            <p>There are no recorded assessments for this reporting period. Unavailable scores do not indicate poor academic performance.</p>
          </div>
        )}
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
            <strong>{formatPercentage(summary.average_score)}</strong>
          </div>
          <div>
            <span>Highest Score</span>
            <strong>{formatPercentage(summary.highest_score)}</strong>
          </div>
          <div>
            <span>Lowest Score</span>
            <strong>{formatPercentage(summary.lowest_score)}</strong>
          </div>
        </div>
        <div className="parent-report-analysis">
          <section className="parent-report-analysis-section">
            <h2>Areas of Strength</h2>
            {strongTopics.length === 0 ? (
              <p>
                No topics have reached the strong performance threshold yet.
              </p>
            ) : (
              <ul>
                {strongTopics.map((item) => (
                  <li key={`${item.subject}-${item.topic}`}>
                    <strong>{item.topic}</strong>
                    {" ("}
                    {item.subject}
                    {") — "}
                    {formatPercentage(item.average)}
                    {" average across "}
                    {item.count}
                    {item.count === 1 ? " assessment" : " assessments"}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="parent-report-analysis-section">
            <h2>Areas Needing Improvement</h2>
            {weakTopics.length === 0 ? (
              <p>
                No topics currently fall below the 60% performance threshold.
              </p>
            ) : (
              <ul>
                {weakTopics.map((item) => (
                  <li key={`${item.subject}-${item.topic}`}>
                    <strong>{item.topic}</strong>
                    {" ("}
                    {item.subject}
                    {") — "}
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
                    Review <strong>{item.topic}</strong> using guided examples,
                    targeted practice, and a follow-up assessment.
                  </li>
                ))}
              </ul>
            ) : developingTopics.length > 0 ? (
              <ul>
                {developingTopics.map((item) => (
                  <li key={`${item.subject}-${item.topic}`}>
                    Continue practising <strong>{item.topic}</strong> with mixed
                    exercises and short quizzes.
                  </li>
                ))}
              </ul>
            ) : strongTopics.length > 0 ? (
              <p>
                Continue introducing challenging questions, real-world
                applications, and periodic revision to maintain strong
                performance.
              </p>
            ) : (
              <p>
                Record additional assessments to generate personalized learning
                recommendations.
              </p>
            )}
          </section>
        </div>
        {Object.values(tutorComments).some(
          (value) => value.trim() !== ""
        ) && (
          <div className="parent-report-feedback">
            <h2>Tutor's Personalized Feedback</h2>
            {tutorComments.observations.trim() && (
              <section>
                <h3>Tutor's Observations</h3>
                <p>{tutorComments.observations}</p>
              </section>
            )}
            {tutorComments.improvements.trim() && (
              <section>
                <h3>Areas for Improvement</h3>
                <p>{tutorComments.improvements}</p>
              </section>
            )}
            {tutorComments.goals.trim() && (
              <section>
                <h3>Goals for Next Month</h3>
                <p>{tutorComments.goals}</p>
              </section>
            )}
          </div>
        )}
        <p className="parent-report-note">
          This report summarizes the student's recorded lessons and assessments
          across the selected reporting period.
        </p>
        <div className="parent-report-footer">
          <p>
            <strong>Understanding This Report</strong>
          </p>
          <p>
            Topic performance is classified as Strong (80% and above),
            Developing (60%–79.99%), or Needs Attention (below 60%). These
            categories are tutoring guidelines based on recorded assessments.
          </p>
          <p>
            This report is intended to support communication between tutors and
            parents. Assessment results should be considered alongside classroom
            participation, lesson observations, and individual learning needs.
          </p>
          <div className="mathgenie-report-footer">
  <p>
    <strong>MathGenie</strong> — Helping Every Student
    Build Confidence in Mathematics.
  </p>

  <p className="parent-report-generated">
    Report generated on {reportDate}
  </p>
</div>
        </div>
      </section>
    </main>
  );
}
