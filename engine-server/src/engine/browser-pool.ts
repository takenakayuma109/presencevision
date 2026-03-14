/**
 * Browser Pool — Playwright ブラウザインスタンス管理
 *
 * bot対策回避のためのフィンガープリント制御、
 * プロキシローテーション、同時実行数制御を行う。
 *
 * 再接続・リトライロジック付き。長時間稼働でブラウザプロセスが
 * クラッシュ/切断されても自動復旧する。
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

interface BrowserPoolOptions {
  maxConcurrency: number;
  headless: boolean;
  pageTimeout: number;
}

interface ContextOptions {
  locale?: string;
  country?: string;
  proxy?: string;
  userAgent?: string;
}

// ブラウザ関連エラーかどうか判定
const BROWSER_ERROR_PATTERNS = [
  "Target closed",
  "target closed",
  "browser has been closed",
  "Browser closed",
  "Browser has been closed",
  "Protocol error",
  "Connection closed",
  "Session closed",
  "Execution context was destroyed",
  "Page closed",
  "page has been closed",
  "Navigation failed because page was closed",
  "net::ERR_CONNECTION_REFUSED",
  "Target page, context or browser has been closed",
];

function isBrowserError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return BROWSER_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

// ランダムユーザーエージェント
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

// 国コード → タイムゾーン・ロケール
const COUNTRY_CONFIG: Record<string, { timezone: string; locale: string }> = {
  JP: { timezone: "Asia/Tokyo", locale: "ja-JP" },
  US: { timezone: "America/New_York", locale: "en-US" },
  GB: { timezone: "Europe/London", locale: "en-GB" },
  DE: { timezone: "Europe/Berlin", locale: "de-DE" },
  FR: { timezone: "Europe/Paris", locale: "fr-FR" },
  KR: { timezone: "Asia/Seoul", locale: "ko-KR" },
  CN: { timezone: "Asia/Shanghai", locale: "zh-CN" },
  TW: { timezone: "Asia/Taipei", locale: "zh-TW" },
  BR: { timezone: "America/Sao_Paulo", locale: "pt-BR" },
  IN: { timezone: "Asia/Kolkata", locale: "hi-IN" },
  AU: { timezone: "Australia/Sydney", locale: "en-AU" },
  CA: { timezone: "America/Toronto", locale: "en-CA" },
  ES: { timezone: "Europe/Madrid", locale: "es-ES" },
  IT: { timezone: "Europe/Rome", locale: "it-IT" },
  NL: { timezone: "Europe/Amsterdam", locale: "nl-NL" },
  SE: { timezone: "Europe/Stockholm", locale: "sv-SE" },
  SG: { timezone: "Asia/Singapore", locale: "en-SG" },
  ID: { timezone: "Asia/Jakarta", locale: "id-ID" },
  TH: { timezone: "Asia/Bangkok", locale: "th-TH" },
  VN: { timezone: "Asia/Ho_Chi_Minh", locale: "vi-VN" },
};

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export class BrowserPool {
  private browser: Browser | null = null;
  private activeContexts = 0;
  private options: BrowserPoolOptions;

  constructor(options?: Partial<BrowserPoolOptions>) {
    this.options = {
      maxConcurrency: options?.maxConcurrency ?? 5,
      headless: options?.headless ?? true,
      pageTimeout: options?.pageTimeout ?? 60_000,
    };
  }

  private async launchBrowser(): Promise<Browser> {
    console.log("[BrowserPool] Launching new browser instance");
    return chromium.launch({
      headless: this.options.headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--no-sandbox",
      ],
    });
  }

  private async closeBrowserSafe(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Browser may already be dead — ignore
      }
      this.browser = null;
    }
  }

  /**
   * ブラウザを取得。接続が切れていたら再起動する。
   * newPage() で実際に接続テストも行う。
   */
  async getBrowser(): Promise<Browser> {
    // 1. インスタンスがない or 切断済み → 新規起動
    if (!this.browser || !this.browser.isConnected()) {
      console.log("[BrowserPool] Browser missing or disconnected, creating new instance");
      await this.closeBrowserSafe();
      this.browser = await this.launchBrowser();
    }

    // 2. 接続テスト — newPage() してすぐ閉じる
    try {
      const testPage = await this.browser.newPage();
      await testPage.close();
    } catch (error) {
      console.warn("[BrowserPool] Browser connectivity test failed, recreating:", error);
      await this.closeBrowserSafe();
      this.browser = await this.launchBrowser();
    }

    return this.browser;
  }

  /**
   * コンテキスト作成。失敗時に1回だけリトライ（ブラウザ再起動込み）。
   */
  async createContext(options?: ContextOptions): Promise<BrowserContext> {
    if (this.activeContexts >= this.options.maxConcurrency) {
      throw new Error(`Max concurrency reached (${this.options.maxConcurrency})`);
    }

    const createOnce = async (): Promise<BrowserContext> => {
      const browser = await this.getBrowser();
      const countryConfig = options?.country
        ? COUNTRY_CONFIG[options.country]
        : undefined;

      const context = await browser.newContext({
        userAgent: options?.userAgent ?? randomUserAgent(),
        locale: options?.locale ?? countryConfig?.locale ?? "en-US",
        timezoneId: countryConfig?.timezone ?? "UTC",
        viewport: { width: 1920, height: 1080 },
        ...(options?.proxy ? { proxy: { server: options.proxy } } : {}),
        // bot対策: WebDriver検出回避
        javaScriptEnabled: true,
      });

      // WebDriver検出回避スクリプト
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        // @ts-expect-error -- chrome stub for bot detection
        window.chrome = { runtime: {} };
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });
      });

      return context;
    };

    try {
      const context = await createOnce();
      this.activeContexts++;
      return context;
    } catch (error) {
      console.warn("[BrowserPool] Context creation failed, retrying with fresh browser:", error);
      // ブラウザ再起動してリトライ1回
      await this.closeBrowserSafe();
      try {
        const context = await createOnce();
        this.activeContexts++;
        return context;
      } catch (retryError) {
        // リトライも失敗 — activeContexts は増やさない
        throw retryError;
      }
    }
  }

  /**
   * ページを使って処理を実行。ブラウザ系エラーなら1回リトライ。
   * ページにはデフォルトタイムアウトを設定する。
   */
  async withPage<T>(
    fn: (page: Page) => Promise<T>,
    options?: ContextOptions,
  ): Promise<T> {
    const attempt = async (): Promise<T> => {
      const context = await this.createContext(options);
      let page: Page | null = null;
      try {
        page = await context.newPage();
        page.setDefaultTimeout(this.options.pageTimeout);
        page.setDefaultNavigationTimeout(this.options.pageTimeout);
        return await fn(page);
      } finally {
        try {
          await context.close();
        } catch {
          // context may already be dead
        }
        this.activeContexts = Math.max(0, this.activeContexts - 1);
      }
    };

    // 1st attempt
    try {
      return await attempt();
    } catch (error) {
      if (!isBrowserError(error)) {
        throw error; // ブラウザ系でなければそのまま投げる
      }

      console.warn("[BrowserPool] Browser error in withPage, resetting browser and retrying:", error);
      await this.closeBrowserSafe();
      this.browser = await this.launchBrowser();

      // 2nd attempt — これで失敗したらそのまま throw
      return await attempt();
    }
  }

  /**
   * ブラウザを強制リセット。サイクル間で呼び出してクリーンな状態にする。
   */
  async resetBrowser(): Promise<void> {
    console.log("[BrowserPool] Resetting browser (force close + relaunch)");
    await this.closeBrowserSafe();
    this.activeContexts = 0;
    // 次の getBrowser() で遅延起動される（事前起動はしない）
  }

  async close(): Promise<void> {
    console.log("[BrowserPool] Closing browser pool");
    await this.closeBrowserSafe();
    this.activeContexts = 0;
  }

  getActiveCount(): number {
    return this.activeContexts;
  }
}

// シングルトン
let poolInstance: BrowserPool | null = null;

export function getBrowserPool(): BrowserPool {
  if (!poolInstance) {
    poolInstance = new BrowserPool({
      maxConcurrency: parseInt(process.env.BROWSER_CONCURRENCY ?? "5"),
      headless: process.env.BROWSER_HEADLESS !== "false",
      pageTimeout: parseInt(process.env.BROWSER_PAGE_TIMEOUT_MS ?? "60000"),
    });
  }
  return poolInstance;
}

/**
 * ブラウザのヘルスチェック。ヘルスエンドポイントから呼び出す。
 */
export function checkBrowserHealth(): { connected: boolean; activeContexts: number } {
  const pool = getBrowserPool();
  // @ts-expect-error -- accessing private for health check
  const browser: Browser | null = pool.browser;
  return {
    connected: browser?.isConnected() ?? false,
    activeContexts: pool.getActiveCount(),
  };
}
