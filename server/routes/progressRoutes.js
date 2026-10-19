
const express = require("express");
const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDateRange(query) {
  const period = query.period || "all";

  if (period === "all") {
    return { period, startDate: null, endDate: null };
  }

  if (["7", "30", "90"].includes(period)) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    start.setDate(start.getDate() - (Number(period) - 1));

    return {
      period,
      startDate: formatDate(start),
      endDate: formatDate(today),
    };
  }

  if (period === "custom") {
    const { startDate, endDate } = query;

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      throw new Error("Enter valid start and end dates in YYYY-MM-DD format");
    }

    if (startDate > endDate) {
      throw new Error("Start date cannot be after end date");
    }

    return { period, startDate, endDate };
  }

  throw new Error("Invalid period. Use 7, 30, 90, all, or custom");
}

// GET /api/students/:id/progress
router.get("/", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const tutorId = req.session.tutorId;

    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    let dateRange;

    try {
      dateRange = getDateRange(req.query);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

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

    const student = await db("students")
      .where({
        id: studentId,
        tutor_id: tutorId,
      })
      .first("id", "first_name", "grade");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Apply the same date range to lessons and assessments.
    const lessonQuery = db("lessons")
      .where({ student_id: studentId });

    const assessmentQuery = db("assessments")
      .where({ student_id: studentId });

    if (dateRange.startDate && dateRange.endDate) {
      lessonQuery.whereBetween("lesson_date", [
        dateRange.startDate,
        dateRange.endDate,
      ]);

      assessmentQuery.whereBetween("assessment_date", [
        dateRange.startDate,
        dateRange.endDate,
      ]);
    }

    const lessons = await lessonQuery
      .orderBy("lesson_date", "desc")
      .orderBy("id", "desc")
      .select("*");

    const assessments = await assessmentQuery
      .orderBy("assessment_date", "desc")
      .orderBy("id", "desc")
      .select("*");

    const percentages = assessments
      .filter((assessment) => Number(assessment.total_marks) > 0)
      .map(
        (assessment) =>
          (Number(assessment.score) / Number(assessment.total_marks)) * 100
      );

    const averageScore =
      percentages.length > 0
        ? Number(
            (
              percentages.reduce((sum, percentage) => sum + percentage, 0) /
              percentages.length
            ).toFixed(2)
          )
        : null;

    const highestScore =
      percentages.length > 0
        ? Number(Math.max(...percentages).toFixed(2))
        : null;

    const lowestScore =
      percentages.length > 0
        ? Number(Math.min(...percentages).toFixed(2))
        : null;

    
      
const assessmentTrend = assessments
  .filter((assessment) => Number(assessment.total_marks) > 0)
  .map((assessment) => ({
    id: assessment.id,
    assessment_date: assessment.assessment_date,
    subject: assessment.subject,
    topic: assessment.topic,
    assessment_type: assessment.assessment_type,
    percentage: Number(
      (
        (Number(assessment.score) /
          Number(assessment.total_marks)) *
        100
      ).toFixed(2)
    ),
  }))
  .reverse();


    
    const latestLesson = lessons[0] || null;

    const latestAssessment = assessments[0]
      ? {
          ...assessments[0],
          percentage:
            Number(assessments[0].total_marks) > 0
              ? Number(
                  (
                    (Number(assessments[0].score) /
                      Number(assessments[0].total_marks)) *
                    100
                  ).toFixed(2)
                )
              : null,
        }
      : null;

    return res.status(200).json({
      success: true,
      student,
      filters: {
        period: dateRange.period,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      },
      summary: {
        total_lessons: lessons.length,
        total_assessments: assessments.length,
        average_score: averageScore,
        highest_score: highestScore,
        lowest_score: lowestScore,
      },
      recent_activity: {
        latest_lesson: latestLesson,
        latest_assessment: latestAssessment,
      },
      assessment_trend: assessmentTrend,
    });
  } catch (error) {
    console.error("Failed to retrieve student progress:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve student progress",
    });
  }
});

module.exports = router;
