import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import TimeRangeSelector from './TimeRangeSelector';

const periods = [
  ['4w', '4 semanas'],
  ['6m', '6 meses'],
  ['all', 'Todo lo guardado'],
];

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(Number(ms || 0) / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ListeningSummary({ summary, period, onPeriodChange, loading, error }) {
  return (
    <section className="stats-section listening-summary" id="listening-summary" aria-labelledby="h-listening">
      <div className="section-head">
        <div>
          <h2 id="h-listening">Tiempo escuchado</h2>
          <p className="section-note">Estimado según las reproducciones que tu cuenta ha guardado en esta app.</p>
        </div>
        <TimeRangeSelector value={period} onChange={onPeriodChange} label="Periodo de tiempo escuchado" options={periods} />
      </div>
      {loading && !summary ? <LoadingState label="Calculando tu escucha…" /> : error && !summary ? <ErrorState /> : summary ? (
        <div className="summary-grid">
          <div className="summary-main">
            <p className="summary-kicker">Tiempo estimado</p>
            <p className="summary-value">{formatDuration(summary.ms)}</p>
          </div>
          <div className="summary-metrics">
            <div className="summary-metric"><strong>{Number(summary.plays || 0).toLocaleString('es-PE')}</strong><span>reproducciones</span></div>
            <div className="summary-metric"><strong>{Number(summary.tracks || 0).toLocaleString('es-PE')}</strong><span>canciones distintas</span></div>
            <div className="summary-metric"><strong>{Number(summary.artists || 0).toLocaleString('es-PE')}</strong><span>artistas distintos</span></div>
          </div>
        </div>
      ) : <EmptyState>Aún no hay historial guardado para este periodo.</EmptyState>}
    </section>
  );
}
