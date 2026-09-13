import { useState } from 'react';
import {
  IconBookmark, IconCheck, IconChevronDown, IconX, IconAlert, IconBook, FILLED,
} from './Icons.jsx';
import { timeAgo } from './ui.jsx';

/**
 * Apresentação da "ficha de estudo" — o formato único do Explicador.
 * Não é um chat: é um documento estruturado (resposta → passos → conceitos →
 * exemplo → exercícios → recursos), como uma página de manual interativa.
 */
export default function FichaCard({ entry, onSave, onDismiss, collapsed = false }) {
  const [open, setOpen] = useState(!collapsed);
  const [revealed, setRevealed] = useState({});
  const f = entry.ficha;
  if (!f) return null;

  return (
    <article className="card ficha">
      <div className="ficha-head" style={{ cursor: collapsed ? 'pointer' : 'default' }} onClick={() => collapsed && setOpen((o) => !o)}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="row" style={{ gap: 6 }}>
            <span className="tag">{entry.subject || f.disciplina || 'Geral'}</span>
            {collapsed && <span className="muted small">{timeAgo(entry.createdAt)}</span>}
          </span>
          <span className="row" style={{ gap: 2 }}>
            {collapsed && (
              <span style={{ transform: open ? 'rotate(180deg)' : 'none', display: 'flex', transition: 'transform .15s' }}>
                <IconChevronDown size={18} />
              </span>
            )}
            {onDismiss && !collapsed && (
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onDismiss(); }} aria-label="Fechar ficha">
                <IconX size={17} />
              </button>
            )}
          </span>
        </div>
        <h2>{f.titulo}</h2>
        {collapsed && <p className="small muted" style={{ margin: '4px 0 0' }}>{entry.question}</p>}
      </div>

      {open && (
        <>
          {f.aviso && (
            <div className="ficha-sec">
              <div className="notice" style={{ margin: 0 }}>
                <IconAlert size={15} /> <span>{f.aviso}</span>
              </div>
            </div>
          )}

          {f.resumo && (
            <div className="ficha-sec">
              <h3><IconBook size={14} /> Resposta direta</h3>
              <p className="ficha-resumo" style={{ margin: 0 }}>{f.resumo}</p>
            </div>
          )}

          {Array.isArray(f.passos) && f.passos.length > 0 && (
            <div className="ficha-sec">
              <h3>Passo a passo</h3>
              <ol className="ficha-steps">
                {f.passos.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </div>
          )}

          {Array.isArray(f.conceitos) && f.conceitos.length > 0 && (
            <div className="ficha-sec">
              <h3>Conceitos-chave</h3>
              <div className="concept-grid">
                {f.conceitos.map((c, i) => (
                  <div className="concept" key={i}>
                    <strong>{c.nome}</strong>
                    <p>{c.definicao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {f.exemplo && (
            <div className="ficha-sec">
              <h3>Exemplo resolvido</h3>
              <div className="example-box">
                <div className="enunciado">{f.exemplo.enunciado}</div>
                <ol>
                  {(f.exemplo.resolucao || []).map((r, i) => <li key={i}>{r}</li>)}
                </ol>
              </div>
            </div>
          )}

          {Array.isArray(f.exercicios) && f.exercicios.length > 0 && (
            <div className="ficha-sec">
              <h3>Exercita</h3>
              {f.exercicios.map((ex, i) => (
                <div className="exercise" key={i}>
                  <p>{i + 1}. {ex.enunciado}</p>
                  <div className="sol-toggle">
                    {ex.dica && (
                      <button className="btn btn-outline btn-sm" onClick={() => setRevealed((r) => ({ ...r, [`d${entry.id}-${i}`]: !r[`d${entry.id}-${i}`] }))}>
                        {revealed[`d${entry.id}-${i}`] ? 'Esconder dica' : 'Ver dica'}
                      </button>
                    )}
                    <button className="btn btn-soft btn-sm" onClick={() => setRevealed((r) => ({ ...r, [`s${entry.id}-${i}`]: !r[`s${entry.id}-${i}`] }))}>
                      {revealed[`s${entry.id}-${i}`] ? 'Esconder solução' : 'Ver solução'}
                    </button>
                  </div>
                  {ex.dica && revealed[`d${entry.id}-${i}`] && <div className="sol" style={{ background: 'var(--accent-soft)', color: '#b45309' }}>Dica: {ex.dica}</div>}
                  {revealed[`s${entry.id}-${i}`] && <div className="sol">Solução: {ex.solucao}</div>}
                </div>
              ))}
            </div>
          )}

          {Array.isArray(f.recursos) && f.recursos.length > 0 && (
            <div className="ficha-sec">
              <h3>Recursos</h3>
              <div className="concept-grid">
                {f.recursos.map((r, i) => (
                  <div className="concept" key={i}>
                    <strong>{r.titulo}</strong>
                    <p>{r.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onSave && (
            <div className="ficha-sec spread">
              <span className="muted small">{entry.question}</span>
              <button
                className={`btn btn-sm ${entry.saved ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => onSave(entry.id, !entry.saved)}
              >
                {entry.saved ? <><IconCheck size={15} /> Guardada</> : <><IconBookmark size={15} /> Guardar</>}
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
