import { render } from "@react-email/components";
import WelcomeEmail from "@/../emails/welcome";
import Day3ReminderEmail from "@/../emails/day3-reminder";
import Day7UpsellEmail from "@/../emails/day7-upsell";

export type EmailType = "welcome" | "day3-reminder" | "day7-upsell";

export interface EmailData {
  userName?: string;
  userEmail: string;
  briefCount?: number;
  remainingBriefs?: number;
}

export async function getEmailTemplate(type: EmailType, data: EmailData) {
  switch (type) {
    case "welcome":
      return {
        subject: "Welcome to ORIGO - Your project brief assistant",
        html: await render(WelcomeEmail({ userName: data.userName, userEmail: data.userEmail })),
      };

    case "day3-reminder":
      return {
        subject:
          data.briefCount === 0
            ? "Ready to create your first project brief?"
            : "Keep the momentum going with ORIGO",
        html: await render(
          Day3ReminderEmail({
            userName: data.userName,
            userEmail: data.userEmail,
            briefCount: data.briefCount,
            remainingBriefs: data.remainingBriefs,
          })
        ),
      };

    case "day7-upsell":
      return {
        subject:
          data.remainingBriefs === 0
            ? "You've used all your free briefs - Upgrade to Pro"
            : "Ready to scale? Upgrade ORIGO for more briefs",
        html: await render(
          Day7UpsellEmail({
            userName: data.userName,
            userEmail: data.userEmail,
            briefCount: data.briefCount,
            remainingBriefs: data.remainingBriefs,
          })
        ),
      };

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

export function shouldSendEmail(
  type: EmailType,
  userCreatedAt: string,
  lastEmailSent?: string
): boolean {
  const now = new Date();
  const createdAt = new Date(userCreatedAt);
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Don't send if we've already sent this type recently
  if (lastEmailSent) {
    const lastSent = new Date(lastEmailSent);
    const hoursSinceLastEmail = Math.floor(
      (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
    );

    // Don't spam - wait at least 12 hours between emails
    if (hoursSinceLastEmail < 12) {
      return false;
    }
  }

  switch (type) {
    case "welcome":
      // Send immediately after signup (or within first hour)
      return daysSinceCreation === 0;

    case "day3-reminder":
      // Send on day 3
      return daysSinceCreation === 3;

    case "day7-upsell":
      // Send on day 7
      return daysSinceCreation === 7;

    default:
      return false;
  }
}
