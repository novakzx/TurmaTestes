import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useRealtime } from '../store/RealtimeContext.jsx';
import { useToast } from '../store/ToastContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';
import { Spinner, Empty, timeAgo } from '../components/ui.jsx';
import { IconChat, IconPlus, IconUsers, IconSearch, IconX } from '../components/Icons.jsx';

export default function Messages() {
  const [convs, setConvs] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const { unreads } = useRealtime();
  const { user: me } = useAuth();

  const load = () => api.get('/conversations').then((d) => setConvs(d.conversations)).catch(() => setConvs([]));
  useEffect(() => { load(); }, []);

  // re-sincroniza quando chegam mensagens em tempo real
  const unreadsKey = JSON.stringify(unreads);
  useEffect(() => { if (convs) load(); }, [unreadsKey]); // eslint-disable-line

  return (
    <div className="page">
      <div className="page-head spread">
        <div>
          <h1>Mensagens</h1>
          <p>Conversas diretas e grupos de estudo</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>
          <IconPlus size={15} /> Nova
        </button>
      </div>

      <div className="card" style={{ padding: 6 }}>
        {convs === null ? (
          <div className="block-loader"><Spinner size={26} /></div>
        ) : convs.length === 0 ? (
          <Empty
            icon={<IconChat size={40} />}
            title="Sem conversas"
            hint="Começa uma mensagem direta ou cria um grupo de estudo com a tua turma."
          />
        ) : (
          <div className="conv-list">
            {convs.map((c) => {
              const unread = unreads[c.id] ?? c.unread;
              const other = c.type === 'dm' ? (c.members.find((m) => m.id !== me?.id) || c.members[0]) : null;
              return (
                <Link key={c.id} to={`/mensagens/${c.id}`} className={`conv-item ${unread > 0 ? 'conv-unread' : ''}`}>
                  {c.type === 'group'
                    ? <GroupAvatar members={c.members} />
                    : <Avatar user={other} size={46} />}
                  <span className="conv-main">
                    <span className="conv-title">
                      {c.title}
                      {c.type === 'group' && <span className="tag tag-muted">{c.members.length} membros</span>}
                    </span>
                    <span className="conv-last">
                      {c.lastMessage ? `${c.type === 'group' ? c.lastMessage.author.username + ': ' : ''}${c.lastMessage.content}` : 'Ainda sem mensagens — diz olá!'}
                    </span>
                  </span>
                  <span className="conv-meta">
                    <span className="conv-time">{c.lastMessageAt ? timeAgo(c.lastMessageAt) : ''}</span>
                    {unread > 0 && <span className="unread-pill">{unread}</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <NewConversationModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={(c) => { setNewOpen(false); load(); }} />
    </div>
  );
}

function GroupAvatar({ members }) {
  const colors = ['#16A34A', '#2563EB', '#DB2777', '#D97706'];
  return (
    <span className="avatar" style={{ width: 46, height: 46, background: 'var(--surface-3)', padding: 0, overflow: 'hidden' }} aria-hidden="true">
      <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
        {(members || []).slice(0, 4).map((m, i) => (
          <span key={m.id} style={{ background: m.avatarColor || colors[i % 4], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>
            {(m.displayName || '?')[0]}
          </span>
        ))}
      </span>
    </span>
  );
}

function NewConversationModal({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dm');
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) { setQ(''); setResults([]); setTitle(''); setSelected([]); setTab('dm'); return; }
    if (q.trim().length >= 2) {
      const t = setTimeout(() => {
        api.get(`/users/search?q=${encodeURIComponent(q.trim())}`).then((d) => setResults(d.users)).catch(() => {});
      }, 250);
      return () => clearTimeout(t);
    }
    setResults([]);
  }, [q, open]);

  const createDm = async (username) => {
    setBusy(true);
    try {
      const d = await api.post('/conversations', { type: 'dm', username });
      onCreated?.(d.conversation);
      navigate(`/mensagens/${d.conversation.id}`);
    } catch (e) { toast(e.message, 'danger'); } finally { setBusy(false); }
  };

  const createGroup = async () => {
    if (!title.trim() || selected.length === 0) return;
    setBusy(true);
    try {
      const d = await api.post('/conversations', { type: 'group', title: title.trim(), usernames: selected });
      onCreated?.(d.conversation);
      navigate(`/mensagens/${d.conversation.id}`);
    } catch (e) { toast(e.message, 'danger'); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova conversa">
      <div className="tabs mb-3">
        <button className={`tab ${tab === 'dm' ? 'tab-active' : ''}`} onClick={() => setTab('dm')}>Mensagem direta</button>
        <button className={`tab ${tab === 'group' ? 'tab-active' : ''}`} onClick={() => setTab('group')}>Grupo</button>
      </div>

      {tab === 'group' && (
        <div className="field">
          <label htmlFor="g-title">Nome do grupo</label>
          <input id="g-title" className="input" placeholder="Ex.: Estudo Biologia 12.º" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
        </div>
      )}

      <div className="field">
        <label htmlFor="g-search">{tab === 'dm' ? 'Procurar estudante' : 'Adicionar membros'}</label>
        <div className="row" style={{ position: 'relative' }}>
          <input
            id="g-search" className="input" placeholder="Nome ou @utilizador"
            value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
            style={{ paddingLeft: 38 }}
          />
          <IconSearch size={17} style={{ position: 'absolute', left: 12, color: 'var(--muted)' }} />
        </div>
        {tab === 'group' && selected.length > 0 && (
          <div className="row-wrap mt-2">
            {selected.map((s) => (
              <span key={s} className="chip chip-static">@{s}
                <button onClick={() => setSelected((arr) => arr.filter((x) => x !== s))} aria-label={`Remover ${s}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}>
                  <IconX size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {results.map((u) => (
        <button
          key={u.id} className="mini-item"
          onClick={() => {
            if (tab === 'dm') createDm(u.username);
            else setSelected((arr) => (arr.includes(u.username) ? arr.filter((x) => x !== u.username) : [...arr, u.username]));
          }}
          disabled={busy}
        >
          <span className="row" style={{ minWidth: 0 }}>
            <Avatar user={u} size={38} />
            <span className="col" style={{ minWidth: 0 }}>
              <strong style={{ fontSize: 14 }}>{u.displayName}</strong>
              <span className="muted small">@{u.username}{u.school ? ` · ${u.school}` : ''}</span>
            </span>
          </span>
          {tab === 'group' && selected.includes(u.username) && <span className="tag">Selecionado</span>}
        </button>
      ))}

      {tab === 'group' && (
        <button className="btn btn-primary btn-block mt-3" onClick={createGroup} disabled={!title.trim() || selected.length === 0 || busy}>
          <IconUsers size={16} /> Criar grupo {selected.length > 0 && `(${selected.length + 1})`}
        </button>
      )}
    </Modal>
  );
}
