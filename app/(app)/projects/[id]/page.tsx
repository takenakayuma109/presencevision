"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card, CardHeader, CardTitle, CardContent, TechTerm } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ArrowLeft, BarChart3, Box, FileText } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

type Tab = "overview" | "entities" | "topics";

const tabLabels: Record<Tab, string> = {
  overview: "概要",
  entities: "エンティティ",
  topics: "トピック",
};

const statusVariant: Record<string, "secondary" | "warning" | "success"> = {
  backlog: "secondary",
  in_progress: "warning",
  completed: "success",
};

const statusLabel: Record<string, string> = {
  backlog: "未着手",
  in_progress: "進行中",
  completed: "完了",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const t = useT();
  const { projects, entities, topics } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    return (
      <div className="space-y-6">
        <Link href="/projects" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Link>
        <p className="text-sm text-muted-foreground">プロジェクトが見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{project.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
      </div>

      <div className="flex gap-2 border-b">
        {(["overview", "entities", "topics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> 統計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground"><TechTerm term="エンティティ">エンティティ</TechTerm></span>
                  <span className="font-medium">{project.entities}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">トピック</span>
                  <span className="font-medium">{project.topics}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">コンテンツ</span>
                  <span className="font-medium">{project.content}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "entities" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base"><TechTerm term="エンティティ">エンティティ</TechTerm></CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>タイプ</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.type}</TableCell>
                    <TableCell><Badge variant="success">アクティブ</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "topics" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">トピック</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>意図</TableHead>
                  <TableHead>クラスター</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((tp) => (
                  <TableRow key={tp.id}>
                    <TableCell className="font-medium">{tp.title}</TableCell>
                    <TableCell>{tp.intent}</TableCell>
                    <TableCell>{tp.cluster}</TableCell>
                    <TableCell><Badge variant={statusVariant[tp.status]}>{statusLabel[tp.status] ?? tp.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
