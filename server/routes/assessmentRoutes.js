
const express = require("express");
const { z } = require("zod");

const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

// Validate assessment information
const assessmentSchema = z
  .object({
    assessment_date: z.iso.date(),

    subject: z.string().trim().min(1).max(100),

    topic: z.string().trim().min(1).max(255),

    assessment_type: z.enum([
      "Quiz",
      "Test",
      "Exam",
      "Assignment",
    ]),

    score: z.number().int().min(0),

    total_marks: z.number().int().min(1),

    remarks: z.string().trim().max(5000).nullable().optional(),
  })
  .strict()
  .refine((data) => data.score <= data.total_marks, {
    message: "Score cannot be greater than total marks",
    path: ["score"],
  });

// POST /api/students/:id/assessments
router.post("/", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const tutorId = req.session.tutorId;

    // Validate student ID
    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    // Validate request body
    const validation = assessmentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid assessment information",
        errors: z.flattenError(validation.error),
      });
    }

    // Confirm tutor is active
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

    // Confirm student belongs to this tutor
    const student = await db("students")
      .where({
        id: studentId,
        tutor_id: tutorId,
      })
      .first("id");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Save assessment
    const [assessmentId] = await db("assessments").insert({
      student_id: studentId,
      ...validation.data,
    });

    // Retrieve saved assessment
    const assessment = await db("assessments")
      .where({
        id: assessmentId,
        student_id: studentId,
      })
      .first();

    return res.status(201).json({
      success: true,
      message: "Assessment saved successfully",
      assessment: {
        ...assessment,
        percentage:
          (assessment.score / assessment.total_marks) * 100,
      },
    });
  } catch (error) {
    console.error("Failed to save assessment:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save assessment",
    });
  }
});



 // GET /api/students/:id/assessments
router.get("/", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const tutorId = req.session.tutorId;

    // Validate student ID
    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    // Confirm the tutor is active
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

    // Confirm the student belongs to this tutor
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

    // Retrieve assessments, newest first
    const assessments = await db("assessments")
      .where({ student_id: studentId })
      .orderBy("assessment_date", "desc")
      .orderBy("id", "desc")
      .select(
        "id",
        "student_id",
        "assessment_date",
        "subject",
        "topic",
        "assessment_type",
        "score",
        "total_marks",
        "remarks",
        "created_at"
      );

    // Calculate percentage for each assessment
    const assessmentsWithPercentages = assessments.map(
      (assessment) => ({
        ...assessment,
        percentage: Number(
          (
            (assessment.score / assessment.total_marks) *
            100
          ).toFixed(2)
        ),
      })
    );

    return res.json({
      success: true,
      student,
      count: assessmentsWithPercentages.length,
      assessments: assessmentsWithPercentages,
    });
  } catch (error) {
    console.error("Failed to retrieve assessments:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve assessments",
    });
  }
});


module.exports = router;
