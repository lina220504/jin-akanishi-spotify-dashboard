# セットアップガイド

このガイドに従って、赤西仁さんのSpotify分析ダッシュボードをセットアップしましょう！

## ステップ1: Spotify Developer登録

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)にアクセス
2. Spotifyアカウントでログイン（持っていない場合は無料で作成）
3. 「Create App」ボタンをクリック
4. アプリ情報を入力:
   - **App name**: `Jin Akanishi Dashboard`（任意の名前でOK）
   - **App description**: `Personal analytics dashboard`
   - **Redirect URI**: `http://localhost:3000`（必須ですが今回は使用しません）
   - チェックボックスにチェックを入れて同意
5. 「Save」をクリック
6. 「Settings」ボタンをクリック
7. **Client ID**と**Client Secret**（「Show Client Secret」をクリック）をコピー

## ステップ2: プロジェクトのセットアップ

### ローカル環境での実行

```bash
# プロジェクトディレクトリに移動
cd jin-akanishi-spotify-dashboard

# .envファイルを作成
cp .env.example .env
```

`.env`ファイルを開いて、先ほどコピーしたClient IDとClient Secretを貼り付け:

```env
SPOTIFY_CLIENT_ID=あなたのClient ID
SPOTIFY_CLIENT_SECRET=あなたのClient Secret
ARTIST_ID=3Z3TqPXlrrRdm7IP3pQXjw
```

### バックエンドのセットアップ

```bash
# プロジェクトルートディレクトリで実行

# 依存関係をインストール（まだの場合）
npm install

# アーティストを検索して選択
npm run search-artist

# データを取得（初回）
npm run fetch-data

# 人気度履歴の追跡を開始
npm run track-popularity
```

成功すると、`data`フォルダに以下のファイルが作成されます:
- `latest.json` - 最新のSpotifyデータ
- `popularity-history.json` - 人気度の履歴データ（生データ）
- `popularity-trends.json` - 人気度の集計データ
- `history-YYYY-MM-DD.json` - 日付別履歴データ

### フロントエンドのセットアップ

```bash
# フロントエンドの依存関係をインストール（プロジェクトルートから実行）
cd frontend
npm install

# プロジェクトルートに戻る
cd ..

# 開発サーバーを起動（自動的にデータがコピーされます）
npm run dev
```

ブラウザで http://localhost:5173 を開くとダッシュボードが表示されます！

### 人気度データの自動取得（オプション）

人気度の推移を追跡するには、毎日自動でデータを取得する必要があります。

#### 自動取得の設定（推奨）

**1回だけ**以下のスクリプトを実行すれば、毎日自動でデータが取得されます：

```bash
# プロジェクトルートディレクトリで実行
./setup-cron.sh
```

**このスクリプトがやること:**
- 毎日午前2時に自動実行するスケジュールを設定
- 既存の同じジョブがあれば上書き
- 実行結果を `logs/cron.log` に保存

#### 設定の確認

cronジョブが正しく設定されたか確認：

```bash
crontab -l
```

以下のような行が表示されればOK：
```
0 2 * * * cd /Users/rina/Desktop/仁くんSpotify分析ダッシュボード && /usr/local/bin/node backend/track-popularity-history.js >> logs/cron.log 2>&1
```

#### ログの確認

自動実行が正常に動作しているか確認：

```bash
# リアルタイムでログを確認
tail -f logs/cron.log

# または過去のログを確認
cat logs/cron.log
```

#### 設定の解除

自動取得を停止したい場合：

```bash
crontab -e
# エディタが開くので、該当する行を削除して保存
```

#### 手動で設定する場合

スクリプトを使わずに手動で設定する場合：

```bash
# cronジョブを編集
crontab -e

# 以下の行を追加（毎日午前2時に実行）
0 2 * * * cd /Users/rina/Desktop/仁くんSpotify分析ダッシュボード && /usr/local/bin/node backend/track-popularity-history.js >> logs/cron.log 2>&1
```

**重要:**
- 設定は1度だけ実行すればOK
- 数日後から「人気度の推移」グラフにデータが表示され始めます
- データが蓄積されるほど、より詳細な分析が可能になります

## ステップ3: GitHubにプッシュ

```bash
# Gitリポジトリを初期化（まだの場合）
git init

# .envファイルは除外されます（.gitignoreに含まれています）
git add .
git commit -m "Initial commit: Jin Akanishi Spotify Dashboard"

# GitHubリポジトリを作成して接続
# GitHubで新しいリポジトリを作成後:
git remote add origin https://github.com/あなたのユーザー名/jin-akanishi-spotify-dashboard.git
git branch -M main
git push -u origin main
```

## ステップ4: GitHub Actionsの設定（週次自動更新）

### GitHub Secretsの設定

1. GitHubリポジトリページにアクセス
2. **Settings** > **Secrets and variables** > **Actions**
3. 「New repository secret」をクリック
4. 以下の2つのSecretを追加:

   **Secret 1:**
   - Name: `SPOTIFY_CLIENT_ID`
   - Secret: あなたのSpotify Client ID

   **Secret 2:**
   - Name: `SPOTIFY_CLIENT_SECRET`
   - Secret: あなたのSpotify Client Secret

### GitHub Actionsの権限設定

1. **Settings** > **Actions** > **General**
2. 「Workflow permissions」セクションで:
   - 「Read and write permissions」を選択
   - 「Allow GitHub Actions to create and approve pull requests」にチェック
3. 「Save」をクリック

### 初回の手動実行

1. リポジトリの**Actions**タブに移動
2. 左サイドバーから「ビルドとデプロイ」を選択
3. 「Run workflow」ボタンをクリック
4. 「Run workflow」を確認

これで初回のデータ取得とビルドが実行されます。

## ステップ5: GitHub Pagesでの公開

### GitHub Pagesの有効化

1. **Settings** > **Pages**
2. 「Source」で:
   - Branch: `gh-pages`を選択
   - Folder: `/ (root)`を選択
3. 「Save」をクリック

数分後、`https://あなたのユーザー名.github.io/jin-akanishi-spotify-dashboard/`でダッシュボードが公開されます！

## オプション: Vercelでのデプロイ

GitHub Pagesの代わりにVercelを使うこともできます。

1. [Vercel](https://vercel.com)にサインアップ
2. 「New Project」をクリック
3. GitHubリポジトリをインポート
4. プロジェクト設定:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 環境変数を追加:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
6. 「Deploy」をクリック

## 週次自動更新について

GitHub Actionsで毎週月曜日の午前9時（日本時間）に自動的に:
1. Spotifyから最新データを取得
2. データを分析
3. ダッシュボードを更新
4. 変更をリポジトリにコミット
5. GitHub Pagesを更新

すべて無料で動作します！

## トラブルシューティング

### データ取得エラー

```
Error: トークン取得エラー
```

→ Client IDとClient Secretが正しいか確認してください

### ダッシュボードが表示されない

1. `data/latest.json`と`data/analysis.json`が存在するか確認
2. `frontend/public/data/`にファイルがコピーされているか確認
3. ブラウザのコンソールでエラーを確認

### GitHub Actionsが失敗する

1. Secretsが正しく設定されているか確認
2. Actions権限が「Read and write」になっているか確認
3. ワークフロー実行ログでエラー内容を確認

## サポート

問題が発生した場合は、GitHubのIssuesで質問してください。

楽しいSpotify分析を！
