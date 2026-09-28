import { useEffect, useState } from 'react';

function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function ProgressBar({ progressMs = 0, durationMs = 0, isPlaying = false }) {
  const [progress, setProgress] = useState(progressMs);
  useEffect(() => { setProgress(progressMs); }, [progressMs]);
  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = window.setInterval(() => setProgress((current) => Math.min(current + 1000, durationMs)), 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, durationMs]);
  const percentage = durationMs ? Math.min(100, (progress / durationMs) * 100) : 0;
  return <div className="progress-wrap"><div className="progress-track" aria-label={`Progreso: ${formatTime(progress)} de ${formatTime(durationMs)}`} role="progressbar" aria-valuemin="0" aria-valuemax={durationMs} aria-valuenow={progress}><span style={{ width: `${percentage}%` }} /></div><div className="time-labels"><span>{formatTime(progress)}</span><span>{formatTime(durationMs)}</span></div></div>;
}
