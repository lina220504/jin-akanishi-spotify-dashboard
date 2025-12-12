import './TopTracks.css'

function TopTracks({ tracks }) {
  return (
    <div className="top-tracks">
      {tracks.map((track, index) => (
        <div key={track.id} className="track-item">
          <div className="track-rank">#{index + 1}</div>
          {track.album.images && track.album.images[0] && (
            <img
              src={track.album.images[0].url}
              alt={track.album.name}
              className="track-image"
            />
          )}
          <div className="track-info">
            <h4 className="track-name">{track.name}</h4>
            <p className="track-album">{track.album.name}</p>
          </div>
          <div className="track-stats">
            <div className="popularity-bar">
              <div
                className="popularity-fill"
                style={{ width: `${track.popularity}%` }}
              />
            </div>
            <span className="popularity-value">{track.popularity}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TopTracks
