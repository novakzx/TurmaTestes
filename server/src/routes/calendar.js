import { Router } from 'express';
import { z } from 'zod';
import { getDb, nowIso, audit, insertReturningId } from '../db/index.js';
import { validateQuery, validateBody, cleanText } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { MUNICIPALITIES, DISTRICTS, slugify, fmtDate, parseDate } from '../services/pt-calendar.js';

const router = Router();

const EVENT_LABELS = {
  holiday_national: 'Feriado nacional',
  holiday_regional: 'Feriado regional',
  holiday_municipal: 'Feriado municipal',
  school_term: 'Período letivo',
  school_break: 'Férias escolares',
  strike: 'Greve',
  exam: 'Exame',
  custom: 'Evento',
};

function serializeEvent(e) {
  return {
    id: e.id,
    type: e.type,
    label: EVENT_LABELS[e.type] || e.type,
    title: e.title,
    description: e.description,
    dateStart: e.date_start,
    dateEnd: e.date_end,
    scope: e.scope,
    regionKey: e.region_key,
    official: !!e.official,
    source: e.source,
  };
}

/** Um evento é relevante para um utilizador se for nacional, ou se o
 *  município/distrito/região corresponder ao seu perfil (ou aos filtros). */
function relevantFor(e, municipalitySlug, districtSlug) {
  if (e.scope === 'national') return true;
  if (e.scope.startsWith('municipality:') && municipalitySlug && e.region_key === municipalitySlug) return true;
  if (e.scope.startsWith('district:') && districtSlug && e.region_key === districtSlug) return true;
  if (e.scope.startsWith('region:') && districtSlug) {
    if (e.region_key === 'acores' && districtSlug === 'acores') return true;
    if (e.region_key === 'madeira' && districtSlug === 'madeira') return true;
  }
  return false;
}

function userRegion(req) {
  const db = getDb();
  let municipality = req.query.municipality;
  let district = req.query.district;
  if (req.user && (!municipality || !district)) {
    const u = db.prepare('SELECT municipality, district FROM users WHERE id = ?').get(req.user.id);
    municipality = municipality || u?.municipality || '';
    district = district || u?.district || '';
  }
  return {
    municipalitySlug: slugify(municipality || ''),
    districtSlug: slugify(district || ''),
  };
}

router.get('/municipalities', (req, res) => {
  res.json({ municipalities: MUNICIPALITIES, districts: DISTRICTS });
});

const monthQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

router.get('/month', validateQuery(monthQuery), (req, res) => {
  const { year, month } = req.validQuery;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endD = new Date(Date.UTC(year, month, 0)); // último dia do mês
  const end = fmtDate(endD);
  const rows = getDb()
    .prepare('SELECT * FROM calendar_events WHERE date_end >= ? AND date_start <= ? ORDER BY date_start')
    .all(start, end);
  const region = userRegion(req);
  res.json({
    year, month,
    events: rows.filter((e) => relevantFor(e, region.municipalitySlug, region.districtSlug)).map(serializeEvent),
    region,
  });
});

const dayQuery = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato AAAA-MM-DD') });

router.get('/day', validateQuery(dayQuery), (req, res) => {
  const date = req.validQuery.date;
  const rows = getDb()
    .prepare('SELECT * FROM calendar_events WHERE date_start <= ? AND date_end >= ? ORDER BY date_start')
    .all(date, date);
  const region = userRegion(req);
  res.json({ date, events: rows.filter((e) => relevantFor(e, region.municipalitySlug, region.districtSlug)).map(serializeEvent) });
});

const upcomingQuery = z.object({ days: z.coerce.number().int().min(1).max(120).default(30) });

router.get('/upcoming', validateQuery(upcomingQuery), (req, res) => {
  const today = fmtDate(new Date());
  const until = fmtDate(new Date(Date.now() + req.validQuery.days * 86400000));
  const rows = getDb()
    .prepare('SELECT * FROM calendar_events WHERE date_end >= ? AND date_start <= ? ORDER BY date_start')
    .all(today, until);
  const region = userRegion(req);
  res.json({ events: rows.filter((e) => relevantFor(e, region.municipalitySlug, region.districtSlug)).map(serializeEvent) });
});

/** Exportação iCalendar (.ics) — integração com calendários do telefone. */
router.get('/export.ics', (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const rows = getDb()
    .prepare('SELECT * FROM calendar_events WHERE date_end >= ? AND date_start <= ? ORDER BY date_start')
    .all(`${year}-01-01`, `${year}-12-31`);
  const region = userRegion(req);
  const events = rows.filter((e) => relevantFor(e, region.municipalitySlug, region.districtSlug));
  const esc = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Turma+//Calendario Oficial PT//PT', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    const dtend = fmtDate(new Date(parseDate(e.date_end).getTime() + 86400000));
    lines.push(
      'BEGIN:VEVENT',
      `UID:tm-${e.id}@turmamais.pt`,
      `DTSTAMP:${nowIso().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART;VALUE=DATE:${e.date_start.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${dtend.replace(/-/g, '')}`,
      `SUMMARY:${esc(e.title)}`,
      e.description ? `DESCRIPTION:${esc(e.description)}` : '',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="turma-calendario-${year}.ics"`);
  res.send(lines.filter((l) => l !== '').join('\r\n'));
});

// --- Administração (greves e eventos) ----------------------------------------
const createEventSchema = z.object({
  type: z.enum(['strike', 'custom', 'exam', 'school_break']),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(1000).default(''),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scope: z.enum(['national']).or(z.string().regex(/^(district|municipality|region):[a-z0-9-]+$/)).default('national'),
  regionKey: z.string().trim().max(60).default(''),
  official: z.boolean().default(false),
  source: z.string().trim().max(200).default(''),
});

router.post('/events', requireAuth, requireAdmin, validateBody(createEventSchema), (req, res) => {
  const d = req.valid;
  const id = insertReturningId(
    `INSERT INTO calendar_events (type, title, description, date_start, date_end, scope, region_key, official, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.type, cleanText(d.title, 140), cleanText(d.description, 1000), d.dateStart, d.dateEnd || d.dateStart, d.scope, slugify(d.regionKey), d.official ? 1 : 0, cleanText(d.source, 200), nowIso()]
  );
  audit(req, 'calendar.create_event', 'ok', `${d.type} ${d.dateStart} ${d.scope}`);
  const e = getDb().prepare('SELECT * FROM calendar_events WHERE id = ?').get(id);
  res.status(201).json({ event: serializeEvent(e) });
});

router.delete('/events/:id(\\d+)', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const e = getDb().prepare('SELECT * FROM calendar_events WHERE id = ?').get(id);
  if (!e) return res.status(404).json({ error: 'Evento não encontrado.' });
  getDb().prepare('DELETE FROM calendar_events WHERE id = ?').run(id);
  audit(req, 'calendar.delete_event', 'ok', `${e.type} ${e.date_start}`);
  res.json({ ok: true });
});

export default router;
