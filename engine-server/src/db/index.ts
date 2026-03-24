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

export async function closeDB(): Promise<void> {
  if (pool) { await pool.end(); pool = null; }
}
