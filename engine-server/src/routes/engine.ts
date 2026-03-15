/**
 * Engine Control Routes — プロジェクトの開始・停止・手動サイクル実行
 */

import { Router, type Request, type Response } from "express";
import {
  startProject,
  stopProject,
  runSingleCycle,
  getActiveProjects,
  isProjectRunning,
  type PresenceProject,
} from "../engine/presence-engine.js";
import {
  verifyWordPressConnection,
  type CmsConfig,
} from "../engine/tasks/cms-publisher.js";

const router = Router();

/**
 * POST /engine/start — プロジェクトを開始
 */
router.post("/start", (req: Request, res: Response) => {
  try {
    const project = req.body as PresenceProject;

    if (!project.id || !project.name || !project.targetUrl) {
      res.status(400).json({
        error: "Missing required fields: id, name, targetUrl",
      });
      return;
    }

    if (isProjectRunning(project.id)) {
      res.status(409).json({
        error: `Project "${project.name}" is already running`,
      });
      return;
    }

    // Ensure defaults
    const fullProject: PresenceProject = {
      id: project.id,
      name: project.name,
      targetUrl: project.targetUrl,
      brandName: project.brandName || project.name,
      keywords: project.keywords || [],
      targetCountries: project.targetCountries || ["JP"],
      methods: project.methods || ["SEO"],
      status: "active",
      createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
      cmsConfig: project.cmsConfig,
    };

    startProject(fullProject);

    res.json({
      message: `Project "${fullProject.name}" started`,
      project: fullProject,
    });
  } catch (error) {
    console.error("[Route] /engine/start error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * POST /engine/test-cms — WordPress接続テスト
 */
router.post("/test-cms", async (req: Request, res: Response) => {
  try {
    const cmsConfig = req.body as CmsConfig;

    if (!cmsConfig.siteUrl || !cmsConfig.username || !cmsConfig.applicationPassword) {
      res.status(400).json({
        error: "Missing required fields: siteUrl, username, applicationPassword",
      });
      return;
    }

    const result = await verifyWordPressConnection(cmsConfig);
    res.json(result);
  } catch (error) {
    console.error("[Route] /engine/test-cms error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * POST /engine/stop — プロジェクトを停止
 */
router.post("/stop", (req: Request, res: Response) => {
  try {
    const { projectId } = req.body as { projectId: string };

    if (!projectId) {
      res.status(400).json({ error: "Missing required field: projectId" });
      return;
    }

    if (!isProjectRunning(projectId)) {
      res.status(404).json({ error: `Project "${projectId}" is not running` });
      return;
    }

    stopProject(projectId);

    res.json({ message: `Project "${projectId}" stopped` });
  } catch (error) {
    console.error("[Route] /engine/stop error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * POST /engine/run-cycle — 手動で1サイクル実行
 */
router.post("/run-cycle", async (req: Request, res: Response) => {
  try {
    const project = req.body as PresenceProject;

    if (!project.id || !project.name || !project.targetUrl) {
      res.status(400).json({
        error: "Missing required fields: id, name, targetUrl",
      });
      return;
    }

    const fullProject: PresenceProject = {
      id: project.id,
      name: project.name,
      targetUrl: project.targetUrl,
      brandName: project.brandName || project.name,
      keywords: project.keywords || [],
      targetCountries: project.targetCountries || ["JP"],
      methods: project.methods || ["SEO"],
      status: "active",
      createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
      cmsConfig: project.cmsConfig,
    };

    // Run cycle asynchronously and return immediately
    res.json({
      message: `Cycle started for project "${fullProject.name}"`,
      note: "Cycle is running in the background. Check /activities for progress.",
    });

    // Don't await — let it run in background
    runSingleCycle(fullProject).catch((err) => {
      console.error(`[Route] run-cycle failed for "${fullProject.name}":`, err);
    });
  } catch (error) {
    console.error("[Route] /engine/run-cycle error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * GET /engine/status — 稼働中プロジェクト一覧
 */
router.get("/status", (_req: Request, res: Response) => {
  try {
    const projects = getActiveProjects();
    res.json({
      activeProjects: projects.length,
      projects,
    });
  } catch (error) {
    console.error("[Route] /engine/status error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
