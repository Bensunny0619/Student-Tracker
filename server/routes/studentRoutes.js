
const express = require("express");
const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

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

module.exports = router;
