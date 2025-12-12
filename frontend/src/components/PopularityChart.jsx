import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function PopularityChart({ data }) {
  if (!data || !data.timeline) {
    return <p>データがありません</p>
  }

  const chartData = data.timeline.map((track, index) => ({
    name: track.name.length > 20 ? track.name.substring(0, 20) + '...' : track.name,
    popularity: track.popularity,
    fullName: track.name,
    album: track.album,
    date: track.releaseDate
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
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{data.fullName}</p>
          <p style={{ margin: '0', fontSize: '0.85rem', color: '#ccc' }}>アルバム: {data.album}</p>
          <p style={{ margin: '5px 0 0 0', color: '#1db954' }}>人気度: {data.popularity}/100</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#999' }}>リリース: {data.date}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.5)"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            domain={[0, 100]}
            label={{ value: '人気度', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="popularity"
            stroke="#1db954"
            strokeWidth={3}
            dot={{ fill: '#1db954', r: 5 }}
            activeDot={{ r: 8 }}
            name="人気度"
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(29, 185, 84, 0.1)', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1db954' }}>統計</h4>
        <p style={{ margin: '0.25rem 0' }}>平均人気度: {data.averagePopularity.toFixed(1)}/100</p>
        <p style={{ margin: '0.25rem 0' }}>
          最も人気: {data.mostPopular.name} ({data.mostPopular.popularity}/100)
        </p>
      </div>
    </div>
  )
}

export default PopularityChart
