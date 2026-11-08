export default function TopNav({ profile, onLogout }) {
  const name = profile?.display_name || 'Usuario';
  return (
    <nav className="top-nav" aria-label="Principal">
      <a className="brand" href="#dashboard">Spotify Stats</a>
      <div className="nav-links">
        <a href="#dashboard" aria-current="page">Inicio</a>
        <a href="#top-artists">Artistas</a>
        <a href="#top-tracks">Canciones</a>
        <a href="#recently-played">Historial</a>
      </div>
      <div className="nav-account">
        <span className="nav-user">{name}</span>
        <button type="button" className="nav-logout" onClick={onLogout}>Salir</button>
      </div>
    </nav>
  );
}
