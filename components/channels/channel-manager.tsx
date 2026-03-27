"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  Search,
  Filter,
  Wifi,
  WifiOff,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";
import {
  ChannelConfigDialog,
  type ChannelDef,
  type ChannelState,
  type ConnectionMethod,
  type ConnectionStatus,
} from "./channel-config-dialog";

/* ------------------------------------------------------------------ */
/*  Channel Data                                                       */
/* ------------------------------------------------------------------ */

const CHANNELS: ChannelDef[] = [
  // SNS
  {
    id: "twitter",
    name: "Twitter / X",
    icon: Twitter,
    color: "#000000",
    bg: "bg-black dark:bg-white/10",
    method: "oauth",
    category: "sns",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    bg: "bg-[#E4405F]",
    method: "oauth",
    category: "sns",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    bg: "bg-[#0A66C2]",
    method: "oauth",
    category: "sns",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    bg: "bg-[#1877F2]",
    method: "oauth",
    category: "sns",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music2,
    color: "#000000",
    bg: "bg-black dark:bg-white/10",
    method: "oauth",
    category: "sns",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    bg: "bg-[#FF0000]",
    method: "oauth",
    category: "sns",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: Pin,
    color: "#BD081C",
    bg: "bg-[#BD081C]",
    method: "oauth",
    category: "sns",
  },
  {
    id: "threads",
    name: "Threads",
    icon: AtSign,
    color: "#000000",
    bg: "bg-black dark:bg-white/10",
    method: "oauth",
    category: "sns",
  },

  // Blog
  {
    id: "medium",
    name: "Medium",
    icon: BookOpen,
    color: "#000000",
    bg: "bg-black dark:bg-white/10",
    method: "api_key",
    category: "blog",
    fields: [
      { key: "apiKey", labelJa: "インテグレーショントークン", labelEn: "Integration Token", type: "password", required: true },
    ],
  },
  {
    id: "note",
    name: "note.com",
    icon: FileText,
    color: "#41C9B4",
    bg: "bg-[#41C9B4]",
    method: "api_key",
    category: "blog",
    fields: [
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
      { key: "username", labelJa: "ユーザー名", labelEn: "Username", type: "text", required: true },
    ],
  },
  {
    id: "devto",
    name: "dev.to",
    icon: FileText,
    color: "#0A0A0A",
    bg: "bg-[#0A0A0A]",
    method: "api_key",
    category: "blog",
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
    category: "blog",
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
    category: "blog",
    fields: [
      { key: "apiKey", labelJa: "パーソナルアクセストークン", labelEn: "Personal Access Token", type: "password", required: true },
      { key: "publicationId", labelJa: "パブリケーションID", labelEn: "Publication ID", type: "text", required: true },
    ],
  },

  // Q&A
  {
    id: "reddit",
    name: "Reddit",
    icon: MessageCircle,
    color: "#FF4500",
    bg: "bg-[#FF4500]",
    method: "oauth",
    category: "qa",
  },
  {
    id: "quora",
    name: "Quora",
    icon: HelpCircle,
    color: "#B92B27",
    bg: "bg-[#B92B27]",
    method: "oauth",
    category: "qa",
  },
  {
    id: "yahoo_chiebukuro",
    name: "Yahoo!\u77E5\u6075\u888B",
    icon: HelpCircle,
    color: "#FF0033",
    bg: "bg-[#FF0033]",
    method: "api_key",
    category: "qa",
    fields: [
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
      { key: "username", labelJa: "ユーザー名", labelEn: "Username", type: "text", required: true },
    ],
  },
  {
    id: "zhihu",
    name: "\u77E5\u4E4E",
    icon: HelpCircle,
    color: "#0084FF",
    bg: "bg-[#0084FF]",
    method: "api_key",
    category: "qa",
    fields: [
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
      { key: "username", labelJa: "ユーザー名", labelEn: "Username", type: "text", required: true },
    ],
  },

  // Regional
  {
    id: "naver_blog",
    name: "Naver Blog",
    icon: Globe,
    color: "#03C75A",
    bg: "bg-[#03C75A]",
    method: "api_key",
    category: "regional",
    fields: [
      { key: "clientId", labelJa: "クライアントID", labelEn: "Client ID", type: "text", required: true },
      { key: "clientSecret", labelJa: "クライアントシークレット", labelEn: "Client Secret", type: "password", required: true },
    ],
  },
  {
    id: "tistory",
    name: "Tistory",
    icon: Globe,
    color: "#E45735",
    bg: "bg-[#E45735]",
    method: "url",
    category: "regional",
    fields: [
      { key: "blogUrl", labelJa: "ブログURL", labelEn: "Blog URL", type: "url", required: true },
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
    ],
  },
  {
    id: "csdn",
    name: "CSDN",
    icon: Globe,
    color: "#FC5531",
    bg: "bg-[#FC5531]",
    method: "api_key",
    category: "regional",
    fields: [
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
      { key: "username", labelJa: "ユーザー名", labelEn: "Username", type: "text", required: true },
    ],
  },
  {
    id: "xing",
    name: "Xing",
    icon: Globe,
    color: "#006567",
    bg: "bg-[#006567]",
    method: "url",
    category: "regional",
    fields: [
      { key: "profileUrl", labelJa: "プロフィールURL", labelEn: "Profile URL", type: "url", required: true },
    ],
  },

  // CMS
  {
    id: "wordpress",
    name: "WordPress",
    icon: Globe,
    color: "#21759B",
    bg: "bg-[#21759B]",
    method: "api_key",
    category: "cms",
    fields: [
      { key: "siteUrl", labelJa: "サイトURL", labelEn: "Site URL", type: "url", placeholder: "https://example.com", required: true },
      { key: "username", labelJa: "ユーザー名", labelEn: "Username", type: "text", required: true },
      { key: "appPassword", labelJa: "アプリケーションパスワード", labelEn: "Application Password", type: "password", required: true },
    ],
  },
  {
    id: "wix",
    name: "Wix",
    icon: Globe,
    color: "#0C6EFC",
    bg: "bg-[#0C6EFC]",
    method: "api_key",
    category: "cms",
    fields: [
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
      { key: "siteId", labelJa: "サイトID", labelEn: "Site ID", type: "text", required: true },
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: Globe,
    color: "#96BF48",
    bg: "bg-[#96BF48]",
    method: "api_key",
    category: "cms",
    fields: [
      { key: "storeDomain", labelJa: "ストアドメイン", labelEn: "Store Domain", type: "text", placeholder: "store.myshopify.com", required: true },
      { key: "accessToken", labelJa: "アクセストークン", labelEn: "Access Token", type: "password", required: true },
    ],
  },
  {
    id: "squarespace",
    name: "Squarespace",
    icon: Globe,
    color: "#000000",
    bg: "bg-black dark:bg-white/10",
    method: "api_key",
    category: "cms",
    fields: [
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
      { key: "siteId", labelJa: "サイトID", labelEn: "Site ID", type: "text", required: true },
    ],
  },
  {
    id: "webflow",
    name: "Webflow",
    icon: Globe,
    color: "#4353FF",
    bg: "bg-[#4353FF]",
    method: "api_key",
    category: "cms",
    fields: [
      { key: "apiToken", labelJa: "APIトークン", labelEn: "API Token", type: "password", required: true },
      { key: "siteId", labelJa: "サイトID", labelEn: "Site ID", type: "text", required: true },
      { key: "collectionId", labelJa: "コレクションID", labelEn: "Collection ID", type: "text", required: false },
    ],
  },
  {
    id: "ghost",
    name: "Ghost",
    icon: Globe,
    color: "#15171A",
    bg: "bg-[#15171A]",
    method: "api_key",
    category: "cms",
    fields: [
      { key: "siteUrl", labelJa: "サイトURL", labelEn: "Site URL", type: "url", placeholder: "https://example.ghost.io", required: true },
      { key: "adminApiKey", labelJa: "Admin APIキー", labelEn: "Admin API Key", type: "password", required: true },
    ],
  },
  {
    id: "microcms",
    name: "microCMS",
    icon: Globe,
    color: "#2B2B2B",
    bg: "bg-[#2B2B2B]",
    method: "api_key",
    category: "cms",
    fields: [
      { key: "serviceDomain", labelJa: "サービスドメイン", labelEn: "Service Domain", type: "text", placeholder: "your-service", required: true },
      { key: "apiKey", labelJa: "APIキー", labelEn: "API Key", type: "password", required: true },
    ],
  },
];

type CategoryKey = "all" | "sns" | "blog" | "qa" | "regional" | "cms";

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
    { key: "sns", labelJa: "SNS", labelEn: "SNS" },
    { key: "blog", labelJa: "ブログ", labelEn: "Blog" },
    { key: "qa", labelJa: "Q&A", labelEn: "Q&A" },
    { key: "regional", labelJa: "地域", labelEn: "Regional" },
    { key: "cms", labelJa: "CMS", labelEn: "CMS" },
  ];

  const categoryLabels: Record<string, { ja: string; en: string }> = {
    sns: { ja: "SNS", en: "Social Media" },
    blog: { ja: "ブログプラットフォーム", en: "Blog Platforms" },
    qa: { ja: "Q&A・フォーラム", en: "Q&A / Forums" },
    regional: { ja: "地域プラットフォーム", en: "Regional Platforms" },
    cms: { ja: "CMS / サイトビルダー", en: "CMS / Site Builder" },
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
            // Simulate OAuth connection
            updateState(selectedChannel.id, {
              status: "connected",
              enabled: true,
              lastSyncAt: new Date().toLocaleString(),
            });
          }}
        />
      )}
    </div>
  );
}
