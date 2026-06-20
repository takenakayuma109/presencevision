#!/bin/bash
set -e

# PresenceVision フロント(Vercel)デプロイ + カスタムドメイン張り替え
# ------------------------------------------------------------------
# presencevision.com / www は特定デプロイに固定エイリアスされており、
# `vercel --prod` だけでは本番ドメインが最新デプロイへ自動で張り替わらない。
# このスクリプトはデプロイ後に最新デプロイURLを取得し、ドメインを張り替える。
#
# Usage: npm run deploy:web
# ------------------------------------------------------------------

echo "=== [1/3] Vercel 本番デプロイ ==="
npx vercel --prod --yes

echo ""
echo "=== [2/3] 最新本番デプロイURLを取得 ==="
URL=$(npx vercel ls 2>/dev/null \
  | grep -oE 'https://presencevision-[a-z0-9]+-takenakayuma109s-projects\.vercel\.app' \
  | head -1)

if [ -z "$URL" ]; then
  echo "ERROR: 最新デプロイURLを取得できませんでした。"
  echo "  → 'npx vercel ls' で最新URLを確認し、手動で:"
  echo "     npx vercel alias set <URL> presencevision.com"
  echo "     npx vercel alias set <URL> www.presencevision.com"
  exit 1
fi
echo "最新デプロイ: $URL"

echo ""
echo "=== [3/3] カスタムドメインを最新デプロイへ張り替え ==="
npx vercel alias set "$URL" presencevision.com
npx vercel alias set "$URL" www.presencevision.com

echo ""
echo "✅ 完了: https://presencevision.com が最新デプロイを配信します。"
echo "   ブラウザは Cmd+Shift+R（スーパーリロード）でご確認ください。"
