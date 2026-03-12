"use client";

import { buttonVariants } from "@/components/ui/button";
import { Badge, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Plus, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

const mockProjects = [
  { id: "1", name: "デジタルプレゼンスガイド", description: "デジタルプレゼンス最適化の包括的ガイド", entities: 12, topics: 24, content: 18 },
  { id: "2", name: "AEO戦略", description: "Answer Engine Optimizationのリサーチとコンテンツ", entities: 8, topics: 15, content: 9 },
  { id: "3", name: "ブランドナレッジベース", description: "コアブランドのエンティティとトピックカバレッジ", entities: 20, topics: 42, content: 35 },
  { id: "4", name: "プロダクトローンチ 2025", description: "製品ローンチのコンテンツとエンティティ設定", entities: 5, topics: 12, content: 6 },
  { id: "5", name: "競合分析", description: "競合環境とギャップ分析", entities: 6, topics: 10, content: 4 },
];

export default function ProjectsPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("projects.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("projects.subtitle")}</p>
        </div>
        <Link href="/projects" className={cn(buttonVariants(), "inline-flex")}>
          <Plus className="h-4 w-4 mr-2" />
          {t("projects.new")}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className={cn("h-full transition-colors hover:bg-muted/50")}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <FolderKanban className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <Badge variant="secondary">{project.entities} {t("projects.entities")}</Badge>
                </div>
                <CardTitle className="text-base">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{t("projects.topics")}: {project.topics}</span>
                  <span>{t("projects.content")}: {project.content}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
