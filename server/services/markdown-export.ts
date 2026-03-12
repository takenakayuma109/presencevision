import { prisma } from "@/lib/db";

export async function exportContentAsMarkdown(assetId: string): Promise<string> {
  const asset = await prisma.contentAsset.findUniqueOrThrow({
    where: { id: assetId },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      entity: true,
      brief: true,
      evidenceItems: true,
    },
  });

  const latestVersion = asset.versions[0];
  if (!latestVersion) throw new Error("No content version found");

  const lines: string[] = [];

  lines.push("---");
  lines.push(`title: "${asset.title}"`);
  lines.push(`type: ${asset.type}`);
  lines.push(`status: ${asset.status}`);
  lines.push(`locale: ${asset.locale}`);
  if (asset.entity) lines.push(`entity: "${asset.entity.name}"`);
  if (asset.slug) lines.push(`slug: "${asset.slug}"`);
  lines.push(`created: ${asset.createdAt.toISOString()}`);
  lines.push(`updated: ${asset.updatedAt.toISOString()}`);
  lines.push("---");
  lines.push("");
  lines.push(latestVersion.body);

  if (asset.evidenceItems.length > 0) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Sources");
    lines.push("");
    for (const evidence of asset.evidenceItems) {
      const status = evidence.verified ? "✓" : "?";
      const link = evidence.url ? ` - [source](${evidence.url})` : "";
      lines.push(`- [${status}] ${evidence.claim}${link}`);
    }
  }

  if (latestVersion.schemaOrg) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Schema.org (JSON-LD)");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(latestVersion.schemaOrg, null, 2));
    lines.push("```");
  }

  return lines.join("\n");
}

export async function exportReportAsMarkdown(reportId: string): Promise<string> {
  const report = await prisma.report.findUniqueOrThrow({
    where: { id: reportId },
  });

  const lines: string[] = [];
  lines.push("---");
  lines.push(`title: "${report.title}"`);
  lines.push(`type: ${report.type}`);
  lines.push(`created: ${report.createdAt.toISOString()}`);
  lines.push("---");
  lines.push("");
  lines.push(report.body);

  return lines.join("\n");
}
