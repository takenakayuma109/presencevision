import { prisma } from "@/lib/db";

export const topicRepository = {
  async findByProject(projectId: string) {
    return prisma.topic.findMany({
      where: { projectId },
      include: {
        topicCluster: true,
        contentBrief: { select: { id: true, status: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  },

  async findById(id: string) {
    return prisma.topic.findUnique({
      where: { id },
      include: { topicCluster: true, contentBrief: true },
    });
  },

  async create(data: {
    projectId: string;
    title: string;
    intent?: string;
    volume?: number;
    difficulty?: number;
    priority?: number;
    topicClusterId?: string;
  }) {
    return prisma.topic.create({ data });
  },

  async update(id: string, data: { title?: string; status?: string; priority?: number }) {
    return prisma.topic.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.topic.delete({ where: { id } });
  },
};
