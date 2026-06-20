"use client";

import { use, useState, useEffect } from "react";
import { ChannelManager } from "@/components/channels/channel-manager";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

interface DbProject {
  id: string;
  name: string;
  workspaceId: string;
}

export default function ProjectChannelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<DbProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProject(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">チャネル</h2>
          <p className="text-sm text-muted-foreground mt-1">
            配信チャネルを管理
          </p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Activity className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {project?.name ? `${project.name} - チャネル` : "チャネル"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          プロジェクトの配信チャネルを管理・設定
        </p>
      </div>
      <ChannelManager
        projectId={projectId}
        workspaceId={project?.workspaceId}
      />
    </div>
  );
}
