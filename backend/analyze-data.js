import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataAnalyzer {
  constructor(data) {
    this.data = data;
  }

  // 人気度推移の分析（リリース日順）
  analyzePopularityTrends() {
    const tracksByDate = this.data.topTracks
      .map(track => ({
        name: track.name,
        popularity: track.popularity,
        releaseDate: track.album.release_date,
        album: track.album.name
      }))
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

    return {
      timeline: tracksByDate,
      averagePopularity: this.calculateAverage(tracksByDate.map(t => t.popularity)),
      mostPopular: tracksByDate.reduce((max, track) =>
        track.popularity > max.popularity ? track : max
      )
    };
  }

  // 年別の楽曲リリース分析
  analyzeReleasesByYear() {
    const byYear = {};

    this.data.albums.forEach(album => {
      const year = album.release_date.split('-')[0];
      if (!byYear[year]) {
        byYear[year] = {
          year,
          albums: [],
          totalTracks: 0
        };
      }
      byYear[year].albums.push(album);
      byYear[year].totalTracks += album.total_tracks;
    });

    return Object.values(byYear).sort((a, b) => a.year - b.year);
  }

  // 音響特徴の統計分析
  analyzeAudioFeatures() {
    if (!this.data.audioFeatures || this.data.audioFeatures.length === 0) {
      return null;
    }

    const features = this.data.audioFeatures;

    const stats = {
      tempo: this.getStats(features.map(f => f.tempo)),
      energy: this.getStats(features.map(f => f.energy)),
      danceability: this.getStats(features.map(f => f.danceability)),
      valence: this.getStats(features.map(f => f.valence)),
      acousticness: this.getStats(features.map(f => f.acousticness)),
      instrumentalness: this.getStats(features.map(f => f.instrumentalness)),
      liveness: this.getStats(features.map(f => f.liveness)),
      speechiness: this.getStats(features.map(f => f.speechiness)),
      loudness: this.getStats(features.map(f => f.loudness))
    };

    // 特徴的な楽曲を抽出
    const mostEnergetic = this.findTrackByFeature(features, 'energy', 'max');
    const mostDanceable = this.findTrackByFeature(features, 'danceability', 'max');
    const mostAcoustic = this.findTrackByFeature(features, 'acousticness', 'max');
    const happiest = this.findTrackByFeature(features, 'valence', 'max');

    return {
      statistics: stats,
      highlights: {
        mostEnergetic,
        mostDanceable,
        mostAcoustic,
        happiest
      }
    };
  }

  // プレイリスト分析
  analyzePlaylists() {
    const playlists = this.data.playlists;

    if (!playlists || playlists.length === 0) {
      return null;
    }

    const sorted = [...playlists].sort((a, b) => b.followers - a.followers);
    const totalFollowers = playlists.reduce((sum, p) => sum + p.followers, 0);
    const totalTracks = playlists.reduce((sum, p) => sum + p.tracks_total, 0);

    return {
      total: playlists.length,
      totalFollowers,
      averageFollowers: Math.round(totalFollowers / playlists.length),
      totalTracks,
      topPlaylists: sorted.slice(0, 10).map(p => ({
        name: p.name,
        followers: p.followers,
        tracks: p.tracks_total,
        owner: p.owner
      })),
      categories: this.categorizePlaylistsByName(playlists)
    };
  }

  // リスナー統計（フォロワー数の推移を記録する場合）
  analyzeListenerStats() {
    return {
      currentFollowers: this.data.artist.followers,
      popularity: this.data.artist.popularity,
      timestamp: this.data.lastUpdated
    };
  }

  // アルバムタイプ別分析
  analyzeAlbumTypes() {
    const types = {};

    this.data.albums.forEach(album => {
      const type = album.album_type;
      if (!types[type]) {
        types[type] = { count: 0, albums: [] };
      }
      types[type].count++;
      types[type].albums.push({
        name: album.name,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks
      });
    });

    return types;
  }

  // ヘルパーメソッド: 統計値計算
  getStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      average: this.calculateAverage(values),
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: this.calculateStdDev(values)
    };
  }

  calculateAverage(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateStdDev(values) {
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.calculateAverage(squareDiffs));
  }

  findTrackByFeature(features, featureName, type) {
    const feature = type === 'max'
      ? features.reduce((max, f) => f[featureName] > max[featureName] ? f : max)
      : features.reduce((min, f) => f[featureName] < min[featureName] ? f : min);

    const track = this.data.tracks.find(t => t.id === feature.id);
    return {
      trackId: feature.id,
      trackName: track?.name || 'Unknown',
      value: feature[featureName]
    };
  }

  categorizePlaylistsByName(playlists) {
    const categories = {
      official: [],
      fan: [],
      genre: [],
      mood: [],
      other: []
    };

    playlists.forEach(playlist => {
      const name = playlist.name.toLowerCase();
      const desc = (playlist.description || '').toLowerCase();

      if (name.includes('official') || desc.includes('official')) {
        categories.official.push(playlist);
      } else if (name.includes('fan') || name.includes('ファン')) {
        categories.fan.push(playlist);
      } else if (name.includes('jpop') || name.includes('j-pop') || name.includes('rock')) {
        categories.genre.push(playlist);
      } else if (name.includes('chill') || name.includes('party') || name.includes('workout')) {
        categories.mood.push(playlist);
      } else {
        categories.other.push(playlist);
      }
    });

    return Object.fromEntries(
      Object.entries(categories).map(([key, items]) => [key, items.length])
    );
  }

  // 全分析を実行
  generateFullAnalysis() {
    console.log('データ分析を開始します...');

    const analysis = {
      generatedAt: new Date().toISOString(),
      artist: {
        name: this.data.artist.name,
        followers: this.data.artist.followers,
        popularity: this.data.artist.popularity,
        genres: this.data.artist.genres
      },
      popularityTrends: this.analyzePopularityTrends(),
      releasesByYear: this.analyzeReleasesByYear(),
      audioFeatures: this.analyzeAudioFeatures(),
      playlists: this.analyzePlaylists(),
      listenerStats: this.analyzeListenerStats(),
      albumTypes: this.analyzeAlbumTypes(),
      summary: {
        totalAlbums: this.data.albums.length,
        totalTracks: this.data.tracks.length,
        totalPlaylists: this.data.playlists.length,
        averageTrackPopularity: this.calculateAverage(
          this.data.topTracks.map(t => t.popularity)
        )
      }
    };

    console.log('分析完了！');
    return analysis;
  }
}

// メイン実行
async function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'latest.json');

  if (!fs.existsSync(dataPath)) {
    console.error('エラー: データファイルが見つかりません。先にfetch-spotify-data.jsを実行してください。');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const analyzer = new DataAnalyzer(rawData);
  const analysis = analyzer.generateFullAnalysis();

  // 分析結果を保存
  const outputPath = path.join(__dirname, '..', 'data', 'analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`分析結果を保存しました: ${outputPath}`);

  // サマリーを表示
  console.log('\n=== 分析サマリー ===');
  console.log(`アーティスト: ${analysis.artist.name}`);
  console.log(`フォロワー数: ${analysis.artist.followers.toLocaleString()}`);
  console.log(`人気度: ${analysis.artist.popularity}/100`);
  console.log(`総アルバム数: ${analysis.summary.totalAlbums}`);
  console.log(`総トラック数: ${analysis.summary.totalTracks}`);
  console.log(`プレイリスト数: ${analysis.summary.totalPlaylists}`);
  console.log(`平均トラック人気度: ${analysis.summary.averageTrackPopularity.toFixed(1)}/100`);
}

main();
