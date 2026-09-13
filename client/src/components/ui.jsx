/** Peças de UI partilhadas: spinner, estados vazios, separadores, tempo relativo. */

export function Spinner({ size = 22 }) {
  return <span className="spinner" style={{ width: size, height: size }} role="progressbar" aria-label="A carregar" />;
}

export function Empty({ icon, title, hint }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`tab ${active === t.id ? 'tab-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count ? <span className="tab-count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

const rtf = new Intl.RelativeTimeFormat('pt-PT', { numeric: 'auto' });

/** Tempo relativo curto em pt-PT ("há 3 h", "ontem", "12/9"). */
export function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const diff = (then - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return 'agora';
  const units = [
    ['minute', 60], ['hour', 3600], ['day', 86400],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) < secs * (unit === 'minute' ? 60 : unit === 'hour' ? 24 : 7)) {
      return rtf.format(Math.round(diff / secs), unit);
    }
  }
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

export const datePt = (iso) =>
  new Date(iso).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

export const shortDate = (d) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}`;
};
