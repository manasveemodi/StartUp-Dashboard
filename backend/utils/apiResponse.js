class ApiResponse {
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static created(res, data, message = "Created successfully") {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = "Internal server error", statusCode = 500, errors = null) {
    const body = { success: false, message, timestamp: new Date().toISOString() };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
  }

  static notFound(res, resource = "Resource") {
    return ApiResponse.error(res, `${resource} not found`, 404);
  }

  static badRequest(res, message = "Bad request", errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  static unauthorized(res, message = "Unauthorized") {
    return ApiResponse.error(res, message, 401);
  }

  static forbidden(res, message = "Forbidden") {
    return ApiResponse.error(res, message, 403);
  }

  static paginated(res, data, pagination) {
    return res.status(200).json({
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;
