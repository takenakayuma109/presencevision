import pg from "pg";

let pool: pg.Pool | null = null;

export function getDB(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL || "postgresql://presencevision:presencevision@localhost:5432/presencevision",
      max: 10,
    });
  }
  return pool;
}

export async function initDB(): Promise<void> {
  const db = getDB();
  await db.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      country TEXT NOT NULL,
      language TEXT NOT NULL,
      method TEXT NOT NULL,
      description TEXT NOT NULL,
      details JSONB,
      artifacts JSONB DEFAULT '[]',
      metrics JSONB,
      error TEXT,
      started_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ,
      duration_ms INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
    CREATE INDEX IF NOT EXISTS idx_activities_project_status ON activities(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_activities_started ON activities(started_at DESC);

    CREATE TABLE IF NOT EXISTS published_articles (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      meta_title TEXT,
      meta_description TEXT,
      keyword TEXT,
      language TEXT NOT NULL DEFAULT 'ja',
      country TEXT NOT NULL DEFAULT 'JP',
      brand_name TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_articles_project ON published_articles(project_id);
    CREATE INDEX IF NOT EXISTS idx_articles_slug ON published_articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON published_articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON published_articles(status);

    CREATE TABLE IF NOT EXISTS engine_projects (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("[DB] Schema initialized");
}

/** プロジェクトをDBに保存（startProject時に呼ぶ） */
export async function saveProject(id: string, data: Record<string, unknown>): Promise<void> {
  const db = getDB();
  await db.query(
    `INSERT INTO engine_projects (id, data, status, started_at, updated_at)
     VALUES ($1, $2, 'active', NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET data = $2, status = 'active', updated_at = NOW()`,
    [id, JSON.stringify(data)],
  );
}

/** プロジェクトをDBから削除（stopProject時に呼ぶ） */
export async function removeProject(id: string): Promise<void> {
  const db = getDB();
  await db.query(`UPDATE engine_projects SET status = 'stopped', updated_at = NOW() WHERE id = $1`, [id]);
}

/** 稼働中プロジェクトをDBから取得（起動時復帰用） */
export async function getActiveProjectsFromDB(): Promise<Record<string, unknown>[]> {
  const db = getDB();
  const result = await db.query(`SELECT data FROM engine_projects WHERE status = 'active'`);
  return result.rows.map((r: { data: Record<string, unknown> }) => r.data);
}

// ---------------------------------------------------------------------------
// Published Articles
// ---------------------------------------------------------------------------

export interface PublishedArticle {
  id: string;
  project_id: string;
  slug: string;
  title: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  keyword: string | null;
  language: string;
  country: string;
  brand_name: string | null;
  status: string;
  published_at: string;
  updated_at: string;
}

function generateSlug(title: string, language: string): string {
  if (language === "ja" || language === "ko" || language === "zh") {
    // For CJK, use timestamp + random
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `article-${Date.now()}`;
}

export async function saveArticle(article: {
  id: string;
  projectId: string;
  title: string;
  body: string;
  metaTitle?: string;
  metaDescription?: string;
  keyword?: string;
  language: string;
  country: string;
  brandName?: string;
}): Promise<PublishedArticle> {
  const db = getDB();
  const slug = generateSlug(article.title, article.language);
  const result = await db.query(
    `INSERT INTO published_articles (id, project_id, slug, title, body, meta_title, meta_description, keyword, language, country, brand_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET title = $4, body = $5, meta_title = $6, meta_description = $7, updated_at = NOW()
     RETURNING *`,
    [article.id, article.projectId, slug, article.title, article.body,
     article.metaTitle ?? null, article.metaDescription ?? null,
     article.keyword ?? null, article.language, article.country,
     article.brandName ?? null],
  );
  return result.rows[0];
}

export async function getArticles(options?: {
  projectId?: string;
  language?: string;
  limit?: number;
  offset?: number;
}): Promise<{ articles: PublishedArticle[]; total: number }> {
  const db = getDB();
  const conditions: string[] = ["status = 'published'"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (options?.projectId) {
    conditions.push(`project_id = $${paramIdx++}`);
    params.push(options.projectId);
  }
  if (options?.language) {
    conditions.push(`language = $${paramIdx++}`);
    params.push(options.language);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const countResult = await db.query(`SELECT COUNT(*) FROM published_articles ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const result = await db.query(
    `SELECT * FROM published_articles ${where} ORDER BY published_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset],
  );

  return { articles: result.rows, total };
}

export async function getArticleBySlug(slug: string): Promise<PublishedArticle | null> {
  const db = getDB();
  const result = await db.query(
    `SELECT * FROM published_articles WHERE slug = $1 AND status = 'published'`,
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function closeDB(): Promise<void> {
  if (pool) { await pool.end(); pool = null; }
}
