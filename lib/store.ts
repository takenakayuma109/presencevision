"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import React from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  description: string;
  entities: number;
  topics: number;
  content: number;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  contentCount: number;
  mentions: number;
  updated: Date;
}

export interface Topic {
  id: string;
  title: string;
  intent: string;
  priority: string;
  status: string;
  cluster: string;
}

export interface ContentBrief {
  id: string;
  title: string;
  topic: string;
  status: string;
  created: Date;
}

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  entity: string;
  updated: Date;
  markdown?: string;
}

export interface Approval {
  id: string;
  contentTitle: string;
  requester: string;
  status: string;
  created: Date;
}

export interface PublishTarget {
  id: string;
  content: string;
  channel: string;
  status: string;
  scheduled: Date | null;
  url: string | null;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  date: Date;
}

export interface Mention {
  id: string;
  source: string;
  snippet: string;
  sentiment: string;
  time: string;
}

export interface ComplianceFlag {
  id: string;
  content: string;
  type: string;
  severity: string;
  message: string;
  resolved: boolean;
}

export interface ChannelItem {
  id: string;
  name: string;
  type: string;
  project: string;
  config: string;
}

export interface Job {
  id: string;
  type: string;
  project: string;
  status: string;
  created: Date;
  completed: Date | null;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  user: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Store state shape
// ---------------------------------------------------------------------------

interface StoreState {
  projects: Project[];
  entities: Entity[];
  topics: Topic[];
  briefs: ContentBrief[];
  contentItems: ContentItem[];
  approvals: Approval[];
  publishTargets: PublishTarget[];
  reports: Report[];
  mentions: Mention[];
  complianceFlags: ComplianceFlag[];
  channels: ChannelItem[];
  jobs: Job[];
  auditLogs: AuditLog[];
}

// ---------------------------------------------------------------------------
// Store actions
// ---------------------------------------------------------------------------

interface StoreActions {
  addProject: (item: Omit<Project, "id">) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;

  addEntity: (item: Omit<Entity, "id">) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  removeEntity: (id: string) => void;

  addTopic: (item: Omit<Topic, "id">) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  removeTopic: (id: string) => void;

  addBrief: (item: Omit<ContentBrief, "id">) => void;
  updateBrief: (id: string, updates: Partial<ContentBrief>) => void;
  removeBrief: (id: string) => void;

  addContentItem: (item: Omit<ContentItem, "id">) => void;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => void;
  removeContentItem: (id: string) => void;

  addApproval: (item: Omit<Approval, "id">) => void;
  updateApproval: (id: string, updates: Partial<Approval>) => void;
  removeApproval: (id: string) => void;

  addPublishTarget: (item: Omit<PublishTarget, "id">) => void;
  updatePublishTarget: (id: string, updates: Partial<PublishTarget>) => void;
  removePublishTarget: (id: string) => void;

  addReport: (item: Omit<Report, "id">) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  removeReport: (id: string) => void;

  addMention: (item: Omit<Mention, "id">) => void;
  updateMention: (id: string, updates: Partial<Mention>) => void;
  removeMention: (id: string) => void;

  addComplianceFlag: (item: Omit<ComplianceFlag, "id">) => void;
  updateComplianceFlag: (id: string, updates: Partial<ComplianceFlag>) => void;
  removeComplianceFlag: (id: string) => void;

  addChannel: (item: Omit<ChannelItem, "id">) => void;
  updateChannel: (id: string, updates: Partial<ChannelItem>) => void;
  removeChannel: (id: string) => void;

  addJob: (item: Omit<Job, "id">) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;

  addAuditLog: (entry: Omit<AuditLog, "id" | "timestamp">) => void;
}

type StoreContextValue = StoreState & StoreActions;

// ---------------------------------------------------------------------------
// Initial mock data (Japanese)
// ---------------------------------------------------------------------------

const initialProjects: Project[] = [
  { id: "1", name: "デジタルプレゼンスガイド", description: "デジタルプレゼンス最適化の包括的ガイド", entities: 12, topics: 24, content: 18 },
  { id: "2", name: "AEO戦略", description: "Answer Engine Optimizationのリサーチとコンテンツ", entities: 8, topics: 15, content: 9 },
  { id: "3", name: "ブランドナレッジベース", description: "コアブランドのエンティティとトピックカバレッジ", entities: 20, topics: 42, content: 35 },
  { id: "4", name: "プロダクトローンチ 2025", description: "製品ローンチのコンテンツとエンティティ設定", entities: 5, topics: 12, content: 6 },
  { id: "5", name: "競合分析", description: "競合環境とギャップ分析", entities: 6, topics: 10, content: 4 },
];

const initialEntities: Entity[] = [
  { id: "1", name: "PresenceVision", type: "Organization", contentCount: 12, mentions: 45, updated: new Date(Date.now() - 3600000) },
  { id: "2", name: "Digital Presence", type: "Concept", contentCount: 8, mentions: 32, updated: new Date(Date.now() - 86400000) },
  { id: "3", name: "AEO", type: "Concept", contentCount: 5, mentions: 18, updated: new Date(Date.now() - 172800000) },
  { id: "4", name: "Answer Engine", type: "Technology", contentCount: 3, mentions: 9, updated: new Date(Date.now() - 259200000) },
  { id: "5", name: "GEO", type: "Concept", contentCount: 4, mentions: 12, updated: new Date(Date.now() - 432000000) },
];

const initialTopics: Topic[] = [
  { id: "1", title: "デジタルプレゼンスとは？", intent: "情報提供", priority: "高", status: "completed", cluster: "コア" },
  { id: "2", title: "AEO vs SEO 比較", intent: "比較", priority: "中", status: "in_progress", cluster: "戦略" },
  { id: "3", title: "GEO最適化の方法", intent: "ハウツー", priority: "中", status: "backlog", cluster: "戦術" },
  { id: "4", title: "エンティティベースのコンテンツ戦略", intent: "情報提供", priority: "高", status: "completed", cluster: "コア" },
  { id: "5", title: "LLM引用のベストプラクティス", intent: "ハウツー", priority: "低", status: "backlog", cluster: "戦術" },
];

const initialBriefs: ContentBrief[] = [
  { id: "1", title: "デジタルプレゼンスガイド - イントロ", topic: "デジタルプレゼンスとは？", status: "READY", created: new Date(Date.now() - 86400000) },
  { id: "2", title: "AEO vs SEO 比較", topic: "AEO vs SEO", status: "IN_PROGRESS", created: new Date(Date.now() - 172800000) },
  { id: "3", title: "エンティティスキーマのベストプラクティス", topic: "エンティティスキーマ", status: "DRAFT", created: new Date(Date.now() - 259200000) },
  { id: "4", title: "GEO最適化のコツ", topic: "GEOハウツー", status: "COMPLETED", created: new Date(Date.now() - 345600000) },
  { id: "5", title: "LLM引用ガイド", topic: "LLM引用", status: "DRAFT", created: new Date(Date.now() - 432000000) },
];

const initialContentItems: ContentItem[] = [
  { id: "1", title: "デジタルプレゼンスガイド", type: "記事", status: "PUBLISHED", entity: "Digital Presence", updated: new Date(Date.now() - 3600000) },
  { id: "2", title: "AEO vs SEO", type: "記事", status: "REVIEW", entity: "AEO", updated: new Date(Date.now() - 86400000) },
  { id: "3", title: "エンティティスキーマガイド", type: "ガイド", status: "DRAFT", entity: "PresenceVision", updated: new Date(Date.now() - 172800000) },
  { id: "4", title: "GEOベストプラクティス", type: "記事", status: "APPROVED", entity: "GEO", updated: new Date(Date.now() - 259200000) },
  { id: "5", title: "レガシーFAQページ", type: "FAQ", status: "ARCHIVED", entity: "PresenceVision", updated: new Date(Date.now() - 432000000) },
];

const initialApprovals: Approval[] = [
  { id: "1", contentTitle: "AEO vs SEO 比較", requester: "admin@presencevision.dev", status: "PENDING", created: new Date(Date.now() - 3600000) },
  { id: "2", contentTitle: "エンティティスキーマガイド", requester: "writer@presencevision.dev", status: "PENDING", created: new Date(Date.now() - 7200000) },
  { id: "3", contentTitle: "デジタルプレゼンス入門", requester: "admin@presencevision.dev", status: "APPROVED", created: new Date(Date.now() - 86400000) },
  { id: "4", contentTitle: "GEOベストプラクティス", requester: "writer@presencevision.dev", status: "NEEDS_REVISION", created: new Date(Date.now() - 172800000) },
  { id: "5", contentTitle: "レガシーFAQアップデート", requester: "admin@presencevision.dev", status: "REJECTED", created: new Date(Date.now() - 259200000) },
];

const initialPublishTargets: PublishTarget[] = [
  { id: "1", content: "デジタルプレゼンスガイド", channel: "ブログ", status: "公開済", scheduled: null, url: "https://example.com/blog/digital-presence" },
  { id: "2", content: "AEO vs SEO", channel: "ブログ", status: "予定", scheduled: new Date(Date.now() + 86400000), url: null },
  { id: "3", content: "エンティティスキーマガイド", channel: "ドキュメント", status: "下書き", scheduled: null, url: null },
  { id: "4", content: "GEOベストプラクティス", channel: "ブログ", status: "公開済", scheduled: null, url: "https://example.com/blog/geo" },
  { id: "5", content: "FAQアップデート", channel: "ヘルプセンター", status: "キュー中", scheduled: new Date(Date.now() + 172800000), url: null },
];

const initialReports: Report[] = [
  { id: "1", title: "週間サマリー - 3月10日", type: "weekly", date: new Date(Date.now() - 86400000) },
  { id: "2", title: "デイリーダイジェスト - 3月11日", type: "daily", date: new Date(Date.now() - 3600000) },
  { id: "3", title: "月間概要 - 2025年2月", type: "monthly", date: new Date(Date.now() - 2592000000) },
  { id: "4", title: "週間サマリー - 3月3日", type: "weekly", date: new Date(Date.now() - 604800000) },
  { id: "5", title: "デイリーダイジェスト - 3月9日", type: "daily", date: new Date(Date.now() - 172800000) },
];

const initialMentions: Mention[] = [
  { id: "1", source: "Twitter", snippet: "PresenceVisionのAEO機能を発見 - コンテンツ戦略が変わる！", sentiment: "positive", time: "2時間前" },
  { id: "2", source: "Reddit", snippet: "PresenceVisionを試した方いますか？導入前にフィードバックを聞きたい。", sentiment: "neutral", time: "5時間前" },
  { id: "3", source: "LinkedIn", snippet: "チームでPresenceVisionを使ったデジタルプレゼンス最適化を導入中。", sentiment: "positive", time: "1日前" },
  { id: "4", source: "Hacker News", snippet: "PresenceVisionは価格に対して過大評価されている気がする。", sentiment: "negative", time: "2日前" },
  { id: "5", source: "ブログ", snippet: "PresenceVisionはブランドのAI検索最適化を支援。", sentiment: "positive", time: "3日前" },
];

const initialComplianceFlags: ComplianceFlag[] = [
  { id: "1", content: "デジタルプレゼンスガイド", type: "正確性", severity: "medium", message: "エンティティの主張に引用が必要", resolved: false },
  { id: "2", content: "AEO vs SEO", type: "コンプライアンス", severity: "low", message: "軽微な表現の修正提案", resolved: true },
  { id: "3", content: "エンティティスキーマガイド", type: "正確性", severity: "high", message: "スキーマ例が古い", resolved: false },
  { id: "4", content: "GEOベストプラクティス", type: "法務", severity: "low", message: "商標使用OK", resolved: true },
  { id: "5", content: "FAQアップデート", type: "正確性", severity: "medium", message: "ファクトチェックが必要", resolved: false },
];

const initialChannels: ChannelItem[] = [
  { id: "1", name: "メインブログ", type: "ブログ", project: "デジタルプレゼンスガイド", config: "URL: blog.example.com, 自動公開: 有効" },
  { id: "2", name: "ドキュメント", type: "ドキュメント", project: "ブランドナレッジベース", config: "URL: docs.example.com, バージョン: v2" },
  { id: "3", name: "ヘルプセンター", type: "ヘルプ", project: "デジタルプレゼンスガイド", config: "URL: help.example.com, FAQ同期: 有効" },
  { id: "4", name: "プロダクトページ", type: "ウェブサイト", project: "ブランドナレッジベース", config: "URL: example.com, スキーマ: Product" },
  { id: "5", name: "APIドキュメント", type: "API", project: "プロダクトローンチ 2025", config: "URL: api.example.com, OpenAPI 3.0" },
];

const initialJobs: Job[] = [
  { id: "1", type: "リサーチ", project: "デジタルプレゼンスガイド", status: "completed", created: new Date(Date.now() - 3600000), completed: new Date(Date.now() - 3500000) },
  { id: "2", type: "エンティティ同期", project: "ブランドナレッジベース", status: "processing", created: new Date(Date.now() - 1800000), completed: null },
  { id: "3", type: "モニタリング", project: "全体", status: "queued", created: new Date(Date.now() - 900000), completed: null },
  { id: "4", type: "レポート生成", project: "AEO戦略", status: "completed", created: new Date(Date.now() - 86400000), completed: new Date(Date.now() - 86350000) },
  { id: "5", type: "コンテンツインデックス", project: "デジタルプレゼンスガイド", status: "failed", created: new Date(Date.now() - 172800000), completed: null },
];

const initialAuditLogs: AuditLog[] = [
  { id: "1", action: "content.published", resource: "デジタルプレゼンスガイド", user: "admin@presencevision.dev", timestamp: new Date(Date.now() - 3600000) },
  { id: "2", action: "entity.updated", resource: "PresenceVision", user: "admin@presencevision.dev", timestamp: new Date(Date.now() - 7200000) },
  { id: "3", action: "brief.created", resource: "AEO vs SEO", user: "writer@presencevision.dev", timestamp: new Date(Date.now() - 86400000) },
  { id: "4", action: "approval.approved", resource: "エンティティスキーマガイド", user: "admin@presencevision.dev", timestamp: new Date(Date.now() - 172800000) },
  { id: "5", action: "research.completed", resource: "デジタルプレゼンスガイド", user: "system", timestamp: new Date(Date.now() - 259200000) },
];

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _idCounter = 100;
function nextId(): string {
  return String(++_idCounter);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const StoreContext = createContext<StoreContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [briefs, setBriefs] = useState<ContentBrief[]>(initialBriefs);
  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContentItems);
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);
  const [publishTargets, setPublishTargets] = useState<PublishTarget[]>(initialPublishTargets);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [mentions, setMentions] = useState<Mention[]>(initialMentions);
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlag[]>(initialComplianceFlags);
  const [channels, setChannels] = useState<ChannelItem[]>(initialChannels);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Audit log helper
  const addAuditLog = useCallback((entry: Omit<AuditLog, "id" | "timestamp">) => {
    setAuditLogs((prev) => [
      { ...entry, id: nextId(), timestamp: new Date() },
      ...prev,
    ]);
  }, []);

  // --- Generic CRUD helpers ---------------------------------------------------

  const addProject = useCallback((item: Omit<Project, "id">) => {
    const id = nextId();
    setProjects((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "project.created", resource: item.name, user: "current-user" });
  }, [addAuditLog]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    addAuditLog({ action: "project.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    addAuditLog({ action: "project.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addEntity = useCallback((item: Omit<Entity, "id">) => {
    const id = nextId();
    setEntities((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "entity.created", resource: item.name, user: "current-user" });
  }, [addAuditLog]);

  const updateEntity = useCallback((id: string, updates: Partial<Entity>) => {
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    addAuditLog({ action: "entity.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeEntity = useCallback((id: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== id));
    addAuditLog({ action: "entity.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addTopic = useCallback((item: Omit<Topic, "id">) => {
    const id = nextId();
    setTopics((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "topic.created", resource: item.title, user: "current-user" });
  }, [addAuditLog]);

  const updateTopic = useCallback((id: string, updates: Partial<Topic>) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    addAuditLog({ action: "topic.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeTopic = useCallback((id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    addAuditLog({ action: "topic.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addBrief = useCallback((item: Omit<ContentBrief, "id">) => {
    const id = nextId();
    setBriefs((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "brief.created", resource: item.title, user: "current-user" });
  }, [addAuditLog]);

  const updateBrief = useCallback((id: string, updates: Partial<ContentBrief>) => {
    setBriefs((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    addAuditLog({ action: "brief.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeBrief = useCallback((id: string) => {
    setBriefs((prev) => prev.filter((b) => b.id !== id));
    addAuditLog({ action: "brief.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addContentItem = useCallback((item: Omit<ContentItem, "id">) => {
    const id = nextId();
    setContentItems((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "content.created", resource: item.title, user: "current-user" });
  }, [addAuditLog]);

  const updateContentItem = useCallback((id: string, updates: Partial<ContentItem>) => {
    setContentItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog({ action: "content.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeContentItem = useCallback((id: string) => {
    setContentItems((prev) => prev.filter((c) => c.id !== id));
    addAuditLog({ action: "content.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addApproval = useCallback((item: Omit<Approval, "id">) => {
    const id = nextId();
    setApprovals((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "approval.created", resource: item.contentTitle, user: "current-user" });
  }, [addAuditLog]);

  const updateApproval = useCallback((id: string, updates: Partial<Approval>) => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    addAuditLog({ action: "approval.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeApproval = useCallback((id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    addAuditLog({ action: "approval.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addPublishTarget = useCallback((item: Omit<PublishTarget, "id">) => {
    const id = nextId();
    setPublishTargets((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "publish.created", resource: item.content, user: "current-user" });
  }, [addAuditLog]);

  const updatePublishTarget = useCallback((id: string, updates: Partial<PublishTarget>) => {
    setPublishTargets((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    addAuditLog({ action: "publish.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removePublishTarget = useCallback((id: string) => {
    setPublishTargets((prev) => prev.filter((p) => p.id !== id));
    addAuditLog({ action: "publish.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addReport = useCallback((item: Omit<Report, "id">) => {
    const id = nextId();
    setReports((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "report.created", resource: item.title, user: "current-user" });
  }, [addAuditLog]);

  const updateReport = useCallback((id: string, updates: Partial<Report>) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    addAuditLog({ action: "report.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    addAuditLog({ action: "report.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addMention = useCallback((item: Omit<Mention, "id">) => {
    const id = nextId();
    setMentions((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "mention.created", resource: item.source, user: "current-user" });
  }, [addAuditLog]);

  const updateMention = useCallback((id: string, updates: Partial<Mention>) => {
    setMentions((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const removeMention = useCallback((id: string) => {
    setMentions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addComplianceFlag = useCallback((item: Omit<ComplianceFlag, "id">) => {
    const id = nextId();
    setComplianceFlags((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "compliance.flagged", resource: item.content, user: "current-user" });
  }, [addAuditLog]);

  const updateComplianceFlag = useCallback((id: string, updates: Partial<ComplianceFlag>) => {
    setComplianceFlags((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    addAuditLog({ action: "compliance.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeComplianceFlag = useCallback((id: string) => {
    setComplianceFlags((prev) => prev.filter((f) => f.id !== id));
    addAuditLog({ action: "compliance.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addChannel = useCallback((item: Omit<ChannelItem, "id">) => {
    const id = nextId();
    setChannels((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "channel.created", resource: item.name, user: "current-user" });
  }, [addAuditLog]);

  const updateChannel = useCallback((id: string, updates: Partial<ChannelItem>) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog({ action: "channel.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeChannel = useCallback((id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id));
    addAuditLog({ action: "channel.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const addJob = useCallback((item: Omit<Job, "id">) => {
    const id = nextId();
    setJobs((prev) => [...prev, { ...item, id }]);
    addAuditLog({ action: "job.created", resource: item.type, user: "current-user" });
  }, [addAuditLog]);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    addAuditLog({ action: "job.updated", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    addAuditLog({ action: "job.deleted", resource: id, user: "current-user" });
  }, [addAuditLog]);

  const value: StoreContextValue = {
    // State
    projects,
    entities,
    topics,
    briefs,
    contentItems,
    approvals,
    publishTargets,
    reports,
    mentions,
    complianceFlags,
    channels,
    jobs,
    auditLogs,
    // Actions
    addProject, updateProject, removeProject,
    addEntity, updateEntity, removeEntity,
    addTopic, updateTopic, removeTopic,
    addBrief, updateBrief, removeBrief,
    addContentItem, updateContentItem, removeContentItem,
    addApproval, updateApproval, removeApproval,
    addPublishTarget, updatePublishTarget, removePublishTarget,
    addReport, updateReport, removeReport,
    addMention, updateMention, removeMention,
    addComplianceFlag, updateComplianceFlag, removeComplianceFlag,
    addChannel, updateChannel, removeChannel,
    addJob, updateJob, removeJob,
    addAuditLog,
  };

  return React.createElement(StoreContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
