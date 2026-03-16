// ---------------------------------------------------------------------------
// Email Templates — HTML with inline styles (blue/violet theme)
// ---------------------------------------------------------------------------

const BRAND_COLOR = "#6D28D9";
const BRAND_COLOR_LIGHT = "#8B5CF6";
const BRAND_COLOR_BG = "#F5F3FF";
const TEXT_COLOR = "#1F2937";
const TEXT_MUTED = "#6B7280";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://presencevision.com";

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:'Helvetica Neue',Arial,'Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif;color:${TEXT_COLOR};line-height:1.7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLOR},${BRAND_COLOR_LIGHT});padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:0.5px;">PresenceVision</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:${BRAND_COLOR_BG};text-align:center;font-size:12px;color:${TEXT_MUTED};">
              <p style="margin:0 0 8px;">&copy; ${new Date().getFullYear()} PresenceVision Inc.</p>
              <p style="margin:0;">
                <a href="${BASE_URL}/settings/notifications" style="color:${BRAND_COLOR};text-decoration:underline;">通知設定を変更</a>
                &nbsp;|&nbsp;
                <a href="${BASE_URL}/unsubscribe" style="color:${BRAND_COLOR};text-decoration:underline;">配信停止</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
  <tr>
    <td style="background-color:${BRAND_COLOR};border-radius:8px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT_COLOR};">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:${TEXT_COLOR};">${text}</p>`;
}

function muted(text: string): string {
  return `<p style="margin:0 0 16px;font-size:13px;color:${TEXT_MUTED};">${text}</p>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function welcome(userName: string): { subject: string; html: string } {
  return {
    subject: "PresenceVisionへようこそ！",
    html: layout(`
      ${heading(`${userName}さん、ようこそ！`)}
      ${paragraph("PresenceVisionにご登録いただきありがとうございます。AI時代のSEO・LLMプレゼンスを自動最適化する旅が始まります。")}
      ${heading("クイックスタート 3ステップ")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        <tr>
          <td style="padding:12px 16px;background-color:${BRAND_COLOR_BG};border-radius:8px;margin-bottom:8px;">
            <p style="margin:0;font-size:15px;"><strong style="color:${BRAND_COLOR};">1.</strong> プロジェクトを作成し、対象ドメインを登録</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:12px 16px;background-color:${BRAND_COLOR_BG};border-radius:8px;">
            <p style="margin:0;font-size:15px;"><strong style="color:${BRAND_COLOR};">2.</strong> Entityを設定して、ブランド情報を入力</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:12px 16px;background-color:${BRAND_COLOR_BG};border-radius:8px;">
            <p style="margin:0;font-size:15px;"><strong style="color:${BRAND_COLOR};">3.</strong> 自動生成されるコンテンツを確認・配信</p>
          </td>
        </tr>
      </table>
      ${ctaButton("ダッシュボードへ", `${BASE_URL}/dashboard`)}
      ${muted("ご不明な点がございましたら、お気軽にサポートまでお問い合わせください。")}
    `),
  };
}

export function trialStarted(
  userName: string,
  trialEndDate: Date,
): { subject: string; html: string } {
  const endDateStr = trialEndDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    subject: "7日間無料トライアルが開始されました",
    html: layout(`
      ${heading(`${userName}さん、トライアルが開始されました！`)}
      ${paragraph(`無料トライアル期間は <strong>${endDateStr}</strong> までです。すべての機能を制限なくお試しいただけます。`)}
      ${heading("トライアル期間中にできること")}
      <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:${TEXT_COLOR};">
        <li style="margin-bottom:8px;">AI自動コンテンツ生成（無制限）</li>
        <li style="margin-bottom:8px;">マルチチャネル配信</li>
        <li style="margin-bottom:8px;">SERP・AIサイテーション モニタリング</li>
        <li style="margin-bottom:8px;">Entity最適化・Trust Score分析</li>
        <li style="margin-bottom:8px;">週次レポート</li>
      </ul>
      ${ctaButton("最初のプロジェクトを設定", `${BASE_URL}/dashboard/projects/new`)}
      ${muted(`トライアル期間終了後、自動的に有料プランへ移行します。不要な場合は${endDateStr}までにキャンセルしてください。`)}
    `),
  };
}

export function trialEnding(
  userName: string,
  daysLeft: number,
): { subject: string; html: string } {
  return {
    subject: `無料トライアルが残り${daysLeft}日です`,
    html: layout(`
      ${heading(`${userName}さん、トライアル終了まであと${daysLeft}日です`)}
      ${paragraph("トライアル期間を引き続きお楽しみいただけていますでしょうか？期間終了前にプランをご確認ください。")}
      ${heading("プラン比較ハイライト")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
        <tr style="background-color:${BRAND_COLOR_BG};">
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${BRAND_COLOR};border-bottom:1px solid #E5E7EB;">機能</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${BRAND_COLOR};border-bottom:1px solid #E5E7EB;text-align:center;">Starter</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${BRAND_COLOR};border-bottom:1px solid #E5E7EB;text-align:center;">Professional</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:13px;border-bottom:1px solid #E5E7EB;">月間記事生成</td>
          <td style="padding:10px 16px;font-size:13px;text-align:center;border-bottom:1px solid #E5E7EB;">30本</td>
          <td style="padding:10px 16px;font-size:13px;text-align:center;border-bottom:1px solid #E5E7EB;">無制限</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:13px;border-bottom:1px solid #E5E7EB;">配信チャネル</td>
          <td style="padding:10px 16px;font-size:13px;text-align:center;border-bottom:1px solid #E5E7EB;">3</td>
          <td style="padding:10px 16px;font-size:13px;text-align:center;border-bottom:1px solid #E5E7EB;">無制限</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:13px;">AI Boost</td>
          <td style="padding:10px 16px;font-size:13px;text-align:center;">—</td>
          <td style="padding:10px 16px;font-size:13px;text-align:center;">✓</td>
        </tr>
      </table>
      ${ctaButton("料金プランを見る", `${BASE_URL}/pricing`)}
      ${muted("ご質問がございましたら、サポートチームまでお気軽にお問い合わせください。")}
    `),
  };
}

export interface WeeklyStats {
  projectName: string;
  articlesGenerated: number;
  channelsDistributed: number;
  serpChanges: number;
  aiCitations: number;
  topContent: { title: string; views: number }[];
}

export function weeklyReport(
  userName: string,
  stats: WeeklyStats,
): { subject: string; html: string } {
  const topContentRows = stats.topContent
    .map(
      (c) => `
      <tr>
        <td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #E5E7EB;">${c.title}</td>
        <td style="padding:8px 16px;font-size:13px;text-align:right;border-bottom:1px solid #E5E7EB;">${c.views.toLocaleString()}views</td>
      </tr>`,
    )
    .join("");

  return {
    subject: `週次レポート: ${stats.projectName}`,
    html: layout(`
      ${heading(`${userName}さん、今週のレポートです`)}
      ${paragraph(`プロジェクト「<strong>${stats.projectName}</strong>」の週次パフォーマンスをお届けします。`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:16px;text-align:center;background-color:${BRAND_COLOR_BG};border-radius:8px;width:25%;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND_COLOR};">${stats.articlesGenerated}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${TEXT_MUTED};">記事生成</p>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:16px;text-align:center;background-color:${BRAND_COLOR_BG};border-radius:8px;width:25%;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND_COLOR};">${stats.channelsDistributed}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${TEXT_MUTED};">配信先</p>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:16px;text-align:center;background-color:${BRAND_COLOR_BG};border-radius:8px;width:25%;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND_COLOR};">${stats.serpChanges >= 0 ? "+" : ""}${stats.serpChanges}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${TEXT_MUTED};">SERP変動</p>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:16px;text-align:center;background-color:${BRAND_COLOR_BG};border-radius:8px;width:25%;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND_COLOR};">${stats.aiCitations}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${TEXT_MUTED};">AI引用</p>
          </td>
        </tr>
      </table>
      ${stats.topContent.length > 0 ? `${heading("トップコンテンツ")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
        <tr style="background-color:${BRAND_COLOR_BG};">
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${BRAND_COLOR};border-bottom:1px solid #E5E7EB;">タイトル</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${BRAND_COLOR};text-align:right;border-bottom:1px solid #E5E7EB;">閲覧数</td>
        </tr>
        ${topContentRows}
      </table>` : ""}
      ${ctaButton("ダッシュボードで詳細を確認", `${BASE_URL}/dashboard`)}
    `),
  };
}

export function entityVerified(
  userName: string,
  projectName: string,
): { subject: string; html: string } {
  return {
    subject: "Entity審査が承認されました",
    html: layout(`
      ${heading("おめでとうございます！")}
      ${paragraph(`${userName}さん、プロジェクト「<strong>${projectName}</strong>」のEntity審査が<strong style="color:#059669;">承認</strong>されました。`)}
      ${heading("次のステップ")}
      <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:${TEXT_COLOR};">
        <li style="margin-bottom:8px;">Entity情報が検索エンジンとAIに反映されます</li>
        <li style="margin-bottom:8px;">Trust Scoreが向上し、コンテンツの信頼性が高まります</li>
        <li style="margin-bottom:8px;">AI Boostの対象としてエンティティが登録されます</li>
      </ul>
      ${ctaButton("プロジェクトを確認", `${BASE_URL}/dashboard/projects`)}
    `),
  };
}

export function entityRejected(
  userName: string,
  projectName: string,
  reason: string,
): { subject: string; html: string } {
  return {
    subject: "Entity審査について",
    html: layout(`
      ${heading("Entity審査結果のお知らせ")}
      ${paragraph(`${userName}さん、プロジェクト「<strong>${projectName}</strong>」のEntity審査について、以下の理由により承認されませんでした。`)}
      <div style="padding:16px;background-color:#FEF2F2;border-left:4px solid #EF4444;border-radius:4px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#991B1B;">${reason}</p>
      </div>
      ${heading("再申請の手順")}
      <ol style="margin:0 0 16px;padding-left:20px;font-size:15px;color:${TEXT_COLOR};">
        <li style="margin-bottom:8px;">上記の指摘事項を修正してください</li>
        <li style="margin-bottom:8px;">プロジェクト設定からEntity情報を更新</li>
        <li style="margin-bottom:8px;">「再審査をリクエスト」ボタンから再申請</li>
      </ol>
      ${ctaButton("Entity情報を編集", `${BASE_URL}/dashboard/projects`)}
      ${muted("ご不明な点がございましたら、support@presencevision.com までお問い合わせください。")}
    `),
  };
}
