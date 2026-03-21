"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  Button,
  Input,
  Badge,
} from "@/components/ui";
import {
  ExternalLink,
  Key,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ConnectionMethod = "oauth" | "api_key" | "url";

export type ConnectionStatus = "disconnected" | "connected" | "expiring";

export interface ChannelDef {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  method: ConnectionMethod;
  category: string;
  fields?: ChannelField[];
}

export interface ChannelField {
  key: string;
  labelJa: string;
  labelEn: string;
  type: "text" | "password" | "url";
  placeholder?: string;
  required?: boolean;
}

export interface ChannelState {
  status: ConnectionStatus;
  enabled: boolean;
  autoPublish: boolean;
  credentials: Record<string, string>;
  lastSyncAt?: string;
  contentFormat?: string;
}

type TestResult = "idle" | "testing" | "success" | "error";

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-blue-500" : "bg-muted-foreground/25"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Content Format Options                                             */
/* ------------------------------------------------------------------ */

const CONTENT_FORMATS: Record<string, { labelJa: string; labelEn: string; options: { value: string; labelJa: string; labelEn: string }[] }> = {
  "twitter": {
    labelJa: "投稿形式",
    labelEn: "Post format",
    options: [
      { value: "single", labelJa: "シングルポスト", labelEn: "Single post" },
      { value: "thread", labelJa: "スレッド", labelEn: "Thread" },
    ],
  },
  "linkedin": {
    labelJa: "投稿形式",
    labelEn: "Post format",
    options: [
      { value: "post", labelJa: "通常投稿", labelEn: "Regular post" },
      { value: "article", labelJa: "記事", labelEn: "Article" },
    ],
  },
  "instagram": {
    labelJa: "投稿形式",
    labelEn: "Post format",
    options: [
      { value: "feed", labelJa: "フィード投稿", labelEn: "Feed post" },
      { value: "carousel", labelJa: "カルーセル", labelEn: "Carousel" },
      { value: "reel", labelJa: "リール", labelEn: "Reel" },
    ],
  },
  "youtube": {
    labelJa: "コンテンツ形式",
    labelEn: "Content format",
    options: [
      { value: "video", labelJa: "動画", labelEn: "Video" },
      { value: "short", labelJa: "ショート", labelEn: "Short" },
      { value: "community", labelJa: "コミュニティ投稿", labelEn: "Community post" },
    ],
  },
  "wordpress": {
    labelJa: "公開状態",
    labelEn: "Publish status",
    options: [
      { value: "draft", labelJa: "下書き", labelEn: "Draft" },
      { value: "publish", labelJa: "公開", labelEn: "Publish" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Channel Config Dialog                                              */
/* ------------------------------------------------------------------ */

interface ChannelConfigDialogProps {
  channel: ChannelDef;
  state: ChannelState;
  open: boolean;
  onClose: () => void;
  onSave: (patch: Partial<ChannelState>) => void;
  onDisconnect: () => void;
  onConnect: () => void;
}

export function ChannelConfigDialog({
  channel,
  state,
  open,
  onClose,
  onSave,
  onDisconnect,
  onConnect,
}: ChannelConfigDialogProps) {
  const { t, locale } = useTranslation();
  const isJa = locale === "ja";

  const [credentials, setCredentials] = useState<Record<string, string>>(
    state.credentials ?? {},
  );
  const [autoPublish, setAutoPublish] = useState(state.autoPublish);
  const [contentFormat, setContentFormat] = useState(
    state.contentFormat ?? "",
  );
  const [testResult, setTestResult] = useState<TestResult>("idle");

  const Icon = channel.icon;

  const updateCredential = useCallback(
    (key: string, value: string) => {
      setCredentials((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleTestConnection = useCallback(async () => {
    setTestResult("testing");
    // Simulate test
    await new Promise((r) => setTimeout(r, 1500));
    const hasCredentials = channel.fields
      ? channel.fields.filter((f) => f.required !== false).every((f) => credentials[f.key]?.trim())
      : true;
    setTestResult(hasCredentials ? "success" : "error");
    setTimeout(() => setTestResult("idle"), 3000);
  }, [channel.fields, credentials]);

  const handleSave = useCallback(() => {
    onSave({
      credentials,
      autoPublish,
      contentFormat: contentFormat || undefined,
      status: "connected",
      enabled: true,
    });
    onClose();
  }, [credentials, autoPublish, contentFormat, onSave, onClose]);

  const formatConfig = CONTENT_FORMATS[channel.id];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={channel.name}
    >
      <div className="space-y-6">
        {/* Channel Header */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${channel.bg}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">
              {isJa ? `接続方法: ${channel.method === "oauth" ? "OAuth認証" : channel.method === "api_key" ? "APIキー" : "URL"}` : `Connection: ${channel.method === "oauth" ? "OAuth" : channel.method === "api_key" ? "API Key" : "URL"}`}
            </p>
          </div>
          <Badge
            variant={
              state.status === "connected"
                ? "success"
                : state.status === "expiring"
                  ? "warning"
                  : "outline"
            }
          >
            {state.status === "connected"
              ? t("channels.statusConnected")
              : state.status === "expiring"
                ? t("channels.statusExpiring")
                : t("channels.statusDisconnected")}
          </Badge>
        </div>

        {/* Connection Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">
            {t("channels.connectionSettings")}
          </h4>

          {/* OAuth channels */}
          {channel.method === "oauth" && (
            <div className="space-y-3">
              {state.status === "disconnected" ? (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={onConnect}
                >
                  <ExternalLink className="h-4 w-4" />
                  {isJa
                    ? `${channel.name}で認証`
                    : `Connect with ${channel.name}`}
                </Button>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{t("channels.oauthConnected")}</span>
                  </div>
                  {state.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("channels.lastSync")}: {state.lastSyncAt}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* API Key / URL channels */}
          {(channel.method === "api_key" || channel.method === "url") && (
            <div className="space-y-3">
              {channel.fields?.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {isJa ? field.labelJa : field.labelEn}
                    {field.required !== false && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </label>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={credentials[field.key] ?? ""}
                    onChange={(e) => updateCredential(field.key, e.target.value)}
                  />
                </div>
              ))}

              {/* Test Connection */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleTestConnection}
                disabled={testResult === "testing"}
              >
                {testResult === "testing" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("channels.testing")}
                  </>
                ) : testResult === "success" ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {t("channels.testSuccess")}
                  </>
                ) : testResult === "error" ? (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    {t("channels.testFailed")}
                  </>
                ) : (
                  <>
                    <Wifi className="h-3.5 w-3.5" />
                    {t("channels.testConnection")}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Publishing Preferences */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-semibold">
            {t("channels.publishSettings")}
          </h4>

          <Toggle
            checked={autoPublish}
            onChange={setAutoPublish}
            label={t("channels.autoPublish")}
          />

          {/* Content Format */}
          {formatConfig && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {isJa ? formatConfig.labelJa : formatConfig.labelEn}
              </label>
              <div className="flex flex-wrap gap-2">
                {formatConfig.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setContentFormat(opt.value)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      contentFormat === opt.value
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    {isJa ? opt.labelJa : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          {state.status !== "disconnected" ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive gap-1.5"
              onClick={() => {
                onDisconnect();
                onClose();
              }}
            >
              <WifiOff className="h-3.5 w-3.5" />
              {t("channels.disconnect")}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave}>
              <Key className="h-3.5 w-3.5 mr-1.5" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
