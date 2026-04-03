const jwt = require("jsonwebtoken");
const { AppError, asyncHandler } = require("./errorHandler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) throw new AppError("Not authenticated. Please log in.", 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");
  if (!user) throw new AppError("User no longer exists", 401);
  if (user.isActive === false) throw new AppError("Account is deactivated", 401);

  req.user = user;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError("You do not have permission to perform this action", 403));
  }
  next();
};

const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (_) {}
  next();
});

module.exports = { protect, restrictTo, optionalAuth };
