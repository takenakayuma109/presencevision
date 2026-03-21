import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 — PresenceVision",
  description: "PresenceVisionの特定商取引法に基づく表記です。",
};

export default function TokushohoPage() {
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
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">特定商取引法に基づく表記</h1>
        <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年3月17日</p>

        <div className="mt-12">
          <table className="w-full">
            <tbody className="divide-y divide-border/50">
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  販売事業者名
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  VISIONOID株式会社
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  代表者
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  [代表者名を入力してください]
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  所在地
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  [住所を入力してください]
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  連絡先
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  メール: info@visionoid.co
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  販売価格
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Starter: ¥9,800/月（税込）</li>
                    <li>Professional: ¥29,800/月（税込）</li>
                    <li>Enterprise: ¥98,000/月（税込）</li>
                  </ul>
                  <p className="mt-2 text-muted-foreground">
                    年額プランの場合、それぞれ ¥7,800/月、¥24,800/月、¥78,000/月（税込）となります。
                  </p>
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  支払方法
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  クレジットカード（Stripe経由）、Apple Pay、Google Pay
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  支払時期
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  登録時に決済情報を登録いただきます。7日間の無料トライアル終了後に課金が開始され、以降は毎月（または毎年）の更新日に自動決済されます。
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  商品引渡し時期
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  決済完了後、即時ご利用いただけます。
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  返品・キャンセル
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  <ul className="list-inside list-disc space-y-1">
                    <li>7日間の無料トライアル期間中は、無料でキャンセルが可能です。</li>
                    <li>月額プランはいつでも解約が可能です。解約後は、当該課金期間の末日までサービスをご利用いただけます。</li>
                    <li>日割り計算による返金は行っておりません。</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <th className="w-1/3 py-5 pr-6 text-left align-top text-sm font-semibold">
                  動作環境
                </th>
                <td className="py-5 text-sm text-foreground/90">
                  <p>以下のモダンブラウザの最新版に対応しています。</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>Google Chrome</li>
                    <li>Mozilla Firefox</li>
                    <li>Apple Safari</li>
                    <li>Microsoft Edge</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <div className="flex gap-6">
              <Link href="/terms" className="transition-colors hover:text-foreground">利用規約</Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">プライバシーポリシー</Link>
              <Link href="/tokushoho" className="font-medium text-foreground">特定商取引法に基づく表記</Link>
            </div>
            <p>&copy; 2026 VISIONOID Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
