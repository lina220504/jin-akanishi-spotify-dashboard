import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const ARTIST_ID = process.env.ARTIST_ID || '5gSFxPK5Te7WRIKL5CEWos';

// 環境変数のチェック
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ エラー: Spotify APIの認証情報が設定されていません\n');
  console.error('以下のコマンドで環境変数を設定してから実行してください:\n');
  console.error('export SPOTIFY_CLIENT_ID="あなたのClient ID"');
  console.error('export SPOTIFY_CLIENT_SECRET="あなたのClient Secret"');
  console.error('export ARTIST_ID="アーティストID" # オプション\n');
  process.exit(1);
}

class PopularityHistoryTracker {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // アクセストークンを取得
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      console.error('トークン取得エラー:', error.response?.data || error.message);
      throw error;
    }
  }

  // 現在の人気度データを取得
  async getCurrentPopularityData() {
    const token = await this.getAccessToken();

    try {
      // アーティスト情報
      const artistResponse = await axios.get(
        `https://api.spotify.com/v1/artists/${ARTIST_ID}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // トップトラック
      const tracksResponse = await axios.get(
        `https://api.spotify.com/v1/artists/${ARTIST_ID}/top-tracks?market=JP`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      return {
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        artist: {
          name: artistResponse.data.name,
          popularity: artistResponse.data.popularity,
          followers: artistResponse.data.followers.total
        },
        topTracks: tracksResponse.data.tracks.map(track => ({
          id: track.id,
          name: track.name,
          popularity: track.popularity,
          album: track.album.name,
          releaseDate: track.album.release_date
        }))
      };
    } catch (error) {
      console.error('データ取得エラー:', error.response?.data || error.message);
      throw error;
    }
  }

  // 履歴データを読み込み
  loadHistory() {
    const historyPath = path.join(__dirname, '..', 'data', 'popularity-history.json');

    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf8');
      return JSON.parse(data);
    }

    return { records: [] };
  }

  // 履歴データを保存
  saveHistory(history) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const historyPath = path.join(dataDir, 'popularity-history.json');
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log(`履歴データを保存しました: ${historyPath}`);
  }

  // 新しいデータポイントを追加
  async addDataPoint() {
    console.log('現在の人気度データを取得中...');
    const currentData = await this.getCurrentPopularityData();

    const history = this.loadHistory();

    // 同じ日のデータがあれば上書き
    const existingIndex = history.records.findIndex(
      record => record.date === currentData.date
    );

    if (existingIndex >= 0) {
      history.records[existingIndex] = currentData;
      console.log(`${currentData.date}のデータを更新しました`);
    } else {
      history.records.push(currentData);
      console.log(`${currentData.date}のデータを追加しました`);
    }

    // 日付順にソート
    history.records.sort((a, b) => new Date(a.date) - new Date(b.date));

    this.saveHistory(history);

    return currentData;
  }

  // 集計データを生成
  generateAggregatedData() {
    const history = this.loadHistory();

    if (history.records.length === 0) {
      console.log('履歴データがありません');
      return null;
    }

    // アーティスト人気度の時系列
    const artistPopularity = history.records.map(record => ({
      date: record.date,
      timestamp: record.timestamp,
      popularity: record.artist.popularity,
      followers: record.artist.followers
    }));

    // トラック別人気度の時系列
    const trackPopularity = {};

    history.records.forEach(record => {
      record.topTracks.forEach(track => {
        if (!trackPopularity[track.id]) {
          trackPopularity[track.id] = {
            id: track.id,
            name: track.name,
            album: track.album,
            releaseDate: track.releaseDate,
            history: []
          };
        }

        trackPopularity[track.id].history.push({
          date: record.date,
          popularity: track.popularity
        });
      });
    });

    return {
      lastUpdated: new Date().toISOString(),
      dataPoints: history.records.length,
      dateRange: {
        start: history.records[0].date,
        end: history.records[history.records.length - 1].date
      },
      artistPopularity: artistPopularity,
      trackPopularity: Object.values(trackPopularity)
    };
  }

  // 集計データを保存
  saveAggregatedData() {
    const aggregated = this.generateAggregatedData();

    if (!aggregated) {
      return;
    }

    const dataDir = path.join(__dirname, '..', 'data');
    const filePath = path.join(dataDir, 'popularity-trends.json');

    fs.writeFileSync(filePath, JSON.stringify(aggregated, null, 2));
    console.log(`集計データを保存しました: ${filePath}`);
    console.log(`データポイント数: ${aggregated.dataPoints}`);
    console.log(`期間: ${aggregated.dateRange.start} 〜 ${aggregated.dateRange.end}`);
  }
}

// メイン実行
async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('エラー: SPOTIFY_CLIENT_IDとSPOTIFY_CLIENT_SECRETを.envファイルに設定してください');
    process.exit(1);
  }

  const tracker = new PopularityHistoryTracker();

  try {
    console.log('========================================');
    console.log('   人気度履歴データ取得');
    console.log('========================================\n');

    // 現在のデータを追加
    const currentData = await tracker.addDataPoint();

    console.log('\n現在のデータ:');
    console.log(`アーティスト人気度: ${currentData.artist.popularity}`);
    console.log(`フォロワー数: ${currentData.artist.followers.toLocaleString()}`);
    console.log(`トップトラック数: ${currentData.topTracks.length}`);

    // 集計データを生成・保存
    console.log('\n集計データを生成中...');
    tracker.saveAggregatedData();

    console.log('\n完了しました！');
    console.log('毎日このスクリプトを実行することで、人気度の推移を追跡できます。');

  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
