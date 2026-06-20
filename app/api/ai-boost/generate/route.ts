import { NextRequest, NextResponse } from "next/server";
import { generateArticle } from "@/lib/ai-boost/engine";
import { checkQuota, consumeQuota, getQuota } from "@/lib/ai-boost/quota";
import type { AIBoostProvider, AIBoostModel } from "@/lib/types/ai-boost";
import type { PlanId } from "@/lib/types/billing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAccess } from "@/lib/stripe/subscription";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      keyword,
      provider,
      model,
      context,
      planId: rawPlanId,
    } = body as {
      projectId?: string;
      keyword?: string;
      provider?: AIBoostProvider;
      model?: AIBoostModel;
      context?: string;
      planId?: PlanId;
    };

    // Validation
    if (!projectId || !keyword) {
      return NextResponse.json(
        { error: "projectId and keyword are required" },
        { status: 400 }
      );
    }

    // アクセスゲート: 有効なサブスクリプション（無料トライアル/有料）必須
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "認証が必要です。", code: "unauthenticated" },
        { status: 401 }
      );
    }
    const access = await checkAccess(userId);
    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error: "AI Boostの利用には有効なサブスクリプション（無料トライアルまたは有料プラン）が必要です。",
          code: "subscription_required",
        },
        { status: 403 }
      );
    }

    // planId はクライアント送信値ではなく契約から確定（課金詐称・クォータ回避を防止）
    const planId: PlanId = (access.planId ?? rawPlanId ?? "starter") as PlanId;

    // Check quota
    const quotaCheck = checkQuota(projectId, planId);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason },
        { status: 429 }
      );
    }

    // Generate article
    const article = await generateArticle(keyword, context, {
      provider: provider ?? "anthropic",
      model,
    });

    // Consume quota after successful generation
    consumeQuota(projectId);

    // Build response with quota info
    const quota = getQuota(projectId, planId);

    return NextResponse.json(
      {
        article: {
          id: crypto.randomUUID(),
          projectId,
          ...article,
          createdAt: new Date().toISOString(),
        },
        quota,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/ai-boost/generate:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate article",
      },
      { status: 500 }
    );
  }
}
