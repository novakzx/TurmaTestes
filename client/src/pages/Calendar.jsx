import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useToast } from '../store/ToastContext.jsx';
import { Spinner, Empty, shortDate } from '../components/ui.jsx';
import {
  IconChevronLeft, IconChevronRight, IconCalendar, IconAlert, IconMapPin,
  IconDownload, IconClock,
} from '../components/Icons.jsx';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const FILTERS = [
  { id: 'holiday', label: 'Feriados', dot: 'dot-holiday' },
  { id: 'municipal', label: 'Municipais', dot: 'dot-municipal' },
  { id: 'school', label: 'Escola', dot: 'dot-school' },
  { id: 'strike', label: 'Greves', dot: 'dot-strike' },
  { id: 'exam', label: 'Exames', dot: 'dot-exam' },
];

const TYPE_GROUP = {
  holiday_national: 'holiday', holiday_regional: 'holiday', holiday_municipal: 'municipal',
  school_term: 'school', school_break: 'school', strike: 'strike', exam: 'exam', custom: 'school',
};

const DOT_CLASS = {
  holiday_national: 'dot-holiday', holiday_regional: 'dot-holiday', holiday_municipal: 'dot-municipal',
  school_term: 'dot-school', school_break: 'dot-break', strike: 'dot-strike', exam: 'dot-exam', custom: 'dot-custom',
};

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function iso(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
const todayIso = () => {
  const n = new Date();
  return iso(n.getFullYear(), n.getMonth() + 1, n.getDate());
};

export default function CalendarPage() {
  const { user, updateMe } = useAuth();
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(todayIso());
  const [municipalities, setMunicipalities] = useState({ municipalities: [], districts: [] });
  const [municipality, setMunicipality] = useState(user?.municipality || '');
  const [upcoming, setUpcoming] = useState([]);
  const [filters, setFilters] = useState({ holiday: true, municipal: true, school: true, strike: true, exam: true });

  useEffect(() => {
    api.get('/calendar/municipalities').then(setMunicipalities).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ year, month });
      if (municipality) q.set('municipality', municipality);
      const d = await api.get(`/calendar/month?${q}`);
      setEvents(d.events);
      const u = await api.get(`/calendar/upcoming?days=45${municipality ? `&municipality=${encodeURIComponent(municipality)}` : ''}`);
      setUpcoming(u.events.filter((e) => ['holiday_national', 'holiday_regional', 'holiday_municipal', 'strike', 'exam'].includes(e.type)).slice(0, 6));
    } catch { /* offline: servido pela cache SW */ } finally { setLoading(false); }
  }, [year, month, municipality]);

  useEffect(() => { load(); }, [load]);

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  };

  const onMunicipality = async (value) => {
    setMunicipality(value);
    const mun = municipalities.municipalities.find((m) => m.municipality === value);
    if (value) {
      updateMe({ municipality: value, district: mun?.district || user?.district || '' }).catch(() => {});
      toast(`Calendário ajustado para ${value}`);
    }
  };

  const exportIcs = () => {
    window.location.href = `/api/calendar/export.ics?year=${year}${municipality ? `&municipality=${encodeURIComponent(municipality)}` : ''}`;
  };

  // grelha do mês (semanas começam à segunda)
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const startOffset = (first.getUTCDay() + 6) % 7; // 0 = segunda
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const out = [];
    for (let i = 0; i < startOffset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push({ day: d, date: iso(year, month, d) });
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of events) {
      if (!filters[TYPE_GROUP[e.type] ?? 'school']) continue;
      const start = e.dateStart;
      const end = e.dateEnd || e.dateStart;
      for (const c of cells) {
        if (!c) continue;
        if (c.date >= start && c.date <= end) {
          (map[c.date] ||= []).push(e);
        }
      }
    }
    return map;
  }, [events, cells, filters]);

  const selectedEvents = useMemo(() => {
    const inDay = events.filter((e) => selected >= e.dateStart && selected <= (e.dateEnd || e.dateStart));
    return inDay.filter((e) => filters[TYPE_GROUP[e.type] ?? 'school']);
  }, [events, selected, filters]);

  const selectedDate = new Date(selected + 'T00:00:00');
  const selectedLabel = selectedDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page-wide">
      <div className="page-head spread">
        <div>
          <h1>Calendário oficial</h1>
          <p>Feriados nacionais, regionais e municipais · férias escolares · greves · exames</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={exportIcs} title="Descarregar .ics para o teu calendário">
          <IconDownload size={15} /> Exportar
        </button>
      </div>

      <div className="notice">
        <IconAlert size={16} />
        <span>
          As greves mostradas são <strong>dados de demonstração</strong> e o calendário escolar é uma <strong>estimativa</strong> do padrão típico.
          Em produção, esta secção é sincronizada com fontes oficiais (despacho anual da DGEstE e pré-avisos de greve publicados), com verificação editorial.
        </span>
      </div>

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="icon-btn" onClick={() => changeMonth(-1)} aria-label="Mês anterior"><IconChevronLeft size={20} /></button>
          <span className="month-label">{MONTHS[month - 1]} {year}</span>
          <button className="icon-btn" onClick={() => changeMonth(1)} aria-label="Mês seguinte"><IconChevronRight size={20} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth() + 1); setSelected(todayIso()); }}>Hoje</button>
        </div>
        <label className="row small" style={{ gap: 7 }}>
          <IconMapPin size={16} className="muted" />
          <select
            className="select" style={{ width: 'auto', padding: '7px 11px', fontSize: 13.5 }}
            value={municipality} onChange={(e) => onMunicipality(e.target.value)}
            aria-label="Feriado municipal"
          >
            <option value="">Feriado municipal — escolher…</option>
            {municipality && !municipalities.municipalities.some((m) => m.municipality === municipality) && (
              <option value={municipality}>{municipality}</option>
            )}
            {municipalities.municipalities.map((m) => (
              <option key={m.municipality} value={m.municipality}>{m.municipality} ({m.district})</option>
            ))}
          </select>
        </label>
      </div>

      <div className="cal-filters" role="group" aria-label="Filtros de eventos">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`chip ${filters[f.id] ? 'chip-active' : ''}`}
            onClick={() => setFilters((s) => ({ ...s, [f.id]: !s[f.id] }))}
            aria-pressed={filters[f.id]}
          >
            <span className={`dot ${f.dot}`} style={{ background: filters[f.id] ? '#fff' : undefined }} /> {f.label}
          </button>
        ))}
      </div>

      <div className="cal-layout">
        <div className="card cal-card">
          {loading ? (
            <div className="block-loader"><Spinner size={26} /></div>
          ) : (
            <>
              <div className="cal-weekdays" aria-hidden="true">
                {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
              </div>
              <div className="cal-grid" role="grid" aria-label={`Calendário de ${MONTHS[month - 1]} de ${year}`}>
                {cells.map((c, i) => {
                  if (!c) return <div key={`e${i}`} className="cal-cell cal-out" style={{ visibility: 'hidden' }} />;
                  const dayEvents = eventsByDate[c.date] || [];
                  const isToday = c.date === todayIso();
                  const isSel = c.date === selected;
                  const holiday = dayEvents.find((e) => e.type.startsWith('holiday'));
                  return (
                    <button
                      key={c.date}
                      role="gridcell"
                      aria-selected={isSel}
                      aria-label={`${c.day} de ${MONTHS[month - 1]}${dayEvents.length ? `, ${dayEvents.length} eventos` : ''}`}
                      className={`cal-cell ${isToday ? 'cal-today' : ''} ${isSel ? 'cal-selected' : ''}`}
                      onClick={() => setSelected(c.date)}
                    >
                      <span className="cal-daynum">{c.day}</span>
                      {holiday && <span className="cal-holiday-name">{holiday.title.replace(/^Feriado municipal — /, '').split(' (')[0]}</span>}
                      <span className="cal-dots">
                        {[...new Set(dayEvents.map((e) => DOT_CLASS[e.type] || 'dot-custom'))].slice(0, 4).map((cls) => (
                          <span key={cls} className={`dot ${cls}`} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Detalhe do dia selecionado (mobile: abaixo da grelha) */}
          <div className="mt-4 day-detail-mobile">
            <h3 style={{ fontSize: 14, marginBottom: 9, textTransform: 'capitalize' }}>{selectedLabel}</h3>
            {selectedEvents.length === 0 ? (
              <p className="muted small">Nenhum evento neste dia.</p>
            ) : (
              selectedEvents.map((e) => <EventCard key={e.id} event={e} />)
            )}
          </div>
        </div>

        {/* Coluna lateral (desktop) */}
        <aside className="col gap-2" aria-label="Próximos eventos">
          <div className="card rail-card" style={{ display: 'block' }}>
            <h3><IconClock size={16} /> Próximos 45 dias</h3>
            {upcoming.length === 0 && <p className="muted small">Sem eventos de momento.</p>}
            {upcoming.map((e) => (
              <button
                key={e.id}
                className="mini-item"
                onClick={() => {
                  const d = new Date(e.dateStart + 'T00:00:00');
                  setYear(d.getFullYear()); setMonth(d.getMonth() + 1); setSelected(e.dateStart);
                }}
              >
                <span className="row" style={{ minWidth: 0, gap: 8 }}>
                  <span className={`dot ${DOT_CLASS[e.type] || 'dot-custom'}`} />
                  <span className="col" style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700 }}>{e.title}</p>
                    <span className="muted small">{shortDate(e.dateStart)} · {e.label}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="card rail-card" style={{ display: 'block' }}>
            <h3><IconCalendar size={16} /> Dia selecionado</h3>
            <p className="muted small" style={{ textTransform: 'capitalize' }}>{selectedLabel}</p>
            <div className="mt-2">
              {selectedEvents.length === 0
                ? <p className="muted small">Nenhum evento.</p>
                : selectedEvents.map((e) => <EventCard key={e.id} event={e} compact />)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EventCard({ event: e, compact = false }) {
  return (
    <div className={`ev-card ev-${e.type}`}>
      <div className="ev-title">
        {e.title}
        {!e.official && <span className="tag tag-accent">{e.type === 'strike' ? 'demonstração' : 'estimativa'}</span>}
      </div>
      {!compact && e.description && <p className="ev-desc">{e.description}</p>}
      <div className="ev-meta">
        <span className="tag tag-muted">{e.label}</span>
        <span>{e.dateStart === e.dateEnd
          ? new Date(e.dateStart + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
          : `${shortDate(e.dateStart)} → ${shortDate(e.dateEnd)}`}</span>
        {e.scope !== 'national' && <span>· {e.scope.replace(/^(municipality|district|region):/, '')}</span>}
        {e.source && <span>· {e.source}</span>}
      </div>
    </div>
  );
}
