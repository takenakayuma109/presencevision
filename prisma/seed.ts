import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/presencevision";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const user = await prisma.user.upsert({
    where: { email: "admin@presencevision.dev" },
    update: {},
    create: {
      email: "admin@presencevision.dev",
      name: "Admin User",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      plan: "pro",
    },
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "demo-project-001" },
    update: {},
    create: {
      id: "demo-project-001",
      workspaceId: workspace.id,
      name: "PresenceVision Demo",
      description: "Digital Presence OS のデモプロジェクト",
      locale: "ja",
    },
  });

  const entities = [
    { name: "PresenceVision", type: "Product", description: "自律型デジタル存在生成エンジン" },
    { name: "Digital Presence", type: "Concept", description: "デジタル存在量の概念" },
    { name: "Answer Engine Optimization", type: "Concept", description: "AEO - 回答エンジン最適化" },
  ];

  for (const entity of entities) {
    await prisma.entity.upsert({
      where: { id: `entity-${entity.name.toLowerCase().replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `entity-${entity.name.toLowerCase().replace(/\s/g, "-")}`,
        projectId: project.id,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        locale: "ja",
      },
    });
  }

  const competitors = [
    { name: "Competitor A", domain: "competitor-a.com" },
    { name: "Competitor B", domain: "competitor-b.com" },
  ];

  for (const comp of competitors) {
    await prisma.competitor.create({
      data: {
        projectId: project.id,
        name: comp.name,
        domain: comp.domain,
      },
    });
  }

  const cluster = await prisma.topicCluster.create({
    data: {
      projectId: project.id,
      name: "Digital Presence基礎",
    },
  });

  const topics = [
    { title: "デジタルプレゼンスとは？完全ガイド", intent: "informational", priority: 10 },
    { title: "AEO（Answer Engine Optimization）入門", intent: "informational", priority: 9 },
    { title: "GEO vs SEO：次世代の検索最適化", intent: "comparison", priority: 8 },
    { title: "LLMに引用されるコンテンツの作り方", intent: "how-to", priority: 7 },
    { title: "ナレッジグラフとエンティティの基本", intent: "informational", priority: 6 },
  ];

  for (const topic of topics) {
    await prisma.topic.create({
      data: {
        projectId: project.id,
        topicClusterId: cluster.id,
        title: topic.title,
        intent: topic.intent,
        priority: topic.priority,
        status: "backlog",
        locale: "ja",
      },
    });
  }

  await prisma.channel.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      name: "Corporate Blog",
      type: "blog",
      config: { url: "https://blog.example.com", format: "markdown" },
    },
  });

  await prisma.promptTemplate.createMany({
    data: [
      {
        name: "research-default",
        agent: "research",
        template: "Analyze the domain and discover content opportunities for digital presence.",
        variables: { locale: "ja", maxTopics: 10 },
      },
      {
        name: "writer-article",
        agent: "writer",
        template: "Write an authoritative article following the provided brief.",
        variables: { maxWords: 3000, locale: "ja" },
      },
      {
        name: "report-weekly",
        agent: "report",
        template: "Generate a weekly report summarizing digital presence performance.",
        variables: { locale: "ja" },
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
