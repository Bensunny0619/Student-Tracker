
const express = require("express");
const argon2 = require("argon2");
const { z } = require("zod");
const rateLimit = require("express-rate-limit");

const db = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password format",
      });
    }

    const { email, password } = validation.data;

    const tutor = await db("tutors")
      .where({ email, status: "active" })
      .first();

    const validPassword = tutor
      ? await argon2.verify(tutor.password_hash, password)
      : false;

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Unable to create session",
        });
      }

      req.session.tutorId = tutor.id;

      req.session.save((saveError) => {
        if (saveError) {
          return res.status(500).json({
            success: false,
            message: "Unable to save session",
          });
        }

        return res.json({
          success: true,
          message: "Login successful",
          tutor: {
            id: tutor.id,
            name: tutor.name,
            email: tutor.email,
            role: tutor.role,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login request failed");

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const tutor = await db("tutors")
      .select("id", "name", "email", "role")
      .where({
        id: req.session.tutorId,
        status: "active",
      })
      .first();

    if (!tutor) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    res.json({
      success: true,
      tutor,
    });
  } catch (error) {
    console.error("Session verification failed");

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.json({
      success: true,
      message: "Logged out",
    });
  }

  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Unable to log out",
      });
    }

    res.clearCookie("tracker.sid");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

module.exports = router;
