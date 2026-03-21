import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 — PresenceVision",
  description: "PresenceVisionの利用規約です。",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">利用規約</h1>
        <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年3月17日</p>

        <div className="mt-12 space-y-10 text-base leading-relaxed text-foreground/90">
          {/* 第1条 */}
          <section>
            <h2 className="text-xl font-semibold">第1条（サービス概要）</h2>
            <p className="mt-3">
              PresenceVision（以下「本サービス」といいます）は、SEO対策およびAI検索対策を自動化するSaaSプラットフォームです。本サービスは、キーワード調査、コンテンツ自動生成、マルチチャネル配信、検索順位追跡、LLM引用モニタリングなどの機能を提供します。
            </p>
          </section>

          {/* 第2条 */}
          <section>
            <h2 className="text-xl font-semibold">第2条（利用資格）</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>本サービスは、法人または個人事業主を対象としています。</li>
              <li>ご利用にあたり、Verified Entity審査を実施する場合があります。審査の結果、ご利用をお断りすることがあります。</li>
              <li>未成年者が本サービスを利用する場合は、法定代理人の同意が必要です。</li>
            </ol>
          </section>

          {/* 第3条 */}
          <section>
            <h2 className="text-xl font-semibold">第3条（アカウント）</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>本サービスのアカウント登録は、Googleアカウント認証またはメールアドレス認証により行います。</li>
              <li>ユーザーは、自己のアカウント情報を適切に管理する責任を負います。</li>
              <li>アカウントの第三者への譲渡、貸与、共有は禁止します。</li>
            </ol>
          </section>

          {/* 第4条 */}
          <section>
            <h2 className="text-xl font-semibold">第4条（料金・支払い）</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>本サービスの料金は、各プランの料金ページに定めるとおりとします。</li>
              <li>決済はStripe株式会社の決済システムを通じて処理されます。</li>
              <li>新規登録時には7日間の無料トライアル期間が適用されます。トライアル開始時に決済情報の登録が必要です。</li>
              <li>トライアル期間終了後、自動的に有料プランへ移行し、課金が開始されます。</li>
              <li>月額プランは毎月自動更新されます。年額プランは毎年自動更新されます。</li>
              <li>料金は税込表示です。</li>
            </ol>
          </section>

          {/* 第5条 */}
          <section>
            <h2 className="text-xl font-semibold">第5条（禁止事項）</h2>
            <p className="mt-3">ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>スパム行為、または大量の低品質コンテンツを意図的に生成・配信する行為</li>
              <li>虚偽の情報を含むコンテンツの生成・配信</li>
              <li>第三者のアカウントへの不正アクセスまたは不正利用</li>
              <li>公序良俗に反するコンテンツの生成・配信</li>
              <li>法令に違反する行為、または違反を助長する行為</li>
              <li>本サービスのインフラに過度な負荷をかける行為</li>
              <li>本サービスのリバースエンジニアリング、逆コンパイル、逆アセンブル</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ol>
          </section>

          {/* 第6条 */}
          <section>
            <h2 className="text-xl font-semibold">第6条（知的財産権）</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>本サービスのAI機能により生成されたコンテンツの著作権は、当該コンテンツを生成したユーザーに帰属します。</li>
              <li>本サービス自体のソフトウェア、デザイン、商標等の知的財産権は当社に帰属します。</li>
              <li>ユーザーは、生成されたコンテンツを自由に利用、編集、公開することができます。</li>
            </ol>
          </section>

          {/* 第7条 */}
          <section>
            <h2 className="text-xl font-semibold">第7条（免責事項）</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>当社は、本サービスの利用により特定の検索順位やAI検索エンジンにおける引用を保証するものではありません。</li>
              <li>Google、各種AIサービス、SNSプラットフォームなど外部サービスの仕様変更、障害、ポリシー変更等による影響について、当社は責任を負いません。</li>
              <li>本サービスのAIが生成するコンテンツの正確性、適法性について、当社は保証しません。ユーザーは生成されたコンテンツの確認・修正の責任を負います。</li>
              <li>天災、通信障害、その他不可抗力による本サービスの中断について、当社は責任を負いません。</li>
            </ol>
          </section>

          {/* 第8条 */}
          <section>
            <h2 className="text-xl font-semibold">第8条（解約）</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>ユーザーは、いつでも本サービスを解約することができます。</li>
              <li>解約は、アカウント設定画面より手続きを行うものとします。</li>
              <li>月途中の解約の場合、日割り計算による返金は行いません。当該課金期間の末日まで本サービスをご利用いただけます。</li>
              <li>解約後も、ユーザーが生成・配信したコンテンツは各配信先プラットフォームに残ります。</li>
              <li>当社は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止または削除することがあります。</li>
            </ol>
          </section>

          {/* 第9条 */}
          <section>
            <h2 className="text-xl font-semibold">第9条（規約の変更）</h2>
            <p className="mt-3">
              当社は、必要に応じて本規約を変更することがあります。変更後の規約は、本サービス上に表示した時点で効力を生じるものとします。重要な変更については、メール等の手段により事前に通知いたします。
            </p>
          </section>

          {/* 第10条 */}
          <section>
            <h2 className="text-xl font-semibold">第10条（準拠法・管轄裁判所）</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>本規約の解釈および適用は、日本法に準拠するものとします。</li>
              <li>本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
            </ol>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <div className="flex gap-6">
              <Link href="/terms" className="font-medium text-foreground">利用規約</Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">プライバシーポリシー</Link>
              <Link href="/tokushoho" className="transition-colors hover:text-foreground">特定商取引法に基づく表記</Link>
            </div>
            <p>&copy; 2026 VISIONOID Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
