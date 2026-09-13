import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../store/ToastContext.jsx';
import { Tabs, Spinner, Empty, timeAgo } from '../components/ui.jsx';
import {
  IconBook, IconCalc, IconTarget, IconClock, IconBookmark, IconCheck,
  IconChevronDown, IconRefresh, FILLED,
} from '../components/Icons.jsx';
import FichaCard from '../components/FichaCard.jsx';

const SUGGESTIONS = {
  'Matemática A': ['Como resolvo equações do 2.º grau?', 'Explica derivadas e a reta tangente', 'Valores notáveis de seno e cosseno'],
  'Física e Química A': ['Leis de Newton na prática', 'Como se calcula o pH?', 'O que é uma reação redox?'],
  'Biologia e Geologia': ['Fotossíntese vs respiração celular', 'Diferenças entre mitose e meiose', 'Como funciona o DNA?'],
  'Português': ['Resumo d\'Os Lusíadas', 'Heterónimos de Fernando Pessoa', 'Como escrever um texto argumentativo?'],
  'História A': ['Causas da expansão portuguesa', 'Estado Novo e 25 de Abril', 'Revolução Industrial'],
  'Geografia A': ['População portuguesa e envelhecimento'],
  'Filosofia': ['Racionalismo vs empirismo', 'Kant vs utilitarismo', 'Validade de argumentos e falácias'],
  'Inglês': ['Present Perfect vs Past Simple'],
  'Economia A': ['Como funciona a oferta e a procura?'],
  'Métodos de estudo': ['Como organizar o estudo?', 'Como me preparo para os exames nacionais?', 'Não consigo concentrar-me'],
  '': ['Como resolvo equações do 2.º grau?', 'Como organizar o estudo?', 'Leis de Newton na prática', 'Heterónimos de Fernando Pessoa'],
};

export default function Tutor() {
  const { toast } = useToast();
  const [tab, setTab] = useState('duvidas');
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null); // { id, ficha, engine }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);
  const [saved, setSaved] = useState(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    api.get('/tutor/subjects').then((d) => setSubjects(d.subjects)).catch(() => {});
    api.get('/tutor/fichas?saved=1').then((d) => { setSaved(d.fichas); setSavedCount(d.fichas.length); }).catch(() => {});
    api.get('/tutor/fichas').then((d) => setHistory(d.fichas.slice(0, 8))).catch(() => {});
  }, []);

  const suggestions = useMemo(() => SUGGESTIONS[subject] || SUGGESTIONS[''], [subject]);

  const ask = async (q) => {
    const text = (q ?? question).trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
    try {
      const d = await api.post('/tutor/ficha', { question: text, subject });
      setResult(d);
      setQuestion('');
      setHistory((h) => [{ id: d.id, subject, question: text, ficha: d.ficha, saved: false, createdAt: new Date().toISOString() }, ...(h || [])].slice(0, 8));
    } catch (e) {
      setError(e.message || 'Não foi possível gerar a ficha.');
    } finally {
      setBusy(false);
    }
  };

  const toggleSave = async (id, nowSaved) => {
    try {
      const d = await api.post(`/tutor/fichas/${id}/save`);
      toast(d.saved ? 'Ficha guardada nos Apontamentos 📌' : 'Removida dos Apontamentos');
      if (result?.id === id) setResult((r) => ({ ...r, ficha: r.ficha, saved: d.saved }));
      const fresh = await api.get('/tutor/fichas?saved=1');
      setSaved(fresh.fichas);
      setSavedCount(fresh.fichas.length);
    } catch { /* ignora */ }
  };

  return (
    <div className="page-wide">
      <div className="page-head">
        <h1>Apoio ao estudo</h1>
        <p>Fichas de estudo do currículo português, ferramentas de cálculo e planos — gratuito e disponível offline</p>
      </div>

      <Tabs
        tabs={[
          { id: 'duvidas', label: 'Dúvidas' },
          { id: 'ferramentas', label: 'Ferramentas' },
          { id: 'apontamentos', label: 'Apontamentos', count: savedCount || undefined },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'duvidas' && (
        <div className="cal-layout">
          <div>
            <div className="card ask-card">
              <div className="field" style={{ marginBottom: 10 }}>
                <label htmlFor="subject">Disciplina (opcional)</label>
                <select id="subject" className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">Geral</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label htmlFor="question">A tua dúvida</label>
                <textarea
                  id="question" className="textarea"
                  placeholder="Ex.: Como resolvo uma equação do 2.º grau com a fórmula resolvente?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 1000))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask(); }}
                />
              </div>
              <div className="spread">
                <span className="muted small">Ctrl/⌘ + Enter para gerar</span>
                <button className="btn btn-primary" onClick={() => ask()} disabled={busy || question.trim().length < 4}>
                  {busy ? <><Spinner size={16} /> A preparar…</> : <><IconBook size={17} /> Criar ficha de estudo</>}
                </button>
              </div>
              {error && <p className="form-error mt-2">{error}</p>}
              <div className="ask-suggest">
                {suggestions.map((s) => (
                  <button key={s} className="chip" onClick={() => { setQuestion(s); ask(s); }} disabled={busy}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {busy && !result && (
              <div className="card ask-card center" style={{ padding: 34 }}>
                <Spinner size={30} />
                <p className="muted mt-3 small">A preparar a tua ficha de estudo…</p>
              </div>
            )}

            {result && !busy && (
              <FichaCard
                entry={{ id: result.id, question, subject, ficha: result.ficha, saved: result.saved, createdAt: new Date().toISOString() }}
                onSave={toggleSave}
                onDismiss={() => setResult(null)}
              />
            )}

            {history && history.length > 0 && !busy && (
              <div className="card rail-card mt-3" style={{ display: 'block' }}>
                <h3><IconClock size={15} /> Dúvidas recentes</h3>
                <div className="mini-list">
                  {history.map((h) => (
                    <button key={h.id} className="mini-item" onClick={() => setResult({ id: h.id, ficha: h.ficha, saved: h.saved, engine: 'histórico' })}>
                      <p style={{ fontWeight: 600 }}>{h.question}</p>
                      <span className="muted small" style={{ flex: 'none' }}>{timeAgo(h.createdAt)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="col gap-2" aria-label="Como funciona">
            <div className="card rail-card" style={{ display: 'block' }}>
              <h3><IconTarget size={16} /> Como funciona</h3>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                <li>Escreve a dúvida como falarias com um colega.</li>
                <li>Recebes uma <strong>ficha de estudo</strong>: resposta direta, passos, conceitos, exemplo e exercícios.</li>
                <li>Guarda as melhores nos <strong>Apontamentos</strong> e revê antes do teste.</li>
              </ol>
              <p className="muted small mt-3">
                As fichas seguem o currículo português (básico e secundário). Sem chatbots, sem esperas, sem custos.
              </p>
            </div>
            <div className="card rail-card" style={{ display: 'block' }}>
              <h3><IconCalc size={16} /> Ferramentas rápidas</h3>
              <button className="btn btn-soft btn-sm btn-block mb-2" onClick={() => setTab('ferramentas')}>Equações do 2.º grau com passos</button>
              <button className="btn btn-soft btn-sm btn-block mb-2" onClick={() => setTab('ferramentas')}>Derivadas de polinómios</button>
              <button className="btn btn-soft btn-sm btn-block" onClick={() => setTab('ferramentas')}>Plano de estudo até ao exame</button>
            </div>
          </aside>
        </div>
      )}

      {tab === 'ferramentas' && <Tools onPlan={() => toast('Plano gerado!')} />}

      {tab === 'apontamentos' && (
        <div>
          {saved === null ? (
            <div className="block-loader"><Spinner size={26} /></div>
          ) : saved.length === 0 ? (
            <Empty
              icon={<IconBookmark size={40} />}
              title="Ainda não guardaste fichas"
              hint='Cria uma ficha no separador "Dúvidas" e toca em Guardar para a teres aqui — disponível mesmo offline.'
            />
          ) : (
            saved.map((h) => (
              <FichaCard key={h.id} entry={h} onSave={toggleSave} collapsed />
            ))
          )}
          <div className="card rail-card mt-3" style={{ display: 'block' }}>
            <h3><IconBookmark size={15} /> Publicações guardadas</h3>
            <p className="muted small">Os posts que guardaste com 🔖 vivem no teu perfil.</p>
            <Link to="/perfil?tab=saved" className="btn btn-outline btn-sm mt-2">Ver no Perfil</Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ferramentas
// ---------------------------------------------------------------------------
function Tools({ onPlan }) {
  const { toast } = useToast();
  const [expr, setExpr] = useState('');
  const [exprRes, setExprRes] = useState(null);
  const [quad, setQuad] = useState({ a: '', b: '', c: '', text: '' });
  const [quadRes, setQuadRes] = useState(null);
  const [deriv, setDeriv] = useState('');
  const [derivRes, setDerivRes] = useState(null);
  const [plan, setPlan] = useState({ subject: '', targetDate: '', hoursPerWeek: 6 });
  const [planRes, setPlanRes] = useState(null);
  const [err, setErr] = useState({});

  const run = async (kind, payload, setter, key) => {
    setErr((e) => ({ ...e, [key]: '' }));
    try {
      const d = await api.post('/tutor/tools', { kind, ...payload });
      setter(d.result);
    } catch (e) {
      setErr((s) => ({ ...s, [key]: e.message }));
    }
  };

  const runPlan = async () => {
    setErr((e) => ({ ...e, plan: '' }));
    try {
      const d = await api.post('/tutor/plan', {
        subject: plan.subject || 'Geral',
        targetDate: plan.targetDate,
        hoursPerWeek: Number(plan.hoursPerWeek) || 6,
      });
      setPlanRes(d.plan);
      onPlan?.();
    } catch (e) {
      setErr((s) => ({ ...s, plan: e.message }));
    }
  };

  return (
    <div className="tool-grid">
      {/* Calculadora */}
      <div className="card tool-card">
        <h3><IconCalc size={17} /> Calculadora científica</h3>
        <p className="muted">Expressões com + − × ÷ ^, parêntesis, √, sin, cos, tan, log, ln. Aceita vírgula decimal.</p>
        <div className="row">
          <input className="input" placeholder="Ex.: raiz(144) + 2^5 ou √144+2^5" value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && expr.trim() && run('expression', { expression: expr }, setExprRes, 'expr')} />
          <button className="btn btn-primary" onClick={() => run('expression', { expression: expr }, setExprRes, 'expr')} disabled={!expr.trim()}>=</button>
        </div>
        {err.expr && <p className="form-error mt-2">{err.expr}</p>}
        {exprRes && <div className="calc-result">{exprRes.expression} = {exprRes.result}</div>}
      </div>

      {/* Equação 2.º grau */}
      <div className="card tool-card">
        <h3><IconTarget size={17} /> Equação do 2.º grau</h3>
        <p className="muted">ax² + bx + c = 0 — com todos os passos e o discriminante.</p>
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <input className="input" placeholder="a" value={quad.a} onChange={(e) => setQuad((q) => ({ ...q, a: e.target.value }))} aria-label="Coeficiente a" />
          <input className="input" placeholder="b" value={quad.b} onChange={(e) => setQuad((q) => ({ ...q, b: e.target.value }))} aria-label="Coeficiente b" />
          <input className="input" placeholder="c" value={quad.c} onChange={(e) => setQuad((q) => ({ ...q, c: e.target.value }))} aria-label="Coeficiente c" />
        </div>
        <div className="row mt-2">
          <input className="input" placeholder="…ou cola a equação: 2x^2 - 5x + 3 = 0" value={quad.text} onChange={(e) => setQuad((q) => ({ ...q, text: e.target.value }))} aria-label="Equação por extenso" />
          <button className="btn btn-primary" onClick={() => run('quadratic', quad.text.trim() ? { text: quad.text } : { a: quad.a || 0, b: quad.b || 0, c: quad.c || 0 }, setQuadRes, 'quad')}>Resolver</button>
        </div>
        {err.quad && <p className="form-error mt-2">{err.quad}</p>}
        {quadRes && (
          <>
            <div className="calc-result">{quadRes.display}</div>
            <ol className="calc-steps">{quadRes.passos.map((p, i) => <li key={i}>{p}</li>)}</ol>
          </>
        )}
      </div>

      {/* Derivada */}
      <div className="card tool-card">
        <h3><IconRefresh size={17} /> Derivada de polinómios</h3>
        <p className="muted">Regra da potência, termo a termo, com explicação.</p>
        <div className="row">
          <input className="input" placeholder="Ex.: 3x^4 - 2x^2 + 5x - 7" value={deriv}
            onChange={(e) => setDeriv(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && deriv.trim() && run('derivative', { expression: deriv }, setDerivRes, 'deriv')} />
          <button className="btn btn-primary" onClick={() => run('derivative', { expression: deriv }, setDerivRes, 'deriv')} disabled={!deriv.trim()}>f′</button>
        </div>
        {err.deriv && <p className="form-error mt-2">{err.deriv}</p>}
        {derivRes && (
          <>
            <div className="calc-result">f′(x) = {derivRes.derivative}</div>
            <ol className="calc-steps">{derivRes.passos.map((p, i) => <li key={i}>{p}</li>)}</ol>
          </>
        )}
      </div>

      {/* Plano de estudo */}
      <div className="card tool-card">
        <h3><IconClock size={17} /> Plano de estudo</h3>
        <p className="muted">Fases semanais até à data do teste/exame, com rotina sugerida.</p>
        <div className="field">
          <input className="input" placeholder="Disciplina (ex.: Matemática A)" value={plan.subject} onChange={(e) => setPlan((p) => ({ ...p, subject: e.target.value }))} aria-label="Disciplina" />
        </div>
        <div className="row mb-2">
          <input className="input" type="date" value={plan.targetDate} onChange={(e) => setPlan((p) => ({ ...p, targetDate: e.target.value }))} aria-label="Data do exame" style={{ flex: 1 }} />
          <select className="select" style={{ width: 'auto' }} value={plan.hoursPerWeek} onChange={(e) => setPlan((p) => ({ ...p, hoursPerWeek: e.target.value }))} aria-label="Horas por semana">
            {[2, 4, 6, 8, 10, 12, 15, 20].map((h) => <option key={h} value={h}>{h} h/semana</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-block" onClick={runPlan} disabled={!plan.targetDate}>Gerar plano</button>
        {err.plan && <p className="form-error mt-2">{err.plan}</p>}
        {planRes && (
          <div className="mt-3">
            <p className="small muted">
              {planRes.semanas} semanas · {planRes.diasRestantes} dias até {new Date(planRes.dataAlvo + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}
            </p>
            {planRes.fases.map((f, i) => (
              <div className="plan-phase" key={i}>
                <span className="plan-num">{i + 1}</span>
                <div>
                  <h4>{f.fase} <span className="muted small">· semanas {f.semanas}</span></h4>
                  <p>{f.foco}</p>
                </div>
              </div>
            ))}
            <div className="mt-3">
              <strong className="small">Rotina sugerida</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)' }}>
                {planRes.rotinaSugerida.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
