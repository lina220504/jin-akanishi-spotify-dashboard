import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ARTIST_ID = process.env.ARTIST_ID || '5gSFxPK5Te7WRIKL5CEWos';

class SpotifyChartsDataFetcher {
  constructor() {
    this.baseURL = 'https://charts.spotify.com/charts';
  }

  // Spotify Charts APIからデータを取得
  async fetchChartData(region = 'global', period = 'daily', date = null) {
    try {
      // 日付が指定されていない場合は最新のデータを取得
      const targetDate = date || this.getLatestChartDate();

      // Spotify Charts APIエンドポイント
      const url = `https://charts.spotify.com/api/charts/regional/${region}/${period}/${targetDate}`;

      console.log(`チャートデータ取得中: ${region} - ${period} - ${targetDate}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('チャートデータ取得エラー:', error.message);
      return null;
    }
  }

  // 最新のチャート日付を取得（通常は昨日）
  getLatestChartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 1); // 昨日
    return date.toISOString().split('T')[0]; // YYYY-MM-DD形式
  }

  // アーティストの楽曲をチャートから検索
  findArtistTracksInChart(chartData, artistName) {
    if (!chartData || !chartData.chartEntries) {
      return [];
    }

    const artistTracks = chartData.chartEntries.items.filter(entry => {
      const trackArtists = entry.trackMetadata?.artists || [];
      return trackArtists.some(artist =>
        artist.name.toLowerCase().includes(artistName.toLowerCase())
      );
    });

    return artistTracks.map(entry => ({
      rank: entry.chartMetadata.currentRank,
      trackName: entry.trackMetadata.trackName,
      artists: entry.trackMetadata.artists.map(a => a.name).join(', '),
      streams: entry.chartMetadata.streamCount || 'N/A',
      peakRank: entry.chartMetadata.peakRank,
      previousRank: entry.chartMetadata.previousRank,
      daysOnChart: entry.chartMetadata.daysOnChart,
      releaseDate: entry.trackMetadata.releaseDate,
      spotifyUrl: entry.trackMetadata.trackUri
    }));
  }

  // 複数の地域とデータを取得
  async fetchMultipleCharts(artistName, regions = ['global', 'jp', 'us'], period = 'daily') {
    const results = {};

    for (const region of regions) {
      console.log(`${region}のチャートを取得中...`);
      const chartData = await this.fetchChartData(region, period);

      if (chartData) {
        const artistTracks = this.findArtistTracksInChart(chartData, artistName);
        results[region] = {
          date: chartData.chartMetadata?.chartDate || this.getLatestChartDate(),
          period: period,
          tracksFound: artistTracks.length,
          tracks: artistTracks
        };
      }

      // API制限を考慮して待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  // 過去のチャートデータを取得（履歴分析用）
  async fetchHistoricalData(artistName, region = 'global', days = 30) {
    const results = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      console.log(`${dateString}のデータを取得中...`);

      const chartData = await this.fetchChartData(region, 'daily', dateString);

      if (chartData) {
        const artistTracks = this.findArtistTracksInChart(chartData, artistName);
        results.push({
          date: dateString,
          tracksFound: artistTracks.length,
          tracks: artistTracks
        });
      }

      // API制限を考慮して待機
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  // データを保存
  async saveChartsData(data, filename = 'charts-data.json') {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`チャートデータを保存しました: ${filePath}`);
  }
}

// メイン実行
async function main() {
  const fetcher = new SpotifyChartsDataFetcher();

  try {
    console.log('========================================');
    console.log('   Spotify Chartsデータ取得');
    console.log('========================================\n');

    // Jin Akanishiのデータを取得
    const artistName = 'Jin Akanishi';

    console.log(`アーティスト: ${artistName}\n`);

    // 1. 現在の複数地域のチャートデータを取得
    console.log('現在のチャートデータを取得中...\n');
    const currentCharts = await fetcher.fetchMultipleCharts(
      artistName,
      ['global', 'jp', 'us', 'gb', 'kr'],
      'daily'
    );

    // 2. 過去30日間のグローバルチャートデータを取得（オプション）
    console.log('\n過去30日間の履歴データを取得中...\n');
    const historicalData = await fetcher.fetchHistoricalData(artistName, 'global', 30);

    // 結果をまとめる
    const chartsData = {
      lastUpdated: new Date().toISOString(),
      artist: artistName,
      currentCharts: currentCharts,
      historical: historicalData,
      summary: {
        totalTracksFound: Object.values(currentCharts).reduce((sum, region) => sum + region.tracksFound, 0),
        regionsWithTracks: Object.entries(currentCharts)
          .filter(([_, data]) => data.tracksFound > 0)
          .map(([region]) => region)
      }
    };

    // データを保存
    await fetcher.saveChartsData(chartsData);

    // サマリーを表示
    console.log('\n========================================');
    console.log('データ取得完了！');
    console.log('========================================');
    console.log(`現在チャートインしている地域: ${chartsData.summary.regionsWithTracks.join(', ') || 'なし'}`);
    console.log(`チャートインしている楽曲数: ${chartsData.summary.totalTracksFound}`);

    // 詳細を表示
    for (const [region, data] of Object.entries(currentCharts)) {
      if (data.tracksFound > 0) {
        console.log(`\n${region.toUpperCase()}:`);
        data.tracks.forEach(track => {
          console.log(`  #${track.rank} - ${track.trackName} (${track.streams} streams)`);
        });
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
