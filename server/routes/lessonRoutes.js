
const express = require("express");
const { z } = require("zod");

const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

const lessonSchema = z.object({
  lesson_date: z.iso.date(),

  subject: z.string().trim().min(1).max(100),

  topic: z.string().trim().min(1).max(255),

  duration_minutes: z.number().int().min(1).max(600),

  lesson_notes: z.string().trim().max(5000).nullable().optional(),

  homework: z.string().trim().max(5000).nullable().optional(),

  performance_notes: z.string().trim().max(5000).nullable().optional(),
}).strict();

// POST /api/students/:id/lessons
router.post("/", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const validation = lessonSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson information",
        errors: validation.error.flatten(),
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

    const [lessonId] = await db("lessons").insert({
      student_id: studentId,
      ...validation.data,
    });

    const lesson = await db("lessons")
      .where({
        id: lessonId,
        student_id: studentId,
      })
      .first();

    return res.status(201).json({
      success: true,
      message: "Lesson saved successfully",
      lesson,
    });
  } catch (error) {
    console.error("Failed to save lesson:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save lesson",
    });
  }
});



 // GET /api/students/:id/lessons
router.get("/", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const tutorId = req.session.tutorId;

    // Confirm the logged-in tutor is still active
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

    // Only allow access to the tutor's own student
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

    // Get the student's lessons, newest first
    const lessons = await db("lessons")
      .where({ student_id: studentId })
      .orderBy("lesson_date", "desc")
      .orderBy("id", "desc")
      .select(
        "id",
        "student_id",
        "lesson_date",
        "subject",
        "topic",
        "duration_minutes",
        "lesson_notes",
        "homework",
        "performance_notes",
        "created_at"
      );

    return res.json({
      success: true,
      student,
      count: lessons.length,
      lessons,
    });
  } catch (error) {
    console.error("Failed to retrieve lessons:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve lessons",
    });
  }
});


const updateLessonSchema = z.object({
  lesson_date: z.iso.date().optional(),

  subject: z.string().trim().min(1).max(100).optional(),

  topic: z.string().trim().min(1).max(255).optional(),

  duration_minutes: z.number().int().min(1).max(600).optional(),

  lesson_notes: z.string().trim().max(5000).nullable().optional(),

  homework: z.string().trim().max(5000).nullable().optional(),

  performance_notes: z.string().trim().max(5000).nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

// PATCH /api/students/:id/lessons/:lessonId
router.patch("/:lessonId", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const lessonId = Number(req.params.lessonId);
    const tutorId = req.session.tutorId;

    if (
      !Number.isSafeInteger(studentId) ||
      studentId < 1 ||
      !Number.isSafeInteger(lessonId) ||
      lessonId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or lesson ID",
      });
    }

    const validation = updateLessonSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson information",
        errors: validation.error.flatten(),
      });
    }

    // Confirm the logged-in tutor is active
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
      .first("id");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Confirm the lesson belongs to this student
    const lesson = await db("lessons")
      .where({
        id: lessonId,
        student_id: studentId,
      })
      .first("id");

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    await db("lessons")
      .where({
        id: lessonId,
        student_id: studentId,
      })
      .update({
        ...validation.data,
        updated_at: db.fn.now(),
      });

    const updatedLesson = await db("lessons")
      .where({
        id: lessonId,
        student_id: studentId,
      })
      .first();

    return res.json({
      success: true,
      message: "Lesson updated successfully",
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error("Failed to update lesson:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update lesson",
    });
  }
});



 // GET /api/students/:id/lessons/:lessonId
router.get("/:lessonId", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const lessonId = Number(req.params.lessonId);
    const tutorId = req.session.tutorId;

    if (
      !Number.isSafeInteger(studentId) ||
      studentId < 1 ||
      !Number.isSafeInteger(lessonId) ||
      lessonId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or lesson ID",
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
      .first("id", "first_name");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const lesson = await db("lessons")
      .where({
        id: lessonId,
        student_id: studentId,
      })
      .first();

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    return res.json({
      success: true,
      student,
      lesson,
    });
  } catch (error) {
    console.error("Failed to retrieve lesson:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve lesson",
    });
  }
});



 // DELETE /api/students/:id/lessons/:lessonId
router.delete("/:lessonId", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const lessonId = Number(req.params.lessonId);
    const tutorId = req.session.tutorId;

    // Validate both IDs
    if (
      !Number.isSafeInteger(studentId) ||
      studentId < 1 ||
      !Number.isSafeInteger(lessonId) ||
      lessonId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or lesson ID",
      });
    }

    // Confirm the logged-in tutor is active
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
      .first("id");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Confirm the lesson belongs to this student
    const lesson = await db("lessons")
      .where({
        id: lessonId,
        student_id: studentId,
      })
      .first("id");

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // Delete the lesson
    await db("lessons")
      .where({
        id: lessonId,
        student_id: studentId,
      })
      .del();

    return res.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete lesson:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete lesson",
    });
  }
});


module.exports = router;
