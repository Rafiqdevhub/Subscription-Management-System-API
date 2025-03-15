const errorMiddleware = (err, req, res, next) => {
  try {
    console.error(`Error [${req.method} ${req.url}]:`, {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // MongoDB Validation Error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: messages.join(", "),
          details: err.errors,
        },
      });
    }

    // MongoDB CastError (Invalid ID)
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: `Invalid ${err.path}: ${err.value}`,
          details: {
            field: err.path,
            value: err.value,
          },
        },
      });
    }

    // MongoDB Duplicate Key Error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_KEY",
          message: `${field} already exists`,
          details: {
            field,
            value: err.keyValue[field],
          },
        },
      });
    }

    // JWT Errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token",
        },
      });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Authentication token expired",
        },
      });
    }

    // Default Error Response
    const statusCode = err.statusCode || 500;
    const errorResponse = {
      success: false,
      error: {
        code: err.code || "INTERNAL_SERVER_ERROR",
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && {
          stack: err.stack,
          details: err.details,
        }),
      },
    };

    res.status(statusCode).json(errorResponse);
  } catch (error) {
    // Fallback error response if error handling fails
    console.error("Error in error handling middleware:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export default errorMiddleware;
