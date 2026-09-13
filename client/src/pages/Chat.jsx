import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useRealtime } from '../store/RealtimeContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { Spinner } from '../components/ui.jsx';
import { IconChevronLeft, IconSend, IconUsers } from '../components/Icons.jsx';

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
const fmtDay = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === yest.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { setActiveConv, resetUnreads, lastMessage } = useRealtime();
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef(null);
  const threadRef = useRef(null);
  const lastMsgCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const [c, m] = await Promise.all([
        api.get(`/conversations/${id}`),
        api.get(`/conversations/${id}/messages?limit=60`),
      ]);
      setConv(c.conversation);
      setMsgs(m.messages);
      resetUnreads(id);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }));
    } catch (e) {
      if (e.status === 403 || e.status === 404) navigate('/mensagens', { replace: true });
    }
  }, [id, navigate, resetUnreads]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setActiveConv(id);
    return () => setActiveConv(null);
  }, [id, setActiveConv]);

  // quando chega mensagem SSE desta conversa → re-sincroniza
  const liveSeq = lastMessage?.seq ?? 0;
  useEffect(() => {
    if (msgs && lastMessage && lastMessage.m.conversationId === Number(id)) {
      api.get(`/conversations/${id}/messages?limit=60`).then((m) => {
        setMsgs(m.messages);
        resetUnreads(id);
      }).catch(() => {});
    }
  }, [liveSeq]); // eslint-disable-line

  // auto-scroll quando eu envio
  useEffect(() => {
    if (msgs && msgs.length > lastMsgCount.current) {
      const atBottom = threadRef.current
        ? threadRef.current.scrollHeight - threadRef.current.scrollTop - threadRef.current.clientHeight < 160
        : true;
      if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMsgCount.current = msgs?.length || 0;
  }, [msgs]);

  const send = async (e) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const d = await api.post(`/conversations/${id}/messages`, { content });
      setMsgs((m) => [...(m || []), d.message]);
      setText('');
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch (err) {
      // offline → Background Sync do service worker tentará reenviar
      if (!navigator.onLine) {
        setMsgs((m) => [...(m || []), { id: `q${Date.now()}`, content, createdAt: new Date().toISOString(), mine: true, author: { username: me?.username }, pending: true }]);
        setText('');
      }
    } finally {
      setSending(false);
    }
  };

  const grouped = useMemo(() => {
    const out = [];
    let lastDay = null;
    let lastAuthor = null;
    let lastTime = 0;
    for (const m of msgs || []) {
      const day = fmtDay(m.createdAt);
      if (day !== lastDay) { out.push({ day, key: `d-${m.id}` }); lastDay = day; lastAuthor = null; }
      const t = new Date(m.createdAt).getTime();
      const showAuthor = m.author?.username !== lastAuthor || t - lastTime > 5 * 60000;
      out.push({ m, showAuthor, showTime: t - lastTime > 60000 || m === (msgs || [])[msgs.length - 1] });
      lastAuthor = m.author?.username;
      lastTime = t;
    }
    return out;
  }, [msgs]);

  if (!conv || !msgs) {
    return <div className="page"><div className="block-loader"><Spinner size={28} /></div></div>;
  }

  const other = conv.type === 'dm' ? conv.members.find((m) => m.id !== me?.id) : null;

  return (
    <div className="page chat-page">
      <div className="card chat-head">
        <button className="icon-btn" onClick={() => navigate('/mensagens')} aria-label="Voltar às conversas">
          <IconChevronLeft size={20} />
        </button>
        {conv.type === 'group' ? (
          <button className="icon-btn" onClick={() => setShowMembers((s) => !s)} aria-label="Ver membros" style={{ width: 40 }}>
            <IconUsers size={20} />
          </button>
        ) : other ? <Avatar user={other} size={38} /> : null}
        <div className="col" style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 15 }}>{conv.title}</strong>
          <span className="muted small">
            {conv.type === 'group' ? `${conv.members.length} membros` : other ? `@${other.username}` : ''}
          </span>
        </div>
      </div>

      {showMembers && conv.type === 'group' && (
        <div className="card mb-2" style={{ padding: 10 }}>
          {conv.members.map((m) => (
            <Link to={`/perfil/${m.username}`} key={m.id} className="mini-item" onClick={() => setShowMembers(false)}>
              <span className="row">
                <Avatar user={m} size={32} />
                <span className="col">
                  <strong style={{ fontSize: 13.5 }}>{m.displayName}</strong>
                  <span className="muted small">@{m.username}</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="chat-thread" ref={threadRef}>
        {grouped.map((g, i) => {
          if (g.day) {
            return <div className="day-sep" key={g.key}><span>{g.day}</span></div>;
          }
          const m = g.m;
          return (
            <div key={m.id}>
              {conv.type === 'group' && !m.mine && g.showAuthor && (
                <div className="msg-author">{m.author?.displayName || m.author?.username}</div>
              )}
              <div className={`msg-row ${m.mine ? 'msg-row-mine' : ''}`}>
                {conv.type === 'group' && !m.mine && g.showAuthor ? <Avatar user={m.author} size={28} style={{ marginTop: 2 }} /> : <span style={{ width: 0 }} />}
                <div className="col">
                  <div className="bubble" style={m.pending ? { opacity: 0.6 } : undefined}>
                    {m.content}{m.pending ? ' ⏳' : ''}
                  </div>
                  {g.showTime && <span className="msg-time">{fmtTime(m.createdAt)}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={send}>
        <textarea
          rows={1}
          placeholder="Escreve uma mensagem…"
          value={text}
          onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px'; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          maxLength={2000}
          aria-label="Mensagem"
        />
        <button className="send-btn" type="submit" disabled={!text.trim() || sending} aria-label="Enviar">
          {sending ? <Spinner size={17} /> : <IconSend size={18} />}
        </button>
      </form>
    </div>
  );
}
