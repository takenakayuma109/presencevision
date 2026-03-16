import { randomBytes, createHash } from "crypto";

/**
 * Generate a PKCE code verifier (43-128 characters, URL-safe)
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Generate a PKCE S256 code challenge from a verifier
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return hash.toString("base64url");
}

/**
 * Generate a random state string for CSRF protection
 */
export function generateState(): string {
  return randomBytes(16).toString("hex");
}
