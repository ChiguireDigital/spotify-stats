const defaultRanges = [
  ['short_term', '4 semanas'],
  ['medium_term', '6 meses'],
  ['long_term', 'Siempre'],
];

export default function TimeRangeSelector({ value, onChange, label, options = defaultRanges }) {
  return (
    <div className="range-selector" aria-label={label} role="group">
      {options.map(([key, text]) => (
        <button key={key} type="button" className={value === key ? 'is-active' : ''} onClick={() => onChange(key)} aria-pressed={value === key}>{text}</button>
      ))}
    </div>
  );
}
