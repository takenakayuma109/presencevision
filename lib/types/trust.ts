// Entity verification status
export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

// Evidence types for content
export type EvidenceType = "official_data" | "research_paper" | "news_source" | "primary_source" | "government_data";

export interface EntityVerification {
  id: string;
  projectId: string;
  status: VerificationStatus;
  // Verification checks
  corporateRegistration: boolean;  // 法人確認
  officialWebsite: boolean;        // 公式サイト確認
  activeService: boolean;          // 実在サービス確認
  domainOwnership: boolean;        // ドメイン所有確認
  verifiedAt?: string;
  rejectedReason?: string;
  reviewedBy?: string;
}

export interface ContentEvidence {
  id: string;
  artifactId: string;
  type: EvidenceType;
  url: string;           // Source URL
  title: string;         // Source title
  excerpt?: string;      // Relevant excerpt
  verifiedAt?: string;
  isValid: boolean;
}

export interface EntityTrustScore {
  projectId: string;
  overallScore: number;  // 0-100
  // Score components
  newsMentions: number;        // ニュース引用スコア
  externalLinks: number;       // 外部リンクスコア
  socialMentions: number;      // SNS言及スコア
  corporateVerified: boolean;  // 実在企業
  contentQuality: number;      // コンテンツ品質スコア
  // Thresholds
  canPublish: boolean;         // Score >= 30
  canDistribute: boolean;      // Score >= 50
  canFullDistribute: boolean;  // Score >= 70
  updatedAt: string;
}

// Publish guard result
export interface PublishGuardResult {
  allowed: boolean;
  reasons: string[];
  missingEvidence: boolean;
  trustScoreTooLow: boolean;
  entityNotVerified: boolean;
}
