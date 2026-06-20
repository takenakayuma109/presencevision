/**
 * Engine Proxy — Next.js API Route that proxies requests to the VPS engine.
 *
 * This solves the Mixed Content issue (https frontend → http VPS).
 * All /api/engine/* requests are forwarded to the VPS engine server.
 *
 * 安全・課金方針:
 * - AI/コストを消費する操作（/engine/start, /engine/run-cycle）は、有効な
 *   サブスクリプション（無料トライアルまたは有料）を必須とする。無契約者の
 *   VPS/AI 費用の垂れ流しを防止する。
 * - エンジンに渡す planId はクライアント送信値ではなく、サーバー側で契約から
 *   確定した値を注入する（プラン詐称＝Pro/Enterprise契約者がstarter動作、
 *   または無契約者がProを騙る、を防止）。
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAccess } from "@/lib/stripe/subscription";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";
const ENGINE_API_KEY = process.env.NEXT_PUBLIC_ENGINE_API_KEY ?? "";

// AI/コストを消費する操作。アクセスゲート＋planId注入の対象。
const GATED_PATHS = new Set(["engine/start", "engine/run-cycle"]);

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
) {
  const { path } = await params;
  const joinedPath = path.join("/");
  const targetPath = "/" + joinedPath;
  const url = new URL(targetPath, ENGINE_URL);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = {
    "x-api-key": ENGINE_API_KEY,
  };

  // Forward content-type for POST requests
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  // body は最大1回だけ読み取る。ゲート対象で読んだ場合は preparedBody に保持。
  let preparedBody: string | undefined;

  // --- Access gate + authoritative planId injection ---
  if (request.method === "POST" && GATED_PATHS.has(joinedPath)) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "認証が必要です。ログインしてください。", code: "unauthenticated" },
        { status: 401 },
      );
    }

    const access = await checkAccess(userId);
    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error:
            "エンジンの起動には有効なサブスクリプション（無料トライアルまたは有料プラン）が必要です。",
          code: "subscription_required",
        },
        { status: 403 },
      );
    }

    // クライアント送信値を信頼せず、契約から確定した planId を注入する
    const raw = await request.text();
    try {
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.planId = access.planId;
      preparedBody = JSON.stringify(parsed);
    } catch {
      preparedBody = raw;
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      fetchOptions.body = preparedBody ?? (await request.text());
    }

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: `Engine is unreachable at ${ENGINE_URL}. Is the server running?` },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, ctx.params);
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, ctx.params);
}
