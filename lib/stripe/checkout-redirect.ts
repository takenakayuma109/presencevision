import type { PlanId, BillingInterval } from "@/lib/types/billing";

/**
 * Client-side checkout redirect helper.
 *
 * Checks whether the user is authenticated (via a lightweight session check)
 * before initiating a Stripe Checkout flow.
 *
 * - If the user is NOT logged in, redirects to /sign-in with a callbackUrl
 *   that includes the selected plan so checkout resumes after sign-in.
 * - If the user IS logged in, calls /api/stripe/checkout and redirects
 *   to the Stripe-hosted checkout page.
 */
export async function redirectToCheckout(
  planId: PlanId,
  interval: BillingInterval,
): Promise<void> {
  // Check if user has an active session
  const isLoggedIn = await checkSession();

  if (!isLoggedIn) {
    const callbackUrl = `/dashboard?plan=${planId}&interval=${interval}`;
    window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    return;
  }

  // User is authenticated — create checkout session
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, interval }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));

    // Double-check: if the server says 401, redirect to sign-in
    if (res.status === 401) {
      const callbackUrl = `/dashboard?plan=${planId}&interval=${interval}`;
      window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      return;
    }

    throw new Error(data.error ?? "Failed to create checkout session");
  }

  const { sessionUrl } = await res.json();

  if (!sessionUrl) {
    throw new Error("No session URL returned from checkout API");
  }

  window.location.href = sessionUrl;
}

/**
 * Lightweight session check using the next-auth session endpoint.
 * Returns true if the user has an active session, false otherwise.
 */
async function checkSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) return false;
    const data = await res.json();
    // next-auth returns {} for unauthenticated users
    return !!data?.user?.email;
  } catch {
    return false;
  }
}
