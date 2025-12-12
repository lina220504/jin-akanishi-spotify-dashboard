import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

function PlaylistAnalysis({ data }) {
  if (!data || data.total === 0) {
    return <p>データがありません</p>
  }

  const COLORS = ['#1db954', '#1ed760', '#17a349', '#14853b', '#11672e']

  const categoryData = Object.entries(data.categories).map(([name, count]) => ({
    name: translateCategory(name),
    value: count
  }))

  function translateCategory(category) {
    const translations = {
      official: '公式',
      fan: 'ファン作成',
      genre: 'ジャンル別',
      mood: 'ムード別',
      other: 'その他'
    }
    return translations[category] || category
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid #1db954',
          padding: '10px',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0', fontWeight: 'bold' }}>{data.name}</p>
          <p style={{ margin: '5px 0 0 0', color: '#1db954' }}>{data.value}プレイリスト</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(29, 185, 84, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1db954', fontSize: '0.9rem' }}>総プレイリスト数</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1db954' }}>{data.total}</p>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(29, 185, 84, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1db954', fontSize: '0.9rem' }}>総フォロワー数</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1db954' }}>
            {data.totalFollowers.toLocaleString()}
          </p>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(29, 185, 84, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1db954', fontSize: '0.9rem' }}>平均フォロワー数</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1db954' }}>
            {data.averageFollowers.toLocaleString()}
          </p>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(29, 185, 84, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1db954', fontSize: '0.9rem' }}>総トラック数</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1db954' }}>
            {data.totalTracks.toLocaleString()}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1db954' }}>カテゴリ別分布</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1db954' }}>人気プレイリスト トップ10</h4>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {data.topPlaylists.map((playlist, index) => (
            <div
              key={playlist.name}
              style={{
                padding: '1rem',
                marginBottom: '0.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1db954', minWidth: '30px' }}>
                #{index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 0.25rem 0' }}>{playlist.name}</h5>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  作成者: {playlist.owner}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 0.25rem 0', color: '#1db954', fontWeight: 'bold' }}>
                  {playlist.followers.toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  フォロワー
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 0.25rem 0', color: '#1ed760', fontWeight: 'bold' }}>
                  {playlist.tracks}
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  トラック
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlaylistAnalysis
