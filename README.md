# PresenceVision

**Autonomous Digital Presence Engine**
（自律型デジタル存在生成エンジン）

PresenceVision は企業・プロダクト・人物・概念のデジタル存在を自律的に強化するAI運用OSです。

## Overview

PresenceVision は以下を統合します:

- **SEO** — Search Engine Optimization
- **AEO** — Answer Engine Optimization
- **GEO** — Generative Engine Optimization
- **LLM Discoverability** — LLMに引用される構造
- **Knowledge Graph Presence** — ナレッジグラフ上の存在
- **Entity Presence** — エンティティとしての認識
- **Owned Media Automation** — 自社メディアの自動運用

## Presence Layer Architecture

| Layer | Name | Focus |
|-------|------|-------|
| Layer 1 | Global Knowledge Layer | 英語中心のグローバル知識構築 |
| Layer 2 | Local Market Layer | 日本語での市場浸透 |
| Layer 3 | Structured Knowledge Layer | Schema.org / Entity構造化 |
| Layer 4 | LLM Citation Layer | LLM引用最適化 |

## AI Agent System

| Agent | Role |
|-------|------|
| Research Agent | トピック探索・競合分析・エンティティギャップ分析 |
| Strategy Agent | コンテンツ戦略・公開計画・LLM引用戦略 |
| Brief Agent | コンテンツブリーフ生成 |
| Writer Agent | 記事・FAQ・用語集・比較記事生成 |
| Editor Agent | 編集・品質改善・ブランドトーン整合 |
| Evidence Agent | 主張の根拠チェック・引用検証 |
| Compliance Agent | 法務チェック・ブランドセーフティ |
| Schema Agent | Schema.org構造化データ生成 |
| Publisher Agent | 公開計画・Markdown出力 |
| Monitor Agent | 検索監視・言及監視・FAQ不足検出 |
| Report Agent | 日次/週次/月次レポート生成 |
| Orchestrator Agent | エージェント統合・ワークフロー管理 |

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, TanStack Table
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL, Prisma ORM
- **Queue**: Redis, BullMQ
- **AI**: Claude API (Anthropic)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database URL and API keys
# Then generate Prisma client and run migrations
npx prisma generate
npx prisma db push

# Seed the database
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

### Run Worker (separate terminal)

```bash
npx tsx workers/index.ts
```

## Project Structure

```
app/                    # Next.js App Router pages
  (app)/                # Authenticated layout group
    dashboard/          # Dashboard
    projects/           # Project management
    entities/           # Entity management
    topics/             # Topic management
    research/           # Research tools
    briefs/             # Content briefs / calendar
    content/            # Content studio
    approvals/          # Approval queue
    publish/            # Publish center
    reports/            # Reports
    monitoring/         # Monitoring
    compliance/         # Compliance review
    channels/           # Channel management
    jobs/               # Job queue UI
    audit-logs/         # Audit trail
    settings/           # Workspace settings
  api/                  # API routes

components/             # React components
  ui/                   # Base UI components (Button, Card, etc.)
  dashboard/            # Dashboard-specific components
  layout/               # App shell, sidebar, header
  tables/               # Data table components
  forms/                # Form components
  charts/               # Chart components

lib/                    # Shared libraries
  ai/                   # AI provider abstraction
  db/                   # Prisma client
  jobs/                 # BullMQ queue
  utils/                # Utilities

server/                 # Server-side code
  agents/               # AI Agent implementations
  services/             # Business logic services
  repositories/         # Data access layer
  workflows/            # Multi-agent workflows

workers/                # Background job workers
prisma/                 # Database schema & seeds
types/                  # TypeScript type definitions
```

## Core Loop

PresenceVision は24時間稼働するコアループで動作します:

```
Trend Analysis → Topic Discovery → Content Planning → Content Generation
→ Review → Approval → Publish → Monitor → Report → Strategy Update → Loop
```

## Ethics & Principles

1. スパムは禁止
2. bot規制回避は禁止
3. 不正クリック生成は禁止
4. 不正レビューは禁止
5. 規約違反投稿は禁止
6. 高品質コンテンツのみ生成
7. 一次情報を重視
8. LLMが引用しやすい構造を作る
9. 自社メディア中心
10. 外部コミュニティ投稿は基本ドラフト生成のみ

## Mission

**Make digital presence autonomous.**

## License

Private — All rights reserved.
