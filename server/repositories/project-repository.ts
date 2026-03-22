import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const projectRepository = {
  async findAll(workspaceId: string) {
    return prisma.project.findMany({
      where: { workspaceId },
      include: { _count: { select: { entities: true, topics: true, contentAssets: true } } },
      orderBy: { updatedAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        entities: true,
        competitors: true,
        _count: {
          select: { topics: true, contentAssets: true, contentBriefs: true, reports: true },
        },
      },
    });
  },

  async create(data: {
    workspaceId: string;
    name: string;
    url?: string;
    description?: string;
    locale?: string;
    metadata?: Prisma.InputJsonValue;
    competitors?: string[];
  }) {
    const { competitors, ...projectData } = data;

    return prisma.project.create({
      data: {
        ...projectData,
        competitors: competitors && competitors.length > 0
          ? {
              create: competitors.map((name) => ({ name })),
            }
          : undefined,
      },
      include: {
        competitors: true,
        _count: { select: { entities: true, topics: true, contentAssets: true } },
      },
    });
  },

  async update(id: string, data: { name?: string; description?: string; status?: string; url?: string; metadata?: Prisma.InputJsonValue }) {
    return prisma.project.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.project.delete({ where: { id } });
  },
};
