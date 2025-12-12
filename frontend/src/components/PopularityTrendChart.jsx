import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PopularityTrendChart.css';

function PopularityTrendChart({ trendsData }) {
  const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'year'
  const [selectedTracks, setSelectedTracks] = useState([]);

  if (!trendsData || !trendsData.artistPopularity) {
    return (
      <div className="popularity-trend-chart">
        <p>人気度の履歴データがありません。定期的にデータを取得してください。</p>
        <code>npm run track-popularity</code>
      </div>
    );
  }

  // データを期間ごとに集計
  const aggregateData = (data, period) => {
    if (!data || data.length === 0) return [];

    const grouped = {};

    data.forEach(item => {
      const date = new Date(item.date);
      let key;

      switch (period) {
        case 'week':
          // 週単位 (日曜日始まり)
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          // 月単位
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          // 年単位
          key = String(date.getFullYear());
          break;
        default:
          key = item.date;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          values: [],
          followers: []
        };
      }

      grouped[key].values.push(item.popularity);
      if (item.followers) {
        grouped[key].followers.push(item.followers);
      }
    });

    return Object.values(grouped).map(group => ({
      date: group.date,
      popularity: Math.round(group.values.reduce((a, b) => a + b, 0) / group.values.length),
      followers: group.followers.length > 0
        ? Math.round(group.followers.reduce((a, b) => a + b, 0) / group.followers.length)
        : null
    }));
  };

  // トラック別データを集計
  const aggregateTrackData = (trackHistory, period) => {
    if (!trackHistory || trackHistory.length === 0) return [];

    const grouped = {};

    trackHistory.forEach(item => {
      const date = new Date(item.date);
      let key;

      switch (period) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = item.date;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          values: []
        };
      }

      grouped[key].values.push(item.popularity);
    });

    return Object.values(grouped).map(group => ({
      date: group.date,
      popularity: Math.round(group.values.reduce((a, b) => a + b, 0) / group.values.length)
    }));
  };

  // アーティストデータを集計
  const artistData = aggregateData(trendsData.artistPopularity, timeframe);

  // 選択されたトラックのデータを準備
  const trackDatasets = selectedTracks.map(trackId => {
    const track = trendsData.trackPopularity.find(t => t.id === trackId);
    if (!track) return null;

    return {
      id: track.id,
      name: track.name,
      data: aggregateTrackData(track.history, timeframe)
    };
  }).filter(Boolean);

  // グラフ用のデータを統合
  const chartData = artistData.map(artistPoint => {
    const point = {
      date: artistPoint.date,
      artist: artistPoint.popularity
    };

    trackDatasets.forEach(track => {
      const trackPoint = track.data.find(d => d.date === artistPoint.date);
      point[track.id] = trackPoint ? trackPoint.popularity : null;
    });

    return point;
  });

  // トラック選択の切り替え
  const toggleTrack = (trackId) => {
    setSelectedTracks(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  // 色のパレット
  const colors = ['#1DB954', '#1ed760', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'];

  // 日付フォーマット
  const formatDate = (dateStr) => {
    if (timeframe === 'year') {
      return dateStr;
    } else if (timeframe === 'month') {
      const [year, month] = dateStr.split('-');
      return `${year}/${month}`;
    } else {
      return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="popularity-trend-chart">
      <div className="chart-controls">
        <div className="timeframe-buttons">
          <button
            className={timeframe === 'week' ? 'active' : ''}
            onClick={() => setTimeframe('week')}
          >
            週別
          </button>
          <button
            className={timeframe === 'month' ? 'active' : ''}
            onClick={() => setTimeframe('month')}
          >
            月別
          </button>
          <button
            className={timeframe === 'year' ? 'active' : ''}
            onClick={() => setTimeframe('year')}
          >
            年別
          </button>
        </div>

        <div className="track-selector">
          <label>トラックを選択:</label>
          <div className="track-list">
            {trendsData.trackPopularity.slice(0, 10).map((track, index) => (
              <label key={track.id} className="track-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTracks.includes(track.id)}
                  onChange={() => toggleTrack(track.id)}
                />
                <span>{track.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
          />
          <YAxis
            domain={[0, 100]}
            label={{ value: '人気度', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            labelFormatter={formatDate}
            formatter={(value) => [value, '人気度']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="artist"
            stroke="#8b5cf6"
            strokeWidth={3}
            name="アーティスト全体"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          {trackDatasets.map((track, index) => (
            <Line
              key={track.id}
              type="monotone"
              dataKey={track.id}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              name={track.name}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="chart-info">
        <p>データポイント数: {trendsData.dataPoints}</p>
        <p>期間: {trendsData.dateRange?.start} 〜 {trendsData.dateRange?.end}</p>
      </div>
    </div>
  );
}

export default PopularityTrendChart;
