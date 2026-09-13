import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const RealtimeContext = createContext(null);

/**
 * Tempo real via Server-Sent Events (/api/events/stream):
 *  - mensagens novas → incrementa não-lidas (exceto na conversa aberta)
 *  - notificações novas → badge + toast
 *  - reconexão automática nativa do EventSource
 */
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unreads, setUnreads] = useState({}); // conversationId -> count
  const [notifCount, setNotifCount] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [lastMessage, setLastMessage] = useState(null); // { m, seq } — p/ páginas de Chat
  const seqRef = useRef(0);
  const activeConvRef = useRef(null); // conversa aberta no Chat
  const esRef = useRef(null);

  const setActiveConv = useCallback((id) => {
    activeConvRef.current = id ? Number(id) : null;
    if (id) setUnreads((u) => ({ ...u, [Number(id)]: 0 }));
  }, []);

  const resetUnreads = useCallback((convId) => setUnreads((u) => ({ ...u, [Number(convId)]: 0 })), []);
  const clearNotifs = useCallback(() => setNotifCount(0), []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!user) {
      esRef.current?.close();
      esRef.current = null;
      setUnreads({});
      setNotifCount(0);
      return;
    }
    // sincroniza contagens iniciais
    api.get('/conversations').then((d) => {
      const map = {};
      for (const c of d.conversations) map[c.id] = c.unread;
      setUnreads(map);
    }).catch(() => {});
    api.get('/notifications?unread=1').then((d) => setNotifCount(d.unread)).catch(() => {});

    const es = new EventSource('/api/events/stream', { withCredentials: true });
    esRef.current = es;
    es.addEventListener('message', (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (!m || typeof m !== 'object' || !m.conversationId) return;
        seqRef.current += 1;
        setLastMessage({ m, seq: seqRef.current });
        if (m.conversationId !== activeConvRef.current) {
          setUnreads((u) => ({ ...u, [m.conversationId]: (u[m.conversationId] || 0) + 1 }));
        }
      } catch { /* heartbeats ": ping" não são JSON — ignorar */ }
    });
    es.addEventListener('notification', (ev) => {
      try {
        const n = JSON.parse(ev.data);
        if (n.type === 'message') {
          // o evento 'message' já trata das contagens; aqui só o toast
          toast(n.text, 'info', 4000);
        } else {
          setNotifCount((c) => c + 1);
          toast(n.text, 'info', 4000);
        }
      } catch { /* ignora */ }
    });
    return () => { es.close(); esRef.current = null; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RealtimeContext.Provider value={{ unreads, notifCount, online, lastMessage, setActiveConv, resetUnreads, clearNotifs, setNotifCount }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);
export const totalUnreads = (unreads) => Object.values(unreads || {}).reduce((a, b) => a + b, 0);
