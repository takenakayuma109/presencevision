/**
 * Health Check Endpoint
 *
 * Returns status of all services: database connection, engine server.
 * Used by monitoring and deployment scripts to verify system health.
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: string; latency_ms?: number; error?: string }> = {};

  // --- Database Check ---
  try {
    const dbStart = Date.now();
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    checks.database = { status: "ok", latency_ms: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }

  // --- Engine Check ---
  try {
    const engineStart = Date.now();
    const res = await fetch(`${ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      checks.engine = { status: "ok", latency_ms: Date.now() - engineStart };
    } else {
      checks.engine = { status: "degraded", error: `HTTP ${res.status}` };
    }
  } catch (err) {
    checks.engine = {
      status: "error",
      error: err instanceof Error ? err.message : "Engine unreachable",
    };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - start,
      services: checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
