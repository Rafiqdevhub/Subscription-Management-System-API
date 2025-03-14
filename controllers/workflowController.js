import dayjs from "dayjs";
import { createRequire } from "module";
import Subscription from "../models/subscriptionModel.js";
import { sendReminderEmail } from "../utils/sendEmail.js";
const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");

const REMINDERS = [7, 5, 2, 1];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Helper function to implement retry logic for async operations
 */
const retryOperation = async (
  operation,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

/**
 * @desc    Send subscription reminders workflow
 * @route   POST /api/v1/workflows/subscription/reminder
 * @access  Private
 */
const sendReminders = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;

  if (!subscriptionId) {
    console.error("Missing subscriptionId in workflow payload");
    return;
  }

  try {
    const subscription = await fetchSubscription(context, subscriptionId);

    if (!subscription) {
      console.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    if (subscription.status !== "active") {
      console.log(
        `Subscription ${subscriptionId} is not active. Current status: ${subscription.status}`
      );
      return;
    }

    const renewalDate = dayjs(subscription.renewalDate);

    if (renewalDate.isBefore(dayjs())) {
      console.log(
        `Renewal date has passed for subscription ${subscriptionId}. Stopping workflow.`
      );
      return;
    }

    for (const daysBefore of REMINDERS) {
      const reminderDate = renewalDate.subtract(daysBefore, "day");

      if (reminderDate.isAfter(dayjs())) {
        await sleepUntilReminder(
          context,
          `Reminder ${daysBefore} days before`,
          reminderDate
        );
      }

      if (dayjs().isSame(reminderDate, "day")) {
        console.log(
          `Processing ${daysBefore} days reminder for subscription ${subscriptionId}`
        );

        await retryOperation(async () => {
          await triggerReminder(
            context,
            `${daysBefore} days before reminder`,
            subscription
          );
        });

        console.log(
          `Successfully sent ${daysBefore} days reminder for subscription ${subscriptionId}`
        );
      }
    }
  } catch (error) {
    console.error("Error in sendReminders workflow:", error);
    throw error; // Let the workflow system handle the retry
  }
});

/**
 * Fetch subscription with retry logic
 */
const fetchSubscription = async (context, subscriptionId) => {
  return await context.run("getSubscription", async () => {
    return await retryOperation(async () => {
      const subscription = await Subscription.findById(subscriptionId)
        .populate("user", "name email")
        .lean();

      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      return subscription;
    });
  });
};

/**
 * Trigger reminder email with context tracking
 */
const triggerReminder = async (context, label, subscription) => {
  return await context.run(label, async () => {
    console.log(
      `Triggering ${label} reminder for subscription ${subscription._id}`
    );

    await sendReminderEmail({
      to: subscription.user.email,
      type: label,
      subscription,
    });

    console.log(
      `Successfully triggered ${label} reminder for subscription ${subscription._id}`
    );
  });
};

/**
 * Sleep until next reminder date with logging
 */
const sleepUntilReminder = async (context, label, date) => {
  console.log(`Scheduling ${label} reminder for ${date.format()}`);
  await context.sleepUntil(label, date.toDate());
  console.log(`Resumed from sleep for ${label} reminder`);
};

export { sendReminders };
