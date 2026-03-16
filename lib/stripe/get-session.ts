/**
 * Shared server-side session helper for Stripe API routes.
 *
 * Uses dynamic import of next-auth so the build doesn't break
 * if next-auth is not fully configured yet.
 */

interface SessionUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export interface AppSession {
  user: SessionUser;
}

export async function getSession(): Promise<AppSession | null> {
  try {
    const { getServerSession } = await import("next-auth");
    let authOptions: any = undefined;
    try {
      const authModule = await import("@/lib/auth");
      authOptions = authModule.authOptions;
    } catch {
      // authOptions not configured yet — getServerSession will use defaults
    }
    const session = (await getServerSession(authOptions)) as Record<string, unknown> | null;
    if (!session || !session.user) return null;
    return session as unknown as AppSession;
  } catch {
    return null;
  }
}

/**
 * Extract a stable userId from the session.
 * Prefers `session.user.id` (set by most next-auth adapters),
 * falls back to email.
 */
export function getUserId(session: AppSession): string {
  return session.user.id ?? session.user.email ?? "";
}
