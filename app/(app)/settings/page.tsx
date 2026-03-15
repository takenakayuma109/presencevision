"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import { Settings, Key, Bell, Server } from "lucide-react";
import { getEngineBaseUrl, getEngineHealth, type EngineHealthResponse } from "@/lib/engine-client";

type EngineConnectionStatus = "idle" | "testing" | "connected" | "error";

export default function SettingsPage() {
  const [engineStatus, setEngineStatus] = useState<EngineConnectionStatus>("idle");
  const [engineHealth, setEngineHealth] = useState<EngineHealthResponse | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);

  const testConnection = useCallback(async () => {
    setEngineStatus("testing");
    setEngineError(null);
    try {
      const health = await getEngineHealth();
      setEngineHealth(health);
      setEngineStatus("connected");
    } catch (err) {
      setEngineStatus("error");
      setEngineError(
        err instanceof Error ? err.message : "接続に失敗しました",
      );
      setEngineHealth(null);
    }
  }, []);

  const statusLabel: Record<EngineConnectionStatus, string> = {
    idle: "未確認",
    testing: "接続テスト中...",
    connected: "接続済み",
    error: "接続エラー",
  };

  const statusColor: Record<EngineConnectionStatus, string> = {
    idle: "bg-gray-400",
    testing: "bg-yellow-400 animate-pulse",
    connected: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">設定</h2>
        <p className="text-sm text-muted-foreground mt-1">ワークスペースとアカウントの設定</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Engine Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Server className="h-4 w-4" /> エンジン接続
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Engine URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border bg-muted px-3 py-2 text-sm font-mono">
                  {getEngineBaseUrl()}
                </code>
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${statusColor[engineStatus]}`} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {statusLabel[engineStatus]}
                  </span>
                </div>
              </div>
            </div>

            {engineHealth && engineStatus === "connected" && (
              <div className="rounded border bg-muted/50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ステータス</span>
                  <span className="font-medium">{engineHealth.status}</span>
                </div>
                {engineHealth.version && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">バージョン</span>
                    <span className="font-medium">{engineHealth.version}</span>
                  </div>
                )}
                {engineHealth.activeProjects !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">アクティブプロジェクト</span>
                    <span className="font-medium">{engineHealth.activeProjects}</span>
                  </div>
                )}
                {engineHealth.ollama && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ollamaモデル</span>
                    <span className="font-medium">
                      {engineHealth.ollama.connected
                        ? engineHealth.ollama.model ?? "接続済み"
                        : "未接続"}
                    </span>
                  </div>
                )}
                {engineHealth.uptime !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">稼働時間</span>
                    <span className="font-medium">
                      {Math.floor(engineHealth.uptime / 3600000)}時間{" "}
                      {Math.floor((engineHealth.uptime % 3600000) / 60000)}分
                    </span>
                  </div>
                )}
              </div>
            )}

            {engineError && (
              <div className="rounded border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                {engineError}
              </div>
            )}

            <Button
              size="sm"
              onClick={testConnection}
              disabled={engineStatus === "testing"}
            >
              {engineStatus === "testing" ? "テスト中..." : "接続テスト"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" /> ワークスペース
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ワークスペース名</label>
              <Input defaultValue="マイワークスペース" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">メールアドレス</label>
              <Input defaultValue="user@example.com" type="email" />
            </div>
            <Button size="sm">保存</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" /> API設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Anthropic API Key</label>
              <Input defaultValue="sk-ant-•••••••••••••" type="password" />
            </div>
            <Button size="sm">更新</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" /> 通知設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">レポート通知</p>
                <p className="text-xs text-muted-foreground">週次レポートをメールで受信</p>
              </div>
              <div className="h-6 w-11 rounded-full bg-blue-500 relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
