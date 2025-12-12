import './ArtistHeader.css'

function ArtistHeader({ artist, lastUpdated }) {
  return (
    <header className="artist-header">
      <div className="artist-header-content">
        {artist.images && artist.images[0] && (
          <img
            src={artist.images[0].url}
            alt={artist.name}
            className="artist-image"
          />
        )}
        <div className="artist-info">
          <h1 className="artist-name">{artist.name}</h1>
          <p className="dashboard-subtitle">Jip's による Jip'sのためのダッシュボード</p>
          <div className="artist-genres">
            {artist.genres.map((genre, index) => (
              <span key={index} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>
          <p className="update-time">
            最終更新: {new Date(lastUpdated).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </div>
    </header>
  )
}

export default ArtistHeader
