import User from "../models/userModel.js";

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Public
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      const newError = new Error("Invalid user ID format");
      newError.statusCode = 400;
      return next(newError);
    }
    next(error);
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/v1/users
 * @access  Public
 */
const createUser = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    // Basic validation
    if (!email || !name || !password) {
      const error = new Error("Please provide all required fields");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    // Don't send password in response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/v1/users/:id
 * @access  Private
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    // Only update fields that are sent
    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const error = new Error("Email already in use");
        error.statusCode = 409;
        throw error;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error.name === "CastError") {
      const newError = new Error("Invalid user ID format");
      newError.statusCode = 400;
      return next(newError);
    }
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/users/:id
 * @access  Private
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: null,
    });
  } catch (error) {
    if (error.name === "CastError") {
      const newError = new Error("Invalid user ID format");
      newError.statusCode = 400;
      return next(newError);
    }
    next(error);
  }
};

export { getUsers, getUser, createUser, updateUser, deleteUser };
