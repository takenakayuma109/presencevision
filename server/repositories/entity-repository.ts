import { prisma } from "@/lib/db";

export const entityRepository = {
  async findByProject(projectId: string) {
    return prisma.entity.findMany({
      where: { projectId },
      include: { _count: { select: { contentAssets: true, mentions: true } } },
      orderBy: { updatedAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.entity.findUnique({
      where: { id },
      include: { contentAssets: true, mentions: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
  },

  async create(data: {
    projectId: string;
    name: string;
    type: string;
    description?: string;
    locale?: string;
  }) {
    return prisma.entity.create({ data });
  },

  async update(id: string, data: { name?: string; type?: string; description?: string }) {
    return prisma.entity.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.entity.delete({ where: { id } });
  },
};
