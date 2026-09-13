import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useToast } from '../store/ToastContext.jsx';
import Avatar from './Avatar.jsx';
import Modal from './Modal.jsx';
import { IconPlus, IconX, IconPoll } from './Icons.jsx';

const SUBJECTS = [
  'Matemática A', 'Física e Química A', 'Biologia e Geologia', 'Português', 'História A',
  'Geografia A', 'Filosofia', 'Inglês', 'Economia A', 'Métodos de estudo', 'Turma+', 'Regresso às aulas',
];

const MAX = 2000;

export default function Composer({ open, onClose, onPosted, compact = false }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [pollOn, setPollOn] = useState(false);
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '']);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setContent(''); setSubject(''); setPollOn(false); setPollQ(''); setPollOpts(['', '']); setError('');
  };

  const submit = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const body = { content: content.trim(), subject };
      if (pollOn) {
        const opts = pollOpts.map((o) => o.trim()).filter(Boolean);
        if (!pollQ.trim() || opts.length < 2) throw new Error('A sondagem precisa de pergunta e pelo menos 2 opções.');
        body.poll = { question: pollQ.trim(), options: opts };
      }
      const d = await api.post('/posts', body);
      onPosted?.(d.post);
      toast('Publicação partilhada.');
      reset();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Não foi possível publicar.');
    } finally {
      setSending(false);
    }
  };

  const form = (
    <div className="col gap-2">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Avatar user={user} size={compact ? 36 : 42} />
        <div className="col" style={{ flex: 1 }}>
          <textarea
            className="textarea"
            placeholder="O que se passa na tua turma?"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX))}
            autoFocus={!compact}
            aria-label="Conteúdo da publicação"
          />
          <div className="spread mt-2">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`icon-btn ${pollOn ? 'saved' : ''}`}
                style={pollOn ? { color: 'var(--brand-ink)' } : {}}
                onClick={() => setPollOn((p) => !p)}
                aria-label="Adicionar sondagem" aria-pressed={pollOn} title="Sondagem"
              >
                <IconPoll size={20} />
              </button>
              <select className="select" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Tema">
                <option value="">Sem tema</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="row">
              <span className={`small muted ${content.length > MAX * 0.9 ? 'form-error' : ''}`}>{content.length}/{MAX}</span>
              <button className="btn btn-primary btn-sm" onClick={submit} disabled={!content.trim() || sending}>
                {sending ? 'A publicar…' : 'Publicar'}
              </button>
            </div>
          </div>

          {pollOn && (
            <div className="poll mt-2">
              <div className="spread mb-2">
                <strong className="small">Sondagem</strong>
                <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setPollOn(false)} aria-label="Remover sondagem"><IconX size={15} /></button>
              </div>
              <input className="input mb-2" placeholder="Pergunta da sondagem" value={pollQ} onChange={(e) => setPollQ(e.target.value)} maxLength={140} />
              {pollOpts.map((o, i) => (
                <div className="row mb-2" key={i}>
                  <input
                    className="input" placeholder={`Opção ${i + 1}`} value={o} maxLength={80}
                    onChange={(e) => setPollOpts((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                  {pollOpts.length > 2 && (
                    <button type="button" className="icon-btn" onClick={() => setPollOpts((arr) => arr.filter((_, j) => j !== i))} aria-label={`Remover opção ${i + 1}`}>
                      <IconX size={16} />
                    </button>
                  )}
                </div>
              ))}
              {pollOpts.length < 4 && (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setPollOpts((a) => [...a, ''])}>
                  <IconPlus size={14} /> Opção
                </button>
              )}
            </div>
          )}

          {error && <p className="form-error mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );

  if (compact) return <div className="card composer-inline">{form}</div>;

  return (
    <Modal open={open} onClose={onClose} title="Nova publicação">
      {form}
    </Modal>
  );
}
