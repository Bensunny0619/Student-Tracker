
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



/**
 * GET /api/students/:id/report-feedback/history
 *
 * Returns all saved feedback periods for the student,
 * ordered from newest to oldest.
 */
router.get("/history", async (req, res) => {
  try {
    const student = await verifyStudent(req, res);

    if (!student) return;

    const reports = await db("parent_report_feedback")
      .where("student_id", student.id)
      .select(
        "id",
        "period_start",
        "period_end",
        "observations",
        "improvements",
        "goals",
        "created_at",
        "updated_at"
      )
      .orderBy("period_start", "desc")
      .orderBy("id", "desc");

    // Convert database dates to YYYY-MM-DD.
    // Avoid timezone-related date shifts.
    const formatDbDate = (value) => {
      if (typeof value === "string") {
        return value.slice(0, 10);
      }

      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const history = reports.map((report) => ({
      id: report.id,
      startDate: formatDbDate(report.period_start),
      endDate: formatDbDate(report.period_end),
      hasObservations: Boolean(report.observations?.trim()),
      hasImprovements: Boolean(report.improvements?.trim()),
      hasGoals: Boolean(report.goals?.trim()),
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    }));

    return res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Failed to retrieve report history:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve report history",
    });
  }
});



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



/**
 * DELETE /api/students/:id/report-feedback
 *
 * Deletes saved tutor feedback for one reporting period.
 * Does not delete lessons or assessments.
 */
router.delete("/", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate YYYY-MM-DD dates, including real calendar dates.
    const isValidDate = (value) => {
      if (typeof value !== "string") return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(0);
      date.setUTCFullYear(year, month - 1, day);

      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      );
    };

    if (
      !isValidDate(startDate) ||
      !isValidDate(endDate) ||
      startDate > endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid startDate and endDate are required.",
      });
    }

    // Reuse the existing authentication and ownership helper.
    const student = await verifyStudent(req, res);

    if (!student) return;

    const deletedCount = await db("parent_report_feedback")
      .where({
        student_id: student.id,
        period_start: startDate,
        period_end: endDate,
      })
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No saved feedback found for this reporting period.",
      });
    }

    return res.json({
      success: true,
      message: "Saved report feedback deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete report feedback:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete saved report feedback.",
    });
  }
});



/**
 * PATCH /api/students/:id/report-feedback/delivery
 *
 * Manually mark an existing report as sent.
 */
const deliverySchema = periodSchema.safeExtend({
  deliveryMethod: z.enum(["whatsapp", "email", "other"]),
});

router.patch("/delivery", async (req, res) => {
  try {
    const student = await verifyStudent(req, res);
    if (!student) return;

    const validation = deliverySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid report delivery information",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { startDate, endDate, deliveryMethod } =
      validation.data;

    const reportQuery = {
      student_id: student.id,
      period_start: startDate,
      period_end: endDate,
    };

    const report = await db("parent_report_feedback")
      .where(reportQuery)
      .first();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Save the report feedback before marking it as sent.",
      });
    }

    if (Boolean(report.is_sent)) {
      return res.status(409).json({
        success: false,
        message: "This report is already marked as sent.",
      });
    }

    const updatedCount = await db("parent_report_feedback")
      .where(reportQuery)
      .where("is_sent", false)
      .update({
        is_sent: true,
        sent_at: db.fn.now(),
        delivery_method: deliveryMethod,
        updated_at: db.fn.now(),
      });

    if (!updatedCount) {
      return res.status(409).json({
        success: false,
        message: "Report delivery status has already changed.",
      });
    }

    const updatedReport = await db("parent_report_feedback")
      .where(reportQuery)
      .first();

    return res.json({
      success: true,
      message: "Report marked as sent successfully.",
      delivery: {
        isSent: Boolean(updatedReport.is_sent),
        sentAt: updatedReport.sent_at,
        deliveryMethod: updatedReport.delivery_method,
      },
    });
  } catch (error) {
    console.error("Failed to update report delivery:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update report delivery.",
    });
  }
});


module.exports = router;
