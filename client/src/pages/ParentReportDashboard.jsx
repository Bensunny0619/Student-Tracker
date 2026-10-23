
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
} from "lucide-react";

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getMonthDateRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);

  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export default function ParentReportDashboard() {
 const [searchParams, setSearchParams] = useSearchParams();

const urlMonth = searchParams.get("month");

const selectedMonth =
  /^\d{4}-(0[1-9]|1[0-2])$/.test(urlMonth || "")
    ? urlMonth
    : getCurrentMonth();

function handleMonthChange(event) {
  const month = event.target.value;

  if (month) {
    setSearchParams({ month });
  }
}

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard data whenever the month changes
  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        setStudents([]);
        setSummary(null);

        const params = new URLSearchParams({
          month: selectedMonth,
        });

        const response = await fetch(
          `/api/reports/dashboard?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load report dashboard."
          );
        }

        if (!controller.signal.aborted) {
          setStudents(data.students || []);
          setSummary(data.summary || null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, [selectedMonth]);

  // Filter students by name and report status
  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const studentName = String(
        student.firstName || ""
      ).toLowerCase();

      const matchesSearch = studentName.includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        student.reportStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
  }

  const reportDateRange = getMonthDateRange(selectedMonth);

  return (
    <main className="students-page">
      <Link to="/students" className="back-link">
        <ArrowLeft size={18} />
        Back to Students
      </Link>

      <div className="report-dashboard-header">
        <h1>
          <ClipboardList size={28} />
          MathGenie Report Dashboard
        </h1>

        <p>
          Track monthly parent report preparation for all
          students.
        </p>
      </div>

      {/* Reporting month */}
      <div className="report-dashboard-period">
        <CalendarDays size={20} />

        <label htmlFor="dashboard-month">
          Reporting Month
        </label>

        <input
          id="dashboard-month"
          type="month"
          value={selectedMonth}
         onChange={handleMonthChange}
        />
      </div>

      {loading && (
        <p role="status">Loading monthly reports...</p>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && summary && (
        <>
          {/* Search and filters */}
          <div className="report-dashboard-filters">
            <div className="report-dashboard-search">
              <label htmlFor="report-student-search">
                Search Student
              </label>

              <div className="report-dashboard-search-input">
                <Search size={18} />

                <input
                  id="report-student-search"
                  type="search"
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="report-dashboard-filter">
              <label htmlFor="report-status-filter">
                Report Status
              </label>

              <select
                id="report-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="all">All Reports</option>
               <option value="not_prepared">Not Prepared</option>
<option value="ready_to_send">Ready to Send</option>
<option value="sent">Sent</option>
              </select>
            </div>

            <button
              type="button"
              className="report-dashboard-clear-btn"
              onClick={clearFilters}
              disabled={
                searchTerm === "" &&
                statusFilter === "all"
              }
            >
              Clear Filters
            </button>
          </div>

        
          
{/* Summary cards */}
<div className="report-dashboard-summary">
  <div>
    <span>Total Students</span>
    <strong>{summary.totalStudents}</strong>
  </div>

  <div>
    <span>Not Prepared</span>
    <strong>{summary.notPrepared}</strong>
  </div>

  <div>
    <span>Ready to Send</span>
    <strong>{summary.readyToSend}</strong>
  </div>

  <div>
    <span>Sent</span>
    <strong>{summary.reportsSent}</strong>
  </div>
</div>


          {/* Student report list */}
          <div className="report-dashboard-students">
            <h2>Student Report Status</h2>

            <p>
              Showing {filteredStudents.length} of{" "}
              {students.length} students
            </p>

            {students.length === 0 ? (
              <p>No students found for your account.</p>
            ) : filteredStudents.length === 0 ? (
              <div className="report-dashboard-no-results">
                <h3>No matching reports found</h3>

                <p>
                  Try another student name or report status.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="report-dashboard-list">
                {filteredStudents.map((student) => {
                  const isSent = student.reportStatus === "sent";
const isReady = student.reportStatus === "ready_to_send";
const isPrepared = isSent || isReady;

                  const reportParams =
                    new URLSearchParams(reportDateRange);

                  const reportUrl =
                    `/students/${student.id}/parent-report?` +
                    reportParams.toString();

                  return (
                    <div
                      className="report-dashboard-student"
                      key={student.id}
                    >
                      <div>
                        <h3>{student.firstName}</h3>
                        <p>Grade {student.grade}</p>
                      </div>

                      <div className="report-dashboard-student-actions">
                       

<div
  className={`report-dashboard-status ${
    isSent
      ? "status-saved"
      : isReady
        ? "status-ready"
        : "status-pending"
  }`}
>
  {isSent ? (
    <>
      <CheckCircle2 size={19} />
      <span>Sent</span>
    </>
  ) : isReady ? (
    <>
      <Clock3 size={19} />
      <span>Ready to Send</span>
    </>
  ) : (
    <>
      <Clock3 size={19} />
      <span>Not Prepared</span>
    </>
  )}
</div>


                     <Link
  className="report-dashboard-action-btn"
  to={reportUrl}
  state={{ reportMonth: selectedMonth }}
>
                          {isPrepared
  ? "View Report"
  : "Prepare Report"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
