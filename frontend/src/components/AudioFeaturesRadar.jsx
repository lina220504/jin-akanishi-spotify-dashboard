import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts'

function AudioFeaturesRadar({ data }) {
  if (!data || !data.statistics) {
    return <p>データがありません</p>
  }

  const stats = data.statistics

  const chartData = [
    { feature: 'エネルギー', value: (stats.energy.average * 100).toFixed(1) },
    { feature: 'ダンス性', value: (stats.danceability.average * 100).toFixed(1) },
    { feature: 'ポジティブ度', value: (stats.valence.average * 100).toFixed(1) },
    { feature: 'アコースティック', value: (stats.acousticness.average * 100).toFixed(1) },
    { feature: 'ライブ感', value: (stats.liveness.average * 100).toFixed(1) },
    { feature: 'スピーチ性', value: (stats.speechiness.average * 100).toFixed(1) },
  ]

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis
            dataKey="feature"
            stroke="rgba(255,255,255,0.7)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)' }}
          />
          <Radar
            name="平均値"
            dataKey="value"
            stroke="#1db954"
            fill="#1db954"
            fillOpacity={0.6}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
        </RadarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1db954' }}>注目楽曲</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {data.highlights.mostEnergetic && (
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>最もエネルギッシュ</h5>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{data.highlights.mostEnergetic.trackName}</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                エネルギー: {(data.highlights.mostEnergetic.value * 100).toFixed(0)}%
              </p>
            </div>
          )}
          {data.highlights.mostDanceable && (
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>最もダンサブル</h5>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{data.highlights.mostDanceable.trackName}</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                ダンス性: {(data.highlights.mostDanceable.value * 100).toFixed(0)}%
              </p>
            </div>
          )}
          {data.highlights.mostAcoustic && (
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>最もアコースティック</h5>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{data.highlights.mostAcoustic.trackName}</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                アコースティック: {(data.highlights.mostAcoustic.value * 100).toFixed(0)}%
              </p>
            </div>
          )}
          {data.highlights.happiest && (
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>最も明るい曲</h5>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{data.highlights.happiest.trackName}</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                ポジティブ度: {(data.highlights.happiest.value * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(29, 185, 84, 0.1)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>詳細統計</h4>
          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
            平均テンポ: {stats.tempo.average.toFixed(1)} BPM (範囲: {stats.tempo.min.toFixed(0)} - {stats.tempo.max.toFixed(0)})
          </p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
            平均ラウドネス: {stats.loudness.average.toFixed(1)} dB
          </p>
        </div>
      </div>
    </div>
  )
}

export default AudioFeaturesRadar
