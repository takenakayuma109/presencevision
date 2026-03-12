import { prisma } from "@/lib/db";
import type { AssetStatus, AssetType } from "@prisma/client";

export const contentRepository = {
  async findByProject(projectId: string, filters?: { status?: AssetStatus; type?: AssetType }) {
    return prisma.contentAsset.findMany({
      where: { projectId, ...filters },
      include: {
        brief: { select: { id: true, title: true } },
        entity: { select: { id: true, name: true } },
        versions: { orderBy: { version: "desc" }, take: 1 },
        _count: { select: { approvalRequests: true, riskFlags: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.contentAsset.findUnique({
      where: { id },
      include: {
        brief: true,
        entity: true,
        versions: { orderBy: { version: "desc" } },
        evidenceItems: true,
        approvalRequests: { include: { comments: { include: { author: true } } } },
        riskFlags: true,
        publishTargets: { include: { channel: true } },
      },
    });
  },

  async create(data: {
    projectId: string;
    briefId?: string;
    entityId?: string;
    type?: AssetType;
    title: string;
    slug?: string;
    locale?: string;
  }) {
    return prisma.contentAsset.create({ data });
  },

  async updateStatus(id: string, status: AssetStatus) {
    return prisma.contentAsset.update({ where: { id }, data: { status } });
  },

  async addVersion(assetId: string, body: string, schemaOrg?: object) {
    const lastVersion = await prisma.contentVersion.findFirst({
      where: { assetId },
      orderBy: { version: "desc" },
    });

    return prisma.contentVersion.create({
      data: {
        assetId,
        version: (lastVersion?.version ?? 0) + 1,
        body,
        schemaOrg: schemaOrg as object,
      },
    });
  },

  async getLatestVersion(assetId: string) {
    return prisma.contentVersion.findFirst({
      where: { assetId },
      orderBy: { version: "desc" },
    });
  },
};
