/**
 * Distribution Scheduler
 *
 * 投稿スケジュール管理。チャネルごとのレートリミットと
 * アクティブ時間帯に基づいて最適な投稿時刻を割り当てる。
 */

import type { SpokePost } from "./hub-spoke";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostingRule {
  channel: string;
  maxPerDay: number;
  activeHoursStart: number; // 0-23
  activeHoursEnd: number; // 0-23
  timezone: string;
  minIntervalMinutes: number; // Minimum time between posts
}

export interface ScheduledPost {
  spokeId: string;
  articleId: string;
  channel: string;
  projectId?: string;
  scheduledAt: string; // ISO 8601 datetime
  content: string;
  status: "scheduled" | "publishing" | "published" | "failed";
  publishedAt?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// In-memory storage
// ---------------------------------------------------------------------------

const scheduledPosts: Map<string, ScheduledPost> = new Map();

/** Track when the last post was made on each channel */
const lastPostTimes: Map<string, Date> = new Map();

/** Track how many posts have been made today per channel */
const dailyPostCounts: Map<string, { date: string; count: number }> = new Map();

// ---------------------------------------------------------------------------
// Default posting rules
// ---------------------------------------------------------------------------

export function getDefaultPostingRules(): PostingRule[] {
  return [
    { channel: "twitter", maxPerDay: 5, activeHoursStart: 8, activeHoursEnd: 22, timezone: "UTC", minIntervalMinutes: 60 },
    { channel: "linkedin", maxPerDay: 2, activeHoursStart: 8, activeHoursEnd: 18, timezone: "UTC", minIntervalMinutes: 240 },
    { channel: "instagram", maxPerDay: 3, activeHoursStart: 9, activeHoursEnd: 21, timezone: "UTC", minIntervalMinutes: 120 },
    { channel: "facebook", maxPerDay: 3, activeHoursStart: 9, activeHoursEnd: 21, timezone: "UTC", minIntervalMinutes: 120 },
    { channel: "medium", maxPerDay: 1, activeHoursStart: 9, activeHoursEnd: 17, timezone: "UTC", minIntervalMinutes: 1440 },
    { channel: "note", maxPerDay: 1, activeHoursStart: 9, activeHoursEnd: 21, timezone: "Asia/Tokyo", minIntervalMinutes: 1440 },
    { channel: "devto", maxPerDay: 1, activeHoursStart: 9, activeHoursEnd: 17, timezone: "UTC", minIntervalMinutes: 1440 },
    { channel: "qiita", maxPerDay: 1, activeHoursStart: 9, activeHoursEnd: 21, timezone: "Asia/Tokyo", minIntervalMinutes: 1440 },
    { channel: "reddit", maxPerDay: 2, activeHoursStart: 9, activeHoursEnd: 23, timezone: "US/Eastern", minIntervalMinutes: 360 },
    { channel: "quora", maxPerDay: 2, activeHoursStart: 9, activeHoursEnd: 21, timezone: "UTC", minIntervalMinutes: 360 },
    { channel: "pinterest", maxPerDay: 5, activeHoursStart: 8, activeHoursEnd: 23, timezone: "UTC", minIntervalMinutes: 60 },
    { channel: "tiktok", maxPerDay: 2, activeHoursStart: 10, activeHoursEnd: 22, timezone: "UTC", minIntervalMinutes: 240 },
    { channel: "youtube", maxPerDay: 1, activeHoursStart: 10, activeHoursEnd: 18, timezone: "UTC", minIntervalMinutes: 1440 },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyCount(channel: string): number {
  const today = getTodayString();
  const entry = dailyPostCounts.get(channel);
  if (!entry || entry.date !== today) {
    return 0;
  }
  return entry.count;
}

function incrementDailyCount(channel: string): void {
  const today = getTodayString();
  const entry = dailyPostCounts.get(channel);
  if (!entry || entry.date !== today) {
    dailyPostCounts.set(channel, { date: today, count: 1 });
  } else {
    entry.count++;
  }
}

function getRuleForChannel(channel: string, rules: PostingRule[]): PostingRule | undefined {
  return rules.find((r) => r.channel === channel);
}

/**
 * Get the current hour in the rule's timezone.
 * Uses a simplified approach: for "Asia/Tokyo" add +9, for "US/Eastern" add -5,
 * otherwise treat as UTC. Full Intl support would be used in production.
 */
function getCurrentHourInTimezone(timezone: string): number {
  const now = new Date();
  let offsetHours = 0;

  if (timezone === "Asia/Tokyo") {
    offsetHours = 9;
  } else if (timezone === "US/Eastern") {
    offsetHours = -5;
  } else if (timezone === "US/Pacific") {
    offsetHours = -8;
  }
  // UTC and others default to 0

  const utcHour = now.getUTCHours();
  const localHour = (utcHour + offsetHours + 24) % 24;
  return localHour;
}

// ---------------------------------------------------------------------------
// Public API: Check if posting is allowed right now
// ---------------------------------------------------------------------------

export function canPostNow(channel: string, rules: PostingRule[]): boolean {
  const rule = getRuleForChannel(channel, rules);
  if (!rule) {
    // No rule defined -- allow by default
    return true;
  }

  // Check daily limit
  const dailyCount = getDailyCount(channel);
  if (dailyCount >= rule.maxPerDay) {
    return false;
  }

  // Check active hours
  const currentHour = getCurrentHourInTimezone(rule.timezone);
  if (rule.activeHoursStart <= rule.activeHoursEnd) {
    // Normal range (e.g. 8-22)
    if (currentHour < rule.activeHoursStart || currentHour >= rule.activeHoursEnd) {
      return false;
    }
  } else {
    // Overnight range (e.g. 22-6)
    if (currentHour >= rule.activeHoursEnd && currentHour < rule.activeHoursStart) {
      return false;
    }
  }

  // Check minimum interval
  const lastPost = lastPostTimes.get(channel);
  if (lastPost) {
    const elapsedMs = Date.now() - lastPost.getTime();
    const minIntervalMs = rule.minIntervalMinutes * 60 * 1000;
    if (elapsedMs < minIntervalMs) {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Public API: Get the next available posting time
// ---------------------------------------------------------------------------

export function getNextPostTime(channel: string, rules: PostingRule[]): Date {
  const rule = getRuleForChannel(channel, rules);
  if (!rule) {
    // No rule -- can post immediately
    return new Date();
  }

  const now = new Date();
  let candidate = new Date(now.getTime());

  // If daily limit reached, move to next day
  const dailyCount = getDailyCount(channel);
  if (dailyCount >= rule.maxPerDay) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
    candidate.setUTCHours(rule.activeHoursStart, 0, 0, 0);
    return candidate;
  }

  // If minimum interval hasn't passed, wait for it
  const lastPost = lastPostTimes.get(channel);
  if (lastPost) {
    const nextAfterInterval = new Date(
      lastPost.getTime() + rule.minIntervalMinutes * 60 * 1000,
    );
    if (nextAfterInterval > candidate) {
      candidate = nextAfterInterval;
    }
  }

  // If outside active hours, move to next active window
  const currentHour = candidate.getUTCHours();
  if (rule.activeHoursStart <= rule.activeHoursEnd) {
    if (currentHour < rule.activeHoursStart) {
      candidate.setUTCHours(rule.activeHoursStart, 0, 0, 0);
    } else if (currentHour >= rule.activeHoursEnd) {
      candidate.setUTCDate(candidate.getUTCDate() + 1);
      candidate.setUTCHours(rule.activeHoursStart, 0, 0, 0);
    }
  }

  return candidate;
}

// ---------------------------------------------------------------------------
// Public API: Assign posting times to spoke posts
// ---------------------------------------------------------------------------

export function scheduleDistribution(
  spokes: SpokePost[],
  rules: PostingRule[],
): ScheduledPost[] {
  const scheduled: ScheduledPost[] = [];

  // Track next available time per channel
  const nextAvailable = new Map<string, Date>();

  for (const spoke of spokes) {
    const rule = getRuleForChannel(spoke.channel, rules);

    // Determine the next available time for this channel
    let nextTime: Date;
    const channelNext = nextAvailable.get(spoke.channel);

    if (channelNext) {
      // There's already a post scheduled -- add minimum interval
      const interval = rule ? rule.minIntervalMinutes * 60 * 1000 : 60 * 60 * 1000;
      nextTime = new Date(channelNext.getTime() + interval);
    } else {
      nextTime = getNextPostTime(spoke.channel, rules);
    }

    // Ensure we're within active hours
    if (rule) {
      const hour = nextTime.getUTCHours();
      if (rule.activeHoursStart <= rule.activeHoursEnd) {
        if (hour >= rule.activeHoursEnd) {
          nextTime.setUTCDate(nextTime.getUTCDate() + 1);
          nextTime.setUTCHours(rule.activeHoursStart, 0, 0, 0);
        }
      }
    }

    const scheduledPost: ScheduledPost = {
      spokeId: spoke.id,
      articleId: spoke.articleId,
      channel: spoke.channel,
      scheduledAt: nextTime.toISOString(),
      content: spoke.content,
      status: "scheduled",
    };

    scheduledPosts.set(spoke.id, scheduledPost);
    scheduled.push(scheduledPost);

    // Update next available time for this channel
    nextAvailable.set(spoke.channel, nextTime);
  }

  console.log(
    `[Scheduler] Scheduled ${scheduled.length} posts across ${new Set(spokes.map((s) => s.channel)).size} channels`,
  );

  return scheduled;
}

// ---------------------------------------------------------------------------
// Public API: Get upcoming scheduled posts for a project
// ---------------------------------------------------------------------------

export function getScheduledPosts(projectId: string): ScheduledPost[] {
  const now = new Date().toISOString();
  return Array.from(scheduledPosts.values())
    .filter(
      (post) =>
        (post.projectId === projectId || !post.projectId) &&
        post.status === "scheduled" &&
        post.scheduledAt >= now,
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

// ---------------------------------------------------------------------------
// Public API: Get all scheduled posts (regardless of project)
// ---------------------------------------------------------------------------

export function getAllScheduledPosts(): ScheduledPost[] {
  return Array.from(scheduledPosts.values())
    .filter((post) => post.status === "scheduled")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

// ---------------------------------------------------------------------------
// Public API: Mark a post as published
// ---------------------------------------------------------------------------

export function markPostPublished(spokeId: string): void {
  const post = scheduledPosts.get(spokeId);
  if (post) {
    post.status = "published";
    post.publishedAt = new Date().toISOString();
    lastPostTimes.set(post.channel, new Date());
    incrementDailyCount(post.channel);
  }
}

// ---------------------------------------------------------------------------
// Public API: Mark a post as failed
// ---------------------------------------------------------------------------

export function markPostFailed(spokeId: string, error: string): void {
  const post = scheduledPosts.get(spokeId);
  if (post) {
    post.status = "failed";
    post.error = error;
  }
}

// ---------------------------------------------------------------------------
// Public API: Clear all scheduled posts (for testing)
// ---------------------------------------------------------------------------

export function clearSchedule(): void {
  scheduledPosts.clear();
  lastPostTimes.clear();
  dailyPostCounts.clear();
}
