
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  History,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "Unknown date";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPeriod(startDate, endDate) {
  if (startDate === "1000-01-01" && endDate === "9999-12-31") {
    return "All Recorded Dates";
  }

  const [startYear, startMonth] = startDate.split("-").map(Number);
  const lastDay = new Date(startYear, startMonth, 0).getDate();

  const isFullMonth =
    startDate ===
      `${startYear}-${String(startMonth).padStart(2, "0")}-01` &&
    endDate ===
      `${startYear}-${String(startMonth).padStart(2, "0")}-${String(
        lastDay
      ).padStart(2, "0")}`;

  if (isFullMonth) {
    return new Date(startYear, startMonth - 1, 1).toLocaleDateString(
      "en-CA",
      {
        month: "long",
        year: "numeric",
      }
    );
  }

  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export default function ParentReportHistory() {
  const { id } = useParams();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
const [selectedYear, setSelectedYear] = useState("all");
const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/students/${id}/report-feedback/history`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load parent report history"
          );
        }

        if (!controller.signal.aborted) {
          setReports(data.history || []);
        }
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

    loadHistory();

    return () => controller.abort();
  }, [id]);


  async function handleDeleteReport(report) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this saved report feedback? This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    setDeletingId(report.id);
    setError("");

    const params = new URLSearchParams({
      startDate: report.startDate,
      endDate: report.endDate,
    });

    const response = await fetch(
      `/api/students/${id}/report-feedback?${params.toString()}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to delete report");
    }

   setReports((current) =>
  current.filter((item) => item.id !== report.id)
);
  } catch (err) {
    setError(err.message);
  } finally {
    setDeletingId(null);
  }
}

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const availableYears = [
  ...new Set(
    reports.map((report) => report.startDate.slice(0, 4))
  ),
].sort((a, b) => Number(b) - Number(a));

const filteredReports = reports.filter((report) => {
  const [year, month] = report.startDate.split("-");

  const matchesYear =
    selectedYear === "all" || year === selectedYear;

  const matchesMonth =
    selectedMonth === "all" || month === selectedMonth;

  return matchesYear && matchesMonth;
});


const sortedReports = [...filteredReports].sort((a, b) => {
  if (sortOrder === "newest") {
    return (
      b.startDate.localeCompare(a.startDate) ||
      b.endDate.localeCompare(a.endDate)
    );
  }

  return (
    a.startDate.localeCompare(b.startDate) ||
    a.endDate.localeCompare(b.endDate)
  );
});

  return (
    <main className="students-page">
      <Link
        to={`/students/${id}/progress`}
        className="back-link"
      >
        <ArrowLeft size={18} />
        Back to Student Progress
      </Link>

      <div className="report-history-header">
        <div>
          <h1>
            <History size={26} />
            Parent Report History
          </h1>

          <p>
            View previously saved reporting periods and tutor
            feedback.
          </p>
        </div>

        <Link
          to={`/students/${id}/parent-report`}
          className="report-history-new-link"
        >
          <ClipboardList size={18} />
          Generate Report
        </Link>
      </div>

      {loading && (
        <p role="status">Loading saved reports...</p>
      )}

      {!loading && error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="report-history-empty">
          <History size={36} />

          <h2>No Saved Reports Yet</h2>

          <p>
            Save tutor feedback in a parent report to see its
            reporting period here.
          </p>
        </div>
      )}

{!loading && !error && reports.length > 0 && (
  <div className="report-history-filters">
    <div>
      <label htmlFor="history-month">Filter by Month</label>

      <select
        id="history-month"
        value={selectedMonth}
        onChange={(event) => setSelectedMonth(event.target.value)}
      >
        <option value="all">All Months</option>

        {months.map((month, index) => (
          <option
            key={month}
            value={String(index + 1).padStart(2, "0")}
          >
            {month}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label htmlFor="history-year">Filter by Year</label>

      <select
        id="history-year"
        value={selectedYear}
        onChange={(event) => setSelectedYear(event.target.value)}
      >
        <option value="all">All Years</option>

        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>

    <div>
  <label htmlFor="history-sort">Sort By</label>

  <select
    id="history-sort"
    value={sortOrder}
    onChange={(event) => setSortOrder(event.target.value)}
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
  </select>
</div>

   <button
  type="button"
  onClick={() => {
    setSelectedMonth("all");
    setSelectedYear("all");
    setSortOrder("newest");
  }}
>
  Clear Filters
</button>
  </div>
)}


{!loading &&
  !error &&
  reports.length > 0 &&
  filteredReports.length === 0 && (
    <div className="report-history-no-results">
      <History size={36} />

      <h2>No Reports Match Your Filters</h2>

      <p>
        There are no saved parent reports for the selected
        month and year. Try changing your filters or
        viewing all reports.
      </p>

      <button
        type="button"
        onClick={() => {
          setSelectedMonth("all");
          setSelectedYear("all");
          setSortOrder("newest");
        }}
      >
        Clear Filters
      </button>
    </div>
  )}

      {!loading && !error && filteredReports.length > 0 && (
  <>
    <p className="report-history-count">
           Showing {filteredReports.length} of {reports.length} saved reports
          </p>

          <div className="report-history-list">
           {sortedReports.map((report) => {
              const sections = [
                report.hasObservations && "Observations",
                report.hasImprovements && "Improvements",
                report.hasGoals && "Goals",
              ].filter(Boolean);

              return (
                <article
                  className="report-history-card"
                  key={report.id}
                >
                  <div className="report-history-card-main">
                    <h2>
                      <CalendarDays size={20} />
                      {formatPeriod(
                        report.startDate,
                        report.endDate
                      )}
                    </h2>

                    <p className="report-history-dates">
                      {report.startDate} to {report.endDate}
                    </p>

                    <p className="report-history-sections">
                      {sections.length > 0
                        ? sections.join(" • ")
                        : "No feedback sections completed"}
                    </p>

                    <p className="report-history-updated">
                      Last updated:{" "}
                      {report.updatedAt
                        ? new Date(
                            report.updatedAt
                          ).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>

                 <div className="report-history-card-actions">
  <span className="report-history-status">
    <CheckCircle2 size={16} />
    Saved
  </span>

  <Link
    to={`/students/${id}/parent-report?startDate=${report.startDate}&endDate=${report.endDate}`}
    className="report-history-open-btn"
  >
    Open Report
  </Link>

  <button
  type="button"
  className="report-history-delete-btn"
  onClick={() => handleDeleteReport(report)}
  disabled={deletingId !== null}
>
  {deletingId === report.id ? "Deleting..." : "Delete"}
</button>
</div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
