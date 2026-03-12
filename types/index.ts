import type {
  MemberRole,
  BriefStatus,
  AssetStatus,
  AssetType,
  ApprovalStatus,
} from "@prisma/client";

export type { MemberRole, BriefStatus, AssetStatus, AssetType, ApprovalStatus };

export type AgentName =
  | "research"
  | "strategy"
  | "brief"
  | "writer"
  | "editor"
  | "evidence"
  | "compliance"
  | "schema"
  | "publisher"
  | "monitor"
  | "report"
  | "orchestrator";

export interface AgentContext {
  projectId: string;
  workspaceId: string;
  locale: string;
  entityId?: string;
  topicId?: string;
  assetId?: string;
  briefId?: string;
  extra?: Record<string, unknown>;
}

export interface AgentResult<T = unknown> {
  agent: AgentName;
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

export interface ResearchOutput {
  topicOpportunities: TopicOpportunity[];
  keywordClusters: KeywordCluster[];
  faqTopics: string[];
  entityGaps: string[];
  comparisonOpportunities: string[];
}

export interface TopicOpportunity {
  title: string;
  intent: string;
  volume?: number;
  difficulty?: number;
  reason: string;
}

export interface KeywordCluster {
  name: string;
  keywords: string[];
  intent: string;
}

export interface StrategyOutput {
  contentRoadmap: RoadmapItem[];
  weeklyPlan: WeeklyPlanItem[];
  channelPlan: ChannelPlanItem[];
  entityCoveragePlan: EntityCoverageItem[];
}

export interface RoadmapItem {
  title: string;
  priority: number;
  targetWeek: number;
  type: AssetType;
}

export interface WeeklyPlanItem {
  day: string;
  tasks: string[];
}

export interface ChannelPlanItem {
  channel: string;
  frequency: string;
  contentTypes: string[];
}

export interface EntityCoverageItem {
  entity: string;
  currentCoverage: number;
  targetCoverage: number;
  gaps: string[];
}

export interface BriefOutput {
  title: string;
  targetAudience: string;
  searchIntent: string;
  outline: OutlineSection[];
  angle: string;
  evidenceRequirements: string[];
  style: string;
}

export interface OutlineSection {
  heading: string;
  subheadings?: string[];
  notes?: string;
}

export interface WriterOutput {
  title: string;
  body: string;
  metadata: ContentMetadata;
  schemaCandidate?: Record<string, unknown>;
  faq?: FaqItem[];
}

export interface ContentMetadata {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  locale: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface EditorOutput {
  body: string;
  changes: EditChange[];
}

export interface EditChange {
  type: "remove" | "rewrite" | "restructure";
  description: string;
}

export interface EvidenceOutput {
  evidenceMap: EvidenceMapItem[];
  unsupportedClaims: string[];
  verificationTasks: string[];
}

export interface EvidenceMapItem {
  claim: string;
  source: string;
  url?: string;
  verified: boolean;
}

export interface ComplianceOutput {
  status: "approved" | "needs_review" | "blocked";
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  suggestion?: string;
}

export interface SchemaOutput {
  schemas: SchemaItem[];
}

export interface SchemaItem {
  type: string;
  data: Record<string, unknown>;
}

export interface MonitorOutput {
  searchMentions: MentionItem[];
  faqGaps: string[];
  competitorUpdates: string[];
  staleContent: string[];
}

export interface MentionItem {
  source: string;
  url?: string;
  snippet: string;
  sentiment?: string;
}

export interface ReportOutput {
  type: "daily" | "weekly" | "monthly" | "executive";
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export interface WorkflowStep {
  agent: AgentName;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowState {
  id: string;
  name: string;
  projectId: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardData {
  visibilityOverview: { score: number; trend: number };
  entityCoverage: { total: number; covered: number };
  contentPipeline: { draft: number; review: number; approved: number; published: number };
  pendingApprovals: number;
  riskAlerts: number;
  recentActivity: ActivityItem[];
  weeklySummary: { articlesPublished: number; topicsResearched: number; entitiesUpdated: number };
}

export interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  timestamp: Date;
  userId?: string;
}
