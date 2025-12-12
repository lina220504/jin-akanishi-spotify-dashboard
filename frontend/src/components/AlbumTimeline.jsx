import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function AlbumTimeline({ albums }) {
  if (!albums || albums.length === 0) {
    return <p>アルバムデータがありません</p>
  }

  // アルバムを年別にグループ化
  const albumsByYear = {}
  albums.forEach(album => {
    if (album.release_date) {
      const year = new Date(album.release_date).getFullYear()
      if (!albumsByYear[year]) {
        albumsByYear[year] = []
      }
      albumsByYear[year].push(album)
    }
  })

  // チャート用のデータを作成
  const data = Object.keys(albumsByYear)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(year => ({
      year: parseInt(year),
      albums: albumsByYear[year],
      totalTracks: albumsByYear[year].reduce((sum, album) => sum + (album.total_tracks || 0), 0)
    }))

  const chartData = data.map(yearData => ({
    year: yearData.year,
    albums: yearData.albums.length,
    tracks: yearData.totalTracks
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid #1db954',
          padding: '10px',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{data.year}年</p>
          <p style={{ margin: '5px 0', color: '#1db954' }}>アルバム数: {data.albums}</p>
          <p style={{ margin: '5px 0', color: '#1ed760' }}>総トラック数: {data.tracks}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="year"
            stroke="rgba(255,255,255,0.5)"
            label={{ value: '年', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.7)' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            label={{ value: '数', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="albums" fill="#1db954" name="アルバム数" />
          <Bar dataKey="tracks" fill="#1ed760" name="トラック数" />
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1db954' }}>年別リリース一覧</h4>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {data.map(yearData => (
            <div key={yearData.year} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>
                {yearData.year}年 ({yearData.albums.length}アルバム)
              </h5>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {yearData.albums.map((album, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                    {album.name} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({album.total_tracks}曲)</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AlbumTimeline
