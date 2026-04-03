const { body, param, query, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

const validators = {
  createMeeting: [
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }).withMessage("Title max 200 chars"),
    body("description").optional().trim().isLength({ max: 2000 }),
    body("participants").optional().isArray(),
    body("status").optional().isIn(["scheduled", "ongoing", "completed"]),
    body("scheduledAt").optional().isISO8601().withMessage("Invalid date format"),
    validate,
  ],
  updateMeeting: [
    param("id").isMongoId().withMessage("Invalid meeting ID"),
    body("title").optional().trim().notEmpty().isLength({ max: 200 }),
    body("status").optional().isIn(["scheduled", "ongoing", "completed"]),
    validate,
  ],
  createNote: [
    body("meetingId").isMongoId().withMessage("Invalid meeting ID"),
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 300 }),
    body("content").trim().notEmpty().withMessage("Content is required"),
    body("priority").optional().isIn(["low", "medium", "high"]),
    validate,
  ],
  register: [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must contain uppercase, lowercase, and number"),
    validate,
  ],
  login: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  mongoId: [
    param("id").isMongoId().withMessage("Invalid ID format"),
    validate,
  ],
};

module.exports = validators;
