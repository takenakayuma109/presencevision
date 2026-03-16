import { NextRequest, NextResponse } from "next/server";
import { generateArticle } from "@/lib/ai-boost/engine";
import { checkQuota, consumeQuota, getQuota } from "@/lib/ai-boost/quota";
import type { AIBoostProvider, AIBoostModel } from "@/lib/types/ai-boost";
import type { PlanId } from "@/lib/types/billing";

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

    const planId: PlanId = rawPlanId ?? "starter";

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
      provider: provider ?? "openai",
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
