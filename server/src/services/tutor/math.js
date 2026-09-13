/**
 * Ferramentas matemáticas do Explicador — avaliador de expressões seguro
 * (parser próprio, sem eval/Function), resolvedor de equações do 2.º grau,
 * derivadas de polinómios e gerador de planos de estudo.
 * Todos os outputs são "fichas" estruturadas com passos explicados.
 */

// ---------------------------------------------------------------------------
// Normalização de notação pt-PT (vírgula decimal) e parser de expressões
// ---------------------------------------------------------------------------
export function normalizeExpression(input) {
  return String(input)
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/π/g, 'pi');
}

const CONSTS = { pi: Math.PI, e: Math.E };
const FUNCS = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  log: Math.log10, ln: Math.log, exp: Math.exp,
};

function tokenize(s) {
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      if ((num.match(/\./g) || []).length > 1) throw new Error('Número inválido');
      tokens.push({ t: 'num', v: parseFloat(num) });
    } else if (/[a-z]/.test(c)) {
      let name = '';
      while (i < s.length && /[a-z]/.test(s[i])) name += s[i++];
      tokens.push({ t: 'name', v: name });
    } else if ('+-*/^()'.includes(c)) {
      tokens.push({ t: c });
      i++;
    } else {
      throw new Error(`Carácter não suportado: "${c}"`);
    }
  }
  return tokens;
}

/** Parser de descida recursiva: expressão → termo → fator → potência → unário. */
function parseExpression(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = (t) => {
    if (!tokens[pos] || (t && tokens[pos].t !== t)) throw new Error('Expressão incompleta');
    return tokens[pos++];
  };

  function expression() {
    let v = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = eat().t;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function term() {
    let v = unary();
    while (peek() && (peek().t === '*' || peek().t === '/')) {
      const op = eat().t;
      const r = unary();
      if (op === '/' && r === 0) throw new Error('Divisão por zero');
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function unary() {
    if (peek()?.t === '-') { eat('-'); return -power(); }
    if (peek()?.t === '+') { eat('+'); return power(); }
    return power();
  }
  function power() {
    const base = atom();
    if (peek()?.t === '^') {
      eat('^');
      const exp = unary(); // direita-associativo: 2^3^2 = 2^(3^2)
      return Math.pow(base, exp);
    }
    return base;
  }
  function atom() {
    const tk = eat();
    if (tk.t === 'num') return tk.v;
    if (tk.t === 'name') {
      if (tk.v in CONSTS) return CONSTS[tk.v];
      if (tk.v in FUNCS) {
        eat('(');
        const arg = expression();
        eat(')');
        const r = FUNCS[tk.v](arg);
        if (!Number.isFinite(r)) throw new Error('Resultado fora do domínio');
        return r;
      }
      throw new Error(`Nome desconhecido: "${tk.v}"`);
    }
    if (tk.t === '(') {
      const v = expression();
      eat(')');
      return v;
    }
    throw new Error('Expressão inválida');
  }

  const value = expression();
  if (pos < tokens.length) throw new Error('Expressão inválida (sobra texto)');
  return value;
}

export function evaluateExpression(input) {
  const norm = normalizeExpression(input);
  if (!norm || norm.length > 200) throw new Error('Expressão vazia ou demasiado longa');
  const tokens = tokenize(norm);
  const value = parseExpression(tokens);
  if (!Number.isFinite(value)) throw new Error('Resultado indefinido');
  return { input: String(input).trim(), expression: norm, result: round(value) };
}

const round = (v, d = 6) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? 0 : r;
};

// ---------------------------------------------------------------------------
// Equação do 2.º grau: ax² + bx + c = 0 (fórmula resolvente, com passos)
// ---------------------------------------------------------------------------
export function solveQuadratic(a, b, c) {
  a = Number(a); b = Number(b); c = Number(c);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
    throw new Error('Coeficientes inválidos');
  }
  if (a === 0) {
    if (b === 0) throw new Error('Com a = 0 e b = 0 não é uma equação do 1.º/2.º grau');
    const x = round(-c / b);
    return {
      type: 'linear',
      passos: [
        `Com a = 0 a equação é do 1.º grau: ${b}x + (${c}) = 0`,
        `Isola x: x = −(${c}) / ${b}`,
      ],
      solutions: [x],
      display: `x = ${x}`,
    };
  }
  const delta = b * b - 4 * a * c;
  const passos = [
    `Identifica os coeficientes: a = ${a}, b = ${b}, c = ${c}`,
    `Calcula o discriminante: Δ = b² − 4ac = (${b})² − 4·(${a})·(${c}) = ${round(delta)}`,
  ];
  if (delta > 0) {
    const x1 = (-b + Math.sqrt(delta)) / (2 * a);
    const x2 = (-b - Math.sqrt(delta)) / (2 * a);
    passos.push(
      `Δ > 0 → duas soluções reais distintas`,
      `x = (−b ± √Δ) / 2a = (${-b} ± √${round(delta)}) / ${2 * a}`,
      `x₁ = ${round(x1)}   e   x₂ = ${round(x2)}`
    );
    return { type: 'two-real', delta: round(delta), solutions: [round(x1), round(x2)], passos, display: `x₁ = ${round(x1)}, x₂ = ${round(x2)}` };
  }
  if (delta === 0) {
    const x = -b / (2 * a);
    passos.push(`Δ = 0 → uma solução real dupla`, `x = −b / 2a = ${round(x)}`);
    return { type: 'double-real', delta: 0, solutions: [round(x)], passos, display: `x = ${round(x)} (raiz dupla)` };
  }
  const re = round(-b / (2 * a), 4);
  const im = round(Math.sqrt(-delta) / (2 * a), 4);
  passos.push(
    `Δ < 0 → não há soluções reais; no conjunto dos complexos:`,
    `x = ${re} ± ${Math.abs(im)}i`
  );
  return { type: 'complex', delta: round(delta), solutions: [`${re} + ${Math.abs(im)}i`, `${re} − ${Math.abs(im)}i`], passos, display: `x = ${re} ± ${Math.abs(im)}i (complexos)` };
}

/** Tenta extrair a, b, c de texto como "2x^2 - 5x + 3 = 0" ou "x2-4". */
export function parseQuadratic(text) {
  const s = normalizeExpression(text).replace(/\s/g, '').split('=')[0].replace(/-$/, '');
  let a = 0, b = 0, c = 0;
  const re = /([+-]?\d*\.?\d*)x\^2|([+-]?\d*\.?\d*)x(?!\^)|([+-]?\d+\.?\d*)(?!x)/g;
  let m;
  let matched = false;
  while ((m = re.exec(s))) {
    matched = true;
    const coef = (raw) => {
      if (raw === '' || raw === '+') return 1;
      if (raw === '-') return -1;
      return parseFloat(raw);
    };
    if (m[1] !== undefined) a += coef(m[1]);
    else if (m[2] !== undefined) b += coef(m[2]);
    else if (m[3] !== undefined) c += parseFloat(m[3]);
  }
  if (!matched) throw new Error('Não consegui ler a equação. Usa o formato ax² + bx + c (ex.: 2x^2 - 5x + 3).');
  return { a: round(a), b: round(b), c: round(c) };
}

// ---------------------------------------------------------------------------
// Derivada de polinómios (regra da potência, termo a termo)
// ---------------------------------------------------------------------------
export function derivativePolynomial(text) {
  const s = normalizeExpression(text).replace(/\s+/g, '');
  if (!/^[0-9x^+\-.]+$/.test(s)) throw new Error('Apenas polinómios em x (ex.: 3x^4 - 2x^2 + 5x - 7).');
  const terms = s
    .replace(/(?<=[^e])-/g, '+-')
    .split('+')
    .filter(Boolean);
  const out = [];
  const passos = [];
  for (const raw of terms) {
    let t = raw;
    let coef = 1, expo = 0;
    const m = t.match(/^([+-]?\d*\.?\d*)?x(?:\^(-?\d+))?$/) || t.match(/^([+-]?\d+\.?\d*)$/);
    if (!m) throw new Error(`Termo não suportado: "${raw}"`);
    if (t.includes('x')) {
      const cm = t.match(/^([+-]?\d*\.?\d*)/)[1];
      coef = cm === '' || cm === '+' ? 1 : cm === '-' ? -1 : parseFloat(cm);
      const em = t.match(/\^(-?\d+)/);
      expo = em ? parseInt(em[1], 10) : 1;
      if (expo === 0) continue;
      const nc = coef * expo;
      const ne = expo - 1;
      out.push({ c: nc, e: ne });
      passos.push(`d/dx [${t}] = ${coef === 1 ? '' : coef}·${expo}x^${ne}${ne === 0 ? ' = ' + nc : ''} → ${formatTerm(nc, ne)}`);
    } else {
      coef = parseFloat(t);
      passos.push(`d/dx [${t}] = 0 (derivada de uma constante)`);
    }
  }
  if (out.length === 0) return { input: text, derivative: '0', passos: [...passos, 'Resultado: f′(x) = 0'] };
  const expr = out.map((o, i) => (i === 0 ? formatTerm(o.c, o.e, true) : formatTerm(o.c, o.e))).join(' ');
  return { input: text, derivative: expr.replace(/\s+/g, ' ').trim(), passos: [...passos, `f′(x) = ${expr}`] };
}

function formatTerm(c, e, first = false) {
  const sign = c < 0 ? '−' : first ? '' : '+ ';
  const ac = Math.abs(c);
  const coefStr = ac === 1 && e > 0 ? '' : String(round(ac));
  if (e === 0) return `${sign}${coefStr || round(ac)}`;
  if (e === 1) return `${sign}${coefStr}x`;
  return `${sign}${coefStr}x^${e}`;
}

// ---------------------------------------------------------------------------
// Plano de estudo até uma data (exame/teste)
// ---------------------------------------------------------------------------
export function buildStudyPlan({ subject, targetDate, hoursPerWeek = 6, today = new Date() }) {
  const target = new Date(targetDate + 'T00:00:00Z');
  const now = new Date(today.toISOString().slice(0, 10) + 'T00:00:00Z');
  const days = Math.ceil((target - now) / 86400000);
  if (!Number.isFinite(days)) throw new Error('Data inválida');
  if (days <= 0) throw new Error('A data-alvo tem de ser no futuro.');
  const weeks = Math.max(1, Math.ceil(days / 7));
  const hours = Math.max(1, Math.min(40, Number(hoursPerWeek) || 6));

  const phases = [];
  const phaseDefs = [
    { name: 'Diagnóstico', weight: 0.1, focus: 'Lista todos os temas do programa; faz um teste de diagnóstico e marca o que está fraco (verde/amarelo/vermelho).' },
    { name: 'Revisão de conteúdos', weight: 0.4, focus: 'Percorre os temas vermelho→amarelo: apontamentos, manual e resumos próprios. Um tema por sessão.' },
    { name: 'Prática intensiva', weight: 0.35, focus: 'Exercícios e exames de anos anteriores cronometrados. Corrige com a matriz de correção e regista erros num "caderno de erros".' },
    { name: 'Consolidação e simulacro', weight: 0.15, focus: 'Simulacro completo em condições de exame + revisão do caderno de erros e fórmulas essenciais.' },
  ];
  let weekCursor = 1;
  for (const p of phaseDefs) {
    const w = Math.max(1, Math.round(weeks * p.weight));
    phases.push({
      fase: p.name,
      semanas: weeks >= 4 ? `${weekCursor}–${Math.min(weeks, weekCursor + w - 1)}` : '1',
      foco: p.focus,
      horasPorSemana: Math.round(hours * 10) / 10,
    });
    weekCursor += w;
    if (weekCursor > weeks) break;
  }
  return {
    disciplina: subject,
    dataAlvo: targetDate,
    diasRestantes: days,
    semanas: weeks,
    horasPorSemana: hours,
    fases: phases,
    rotinaSugerida: [
      `Sessões de ${Math.min(90, Math.round((hours * 60) / Math.max(2, Math.round(hours / 1.5))))} min, 2–3× por semana (técnica Pomodoro: 25–50 min de foco + 5–10 de pausa).`,
      'Começa sempre por recuperação ativa: fecha o livro e escreve o que sabes do tema da sessão anterior.',
      'Termina cada sessão com 5 minutos de planeamento da próxima.',
      'Nas últimas 48h antes da data: apenas caderno de erros, fórmulas e descanso — não estudes matéria nova.',
    ],
  };
}
