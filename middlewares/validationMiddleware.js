/**
 * Validation middleware functions for request validation
 */

const validateUserInput = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation for create operations
  if (req.method === "POST" && (!password || password.length < 6)) {
    errors.push("Password must be at least 6 characters long");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: errors.join(", "),
        details: errors,
      },
    });
  }

  next();
};

const validateSubscriptionInput = (req, res, next) => {
  const { name, price, frequency, category, paymentMethod } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push("Subscription name must be at least 2 characters long");
  }

  // Price validation
  if (typeof price !== "number" || price < 0) {
    errors.push("Price must be a positive number");
  }

  // Frequency validation
  const validFrequencies = ["daily", "weekly", "monthly", "yearly"];
  if (!frequency || !validFrequencies.includes(frequency)) {
    errors.push("Invalid frequency value");
  }

  // Category validation
  const validCategories = [
    "sports",
    "news",
    "entertainment",
    "lifestyle",
    "technology",
    "finance",
    "politics",
    "other",
  ];
  if (!category || !validCategories.includes(category)) {
    errors.push("Invalid category value");
  }

  // Payment method validation
  if (!paymentMethod || paymentMethod.trim().length < 2) {
    errors.push("Payment method is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: errors.join(", "),
        details: errors,
      },
    });
  }

  next();
};

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation
  if (!password || password.length < 1) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: errors.join(", "),
        details: errors,
      },
    });
  }

  next();
};

const validateIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: "Invalid ID format",
        details: { id },
      },
    });
  }

  next();
};

export {
  validateUserInput,
  validateSubscriptionInput,
  validateLoginInput,
  validateIdParam,
};
