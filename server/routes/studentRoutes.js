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

const updateStudentSchema = studentSchema
  .omit({ status: true })
  .partial()
  .extend({
    status: z.enum(["active", "paused", "ended"]).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update" }
  );




router.get("/:id", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const tutor = await db("tutors")
      .where({
        id: req.session.tutorId,
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
        tutor_id: req.session.tutorId,
      })
      .first();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // MariaDB may return JSON as a string.
    if (typeof student.goals === "string") {
      student.goals = JSON.parse(student.goals);
    }

    return res.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Failed to retrieve student");

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve student",
    });
  }
});


router.patch("/:id", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const validation = updateStudentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid student information",
      });
    }

    const tutorId = req.session.tutorId;

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

    const existingStudent = await db("students")
      .where({
        id: studentId,
        tutor_id: tutorId,
      })
      .first("id");

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const updates = { ...validation.data };

    if (updates.goals !== undefined) {
      updates.goals = updates.goals === null
        ? null
        : JSON.stringify(updates.goals);
    }

    await db("students")
      .where({
        id: studentId,
        tutor_id: tutorId,
      })
      .update(updates);

    const student = await db("students")
      .where({
        id: studentId,
        tutor_id: tutorId,
      })
      .first();

    if (typeof student.goals === "string") {
      student.goals = JSON.parse(student.goals);
    }

    return res.json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    console.error("Failed to update student");

    return res.status(500).json({
      success: false,
      message: "Unable to update student",
    });
  }
});


module.exports = router;
