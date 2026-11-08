function formatSync(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export default function ProfileHeader({ profile, syncStatus }) {
  const name = profile?.display_name || 'tu espacio';
  const avatar = profile?.images?.[0]?.url;
  const last = formatSync(syncStatus?.lastCapturedAt || syncStatus?.lastPlayedAt);
  return (
    <header className="profile-header">
      <div>
        <p className="eyebrow">SPOTIFY STATS / DASHBOARD</p>
        <h1>Buenas, {name}</h1>
        <p className="header-subtitle">Una lectura personal de tus hábitos musicales.</p>
        <p className="header-subtitle" style={{ marginTop: 8 }}>
          {last ? `Última sincronización: ${last}` : 'Sincronizando datos…'}
        </p>
      </div>
      <a className="profile-chip" href={profile?.external_urls?.spotify || '#'} target="_blank" rel="noreferrer" aria-label="Abrir perfil de Spotify">
        {avatar ? <img src={avatar} alt="" /> : <span>{name.charAt(0).toUpperCase()}</span>}
        <strong>{name}</strong>
        <b aria-hidden="true">↗</b>
      </a>
    </header>
  );
}
