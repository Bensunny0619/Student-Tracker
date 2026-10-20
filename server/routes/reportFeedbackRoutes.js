
const express = require("express");
const { z } = require("zod");

const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

const dateSchema = z.iso.date();

const periodSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).strict().refine(
  (data) => data.startDate <= data.endDate,
  { message: "Start date must not be after end date" }
);

const feedbackSchema = periodSchema.safeExtend({
  observations: z.string().max(10000),
  improvements: z.string().max(10000),
  goals: z.string().max(10000),
});

// Verify student ID, active tutor and student ownership.
async function verifyStudent(req, res) {
  const studentId = Number(req.params.id);

  if (!Number.isSafeInteger(studentId) || studentId < 1) {
    res.status(400).json({
      success: false,
      message: "Invalid student ID",
    });
    return null;
  }

  const tutor = await db("tutors")
    .where({
      id: req.session.tutorId,
      status: "active",
    })
    .first("id");

  if (!tutor) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return null;
  }

  const student = await db("students")
    .where({
      id: studentId,
      tutor_id: req.session.tutorId,
    })
    .first("id");

  if (!student) {
    res.status(404).json({
      success: false,
      message: "Student not found",
    });
    return null;
  }

  return student;
}

// GET saved feedback for a reporting period.
router.get("/", async (req, res) => {
  try {
    const student = await verifyStudent(req, res);
    if (!student) return;

    const validation = periodSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid reporting period",
      });
    }

    const { startDate, endDate } = validation.data;

    const feedback = await db("parent_report_feedback")
      .where({
        student_id: student.id,
        period_start: startDate,
        period_end: endDate,
      })
      .first();

    return res.json({
      success: true,
      feedback: feedback || null,
    });
  } catch (error) {
    console.error("Failed to retrieve report feedback:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve report feedback",
    });
  }
});

// PUT creates or updates feedback for a reporting period.
router.put("/", async (req, res) => {
  try {
    const student = await verifyStudent(req, res);
    if (!student) return;

    const validation = feedbackSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid report feedback",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const {
      startDate,
      endDate,
      observations,
      improvements,
      goals,
    } = validation.data;

    const values = {
      observations,
      improvements,
      goals,
    };

    await db("parent_report_feedback")
      .insert({
        student_id: student.id,
        period_start: startDate,
        period_end: endDate,
        ...values,
      })
      .onConflict([
        "student_id",
        "period_start",
        "period_end",
      ])
      .merge({
        ...values,
        updated_at: db.fn.now(),
      });

    const feedback = await db("parent_report_feedback")
      .where({
        student_id: student.id,
        period_start: startDate,
        period_end: endDate,
      })
      .first();

    return res.json({
      success: true,
      message: "Report feedback saved successfully",
      feedback,
    });
  } catch (error) {
    console.error("Failed to save report feedback:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save report feedback",
    });
  }
});

module.exports = router;
