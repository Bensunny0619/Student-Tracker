
const express = require("express");
const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

// GET /api/students/:id/progress
router.get("/", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const tutorId = req.session.tutorId;

    // 1. Validate student ID
    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    // 2. Confirm tutor is active
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

    // 3. Confirm student belongs to tutor
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

    // 4. Retrieve the student's lessons
    const lessons = await db("lessons")
      .where({ student_id: studentId })
      .orderBy("id", "desc")
      .select("*");

    // 5. Retrieve the student's assessments
    const assessments = await db("assessments")
      .where({ student_id: studentId })
      .orderBy("assessment_date", "desc")
      .orderBy("id", "desc")
      .select("*");

    // 6. Calculate assessment statistics
    const percentages = assessments
      .filter(
        (assessment) =>
          Number(assessment.total_marks) > 0
      )
      .map(
        (assessment) =>
          (Number(assessment.score) /
            Number(assessment.total_marks)) *
          100
      );

    const totalAssessments = assessments.length;
    const totalLessons = lessons.length;

    const averageScore =
      percentages.length > 0
        ? Number(
            (
              percentages.reduce(
                (sum, percentage) => sum + percentage,
                0
              ) / percentages.length
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

    // 7. Get recent lesson and assessment
    const latestLesson = lessons[0] || null;

    const latestAssessment = assessments[0]
      ? {
          ...assessments[0],
          percentage: Number(
            (
              (Number(assessments[0].score) /
                Number(assessments[0].total_marks)) *
              100
            ).toFixed(2)
          ),
        }
      : null;

    // 8. Return combined progress summary
    return res.status(200).json({
      success: true,
      student,
      summary: {
        total_lessons: totalLessons,
        total_assessments: totalAssessments,
        average_score: averageScore,
        highest_score: highestScore,
        lowest_score: lowestScore,
      },
      recent_activity: {
        latest_lesson: latestLesson,
        latest_assessment: latestAssessment,
      },
    });
  } catch (error) {
    console.error(
      "Failed to retrieve student progress:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve student progress",
    });
  }
});

module.exports = router;
