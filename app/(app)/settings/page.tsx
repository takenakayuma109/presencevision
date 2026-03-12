"use client";

import { useState } from "react";
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, TechTerm } from "@/components/ui";
import { Input } from "@/components/ui";
import { Key, Bell, Building2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function SettingsPage() {
  const t = useT();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {saved && (
        <div className="rounded-md border border-success/50 bg-success/10 px-4 py-3 text-sm text-success">
          設定を保存しました
        </div>
      )}

      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {t("settings.workspace")}
            </CardTitle>
            <CardDescription>{t("settings.workspaceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t("settings.name")}</label>
              <Input defaultValue={t("common.demoWorkspace")} placeholder={t("settings.workspaceName")} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block"><TechTerm term="スラッグ">{t("settings.slug")}</TechTerm></label>
              <Input defaultValue="demo-workspace" placeholder="workspace-slug" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" /> <TechTerm term="APIキー">{t("settings.apiKeys")}</TechTerm>
            </CardTitle>
            <CardDescription>{t("settings.apiKeysDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-mono text-muted-foreground">pv_••••••••••••••••••••</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-mono text-muted-foreground">pv_••••••••••••••••••••</span>
                <Badge variant="outline">Read-only</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-4">{t("settings.addApiKey")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> {t("settings.notifications")}
            </CardTitle>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">{t("settings.approvalRequests")}</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">{t("settings.researchCompleted")}</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm"><TechTerm term="コンプライアンス">{t("settings.complianceAlerts")}</TechTerm></span>
                <input type="checkbox" className="rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
    </div>
  );
}
