import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  exchangeGbpCode,
  listGbpAccounts,
  listGbpLocations,
  idFromResourceName,
} from "@/lib/oauth/google-business";

/**
 * GET /api/oauth/google-business/callback
 * 認可コードを受け取り、トークン交換 → アカウント/ロケーション取得 →
 * google_business チャネルとして認証情報を保存する。
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("GBP OAuth error:", error);
      return NextResponse.redirect(`${baseUrl}/channels?error=gbp_oauth_denied`);
    }
    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 },
      );
    }

    // CSRF: state をクッキーと照合
    const storedState = request.cookies.get("gbp_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: "Invalid state parameter (CSRF check failed)" },
        { status: 403 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    // コード → トークン
    const tokens = await exchangeGbpCode(code);

    // アカウント＆ロケーション（先頭を自動選択。複数ある場合は後で設定画面で変更可）
    const accounts = await listGbpAccounts(tokens.access_token);
    if (accounts.length === 0) {
      return NextResponse.redirect(`${baseUrl}/channels?error=gbp_no_account`);
    }
    const account = accounts[0];
    const locations = await listGbpLocations(tokens.access_token, account.name);
    if (locations.length === 0) {
      return NextResponse.redirect(`${baseUrl}/channels?error=gbp_no_location`);
    }
    const location = locations[0];
    const accountId = idFromResourceName(account.name);
    const locationId = idFromResourceName(location.name);

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: { workspaceId: true },
    });
    if (!membership) {
      return NextResponse.redirect(`${baseUrl}/channels?error=no_workspace`);
    }

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString();
    const displayName = location.title ?? account.accountName ?? "Google Business";
    const config = {
      scope: tokens.scope,
      accountName: account.name,
      locationName: location.name,
      locationTitle: location.title ?? null,
    };

    let channel = await prisma.channel.findFirst({
      where: { workspaceId: membership.workspaceId, type: "google_business" },
    });

    if (channel) {
      await prisma.channelCredential.deleteMany({
        where: { channelId: channel.id },
      });
      await prisma.channel.update({
        where: { id: channel.id },
        data: { updatedAt: new Date(), name: `Google Business - ${displayName}`, config },
      });
    } else {
      channel = await prisma.channel.create({
        data: {
          workspaceId: membership.workspaceId,
          name: `Google Business - ${displayName}`,
          type: "google_business",
          config,
        },
      });
    }

    const credentials: { channelId: string; key: string; value: string }[] = [
      { channelId: channel.id, key: "accessToken", value: tokens.access_token },
      { channelId: channel.id, key: "expiresAt", value: expiresAt },
      { channelId: channel.id, key: "scope", value: tokens.scope },
      { channelId: channel.id, key: "accountId", value: accountId },
      { channelId: channel.id, key: "locationId", value: locationId },
    ];
    if (tokens.refresh_token) {
      credentials.push({
        channelId: channel.id,
        key: "refreshToken",
        value: tokens.refresh_token,
      });
    }
    await prisma.channelCredential.createMany({ data: credentials });

    const response = NextResponse.redirect(
      `${baseUrl}/channels?success=gbp_connected`,
    );
    response.cookies.delete("gbp_oauth_state");
    return response;
  } catch (e) {
    console.error("GET /api/oauth/google-business/callback:", e);
    return NextResponse.redirect(`${baseUrl}/channels?error=gbp_oauth_failed`);
  }
}
