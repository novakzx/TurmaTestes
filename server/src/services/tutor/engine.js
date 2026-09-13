/**
 * Explicador Turma+ — motor de apoio ao estudo.
 *
 * Por omissão funciona com o motor local (base de conhecimento curada +
 * ferramentas matemáticas): 100% gratuito e offline, sem dependência externa.
 * Se o operador configurar AI_PROVIDER=openai + AI_API_KEY, as perguntas sem
 * correspondência local são respondidas por um LLM (compatível OpenAI), que
 * devolve a MESMA estrutura de "ficha de estudo" — a UI nunca muda.
 */
import { config } from '../../config.js';
import { KNOWLEDGE, genericFicha } from './knowledge.js';
import { evaluateExpression, parseQuadratic, solveQuadratic, derivativePolynomial } from './math.js';

const normalize = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Pontua entradas da base de conhecimento contra a pergunta. */
function matchKnowledge(question, subject) {
  const q = normalize(question);
  const words = new Set(q.split(' ').filter((w) => w.length > 2));
  const scored = KNOWLEDGE.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      const k = normalize(kw);
      if (q.includes(k)) score += k.includes(' ') ? 3 : 2; // expressão composta vale mais
      else if (words.has(k)) score += 2;
    }
    for (const t of entry.titulos) {
      const tn = normalize(t);
      if (q.includes(tn)) score += 3;
    }
    if (subject && entry.disciplinas.some((d) => normalize(d) === normalize(subject))) {
      score = score > 0 ? score + 1 : 0; // disciplina preferida só conta se houver match
    }
    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0] || null;
}

function localFicha(question, subject) {
  const match = matchKnowledge(question, subject);
  if (!match) return { ficha: genericFicha(question, subject), engine: 'local-generic' };
  return {
    ficha: {
      ...match.entry.ficha,
      disciplina: match.entry.disciplinas[0],
      relacionadotemas: match.entry.titulos,
    },
    engine: 'local',
  };
}

/** Provedor LLM opcional (compatível OpenAI). Devolve null em qualquer falha. */
async function llmFicha(question, subject) {
  if (config.ai.provider !== 'openai' || !config.ai.apiKey) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const resp = await fetch(`${config.ai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'És o motor pedagógico do Turma+, uma app para estudantes do ensino básico e secundário em Portugal. ' +
              'Responde SEMPRE em português europeu e devolve apenas JSON com esta estrutura exata: ' +
              '{"titulo": string, "resumo": string (2-4 frases, resposta direta), "passos": string[] (passo a passo), ' +
              '"conceitos": [{"nome": string, "definicao": string}], "exemplo": {"enunciado": string, "resolucao": string[]}, ' +
              '"exercicios": [{"enunciado": string, "dica": string, "solucao": string}], "recursos": [{"titulo": string, "descricao": string}]}. ' +
              'Sê rigoroso com o currículo português (Ensino Básico/Secundário, exames nacionais IAVE). Nunca inventes factos.',
          },
          {
            role: 'user',
            content: subject
              ? `Disciplina: ${subject}. Dúvida do estudante: ${question}`
              : `Dúvida do estudante: ${question}`,
          },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || 'null');
    if (!parsed || typeof parsed.resumo !== 'string') return null;
    parsed.disciplina = subject || '';
    return { ficha: parsed, engine: 'llm' };
  } catch {
    return null; // falha silenciosa → motor local garante resposta
  }
}

/** Gera a ficha de estudo para uma dúvida. */
export async function generateFicha({ question, subject }) {
  const local = localFicha(question, subject);
  if (local.engine === 'local') return local; // match forte da base curada
  const llm = await llmFicha(question, subject);
  return llm || local;
}

// ---------------------------------------------------------------------------
// Ferramentas (calculadora, equações, derivadas) — endpoints dedicados
// ---------------------------------------------------------------------------
export function calcTool(kind, payload) {
  switch (kind) {
    case 'expression':
      return evaluateExpression(payload.expression);
    case 'quadratic': {
      let { a, b, c } = payload;
      if (payload.text) ({ a, b, c } = parseQuadratic(payload.text));
      if (a === undefined || b === undefined || c === undefined) {
        throw new Error('Indica os coeficientes a, b e c (ou escreve a equação completa).');
      }
      return solveQuadratic(a, b ?? 0, c ?? 0);
    }
    case 'derivative':
      return derivativePolynomial(payload.expression);
    default:
      throw new Error('Ferramenta desconhecida');
  }
}
