import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー — PresenceVision",
  description: "PresenceVisionのプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-foreground dark:bg-background">
      {/* Header */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            PresenceVision
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            トップページへ戻る
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 pt-32 pb-20">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">プライバシーポリシー</h1>
        <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年3月17日</p>

        <div className="mt-12 space-y-10 text-base leading-relaxed text-foreground/90">
          <p>
            PresenceVision（以下「当社」といいます）は、本サービスにおけるユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
          </p>

          {/* 第1条 */}
          <section>
            <h2 className="text-xl font-semibold">第1条（収集する情報）</h2>
            <p className="mt-3">当社は、以下の情報を収集します。</p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>
                <span className="font-medium">アカウント情報:</span> 氏名、メールアドレス、プロフィール画像（Google認証の場合）
              </li>
              <li>
                <span className="font-medium">接続SNSアカウント情報:</span> 各SNSプラットフォームへの連携に必要なアカウント情報およびアクセストークン
              </li>
              <li>
                <span className="font-medium">決済情報:</span> Stripe経由で処理されるクレジットカード情報（当社はカード番号を直接保持しません）
              </li>
              <li>
                <span className="font-medium">利用ログ:</span> サービスの利用状況、アクセスログ、操作履歴、生成コンテンツの統計情報
              </li>
              <li>
                <span className="font-medium">デバイス情報:</span> IPアドレス、ブラウザ種類、OS、画面解像度
              </li>
            </ul>
          </section>

          {/* 第2条 */}
          <section>
            <h2 className="text-xl font-semibold">第2条（利用目的）</h2>
            <p className="mt-3">収集した情報は、以下の目的で利用します。</p>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>本サービスの提供、運営、維持</li>
              <li>ユーザーアカウントの管理および認証</li>
              <li>料金の請求および決済処理</li>
              <li>サービスの品質向上、新機能の開発</li>
              <li>カスタマーサポートの提供</li>
              <li>サービスに関する重要な通知、更新情報のお知らせ</li>
              <li>不正利用の検知・防止</li>
            </ol>
          </section>

          {/* 第3条 */}
          <section>
            <h2 className="text-xl font-semibold">第3条（第三者提供）</h2>
            <p className="mt-3">
              当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>
                <span className="font-medium">Stripe Inc.:</span> 決済処理のため、必要な情報を共有します。
              </li>
              <li>
                <span className="font-medium">Google LLC:</span> Google認証およびGoogle関連サービスとの連携のため、必要な情報を共有します。
              </li>
              <li>
                <span className="font-medium">各SNSプラットフォーム:</span> コンテンツ配信機能の利用に際し、ユーザーが連携を許可したプラットフォームに対して必要な情報を共有します。
              </li>
              <li>法令に基づく場合、または公的機関からの正当な要請がある場合</li>
              <li>ユーザーの同意がある場合</li>
            </ul>
          </section>

          {/* 第4条 */}
          <section>
            <h2 className="text-xl font-semibold">第4条（データ保管）</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>ユーザーのデータは、日本国内に所在するサーバーに保管します。</li>
              <li>当社は、適切な技術的・組織的措置を講じ、個人情報の安全管理に努めます。</li>
              <li>データの暗号化、アクセス制御、定期的なセキュリティ監査を実施しています。</li>
            </ol>
          </section>

          {/* 第5条 */}
          <section>
            <h2 className="text-xl font-semibold">第5条（Cookieの利用）</h2>
            <p className="mt-3">当社は、以下の目的でCookieを利用します。</p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>セッション管理（ログイン状態の維持）</li>
              <li>言語設定の保存</li>
              <li>サービスの利用状況の分析（匿名データ）</li>
            </ul>
            <p className="mt-3">
              ユーザーは、ブラウザの設定によりCookieの受け入れを拒否することができますが、一部の機能が利用できなくなる場合があります。
            </p>
          </section>

          {/* 第6条 */}
          <section>
            <h2 className="text-xl font-semibold">第6条（ユーザーの権利）</h2>
            <p className="mt-3">ユーザーは、以下の権利を有します。</p>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>
                <span className="font-medium">開示請求:</span> 当社が保有するご自身の個人情報の開示を請求する権利
              </li>
              <li>
                <span className="font-medium">訂正請求:</span> 個人情報の内容が事実と異なる場合に訂正を請求する権利
              </li>
              <li>
                <span className="font-medium">削除請求:</span> 個人情報の削除を請求する権利（ただし、法令に基づき保存が必要な情報を除きます）
              </li>
              <li>
                <span className="font-medium">利用停止請求:</span> 個人情報の利用停止を請求する権利
              </li>
            </ol>
            <p className="mt-3">
              上記の請求は、下記の連絡先までお問い合わせください。本人確認の上、合理的な期間内に対応いたします。
            </p>
          </section>

          {/* 第7条 */}
          <section>
            <h2 className="text-xl font-semibold">第7条（プライバシーポリシーの変更）</h2>
            <p className="mt-3">
              当社は、必要に応じて本プライバシーポリシーを変更することがあります。重要な変更については、サービス上の通知またはメールにてお知らせいたします。
            </p>
          </section>

          {/* 連絡先 */}
          <section>
            <h2 className="text-xl font-semibold">お問い合わせ</h2>
            <p className="mt-3">
              個人情報の取扱いに関するお問い合わせは、以下までご連絡ください。
            </p>
            <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-6">
              <p className="font-medium">PresenceVision 個人情報保護担当</p>
              <p className="mt-1 text-muted-foreground">
                メール: privacy@presencevision.com
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <div className="flex gap-6">
              <Link href="/terms" className="transition-colors hover:text-foreground">利用規約</Link>
              <Link href="/privacy" className="font-medium text-foreground">プライバシーポリシー</Link>
              <Link href="/tokushoho" className="transition-colors hover:text-foreground">特定商取引法に基づく表記</Link>
            </div>
            <p>&copy; 2026 PresenceVision. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
