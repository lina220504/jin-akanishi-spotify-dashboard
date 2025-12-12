import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const ARTIST_ID = process.env.ARTIST_ID || '3Z3TqPXlrrRdm7IP3pQXjw'; // 赤西仁

// 環境変数のチェック
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ エラー: Spotify APIの認証情報が設定されていません\n');
  console.error('以下のコマンドで環境変数を設定してから実行してください:\n');
  console.error('export SPOTIFY_CLIENT_ID="あなたのClient ID"');
  console.error('export SPOTIFY_CLIENT_SECRET="あなたのClient Secret"');
  console.error('export ARTIST_ID="アーティストID" # オプション\n');
  process.exit(1);
}

class SpotifyDataFetcher {
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

  // アーティスト情報を取得
  async getArtistInfo() {
    const token = await this.getAccessToken();
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${ARTIST_ID}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('アーティスト情報取得エラー:', JSON.stringify(error.response?.data, null, 2) || error.message);
      console.error('使用したARTIST_ID:', ARTIST_ID);
      throw error;
    }
  }

  // アーティストのトップトラックを取得
  async getTopTracks() {
    const token = await this.getAccessToken();
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${ARTIST_ID}/top-tracks?market=JP`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      return response.data.tracks;
    } catch (error) {
      console.error('トップトラック取得エラー:', error.response?.data || error.message);
      throw error;
    }
  }

  // アルバム一覧を取得
  async getAlbums() {
    const token = await this.getAccessToken();
    let allAlbums = [];
    let url = `https://api.spotify.com/v1/artists/${ARTIST_ID}/albums?include_groups=album,single&market=JP&limit=50`;

    try {
      while (url) {
        const response = await axios.get(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        allAlbums = allAlbums.concat(response.data.items);
        url = response.data.next;
      }
      return allAlbums;
    } catch (error) {
      console.error('アルバム取得エラー:', error.response?.data || error.message);
      throw error;
    }
  }

  // アルバムの全トラックを取得
  async getAlbumTracks(albumId) {
    const token = await this.getAccessToken();
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/albums/${albumId}/tracks`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      return response.data.items;
    } catch (error) {
      console.error(`アルバム ${albumId} のトラック取得エラー:`, error.response?.data || error.message);
      return [];
    }
  }

  // トラックの音響特徴を取得（最大100トラックまで一度に取得可能）
  async getAudioFeatures(trackIds) {
    const token = await this.getAccessToken();
    const chunks = [];

    // 100トラックずつに分割
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }

    let allFeatures = [];
    try {
      for (const chunk of chunks) {
        const response = await axios.get(
          `https://api.spotify.com/v1/audio-features?ids=${chunk.join(',')}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        allFeatures = allFeatures.concat(response.data.audio_features.filter(f => f !== null));
      }
      return allFeatures;
    } catch (error) {
      console.error('音響特徴取得エラー:', error.response?.data || error.message);
      return [];
    }
  }

  // アーティストが含まれるプレイリストを検索
  async searchPlaylists() {
    const token = await this.getAccessToken();
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=赤西仁&type=playlist&market=JP&limit=50`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      return response.data.playlists.items;
    } catch (error) {
      console.error('プレイリスト検索エラー:', error.response?.data || error.message);
      return [];
    }
  }

  // 全データを収集
  async fetchAllData() {
    console.log('データ取得を開始します...');

    // アーティスト基本情報
    console.log('1. アーティスト情報を取得中...');
    const artistInfo = await this.getArtistInfo();

    // トップトラック
    console.log('2. トップトラックを取得中...');
    const topTracks = await this.getTopTracks();

    // アルバム
    console.log('3. アルバム一覧を取得中...');
    const albums = await this.getAlbums();

    // 全トラック情報を収集
    console.log('4. 全トラック情報を取得中...');
    const allTracks = [];
    const trackIds = new Set();

    for (const album of albums) {
      const tracks = await this.getAlbumTracks(album.id);
      tracks.forEach(track => {
        if (!trackIds.has(track.id)) {
          trackIds.add(track.id);
          allTracks.push({
            ...track,
            album: {
              id: album.id,
              name: album.name,
              release_date: album.release_date,
              images: album.images
            }
          });
        }
      });
      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 音響特徴を取得
    console.log('5. トラックの音響特徴を取得中...');
    let audioFeatures = [];
    try {
      audioFeatures = await this.getAudioFeatures(Array.from(trackIds));
      if (audioFeatures.length === 0) {
        console.log('⚠ 音響特徴データを取得できませんでした（APIの権限が不足している可能性があります）');
      }
    } catch (error) {
      console.log('⚠ 音響特徴の取得をスキップします:', error.response?.data?.error?.message || error.message);
    }

    // プレイリスト情報
    console.log('6. プレイリスト情報を取得中...');
    const playlists = await this.searchPlaylists();

    const data = {
      lastUpdated: new Date().toISOString(),
      artist: {
        id: artistInfo.id,
        name: artistInfo.name,
        followers: artistInfo.followers.total,
        popularity: artistInfo.popularity,
        genres: artistInfo.genres,
        images: artistInfo.images
      },
      topTracks: topTracks.map(track => ({
        id: track.id,
        name: track.name,
        popularity: track.popularity,
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        album: {
          name: track.album.name,
          release_date: track.album.release_date,
          images: track.album.images
        }
      })),
      albums: albums.map(album => ({
        id: album.id,
        name: album.name,
        release_date: album.release_date,
        total_tracks: album.total_tracks,
        album_type: album.album_type,
        images: album.images
      })),
      tracks: allTracks.map(track => ({
        id: track.id,
        name: track.name,
        duration_ms: track.duration_ms,
        track_number: track.track_number,
        album: track.album
      })),
      audioFeatures: audioFeatures,
      playlists: playlists.filter(p => p && p.id).map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        followers: playlist.followers?.total || 0,
        tracks_total: playlist.tracks?.total || 0,
        images: playlist.images || [],
        owner: playlist.owner?.display_name || 'Unknown'
      }))
    };

    console.log('データ取得完了！');
    console.log(`- アーティストフォロワー数: ${data.artist.followers.toLocaleString()}`);
    console.log(`- アルバム数: ${data.albums.length}`);
    console.log(`- トラック数: ${data.tracks.length}`);
    console.log(`- 音響特徴データ: ${data.audioFeatures.length}トラック`);
    console.log(`- プレイリスト: ${data.playlists.length}`);

    return data;
  }

  // データをファイルに保存
  async saveData(data) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 最新データ
    const latestPath = path.join(dataDir, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));

    // 履歴データ（日付付き）
    const timestamp = new Date().toISOString().split('T')[0];
    const historyPath = path.join(dataDir, `history-${timestamp}.json`);
    fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));

    console.log(`データを保存しました: ${latestPath}`);
    console.log(`履歴を保存しました: ${historyPath}`);
  }
}

// メイン実行
async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('エラー: SPOTIFY_CLIENT_IDとSPOTIFY_CLIENT_SECRETを.envファイルに設定してください');
    process.exit(1);
  }

  const fetcher = new SpotifyDataFetcher();
  try {
    const data = await fetcher.fetchAllData();
    await fetcher.saveData(data);
    console.log('すべての処理が完了しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
