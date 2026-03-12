import { prisma } from "@/lib/db";
import type { DashboardData } from "@/types";

export async function getDashboardData(projectId: string): Promise<DashboardData> {
  const [
    entities,
    contentByStatus,
    pendingApprovals,
    riskAlerts,
    recentLogs,
    publishedThisWeek,
  ] = await Promise.all([
    prisma.entity.count({ where: { projectId } }),
    prisma.contentAsset.groupBy({
      by: ["status"],
      where: { projectId },
      _count: true,
    }),
    prisma.approvalRequest.count({
      where: {
        asset: { projectId },
        status: "PENDING",
      },
    }),
    prisma.riskFlag.count({
      where: {
        asset: { projectId },
        resolved: false,
      },
    }),
    prisma.auditLog.findMany({
      where: { workspace: { projects: { some: { id: projectId } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
    prisma.contentAsset.count({
      where: {
        projectId,
        status: "PUBLISHED",
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of contentByStatus) {
    statusMap[row.status] = row._count;
  }

  const coveredEntities = await prisma.entity.count({
    where: {
      projectId,
      contentAssets: { some: {} },
    },
  });

  return {
    visibilityOverview: { score: 0, trend: 0 },
    entityCoverage: { total: entities, covered: coveredEntities },
    contentPipeline: {
      draft: statusMap["DRAFT"] ?? 0,
      review: statusMap["REVIEW"] ?? 0,
      approved: statusMap["APPROVED"] ?? 0,
      published: statusMap["PUBLISHED"] ?? 0,
    },
    pendingApprovals,
    riskAlerts,
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      timestamp: log.createdAt,
      userId: log.userId ?? undefined,
    })),
    weeklySummary: {
      articlesPublished: publishedThisWeek,
      topicsResearched: 0,
      entitiesUpdated: 0,
    },
  };
}
