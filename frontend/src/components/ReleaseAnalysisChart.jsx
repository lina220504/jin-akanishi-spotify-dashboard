import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from 'recharts';
import './ReleaseAnalysisChart.css';

function ReleaseAnalysisChart({ tracks }) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="release-analysis-chart">
        <p>トラックデータがありません</p>
      </div>
    );
  }

  // トラックデータを準備
  const trackData = tracks
    .filter(track => track.album && track.album.release_date)
    .map(track => {
      const releaseDate = new Date(track.album.release_date);
      const now = new Date();
      const ageInYears = (now - releaseDate) / (1000 * 60 * 60 * 24 * 365);

      return {
        name: track.name,
        album: track.album.name,
        releaseDate: track.album.release_date,
        releaseYear: releaseDate.getFullYear(),
        ageInYears: parseFloat(ageInYears.toFixed(1)),
        popularity: 0, // トラックにpopularityがない場合は0
        duration: track.duration_ms ? track.duration_ms / 60000 : 0 // 分単位
      };
    });

  // 統計情報の計算
  const stats = {
    totalTracks: trackData.length,
    yearRange: {
      min: Math.min(...trackData.map(t => t.releaseYear)),
      max: Math.max(...trackData.map(t => t.releaseYear))
    },
    avgDuration: (trackData.reduce((sum, t) => sum + t.duration, 0) / trackData.length).toFixed(1)
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="label"><strong>{data.name}</strong></p>
          {data.album && <p>アルバム: {data.album}</p>}
          <p>リリース: {data.releaseDate}</p>
          <p>経過年数: {data.ageInYears}年</p>
          {data.duration > 0 && <p>長さ: {data.duration.toFixed(1)}分</p>}
          {data.totalTracks > 0 && <p>トラック数: {data.totalTracks}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="release-analysis-chart">
      <div className="chart-container">
        <h3>リリース年 vs 楽曲の長さ</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="releaseYear"
              name="リリース年"
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <YAxis
              type="number"
              dataKey="duration"
              name="長さ (分)"
              domain={[0, 'dataMax + 1']}
            />
            <ZAxis range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Scatter
              name="トラック"
              data={trackData}
              fill="#8b5cf6"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">総トラック数:</span>
          <span className="summary-value">{stats.totalTracks}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">活動期間:</span>
          <span className="summary-value">
            {stats.yearRange.min} - {stats.yearRange.max}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">平均曲長:</span>
          <span className="summary-value">{stats.avgDuration}分</span>
        </div>
      </div>
    </div>
  );
}

export default ReleaseAnalysisChart;
