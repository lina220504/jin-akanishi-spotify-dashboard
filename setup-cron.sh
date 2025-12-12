#!/bin/bash

# このスクリプトはcronジョブを設定して、毎日自動でSpotifyデータを取得します

# プロジェクトディレクトリのパスを取得
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# ログディレクトリを作成
mkdir -p "$PROJECT_DIR/logs"

# cronジョブの内容
CRON_JOB="0 2 * * * cd $PROJECT_DIR && /usr/local/bin/node backend/track-popularity-history.js >> logs/cron.log 2>&1"

echo "========================================="
echo "  Spotify データ取得の自動化設定"
echo "========================================="
echo ""
echo "このスクリプトは以下のcronジョブを設定します："
echo "毎日午前2時にデータを取得"
echo ""
echo "設定内容:"
echo "$CRON_JOB"
echo ""
echo "続行しますか? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # 既存のcronジョブを取得
    crontab -l > /tmp/mycron 2>/dev/null || echo "" > /tmp/mycron

    # 同じジョブが既に存在するか確認
    if grep -q "track-popularity-history.js" /tmp/mycron; then
        echo ""
        echo "既存のジョブを削除しています..."
        grep -v "track-popularity-history.js" /tmp/mycron > /tmp/mycron.tmp
        mv /tmp/mycron.tmp /tmp/mycron
    fi

    # 新しいジョブを追加
    echo "$CRON_JOB" >> /tmp/mycron

    # cronジョブを設定
    crontab /tmp/mycron

    # 一時ファイルを削除
    rm /tmp/mycron

    echo ""
    echo "✓ cronジョブが正常に設定されました！"
    echo ""
    echo "現在のcronジョブ一覧:"
    crontab -l
    echo ""
    echo "ログファイル: $PROJECT_DIR/logs/cron.log"
    echo ""
    echo "手動で今すぐデータを取得する場合:"
    echo "  npm run track-popularity"
    echo ""
    echo "cronジョブを削除する場合:"
    echo "  crontab -e"
    echo "  該当する行を削除して保存"
else
    echo ""
    echo "設定をキャンセルしました。"
fi
