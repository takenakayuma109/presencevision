"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
} from "@/components/ui";
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Music2,
  Pin,
  AtSign,
  MessageCircle,
  HelpCircle,
  BookOpen,
  FileText,
  Globe,
  Check,
  ExternalLink,
  Key,
  Unplug,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ConnectionMethod = "oauth" | "api_key" | "url";

interface ChannelDef {
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  method: ConnectionMethod;
}

interface ChannelState {
  connected: boolean;
  enabled: boolean;
  apiKey?: string;
  url?: string;
}

/* ------------------------------------------------------------------ */
/*  Channel Data                                                       */
/* ------------------------------------------------------------------ */

const CHANNEL_GROUPS: Record<string, ChannelDef[]> = {
  SNS: [
    { name: "Twitter / X", icon: Twitter, color: "#000000", bg: "bg-black dark:bg-white/10", method: "oauth" },
    { name: "Instagram", icon: Instagram, color: "#E4405F", bg: "bg-[#E4405F]", method: "oauth" },
    { name: "LinkedIn", icon: Linkedin, color: "#0A66C2", bg: "bg-[#0A66C2]", method: "oauth" },
    { name: "Facebook", icon: Facebook, color: "#1877F2", bg: "bg-[#1877F2]", method: "oauth" },
    { name: "TikTok", icon: Music2, color: "#000000", bg: "bg-black dark:bg-white/10", method: "oauth" },
    { name: "YouTube", icon: Youtube, color: "#FF0000", bg: "bg-[#FF0000]", method: "oauth" },
    { name: "Pinterest", icon: Pin, color: "#BD081C", bg: "bg-[#BD081C]", method: "oauth" },
    { name: "Threads", icon: AtSign, color: "#000000", bg: "bg-black dark:bg-white/10", method: "oauth" },
  ],
  Blog: [
    { name: "Medium", icon: BookOpen, color: "#000000", bg: "bg-black dark:bg-white/10", method: "api_key" },
    { name: "note.com", icon: FileText, color: "#41C9B4", bg: "bg-[#41C9B4]", method: "api_key" },
    { name: "dev.to", icon: FileText, color: "#0A0A0A", bg: "bg-[#0A0A0A]", method: "api_key" },
    { name: "Qiita", icon: FileText, color: "#55C500", bg: "bg-[#55C500]", method: "api_key" },
    { name: "Hashnode", icon: FileText, color: "#2962FF", bg: "bg-[#2962FF]", method: "api_key" },
  ],
  "Q&A": [
    { name: "Reddit", icon: MessageCircle, color: "#FF4500", bg: "bg-[#FF4500]", method: "oauth" },
    { name: "Quora", icon: HelpCircle, color: "#B92B27", bg: "bg-[#B92B27]", method: "oauth" },
    { name: "Yahoo!知恵袋", icon: HelpCircle, color: "#FF0033", bg: "bg-[#FF0033]", method: "api_key" },
    { name: "知乎", icon: HelpCircle, color: "#0084FF", bg: "bg-[#0084FF]", method: "api_key" },
  ],
  "CMS/Site Builder": [
    { name: "WordPress", icon: Globe, color: "#21759B", bg: "bg-[#21759B]", method: "api_key" },
    { name: "Wix", icon: Globe, color: "#0C6EFC", bg: "bg-[#0C6EFC]", method: "api_key" },
    { name: "Shopify", icon: Globe, color: "#96BF48", bg: "bg-[#96BF48]", method: "api_key" },
    { name: "Squarespace", icon: Globe, color: "#000000", bg: "bg-black dark:bg-white/10", method: "api_key" },
    { name: "Webflow", icon: Globe, color: "#4353FF", bg: "bg-[#4353FF]", method: "api_key" },
    { name: "Ghost", icon: Globe, color: "#15171A", bg: "bg-[#15171A]", method: "api_key" },
    { name: "microCMS", icon: Globe, color: "#2B2B2B", bg: "bg-[#2B2B2B]", method: "api_key" },
  ],
  Regional: [
    { name: "Naver Blog", icon: Globe, color: "#03C75A", bg: "bg-[#03C75A]", method: "api_key" },
    { name: "Tistory", icon: Globe, color: "#E45735", bg: "bg-[#E45735]", method: "url" },
    { name: "CSDN", icon: Globe, color: "#FC5531", bg: "bg-[#FC5531]", method: "api_key" },
    { name: "Xing", icon: Globe, color: "#006567", bg: "bg-[#006567]", method: "url" },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  SNS: "SNS",
  Blog: "ブログ",
  "Q&A": "Q&A",
  "CMS/Site Builder": "CMS / サイトビルダー",
  Regional: "地域プラットフォーム",
};

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
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
  );
}

/* ------------------------------------------------------------------ */
/*  Channel Card                                                       */
/* ------------------------------------------------------------------ */

function ChannelCard({
  channel,
  state,
  onToggle,
  onConnect,
  onDisconnect,
  onApiKeyChange,
  onApiKeySave,
  onUrlChange,
  onUrlSave,
}: {
  channel: ChannelDef;
  state: ChannelState;
  onToggle: (enabled: boolean) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onApiKeyChange: (key: string) => void;
  onApiKeySave: () => void;
  onUrlChange: (url: string) => void;
  onUrlSave: () => void;
}) {
  const Icon = channel.icon;

  return (
    <div className="rounded-lg border p-4 space-y-3 transition-colors hover:border-border">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${channel.bg}`}
          >
            <Icon className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">{channel.name}</p>
            <Badge
              variant={state.connected ? "success" : "outline"}
              className="text-[10px] mt-0.5"
            >
              {state.connected ? "接続済み" : "未接続"}
            </Badge>
          </div>
        </div>
        <Toggle checked={state.enabled} onChange={onToggle} />
      </div>

      {/* Connection UI (shown when toggled on) */}
      {state.enabled && !state.connected && (
        <div className="pt-1">
          {channel.method === "oauth" && (
            <Button size="sm" variant="outline" className="w-full gap-2" onClick={onConnect}>
              <ExternalLink className="h-3.5 w-3.5" />
              OAuth接続
            </Button>
          )}

          {channel.method === "api_key" && (
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="APIキーを入力"
                value={state.apiKey ?? ""}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className="flex-1 text-xs"
              />
              <Button
                size="sm"
                onClick={onApiKeySave}
                disabled={!state.apiKey?.trim()}
              >
                <Key className="h-3.5 w-3.5 mr-1" />
                保存
              </Button>
            </div>
          )}

          {channel.method === "url" && (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="URLを入力"
                value={state.url ?? ""}
                onChange={(e) => onUrlChange(e.target.value)}
                className="flex-1 text-xs"
              />
              <Button
                size="sm"
                onClick={onUrlSave}
                disabled={!state.url?.trim()}
              >
                保存
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Connected state */}
      {state.enabled && state.connected && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3.5 w-3.5" />
            接続済み
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-destructive hover:text-destructive gap-1"
            onClick={onDisconnect}
          >
            <Unplug className="h-3 w-3" />
            切断
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Channel Connect Component                                          */
/* ------------------------------------------------------------------ */

export function ChannelConnect() {
  const [states, setStates] = useState<Record<string, ChannelState>>(() => {
    const initial: Record<string, ChannelState> = {};
    for (const channels of Object.values(CHANNEL_GROUPS)) {
      for (const ch of channels) {
        initial[ch.name] = {
          connected: false,
          enabled: false,
          apiKey: "",
          url: "",
        };
      }
    }
    return initial;
  });

  const updateState = useCallback(
    (name: string, patch: Partial<ChannelState>) => {
      setStates((prev) => ({
        ...prev,
        [name]: { ...prev[name], ...patch },
      }));
    },
    [],
  );

  const connectedCount = Object.values(states).filter((s) => s.connected).length;
  const totalCount = Object.values(states).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <Badge variant="info">{connectedCount} / {totalCount} チャネル接続</Badge>
      </div>

      {/* Channel groups */}
      {Object.entries(CHANNEL_GROUPS).map(([category, channels]) => (
        <Card key={category}>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map((ch) => {
                const state = states[ch.name];
                return (
                  <ChannelCard
                    key={ch.name}
                    channel={ch}
                    state={state}
                    onToggle={(enabled) => {
                      updateState(ch.name, { enabled });
                      if (!enabled) {
                        updateState(ch.name, { connected: false, enabled: false });
                      }
                    }}
                    onConnect={() => {
                      // Simulate OAuth flow
                      updateState(ch.name, { connected: true });
                    }}
                    onDisconnect={() => {
                      updateState(ch.name, { connected: false, apiKey: "", url: "" });
                    }}
                    onApiKeyChange={(apiKey) => {
                      updateState(ch.name, { apiKey });
                    }}
                    onApiKeySave={() => {
                      if (state.apiKey?.trim()) {
                        updateState(ch.name, { connected: true });
                      }
                    }}
                    onUrlChange={(url) => {
                      updateState(ch.name, { url });
                    }}
                    onUrlSave={() => {
                      if (state.url?.trim()) {
                        updateState(ch.name, { connected: true });
                      }
                    }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
