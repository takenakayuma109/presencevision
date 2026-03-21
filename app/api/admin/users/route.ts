import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const search = searchParams.get("search") ?? "";
    const plan = searchParams.get("plan") ?? "";
    const status = searchParams.get("status") ?? "";
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (plan) {
      where.subscription = { planId: plan };
    }

    if (status === "active") {
      where.subscription = {
        ...((where.subscription as Record<string, unknown>) ?? {}),
        status: { in: ["active", "trialing"] },
      };
    } else if (status === "suspended") {
      where.subscription = {
        ...((where.subscription as Record<string, unknown>) ?? {}),
        status: { in: ["past_due", "canceled", "unpaid"] },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          subscription: {
            select: {
              planId: true,
              status: true,
              interval: true,
            },
          },
          memberships: {
            select: {
              workspace: {
                select: {
                  _count: {
                    select: { projects: true },
                  },
                },
              },
            },
          },
          sessions: {
            orderBy: { expires: "desc" },
            take: 1,
            select: { expires: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const mapped = users.map((u) => {
      // Sum project counts across all workspace memberships
      const projectCount = u.memberships.reduce(
        (sum, m) => sum + (m.workspace._count.projects ?? 0),
        0
      );

      const sub = u.subscription;
      const planId = sub?.planId ?? "free";
      const subStatus = sub?.status ?? "none";

      // Derive a user-friendly status
      let userStatus: "active" | "trial" | "suspended" = "active";
      if (subStatus === "trialing") userStatus = "trial";
      else if (["past_due", "canceled", "unpaid"].includes(subStatus)) userStatus = "suspended";
      else if (subStatus === "none") userStatus = "trial";

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        plan: planId,
        status: userStatus,
        projectsCount: projectCount,
        createdAt: u.createdAt.toISOString(),
        lastLogin: u.sessions[0]?.expires?.toISOString() ?? null,
      };
    });

    return NextResponse.json({
      users: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/admin/users:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
