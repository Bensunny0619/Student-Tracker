const { z } = require("zod");
const express = require("express");
const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();


const studentSchema = z.object({
  first_name: z.string().trim().min(1).max(100),

  grade: z.number().int().min(1).max(12),

  province: z.string().trim().max(100).nullable().optional(),

  timezone: z.string().trim().min(1).max(100),

  parent_name: z.string().trim().max(150).nullable().optional(),

  parent_contact: z.string().trim().max(255).nullable().optional(),

  fee: z.number().min(0).max(99999999.99).nullable().optional(),

  currency: z.string().length(3).regex(/^[A-Za-z]{3}$/)
    .transform((value) => value.toUpperCase())
    .default("CAD"),

  status: z.enum(["active", "paused", "ended"])
    .default("active"),

  consent_date: z.iso.date().nullable().optional(),

  goals: z.array(z.string().trim().min(1).max(500))
    .max(20)
    .nullable()
    .optional(),
}).strict();


// Protect every route in this file
router.use(requireAuth);

// Get students belonging to the logged-in tutor
router.get("/", async (req, res) => {
  try {
    const tutorId = req.session.tutorId;

    // Verify the tutor is still active
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

    const students = await db("students")
      .where("tutor_id", tutorId)
      .select(
        "id",
        "first_name",
        "grade",
        "province",
        "timezone",
        "status",
        "created_at"
      )
      .orderBy("created_at", "desc");

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Failed to retrieve students");

    res.status(500).json({
      success: false,
      message: "Unable to retrieve students",
    });
  }
});



router.post("/", async (req, res) => {
  try {
    const validation = studentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid student information",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const tutorId = req.session.tutorId;

    // Confirm that this tutor account is active
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

    const data = validation.data;

    const [studentId] = await db("students").insert({
      tutor_id: tutorId,
      first_name: data.first_name,
      grade: data.grade,
      province: data.province ?? null,
      timezone: data.timezone,
      parent_name: data.parent_name ?? null,
      parent_contact: data.parent_contact ?? null,
      fee: data.fee ?? null,
      currency: data.currency,
      status: data.status,
      consent_date: data.consent_date ?? null,
      goals: data.goals == null
        ? null
        : JSON.stringify(data.goals),
    });

    const student = await db("students")
      .where({
        id: studentId,
        tutor_id: tutorId,
      })
      .first(
        "id",
        "first_name",
        "grade",
        "province",
        "timezone",
        "status",
        "created_at"
      );

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    console.error("Failed to create student:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create student",
    });
  }
});


module.exports = router;
