export type AIBoostProvider = "openai" | "anthropic";
export type AIBoostModel = "gpt-4o" | "gpt-4o-mini" | "claude-sonnet-4-20250514";

export interface AIBoostConfig {
  provider: AIBoostProvider;
  model: AIBoostModel;
  maxTokens: number;
  temperature: number;
}

export interface AIBoostQuota {
  planId: string;
  monthlyLimit: number; // -1 for unlimited
  used: number;
  remaining: number;
  resetAt: string;
}

export interface AIBoostArticle {
  id: string;
  projectId: string;
  keyword: string;
  title: string;
  content: string;
  provider: AIBoostProvider;
  model: AIBoostModel;
  tokensUsed: number;
  estimatedCostJpy: number;
  createdAt: string;
}
