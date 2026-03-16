import { NextRequest, NextResponse } from "next/server";
import {
  sendWelcomeEmail,
  sendTrialStartedEmail,
  sendTrialEndingEmail,
  sendWeeklyReport,
  sendEntityVerifiedEmail,
  sendEntityRejectedEmail,
} from "@/lib/email/send";

type TemplateName =
  | "welcome"
  | "trialStarted"
  | "trialEnding"
  | "weeklyReport"
  | "entityVerified"
  | "entityRejected";

/**
 * POST /api/email/test
 *
 * Send a test email using a specified template.
 * For development/testing only.
 *
 * Body: { to: string; template: TemplateName }
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoint is not available in production" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { to, template } = body as { to: string; template: TemplateName };

    if (!to || !template) {
      return NextResponse.json(
        { error: "to and template are required" },
        { status: 400 },
      );
    }

    const testName = "テストユーザー";

    switch (template) {
      case "welcome":
        await sendWelcomeEmail(to, testName);
        break;

      case "trialStarted": {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        await sendTrialStartedEmail(to, testName, trialEnd);
        break;
      }

      case "trialEnding":
        await sendTrialEndingEmail(to, testName, 3);
        break;

      case "weeklyReport":
        await sendWeeklyReport(to, testName, {
          projectName: "テストプロジェクト",
          articlesGenerated: 12,
          channelsDistributed: 5,
          serpChanges: 8,
          aiCitations: 3,
          topContent: [
            { title: "AIが変えるSEOの未来", views: 1250 },
            { title: "Entity最適化完全ガイド", views: 890 },
            { title: "LLMプレゼンスとは？", views: 645 },
          ],
        });
        break;

      case "entityVerified":
        await sendEntityVerifiedEmail(to, testName, "テストプロジェクト");
        break;

      case "entityRejected":
        await sendEntityRejectedEmail(
          to,
          testName,
          "テストプロジェクト",
          "Entity情報に不整合があります。公式サイトのURLとEntity名が一致しません。",
        );
        break;

      default:
        return NextResponse.json(
          {
            error: `Unknown template: ${template}. Available: welcome, trialStarted, trialEnding, weeklyReport, entityVerified, entityRejected`,
          },
          { status: 400 },
        );
    }

    return NextResponse.json({ success: true, template, to });
  } catch (error) {
    console.error("POST /api/email/test:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 },
    );
  }
}
