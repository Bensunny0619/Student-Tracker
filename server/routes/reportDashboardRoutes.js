
const express = require("express");
const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Protect all dashboard endpoints
router.use(requireAuth);

// GET /api/reports/dashboard?month=2026-10
router.get("/", async (req, res) => {
  try {
    const { month } = req.query;

    if (
      typeof month !== "string" ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid month in YYYY-MM format.",
      });
    }

    const [year, monthNumber] = month.split("-").map(Number);

    const lastDay = new Date(year, monthNumber, 0).getDate();

    const startDate = `${month}-01`;
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    // Identify the logged-in tutor
    const tutorId = req.session.tutorId;

    // Confirm tutor account is active
    const tutor = await db("tutors")
      .where({
        id: tutorId,
        status: "active",
      })
      .first("id");

    if (!tutor) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Retrieve only this tutor's students
   const students = await db("students")
  .where("tutor_id", tutorId)
  .select("id", "first_name", "grade")
  .orderBy("first_name", "asc");

    const studentIds = students.map((student) => student.id);

    let savedReports = [];

    if (studentIds.length > 0) {
      savedReports = await db("parent_report_feedback")
        .whereIn("student_id", studentIds)
        .where("period_start", startDate)
        .where("period_end", endDate)
       .select(
  "student_id",
  "updated_at",
  "is_sent",
  "sent_at",
  "delivery_method"
);
    }

    const savedReportMap = new Map(
      savedReports.map((report) => [
        Number(report.student_id),
        report,
      ])
    );

  
const results = students.map((student) => {
  const savedReport = savedReportMap.get(Number(student.id));

  const reportStatus = !savedReport
    ? "not_prepared"
    : Boolean(savedReport.is_sent)
      ? "sent"
      : "ready_to_send";

  return {
    id: student.id,
    firstName: student.first_name,
    grade: student.grade,
    reportStatus,
    lastUpdated: savedReport?.updated_at || null,
    sentAt: savedReport?.sent_at || null,
    deliveryMethod: savedReport?.delivery_method || null,
  };
});


    
const readyCount = results.filter(
  (student) => student.reportStatus === "ready_to_send"
).length;

const sentCount = results.filter(
  (student) => student.reportStatus === "sent"
).length;

const notPreparedCount = results.filter(
  (student) => student.reportStatus === "not_prepared"
).length;

return res.json({
  success: true,
  month,
  startDate,
  endDate,
  summary: {
    totalStudents: results.length,
    reportsSaved: readyCount + sentCount,
    readyToSend: readyCount,
    reportsSent: sentCount,
    notPrepared: notPreparedCount,
  },
  students: results,
});


  } catch (error) {
    console.error("Report dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load report dashboard.",
    });
  }
});

module.exports = router;
