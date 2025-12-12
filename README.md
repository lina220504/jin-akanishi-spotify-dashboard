# 赤西仁 Spotify Analytics Dashboard

赤西仁さんのSpotifyデータを自動収集・分析し、ビジュアライズするダッシュボードです。

## 機能

- **楽曲人気度推移**: リリース順の人気度トレンド分析
- **リスナー統計**: フォロワー数と人気度の追跡
- **プレイリスト分析**: 含まれるプレイリストの統計情報
- **アルバムタイムライン**: 年別リリース履歴
- **週次自動更新**: GitHub Actionsで毎週月曜日に自動データ更新

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <your-repo-url>
cd jin-akanishi-spotify-dashboard
```

### 2. Spotify API認証情報の取得

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) にアクセス
2. ログインして「Create App」をクリック
3. アプリ名と説明を入力（例: "Jin Akanishi Dashboard"）
4. Client IDとClient Secretをコピー

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集して認証情報を設定:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
ARTIST_ID=3Z3TqPXlrrRdm7IP3pQXjw
```

### 4. バックエンドのセットアップ

```bash
cd backend
npm install
```

### 5. データの初回取得

```bash
npm run fetch-data
```

データが`data/latest.json`に保存されます。

### 6. データ分析の実行

```bash
cd backend
node analyze-data.js
```

分析結果が`data/analysis.json`に保存されます。

### 7. フロントエンドのセットアップ

```bash
cd frontend
npm install
```

### 8. データをフロントエンドにコピー

```bash
mkdir -p frontend/public/data
cp data/latest.json frontend/public/data/
cp data/analysis.json frontend/public/data/
```

### 9. 開発サーバーの起動

```bash
cd frontend
npm run dev
```

ブラウザで http://localhost:5173 を開く

## デプロイ

### GitHub Pagesへのデプロイ

1. **GitHub Secretsの設定**

リポジトリの Settings > Secrets and variables > Actions で以下を追加:

- `SPOTIFY_CLIENT_ID`: あなたのSpotify Client ID
- `SPOTIFY_CLIENT_SECRET`: あなたのSpotify Client Secret

2. **GitHub Actionsの有効化**

リポジトリの Settings > Actions > General で「Read and write permissions」を有効化

3. **GitHub Pagesの設定**

- Settings > Pages
- Source: 「Deploy from a branch」を選択
- Branch: `gh-pages` / `/ (root)` を選択

4. **デプロイワークフローの追加**

`.github/workflows/deploy.yml`ファイルを作成（下記参照）

5. **手動実行またはプッシュでデプロイ**

最初のデプロイは手動で実行:
- Actions タブ > 「週次データ更新」> 「Run workflow」

その後、毎週月曜日午前0時（UTC）に自動更新されます。

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にサインアップ
2. 「New Project」からGitHubリポジトリをインポート
3. 環境変数を設定:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
4. Build設定:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. デプロイ

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
