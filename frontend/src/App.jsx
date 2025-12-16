import { useState, useEffect } from 'react'
import './App.css'
import ArtistHeader from './components/ArtistHeader'
import PopularityChart from './components/PopularityChart'
import PopularityTrendChart from './components/PopularityTrendChart'
import ReleaseAnalysisChart from './components/ReleaseAnalysisChart'
import AudioFeaturesRadar from './components/AudioFeaturesRadar'
import AlbumTimeline from './components/AlbumTimeline'
import TopTracks from './components/TopTracks'

function App() {
  const [data, setData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Viteのベースパスを使用
      const basePath = import.meta.env.BASE_URL
      console.log('🔧 BASE_URL:', basePath)
      console.log('🔧 Fetching:', `${basePath}data/latest.json`)
      const dataResponse = await fetch(`${basePath}data/latest.json`)

      if (!dataResponse.ok) {
        throw new Error('データの読み込みに失敗しました')
      }

      const rawData = await dataResponse.json()
      setData(rawData)

      // analysis.jsonはオプショナル
      try {
        const analysisResponse = await fetch(`${basePath}data/analysis.json`)
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          setAnalysis(analysisData)
        }
      } catch (err) {
        console.log('Analysis data not available:', err)
      }

      // popularity-trends.jsonはオプショナル
      try {
        const trendsResponse = await fetch(`${basePath}data/popularity-trends.json`)
        if (trendsResponse.ok) {
          const trendsData = await trendsResponse.json()
          setTrends(trendsData)
        }
      } catch (err) {
        console.log('Trends data not available:', err)
      }

      setError(null)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>データを読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>エラー</h2>
        <p>{error}</p>
        <button onClick={loadData}>再試行</button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="error-container">
        <h2>データが見つかりません</h2>
        <p>バックエンドスクリプトを実行してデータを生成してください。</p>
      </div>
    )
  }

  return (
    <div className="app">
      <ArtistHeader
        artist={data.artist}
        lastUpdated={data.lastUpdated}
      />

      <main className="dashboard">
        <section className="stats-overview">
          <div className="stat-card">
            <h3>フォロワー数</h3>
            <p className="stat-value">{data.artist.followers.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>人気度</h3>
            <p className="stat-value">{data.artist.popularity}/100</p>
          </div>
          <div className="stat-card">
            <h3>アルバム数</h3>
            <p className="stat-value">{data.albums?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>トラック数</h3>
            <p className="stat-value">{data.tracks?.length || 0}</p>
          </div>
        </section>

        {trends && (
          <section className="chart-section">
            <h2>人気度の推移</h2>
            <PopularityTrendChart trendsData={trends} />
          </section>
        )}

        <section className="chart-section">
          <h2>トップトラック</h2>
          <TopTracks tracks={data.topTracks} />
        </section>

        {data.tracks && data.tracks.length > 0 && (
          <section className="chart-section">
            <h2>リリース分析</h2>
            <ReleaseAnalysisChart tracks={data.tracks} albums={data.albums} />
          </section>
        )}

        {analysis?.popularityTrends && (
          <section className="chart-section">
            <h2>楽曲人気度の推移</h2>
            <PopularityChart data={analysis.popularityTrends} />
          </section>
        )}

        {data.audioFeatures && data.audioFeatures.length > 0 && (
          <section className="chart-section">
            <h2>音響特徴の分析</h2>
            <AudioFeaturesRadar data={data.audioFeatures} />
          </section>
        )}

        {data.albums && data.albums.length > 0 && (
          <section className="chart-section">
            <h2>年別アルバム一覧</h2>
            <AlbumTimeline albums={data.albums} />
          </section>
        )}
      </main>

      <footer className="footer">
        <p>最終更新: {new Date(data.lastUpdated).toLocaleString('ja-JP')}</p>
        <p>Data from Spotify Web API</p>
      </footer>
    </div>
  )
}

export default App
