/**
 * Browser Pool — Playwright ブラウザインスタンス管理
 *
 * bot対策回避のためのフィンガープリント制御、
 * プロキシローテーション、同時実行数制御を行う。
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

interface BrowserPoolOptions {
  maxConcurrency: number;
  headless: boolean;
}

interface ContextOptions {
  locale?: string;
  country?: string;
  proxy?: string;
  userAgent?: string;
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
    };
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: this.options.headless,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-features=IsolateOrigins,site-per-process",
          "--no-sandbox",
        ],
      });
    }
    return this.browser;
  }

  async createContext(options?: ContextOptions): Promise<BrowserContext> {
    if (this.activeContexts >= this.options.maxConcurrency) {
      throw new Error(`Max concurrency reached (${this.options.maxConcurrency})`);
    }

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

    this.activeContexts++;
    return context;
  }

  async withPage<T>(
    fn: (page: Page) => Promise<T>,
    options?: ContextOptions,
  ): Promise<T> {
    const context = await this.createContext(options);
    const page = await context.newPage();

    try {
      return await fn(page);
    } finally {
      await context.close();
      this.activeContexts--;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.activeContexts = 0;
    }
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
    });
  }
  return poolInstance;
}
