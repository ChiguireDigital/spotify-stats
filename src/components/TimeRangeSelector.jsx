const ranges = [
  ['short_term', 'Short Term'],
  ['medium_term', 'Medium Term'],
  ['long_term', 'Long Term'],
];

export default function TimeRangeSelector({ value, onChange, label }) {
  return <div className="range-selector" aria-label={label} role="group">{ranges.map(([key, text]) => <button key={key} type="button" className={value === key ? 'is-active' : ''} onClick={() => onChange(key)} aria-pressed={value === key}>{text}</button>)}</div>;
}
