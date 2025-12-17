# 赤西仁 Spotify Analytics Dashboard

赤西仁さんのSpotifyデータを自動収集・分析し、ビジュアライズするダッシュボードです。

## 機能

- **楽曲人気度推移**: リリース順の人気度トレンド分析
- **リスナー統計**: フォロワー数と人気度の追跡
- **プレイリスト分析**: 含まれるプレイリストの統計情報
- **アルバムタイムライン**: 年別リリース履歴
- **週次自動更新**: GitHub Actionsで毎週月曜日に自動データ更新

## GitHub Actions設定

### デプロイワークフロー

`.github/workflows/deploy.yml`:

```yaml
name: ビルドとデプロイ

on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 1'  # 毎週月曜日 0:00 UTC
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Node.jsセットアップ
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: バックエンド依存関係インストール
        run: cd backend && npm install

      - name: データ取得
        env:
          SPOTIFY_CLIENT_ID: \${{ secrets.SPOTIFY_CLIENT_ID }}
          SPOTIFY_CLIENT_SECRET: \${{ secrets.SPOTIFY_CLIENT_SECRET }}
        run: cd backend && node fetch-spotify-data.js

      - name: データ分析
        run: cd backend && node analyze-data.js

      - name: フロントエンド依存関係インストール
        run: cd frontend && npm install

      - name: データコピー
        run: |
          mkdir -p frontend/public/data
          cp data/*.json frontend/public/data/

      - name: ビルド
        run: cd frontend && npm run build

      - name: GitHub Pagesにデプロイ
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

## プロジェクト構成

```
jin-akanishi-spotify-dashboard/
├── backend/
│   ├── fetch-spotify-data.js   # データ取得スクリプト
│   ├── analyze-data.js          # データ分析スクリプト
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Reactコンポーネント
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── data/               # 公開データファイル
│   └── package.json
├── data/
│   ├── latest.json             # 最新データ
│   ├── analysis.json           # 分析結果
│   └── history-*.json          # 履歴データ
├── .github/
│   └── workflows/
│       ├── update-data.yml     # 週次更新
│       └── deploy.yml          # デプロイ
└── README.md
```

## 使用技術

### バックエンド
- Node.js
- Axios (HTTPクライアント)
- Spotify Web API

### フロントエンド
- React
- Vite
- Recharts (チャートライブラリ)

### CI/CD
- GitHub Actions

## トラブルシューティング

### データが表示されない

1. バックエンドでデータを取得したか確認
2. `data/latest.json`と`data/analysis.json`が存在するか確認
3. `frontend/public/data/`にファイルがコピーされているか確認

### GitHub Actionsが失敗する

1. Secretsが正しく設定されているか確認
2. リポジトリのActions権限が有効か確認
3. ワークフローログでエラー内容を確認

### API制限エラー

Spotify APIのレート制限に達した場合は、しばらく待ってから再試行してください。

## ライセンス

MIT

## 注意事項

このプロジェクトは個人的な分析目的で作成されています。Spotifyのデータは[Spotify Web API Terms of Service](https://developer.spotify.com/terms)に従って使用してください。
