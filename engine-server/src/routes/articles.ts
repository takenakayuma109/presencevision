/**
 * Articles API — 公開記事のエンドポイント（認証不要）
 *
 * Hub & Spoke の「Hub」として、生成されたSEO記事を配信する。
 */

import { Router } from "express";
import { getArticles, getArticleBySlug } from "../db/index.js";

const router = Router();

/**
 * GET /articles
 * 公開記事一覧
 */
router.get("/", async (req, res) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const language = req.query.language as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { articles, total } = await getArticles({ projectId, language, limit, offset });

    res.json({
      articles,
      total,
      limit,
      offset,
      hasMore: offset + articles.length < total,
    });
  } catch (error) {
    console.error("[Articles] Failed to fetch articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

/**
 * GET /articles/:slug
 * 個別記事
 */
router.get("/:slug", async (req, res) => {
  try {
    const article = await getArticleBySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(article);
  } catch (error) {
    console.error("[Articles] Failed to fetch article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

export default router;
