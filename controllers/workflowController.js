import dayjs from "dayjs";
import { createRequire } from "module";
import Subscription from "../models/subscriptionModel.js";
import { sendReminderEmail } from "../utils/sendEmail.js";
const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");

const REMINDERs = [7, 5, 2, 1];

const sendReminders = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;
  const subscription = await fetchSubscription(context, subscriptionId);

  if (!subscription || subscription.status !== "active") return;

  const renewalDate = new dayjs(subscription.renewalDate);

  if (renewalDate.isBefore(dayjs())) {
    console.log(
      `Renewal date has passed for subscription ${subscriptionId}. Stopping workflow.`
    );
    return;
  }
  for (const daysBefore of REMINDERs) {
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
        `Sending ${daysBefore} days reminder for subscription ${subscriptionId}`
      );
      await triggerReminder(
        context,
        `${daysBefore} days before reminder`,
        subscription
      );
      // sendEmail(subscription.user.email, `Renewal reminder for ${subscription.name}`);
    }
  }
});

const fetchSubscription = async (context, subscriptionId) => {
  return await context.run("getSubscription", async () => {
    return Subscription.findById(subscriptionId).populate("user", "name email");
  });
};

const triggerReminder = async (context, label, subscription) => {
  return await context.run(label, async () => {
    console.log(`Triggering ${label} reminder`);

    await sendReminderEmail({
      to: subscription.user.email,
      type: label,
      subscription,
    });
  });
};

const sleepUntilReminder = async (context, label, date) => {
  console.log(`Sleeping until ${label} reminder at ${date}`);
  await context.sleepUntil(label, date.toDate());
};

export { sendReminders };
