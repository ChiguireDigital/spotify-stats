export default function Sidebar({ profile, onLogout }) {
  const name = profile?.display_name || 'Usuario';
  return <aside className="sidebar"><a className="sidebar-brand" href="#dashboard"><span>♪</span><strong>Spotify<br />Stats</strong></a><nav className="sidebar-nav" aria-label="Navegación principal"><a className="active" href="#dashboard">Dashboard</a><a href="#top-artists">Top Artists</a><a href="#top-tracks">Top Tracks</a><a href="#recently-played">Recently Played</a></nav><div className="sidebar-account"><div className="account-line"><span className="account-avatar">{name.charAt(0).toUpperCase()}</span><span><small>Sesión activa</small><strong>{name}</strong></span></div><button className="logout-button" type="button" onClick={onLogout}>Cerrar sesión</button></div></aside>;
}
