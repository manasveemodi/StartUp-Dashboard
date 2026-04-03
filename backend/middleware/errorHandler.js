const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") { statusCode = 401; message = "Invalid token"; }
  if (err.name === "TokenExpiredError") { statusCode = 401; message = "Token expired"; }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") { statusCode = 413; message = "File too large"; }
  if (err.code === "LIMIT_UNEXPECTED_FILE") { statusCode = 400; message = "Unexpected file field"; }

  if (statusCode === 500) {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, url: req.url, method: req.method });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { AppError, errorHandler, asyncHandler };
