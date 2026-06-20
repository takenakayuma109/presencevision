"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  Badge,
  Input,
} from "@/components/ui";
import {
  FileText,
  Globe,
  Search,
  Filter,
  Wifi,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import {
  ChannelConfigDialog,
  type ChannelDef,
  type ChannelState,
  type ConnectionStatus,
} from "./channel-config-dialog";

/* ------------------------------------------------------------------ */
/*  Channel Data                                                       */
/*                                                                    */
/*  安全設計: 実際に動作し、各社の利用規約に準拠した「公式API系」のみ。     */
/*  自社ナレッジHubは全プランで自動有効（接続不要）のためここには出さない。   */
/*  SNS（X/Instagram等）・Q&A（Reddit/Quora等）への自動投稿は、規約違反・    */
/*  アカウント凍結リスクがあるため提供しない（エンジン側でも無効化済み）。     */
/* ------------------------------------------------------------------ */

const CHANNELS: ChannelDef[] = [
  // 自社サイト（あなたのCMS・公式API）
  {
    id: "wordpress",
    name: "WordPress / 自社サイト",
    icon: Globe,
    color: "#21759B",
    bg: "bg-[#21759B]",
    method: "api_key",
    category: "owned",
    fields: [
      { key: "siteUrl", labelJa: "サイトURL", labelEn: "Site URL", type: "url", placeholder: "https://example.com", required: true },
      { key: "username", labelJa: "ユーザー名", labelEn: "Username", type: "text", required: true },
      { key: "appPassword", labelJa: "アプリケーションパスワード", labelEn: "Application Password", type: "password", required: true },
    ],
  },

  // ローカル検索（Googleビジネスプロフィール・公式API）
  {
    id: "google_business",
    name: "Google Business Profile",
    icon: Globe,
    color: "#4285F4",
    bg: "bg-[#4285F4]",
    method: "oauth",
    category: "local",
    oauthPath: "/api/oauth/google-business",
  },

  // 技術コミュニティ（公式API）
  {
    id: "devto",
    name: "dev.to",
    icon: FileText,
    color: "#0A0A0A",
    bg: "bg-[#0A0A0A]",
    method: "api_key",
    category: "community",
    fields: [
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
    ],
  },
  {
    id: "qiita",
    name: "Qiita",
    icon: FileText,
    color: "#55C500",
    bg: "bg-[#55C500]",
    method: "api_key",
    category: "community",
    fields: [
      { key: "apiKey", labelJa: "アクセストークン", labelEn: "Access Token", type: "password", required: true },
    ],
  },
  {
    id: "hashnode",
    name: "Hashnode",
    icon: FileText,
    color: "#2962FF",
    bg: "bg-[#2962FF]",
    method: "api_key",
    category: "community",
    fields: [
      { key: "apiKey", labelJa: "パーソナルアクセストークン", labelEn: "Personal Access Token", type: "password", required: true },
      { key: "publicationId", labelJa: "パブリケーションID", labelEn: "Publication ID", type: "text", required: true },
    ],
  },
];

type CategoryKey = "all" | "owned" | "local" | "community";

/* ------------------------------------------------------------------ */
/*  Status Dot                                                         */
/* ------------------------------------------------------------------ */

function StatusDot({ status }: { status: ConnectionStatus }) {
  const colors: Record<ConnectionStatus, string> = {
    connected: "bg-green-500",
    expiring: "bg-orange-400 animate-pulse",
    disconnected: "bg-gray-400",
  };
  return <div className={`h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}

/* ------------------------------------------------------------------ */
/*  Channel Card (Grid)                                                */
/* ------------------------------------------------------------------ */

function ChannelGridCard({
  channel,
  state,
  onClick,
}: {
  channel: ChannelDef;
  state: ChannelState;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const Icon = channel.icon;

  return (
    <button
      onClick={onClick}
      className="group rounded-lg border p-4 text-left transition-all hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-700 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${channel.bg} transition-transform group-hover:scale-105`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">{channel.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <StatusDot status={state.status} />
              <span className="text-xs text-muted-foreground">
                {state.status === "connected"
                  ? t("channels.statusConnected")
                  : state.status === "expiring"
                    ? t("channels.statusExpiring")
                    : t("channels.statusDisconnected")}
              </span>
            </div>
          </div>
        </div>
        {state.autoPublish && state.status === "connected" && (
          <Badge variant="info" className="text-[10px]">
            {t("channels.autoLabel")}
          </Badge>
        )}
      </div>
      {state.lastSyncAt && state.status === "connected" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {t("channels.lastSync")}: {state.lastSyncAt}
        </div>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Channel Manager                                                    */
/* ------------------------------------------------------------------ */

interface ChannelManagerProps {
  projectId?: string;
  workspaceId?: string;
}

export function ChannelManager({ projectId, workspaceId }: ChannelManagerProps = {}) {
  const { t, locale } = useTranslation();
  const isJa = locale === "ja";

  const [states, setStates] = useState<Record<string, ChannelState>>(() => {
    const initial: Record<string, ChannelState> = {};
    for (const ch of CHANNELS) {
      initial[ch.id] = {
        status: "disconnected",
        enabled: false,
        autoPublish: false,
        credentials: {},
      };
    }
    return initial;
  });

  const [selectedChannel, setSelectedChannel] = useState<ChannelDef | null>(null);
  const [filterCategory, setFilterCategory] = useState<CategoryKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // Map channel type -> saved DB id for disconnect/delete
  const [savedChannelIds, setSavedChannelIds] = useState<Record<string, string>>({});

  // Load saved channels from the API on mount
  useEffect(() => {
    const url = projectId
      ? `/api/channels?projectId=${projectId}`
      : "/api/channels";
    fetch(url)
      .then((r) => r.ok ? r.json() : [])
      .then((channels: Array<{ id: string; type: string; config: Record<string, unknown> | null; connected: boolean }>) => {
        const ids: Record<string, string> = {};
        for (const ch of channels) {
          ids[ch.type] = ch.id;
          setStates((prev) => ({
            ...prev,
            [ch.type]: {
              ...prev[ch.type],
              status: ch.connected ? "connected" : "disconnected",
              enabled: ch.connected,
              autoPublish: (ch.config as Record<string, unknown>)?.autoPublish === true,
              credentials: {}, // credentials not returned for security
            },
          }));
        }
        setSavedChannelIds(ids);
      })
      .catch(() => {});
  }, [projectId]);

  const updateState = useCallback(
    (id: string, patch: Partial<ChannelState>) => {
      setStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
    },
    [],
  );

  // Persist a channel save to the API
  const saveChannelToApi = useCallback(
    async (channelId: string, patch: Partial<ChannelState>) => {
      if (!workspaceId) return;
      try {
        const res = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            projectId: projectId ?? undefined,
            name: CHANNELS.find((c) => c.id === channelId)?.name ?? channelId,
            type: channelId,
            credentials: patch.credentials ?? {},
            config: {
              autoPublish: patch.autoPublish ?? false,
              contentFormat: patch.contentFormat,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSavedChannelIds((prev) => ({ ...prev, [channelId]: data.id }));
        }
      } catch {
        // silent
      }
    },
    [workspaceId, projectId],
  );

  // Delete a channel via the API
  const deleteChannelFromApi = useCallback(
    async (channelId: string) => {
      const dbId = savedChannelIds[channelId];
      if (!dbId) return;
      try {
        await fetch(`/api/channels?id=${dbId}`, { method: "DELETE" });
        setSavedChannelIds((prev) => {
          const next = { ...prev };
          delete next[channelId];
          return next;
        });
      } catch {
        // silent
      }
    },
    [savedChannelIds],
  );

  const connectedCount = useMemo(
    () => Object.values(states).filter((s) => s.status !== "disconnected").length,
    [states],
  );

  const categories: { key: CategoryKey; labelJa: string; labelEn: string }[] = [
    { key: "all", labelJa: "すべて", labelEn: "All" },
    { key: "owned", labelJa: "自社サイト", labelEn: "Your Site" },
    { key: "local", labelJa: "ローカル", labelEn: "Local" },
    { key: "community", labelJa: "技術コミュニティ", labelEn: "Community" },
  ];

  const categoryLabels: Record<string, { ja: string; en: string }> = {
    owned: { ja: "自社サイト / CMS（公式API）", en: "Your Site / CMS" },
    local: { ja: "ローカル検索（Googleビジネスプロフィール）", en: "Local Search" },
    community: { ja: "技術コミュニティ（公式API）", en: "Tech Communities" },
  };

  const filteredChannels = useMemo(() => {
    return CHANNELS.filter((ch) => {
      if (filterCategory !== "all" && ch.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ch.name.toLowerCase().includes(q) || ch.id.includes(q);
      }
      return true;
    });
  }, [filterCategory, searchQuery]);

  // Group filtered channels by category
  const groupedChannels = useMemo(() => {
    const groups: Record<string, ChannelDef[]> = {};
    for (const ch of filteredChannels) {
      if (!groups[ch.category]) groups[ch.category] = [];
      groups[ch.category].push(ch);
    }
    return groups;
  }, [filteredChannels]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{t("channels.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("channels.subtitle")}
        </p>
      </div>

      {/* Hub always-on + safety note (why no SNS) */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">自社ナレッジHubは全プランで自動的に有効です（接続は不要）。</span>
          下記は「追加の公開先」です。SNS（X・Instagram等）やQ&Aサイトへの自動投稿は、各社の利用規約違反・アカウント凍結のリスクがあるため、安全設計の方針として提供していません。
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="info">
          {connectedCount} / {CHANNELS.length}{" "}
          {t("channels.connected")}
        </Badge>
        <Badge variant="success">
          <Wifi className="h-3 w-3 mr-1" />
          {Object.values(states).filter((s) => s.status === "connected").length}{" "}
          {t("channels.active")}
        </Badge>
        {Object.values(states).some((s) => s.status === "expiring") && (
          <Badge variant="warning">
            {Object.values(states).filter((s) => s.status === "expiring").length}{" "}
            {t("channels.tokenExpiring")}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("channels.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filterCategory === cat.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isJa ? cat.labelJa : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Groups */}
      {Object.entries(groupedChannels).map(([category, channels]) => (
        <Card key={category}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {isJa
                  ? categoryLabels[category]?.ja ?? category
                  : categoryLabels[category]?.en ?? category}
              </h3>
              <span className="text-xs text-muted-foreground">
                {channels.filter((ch) => states[ch.id]?.status !== "disconnected").length}
                {" / "}
                {channels.length} {t("channels.connected")}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {channels.map((ch) => (
                <ChannelGridCard
                  key={ch.id}
                  channel={ch}
                  state={states[ch.id]}
                  onClick={() => setSelectedChannel(ch)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty State */}
      {filteredChannels.length === 0 && (
        <div className="text-center py-12">
          <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("channels.noResults")}
          </p>
        </div>
      )}

      {/* Config Dialog */}
      {selectedChannel && (
        <ChannelConfigDialog
          channel={selectedChannel}
          state={states[selectedChannel.id]}
          open={!!selectedChannel}
          onClose={() => setSelectedChannel(null)}
          onSave={(patch) => {
            updateState(selectedChannel.id, patch);
            saveChannelToApi(selectedChannel.id, patch);
          }}
          onDisconnect={() => {
            updateState(selectedChannel.id, {
              status: "disconnected",
              enabled: false,
              autoPublish: false,
              credentials: {},
              lastSyncAt: undefined,
              contentFormat: undefined,
            });
            deleteChannelFromApi(selectedChannel.id);
          }}
          onConnect={() => {
            // No-op: connection is handled via credential input + save
          }}
        />
      )}
    </div>
  );
}
