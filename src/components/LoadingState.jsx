export default function LoadingState({ label = 'Cargando…', compact = false }) {
  return <div className={`loading-state ${compact ? 'is-compact' : ''}`} role="status"><span className="loading-dot" />{label}</div>;
}
