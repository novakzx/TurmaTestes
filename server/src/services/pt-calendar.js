/**
 * Calendário oficial português — geração de eventos.
 *
 * Fontes de referência (documentadas em docs/01-escopo.md):
 *  - Feriados nacionais: Lei n.º 66/77 e alterações (13 feriados nacionais +
 *    Carnaval, que é facultativo/tolerância de ponto no continente).
 *  - Feriados regionais: Dia da Região Autónoma dos Açores (segunda-feira do
 *    Espírito Santo) e Dia da Região Autónoma da Madeira (1 de julho) +
 *    tolerância regional da Primeira Oitava (26 de dezembro, Madeira).
 *  - Feriados municipais: lista curada dos municípios mais relevantes para a
 *    base de utilizadores; extensível (cada câmara municipal publica o seu).
 *  - Calendário escolar: em produção deve ser sincronizado com o despacho
 *    anual do Ministério da Educação (DGEstE). Aqui é gerado com base no
 *    padrão típico e marcado como "estimativa" (official = 0).
 */

export const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const addDays = (dateStr, n) => {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return fmtDate(d);
};

/** Domingo de Páscoa — algoritmo gregoriano anónimo (Meeus/Jones/Butcher). */
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return fmtDate(new Date(Date.UTC(year, month - 1, day)));
}

/** Fixa uma data (ano, mês 1-12, dia) em YYYY-MM-DD. */
const fixed = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// ---------------------------------------------------------------------------
// Feriados nacionais
// ---------------------------------------------------------------------------
export function nationalHolidays(year) {
  const easter = easterSunday(year);
  return [
    { date: fixed(year, 1, 1), title: 'Ano Novo', description: 'Santa Maria, Mãe de Deus. Feriado nacional.', official: true },
    { date: addDays(easter, -47), title: 'Carnaval (Terça-feira de Carnaval)', description: 'Dia facultativo — geralmente concedida tolerância de ponto na função pública e suspensão de atividades letivas.', official: false },
    { date: addDays(easter, -2), title: 'Sexta-feira Santa', description: 'Feriado nacional móvel (sexta-feira anterior ao Domingo de Páscoa).', official: true },
    { date: easter, title: 'Domingo de Páscoa', description: 'Feriado nacional móvel.', official: true },
    { date: addDays(easter, 60), title: 'Corpo de Deus', description: 'Feriado nacional móvel (60 dias após a Páscoa).', official: true },
    { date: fixed(year, 4, 25), title: 'Dia da Liberdade', description: '25 de Abril de 1974 — Revolução dos Cravos. Feriado nacional.', official: true },
    { date: fixed(year, 5, 1), title: 'Dia do Trabalhador', description: 'Feriado nacional.', official: true },
    { date: fixed(year, 6, 10), title: 'Dia de Portugal, de Camões e das Comunidades Portuguesas', description: 'Feriado nacional.', official: true },
    { date: fixed(year, 8, 15), title: 'Assunção de Nossa Senhora', description: 'Feriado nacional.', official: true },
    { date: fixed(year, 10, 5), title: 'Implantação da República', description: '5 de Outubro de 1910. Feriado nacional.', official: true },
    { date: fixed(year, 11, 1), title: 'Dia de Todos os Santos', description: 'Feriado nacional.', official: true },
    { date: fixed(year, 12, 1), title: 'Restauração da Independência', description: '1 de Dezembro de 1640. Feriado nacional.', official: true },
    { date: fixed(year, 12, 8), title: 'Imaculada Conceição', description: 'Feriado nacional.', official: true },
    { date: fixed(year, 12, 25), title: 'Natal', description: 'Feriado nacional.', official: true },
  ].map((h) => ({
    type: 'holiday_national',
    scope: 'national',
    region_key: '',
    source: 'Lei n.º 66/77 (feriados nacionais)',
    ...h,
  }));
}

// ---------------------------------------------------------------------------
// Feriados regionais (Regiões Autónomas)
// ---------------------------------------------------------------------------
export function regionalHolidays(year) {
  const easter = easterSunday(year);
  return [
    {
      type: 'holiday_regional', date: addDays(easter, 50), date_end: null,
      title: 'Dia da Região Autónoma dos Açores',
      description: 'Segunda-feira do Espírito Santo (Pentecostes). Feriado regional nos Açores.',
      scope: 'region:acores', region_key: 'acores', official: true,
      source: 'Decreto Regulamentar Regional n.º 13/80/A',
    },
    {
      type: 'holiday_regional', date: fixed(year, 7, 1), date_end: null,
      title: 'Dia da Região Autónoma da Madeira e das Comunidades Madeirenses',
      description: 'Feriado regional na Madeira.',
      scope: 'region:madeira', region_key: 'madeira', official: true,
      source: 'Decreto Regulamentar Regional n.º 18/79/M',
    },
    {
      type: 'holiday_regional', date: fixed(year, 12, 26), date_end: null,
      title: 'Primeira Oitava (Madeira)',
      description: 'Tolerância regional na Madeira no dia seguinte ao Natal.',
      scope: 'region:madeira', region_key: 'madeira', official: false,
      source: 'Prática regional (Madeira)',
    },
  ];
}

// ---------------------------------------------------------------------------
// Feriados municipais (lista curada e extensível)
// movable: 'ascensao' = quinta-feira da Ascensão (39 dias após a Páscoa)
// ---------------------------------------------------------------------------
export const MUNICIPAL_HOLIDAYS = [
  { municipality: 'Lisboa', district: 'Lisboa', month: 6, day: 13, name: 'Santo António', note: 'Dia de Santo António, padroeiro popular de Lisboa.' },
  { municipality: 'Cascais', district: 'Lisboa', month: 6, day: 13, name: 'Santo António' },
  { municipality: 'Sintra', district: 'Lisboa', month: 6, day: 29, name: 'São Pedro' },
  { municipality: 'Porto', district: 'Porto', month: 6, day: 24, name: 'São João', note: 'Festa de São João do Porto.' },
  { municipality: 'Vila Nova de Gaia', district: 'Porto', month: 6, day: 24, name: 'São João' },
  { municipality: 'Braga', district: 'Braga', month: 6, day: 24, name: 'São João', note: 'São João de Braga.' },
  { municipality: 'Guimarães', district: 'Braga', month: 6, day: 24, name: 'São João' },
  { municipality: 'Coimbra', district: 'Coimbra', month: 7, day: 4, name: 'Rainha Santa Isabel' },
  { municipality: 'Aveiro', district: 'Aveiro', month: 5, day: 12, name: 'Santa Joana Princesa' },
  { municipality: 'Setúbal', district: 'Setúbal', month: 9, day: 15, name: 'Bocage / Dia da Cidade' },
  { municipality: 'Almada', district: 'Setúbal', month: 6, day: 24, name: 'São João' },
  { municipality: 'Leiria', district: 'Leiria', month: 5, day: 22, name: 'Dia da Cidade de Leiria' },
  { municipality: 'Santarém', district: 'Santarém', month: 3, day: 19, name: 'São José' },
  { municipality: 'Viseu', district: 'Viseu', month: 9, day: 21, name: 'São Mateus' },
  { municipality: 'Faro', district: 'Faro', month: 9, day: 7, name: 'Dia do Município de Faro' },
  { municipality: 'Viana do Castelo', district: 'Viana do Castelo', month: 8, day: 20, name: 'Nossa Senhora d’Agonia' },
  { municipality: 'Vila Real', district: 'Vila Real', month: 5, day: 13, name: 'Dia da Cidade de Vila Real' },
  { municipality: 'Bragança', district: 'Bragança', month: 8, day: 22, name: 'Dia da Cidade de Bragança' },
  { municipality: 'Elvas', district: 'Portalegre', month: 1, day: 14, name: 'Batalha das Linhas de Elvas' },
  { municipality: 'Beja', district: 'Beja', movable: 'ascensao', name: 'Quinta-feira da Ascensão', note: 'Dia da Espiga.' },
  { municipality: 'Mafra', district: 'Lisboa', movable: 'ascensao', name: 'Quinta-feira da Ascensão', note: 'Dia da Espiga.' },
  { municipality: 'Funchal', district: 'Madeira', month: 8, day: 21, name: 'Dia da Cidade do Funchal' },
  { municipality: 'Angra do Heroísmo', district: 'Açores', month: 6, day: 24, name: 'São João' },
  { municipality: 'Horta', district: 'Açores', month: 6, day: 24, name: 'São João' },
];

export function municipalHolidays(year) {
  const easter = easterSunday(year);
  return MUNICIPAL_HOLIDAYS.map((m) => {
    const date =
      m.movable === 'ascensao' ? addDays(easter, 39) : fixed(year, m.month, m.day);
    const slug = slugify(m.municipality);
    return {
      type: 'holiday_municipal',
      date,
      title: `Feriado municipal — ${m.municipality} (${m.name})`,
      description: `${m.note || 'Feriado municipal de ' + m.municipality + '.'} Distrito de ${m.district}.`,
      scope: `municipality:${slug}`,
      region_key: slug,
      official: true,
      source: `Câmara Municipal de ${m.municipality}`,
      municipality: m.municipality,
      district: m.district,
    };
  });
}

export const MUNICIPALITIES = MUNICIPAL_HOLIDAYS.map((m) => ({
  municipality: m.municipality,
  district: m.district,
}));

export const DISTRICTS = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora',
  'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém',
  'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Açores', 'Madeira',
];

export function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// Calendário escolar (estimativa baseada no padrão típico dos despachos
// anuais — em produção, sincronizar com o calendário oficial da DGEstE).
// ---------------------------------------------------------------------------
export function schoolYearEvents(startYear) {
  const y = startYear;
  const official = false;
  const source = 'Estimativa com base no padrão típico — confirmar no despacho anual da DGEstE';
  const ev = (type, title, description, date, date_end) => ({
    type, title, description, date, date_end: date_end || date, scope: 'national',
    region_key: '', official, source,
  });
  return [
    ev('school_term', `1.º período ${y}/${y + 1}`, 'Início do ano letivo — 1.º período.', `${y}-09-15`, `${y}-12-18`),
    ev('school_break', `Férias de Natal ${y}/${y + 1}`, 'Interrupção letiva do Natal.', `${y}-12-21`, `${y + 1}-01-02`),
    ev('school_term', `2.º período ${y}/${y + 1}`, '2.º período letivo.', `${y + 1}-01-05`, `${y + 1}-03-27`),
    ev('school_break', `Férias da Páscoa ${y}/${y + 1}`, 'Interrupção letiva da Páscoa.', `${y + 1}-03-30`, `${y + 1}-04-10`),
    ev('school_term', `3.º período ${y}/${y + 1}`, '3.º período letivo (termos escalonados por ano de escolaridade).', `${y + 1}-04-13`, `${y + 1}-06-09`),
    ev('exam', `Exames nacionais — 1.ª fase ${y + 1}`, '1.ª fase dos exames finais nacionais do ensino secundário (datas estimadas).', `${y + 1}-06-15`, `${y + 1}-06-26`),
    ev('exam', `Exames nacionais — 2.ª fase ${y + 1}`, '2.ª fase dos exames finais nacionais (datas estimadas).', `${y + 1}-07-20`, `${y + 1}-07-24`),
  ];
}

// ---------------------------------------------------------------------------
// Greves escolares (dados de demonstração — em produção este feed seria
// alimentado por avisos oficiais: pré-avisos sindicais publicados, DGAE/ME)
// ---------------------------------------------------------------------------
export function seedStrikes(todayIso) {
  const t = new Date(todayIso);
  const d = (offsetDays) => {
    const x = new Date(t.getTime());
    x.setUTCDate(x.getUTCDate() + offsetDays);
    return fmtDate(x);
  };
  return [
    {
      type: 'strike', date: d(9), date_end: d(9),
      title: 'Greve nacional do pessoal docente (demonstração)',
      description:
        'Registo de demonstração. Pré-aviso de greve ao pessoal docente e não docente para todo o território continental — serviços mínimos aplicáveis a exames. Em produção, esta informação seria validada a partir de fontes oficiais (avisos sindicais / Ministério da Educação).',
      scope: 'national', region_key: '', official: false,
      source: 'Dados de demonstração Turma+',
    },
    {
      type: 'strike', date: d(23), date_end: d(24),
      title: 'Greve regional — escolas do distrito do Porto (demonstração)',
      description:
        'Registo de demonstração de greve com impacto regional (distrito do Porto), incluindo pessoal não docente. Confirma sempre junto da tua escola.',
      scope: 'district:porto', region_key: 'porto', official: false,
      source: 'Dados de demonstração Turma+',
    },
    {
      type: 'strike', date: d(-4), date_end: d(-4),
      title: 'Greve ao primeiro tempo de aulas — secundário (demonstração)',
      description:
        'Registo de demonstração (ocorrido há dias): greve ao primeiro tempo letivo convocada por associação de estudantes do secundário.',
      scope: 'national', region_key: '', official: false,
      source: 'Dados de demonstração Turma+',
    },
  ];
}

/** Gera todos os eventos de calendário para um conjunto de anos. */
export function generateCalendarEvents(years, todayIso) {
  const events = [];
  for (const y of years) {
    // schoolYearEvents(y) cobre set(y)→jul(y+1); percorrer vários anos dá cobertura total
    events.push(...nationalHolidays(y), ...regionalHolidays(y), ...municipalHolidays(y), ...schoolYearEvents(y));
  }
  events.push(...seedStrikes(todayIso));
  return events.map((e) => ({ ...e, date_end: e.date_end || e.date }));
}
