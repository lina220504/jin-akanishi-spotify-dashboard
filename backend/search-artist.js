import axios from 'axios';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// アクセストークンを取得
async function getAccessToken() {
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
    return response.data.access_token;
  } catch (error) {
    console.error('トークン取得エラー:', error.response?.data || error.message);
    throw error;
  }
}

// アーティストを検索
async function searchArtist(query) {
  const token = await getAccessToken();
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    return response.data.artists.items;
  } catch (error) {
    console.error('検索エラー:', error.response?.data || error.message);
    throw error;
  }
}

// ユーザー入力を取得
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// .envファイルを更新
function updateEnvFile(artistId) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // ARTIST_ID行を更新
  if (envContent.includes('ARTIST_ID=')) {
    envContent = envContent.replace(/ARTIST_ID=.*/g, `ARTIST_ID=${artistId}`);
  } else {
    envContent += `\n# 選択したアーティストID\nARTIST_ID=${artistId}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('\n✓ .envファイルを更新しました！');
}

// メイン処理
async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('エラー: SPOTIFY_CLIENT_IDとSPOTIFY_CLIENT_SECRETを.envファイルに設定してください');
    process.exit(1);
  }

  console.log('========================================');
  console.log('   Spotifyアーティスト検索ツール');
  console.log('========================================\n');

  const artistName = await askQuestion('アーティスト名を入力してください: ');

  console.log(`\n"${artistName}" を検索中...\n`);

  const artists = await searchArtist(artistName);

  if (artists.length === 0) {
    console.log('アーティストが見つかりませんでした。');
    process.exit(0);
  }

  console.log('検索結果:\n');
  artists.forEach((artist, index) => {
    const followers = artist.followers.total.toLocaleString();
    const genres = artist.genres.length > 0 ? artist.genres.slice(0, 3).join(', ') : 'ジャンル情報なし';
    console.log(`[${index + 1}] ${artist.name}`);
    console.log(`    フォロワー: ${followers}`);
    console.log(`    ジャンル: ${genres}`);
    console.log(`    ID: ${artist.id}`);
    console.log('');
  });

  const selection = await askQuestion('番号を選択してください (1-' + artists.length + '): ');
  const selectedIndex = parseInt(selection) - 1;

  if (selectedIndex < 0 || selectedIndex >= artists.length) {
    console.log('無効な選択です。');
    process.exit(1);
  }

  const selectedArtist = artists[selectedIndex];
  console.log(`\n✓ "${selectedArtist.name}" を選択しました`);
  console.log(`  ID: ${selectedArtist.id}`);

  updateEnvFile(selectedArtist.id);

  console.log('\n次のコマンドでデータ取得を開始できます:');
  console.log('  npm run fetch-data');
}

main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
