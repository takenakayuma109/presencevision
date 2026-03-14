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
  `);
  console.log("[DB] Schema initialized");
}

export async function closeDB(): Promise<void> {
  if (pool) { await pool.end(); pool = null; }
}
