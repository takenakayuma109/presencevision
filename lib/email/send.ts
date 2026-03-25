import { getResend, FROM_EMAIL } from "./client";
import {
  welcome,
  trialStarted,
  trialEnding,
  weeklyReport,
  dailyReport,
  entityVerified,
  entityRejected,
  type WeeklyStats,
  type DailyReportStats,
  type DailyReportHighlight,
} from "./templates";

// ---------------------------------------------------------------------------
// Email sending helpers
// ---------------------------------------------------------------------------

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`[email] Exception sending "${subject}" to ${to}:`, err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<void> {
  const { subject, html } = welcome(name);
  await send(email, subject, html);
}

export async function sendTrialStartedEmail(
  email: string,
  name: string,
  trialEndDate: Date,
): Promise<void> {
  const { subject, html } = trialStarted(name, trialEndDate);
  await send(email, subject, html);
}

export async function sendTrialEndingEmail(
  email: string,
  name: string,
  daysLeft: number,
): Promise<void> {
  const { subject, html } = trialEnding(name, daysLeft);
  await send(email, subject, html);
}

export async function sendWeeklyReport(
  email: string,
  name: string,
  stats: WeeklyStats,
): Promise<void> {
  const { subject, html } = weeklyReport(name, stats);
  await send(email, subject, html);
}

export async function sendDailyReport(
  email: string,
  userName: string,
  projectName: string,
  date: string,
  stats: DailyReportStats,
  highlights: DailyReportHighlight[],
): Promise<void> {
  const { subject, html } = dailyReport(userName, projectName, date, stats, highlights);
  await send(email, subject, html);
}

export async function sendEntityVerifiedEmail(
  email: string,
  name: string,
  projectName: string,
): Promise<void> {
  const { subject, html } = entityVerified(name, projectName);
  await send(email, subject, html);
}

export async function sendEntityRejectedEmail(
  email: string,
  name: string,
  projectName: string,
  reason: string,
): Promise<void> {
  const { subject, html } = entityRejected(name, projectName, reason);
  await send(email, subject, html);
}
