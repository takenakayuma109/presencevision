/**
 * Frontend Sync — エンジンの成果をフロントエンド(Neon DB)に同期
 *
 * エンジンはVPSローカルDBにデータを保存するが、
 * ダッシュボード表示はNeon DBを参照するため、
 * フロントエンドAPIを呼んで同期する必要がある。
 */

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

interface SyncResult {
  topics: number;
  content: number;
  errors: string[];
}

/** フロントエンドAPIにPOST */
async function postToFrontend(
  path: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    const res = await fetch(`${FRONTEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      // 重複エラーは無視（既に同期済み）
      if (res.status === 409 || text.includes("Unique constraint")) {
        return true;
      }
      console.warn(`[Sync] POST ${path} failed (${res.status}): ${text}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[Sync] POST ${path} error:`, error);
    return false;
  }
}

/** 既存トピックを取得 */
async function getExistingTopics(projectId: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${FRONTEND_URL}/api/topics?projectId=${projectId}`,
    );
    if (!res.ok) return [];
    const topics = (await res.json()) as Array<{ title: string }>;
    return topics.map((t) => t.title);
  } catch {
    return [];
  }
}

/** キーワードをTopicとしてNeonに同期（重複スキップ） */
async function syncTopics(
  projectId: string,
  keywords: string[],
): Promise<number> {
  const existing = await getExistingTopics(projectId);
  const newKeywords = keywords.filter((k) => !existing.includes(k));

  if (newKeywords.length === 0) {
    console.log(`[Sync] All ${keywords.length} topics already synced`);
    return keywords.length;
  }

  let synced = existing.length;
  for (const keyword of newKeywords) {
    const ok = await postToFrontend("/api/topics", {
      projectId,
      title: keyword,
      intent: "informational",
      priority: 5,
    });
    if (ok) synced++;
  }
  return synced;
}

/** 既存コンテンツタイトルを取得 */
async function getExistingContent(projectId: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${FRONTEND_URL}/api/content?projectId=${projectId}`,
    );
    if (!res.ok) return [];
    const assets = (await res.json()) as Array<{ title: string }>;
    return assets.map((a) => a.title);
  } catch {
    return [];
  }
}

/** 生成コンテンツをContentAssetとしてNeonに同期（重複スキップ） */
async function syncContent(
  projectId: string,
  content: Array<{
    type: string;
    title: string;
    language: string;
  }>,
): Promise<number> {
  const existingTitles = await getExistingContent(projectId);
  const newContent = content.filter((c) => !existingTitles.includes(c.title));

  if (newContent.length === 0) {
    console.log(`[Sync] All ${content.length} content items already synced`);
    return content.length;
  }

  let synced = existingTitles.length;

  // Prisma AssetType enum: ARTICLE, FAQ, GLOSSARY, LANDING, COMPARISON, KNOWLEDGE
  const typeMap: Record<string, string> = {
    article: "ARTICLE",
    faq: "FAQ",
    schema: "KNOWLEDGE",
    meta_tags: "LANDING",
    multilingual: "ARTICLE",
  };

  for (const item of newContent) {
    const slug = item.title
      .toLowerCase()
      .replace(/[^a-z0-9\u3000-\u9fff\uff00-\uffef]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

    const ok = await postToFrontend("/api/content", {
      projectId,
      title: item.title,
      type: typeMap[item.type] ?? "blog_post",
      slug,
      locale: item.language,
    });
    if (ok) synced++;
  }
  return synced;
}

/**
 * サイクル完了後にフロントエンドDBへ同期
 */
export async function syncCycleToFrontend(params: {
  projectId: string;
  keywords: string[];
  contentGenerated: Array<{
    type: string;
    title: string;
    language: string;
  }>;
}): Promise<SyncResult> {
  const errors: string[] = [];

  console.log(`[Sync] Starting frontend sync for project ${params.projectId}...`);

  // Topics同期
  const topicsSynced = await syncTopics(params.projectId, params.keywords);
  if (topicsSynced < params.keywords.length) {
    errors.push(`Topics: ${topicsSynced}/${params.keywords.length} synced`);
  }

  // Content同期
  const contentSynced = await syncContent(
    params.projectId,
    params.contentGenerated,
  );
  if (contentSynced < params.contentGenerated.length) {
    errors.push(
      `Content: ${contentSynced}/${params.contentGenerated.length} synced`,
    );
  }

  console.log(
    `[Sync] Frontend sync complete: ${topicsSynced} topics, ${contentSynced} content${errors.length > 0 ? ` (${errors.join(", ")})` : ""}`,
  );

  return {
    topics: topicsSynced,
    content: contentSynced,
    errors,
  };
}
