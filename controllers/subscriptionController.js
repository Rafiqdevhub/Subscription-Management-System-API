import { SERVER_URL } from "../config/env.js";
import workflowClient from "../config/upstash.js";
import Subscription from "../models/subscriptionModel.js";

/**
 * @desc    Create new subscription
 * @route   POST /api/v1/subscriptions
 * @access  Private
 */
const createSubscription = async (req, res, next) => {
  try {
    const { name, price, frequency, category, paymentMethod, startDate } =
      req.body;

    // Basic validation
    if (
      !name ||
      !price ||
      !frequency ||
      !category ||
      !paymentMethod ||
      !startDate
    ) {
      const error = new Error("Please provide all required fields");
      error.statusCode = 400;
      throw error;
    }

    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    // Trigger reminder workflow
    try {
      await workflowClient.trigger({
        url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
        body: { subscriptionId: subscription.id },
        headers: { "content-type": "application/json" },
        retries: 3,
      });
    } catch (workflowError) {
      console.error("Failed to trigger reminder workflow:", workflowError);
      // Don't fail the request if workflow fails
    }

    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all subscriptions
 * @route   GET /api/v1/subscriptions
 * @access  Private
 */
const getSubscription = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find().populate(
      "user",
      "name email"
    );

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's subscriptions
 * @route   GET /api/v1/subscriptions/user/:id
 * @access  Private
 */
const getSubscriptionsById = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      const error = new Error("Not authorized to access this resource");
      error.statusCode = 403;
      throw error;
    }

    const subscriptions = await Subscription.find({
      user: req.params.id,
    }).populate("user", "name email");

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
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
 * @desc    Update subscription
 * @route   PUT /api/v1/subscriptions/:id
 * @access  Private
 */
const updateSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error("Not authorized to update this subscription");
      error.statusCode = 403;
      throw error;
    }

    // Only allow updating specific fields
    const allowedUpdates = [
      "name",
      "price",
      "currency",
      "frequency",
      "category",
      "paymentMethod",
    ];
    const updates = Object.keys(req.body)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSubscription,
    });
  } catch (error) {
    if (error.name === "CastError") {
      const newError = new Error("Invalid subscription ID format");
      newError.statusCode = 400;
      return next(newError);
    }
    next(error);
  }
};

/**
 * @desc    Delete subscription
 * @route   DELETE /api/v1/subscriptions/:id
 * @access  Private
 */
const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error("Not authorized to delete this subscription");
      error.statusCode = 403;
      throw error;
    }

    await Subscription.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
      data: null,
    });
  } catch (error) {
    if (error.name === "CastError") {
      const newError = new Error("Invalid subscription ID format");
      newError.statusCode = 400;
      return next(newError);
    }
    next(error);
  }
};

/**
 * @desc    Cancel subscription
 * @route   PUT /api/v1/subscriptions/:id/cancel
 * @access  Private
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error("Not authorized to cancel this subscription");
      error.statusCode = 403;
      throw error;
    }

    if (subscription.status === "cancelled") {
      const error = new Error("Subscription is already cancelled");
      error.statusCode = 400;
      throw error;
    }

    subscription.status = "cancelled";
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    if (error.name === "CastError") {
      const newError = new Error("Invalid subscription ID format");
      newError.statusCode = 400;
      return next(newError);
    }
    next(error);
  }
};

/**
 * @desc    Renew subscription
 * @route   PUT /api/v1/subscriptions/:id/renew
 * @access  Private
 */
const renewalSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error("Not authorized to renew this subscription");
      error.statusCode = 403;
      throw error;
    }

    if (subscription.status === "active") {
      const error = new Error("Subscription is already active");
      error.statusCode = 400;
      throw error;
    }

    const renewalPeriods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };

    const newStartDate = new Date();
    const newRenewalDate = new Date(newStartDate);
    newRenewalDate.setDate(
      newRenewalDate.getDate() + renewalPeriods[subscription.frequency]
    );

    subscription.status = "active";
    subscription.startDate = newStartDate;
    subscription.renewalDate = newRenewalDate;

    await subscription.save();

    // Trigger reminder workflow
    try {
      await workflowClient.trigger({
        url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
        body: { subscriptionId: subscription.id },
        headers: { "content-type": "application/json" },
        retries: 3,
      });
    } catch (workflowError) {
      console.error("Failed to trigger reminder workflow:", workflowError);
      // Don't fail the request if workflow fails
    }

    res.status(200).json({
      success: true,
      message: "Subscription renewed successfully",
      data: subscription,
    });
  } catch (error) {
    if (error.name === "CastError") {
      const newError = new Error("Invalid subscription ID format");
      newError.statusCode = 400;
      return next(newError);
    }
    next(error);
  }
};

export {
  createSubscription,
  getSubscriptionsById,
  getSubscription,
  updateSubscriptionById,
  deleteSubscription,
  cancelSubscription,
  renewalSubscription,
};
