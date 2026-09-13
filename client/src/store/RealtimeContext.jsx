import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api, getBearer } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const RealtimeContext = createContext(null);

/**
 * Tempo real via Server-Sent Events (/api/events/stream), consumido com
 * fetch + ReadableStream (em vez de EventSource) para poder enviar o header
 * Authorization — necessário quando o browser bloqueia cookies (iframes).
 *  - mensagens novas → incrementa não-lidas (exceto na conversa aberta)
 *  - notificações novas → badge + toast
 *  - reconexão automática com backoff
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

    const controller = new AbortController();
    let stopped = false;
    let delay = 2000;
    let timer = null;

    const handleFrame = (frame) => {
      let event = 'message';
      const dataLines = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith(':')) continue; // comentário/heartbeat
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      if (!dataLines.length) return;
      let payload;
      try { payload = JSON.parse(dataLines.join('\n')); } catch { return; }

      if (event === 'message') {
        if (!payload || typeof payload !== 'object' || !payload.conversationId) return;
        seqRef.current += 1;
        setLastMessage({ m: payload, seq: seqRef.current });
        if (payload.conversationId !== activeConvRef.current) {
          setUnreads((u) => ({ ...u, [payload.conversationId]: (u[payload.conversationId] || 0) + 1 }));
        }
      } else if (event === 'notification') {
        if (payload?.type === 'message') {
          toast(payload.text, 'info', 4000); // o evento 'message' já trata contagens
        } else if (payload?.text) {
          setNotifCount((c) => c + 1);
          toast(payload.text, 'info', 4000);
        }
      }
    };

    const connect = async () => {
      try {
        const headers = { Accept: 'text/event-stream' };
        const tk = getBearer();
        if (tk) headers.Authorization = `Bearer ${tk}`;
        const res = await fetch('/api/events/stream', {
          headers,
          credentials: 'include',
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`sse ${res.status}`);
        delay = 2000;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf('\n\n')) >= 0) {
            handleFrame(buf.slice(0, idx));
            buf = buf.slice(idx + 2);
          }
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (!stopped) {
        timer = setTimeout(connect, delay);
        delay = Math.min(delay * 1.6, 15000);
      }
    };

    connect();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      controller.abort();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RealtimeContext.Provider value={{ unreads, notifCount, online, lastMessage, setActiveConv, resetUnreads, clearNotifs, setNotifCount }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);
export const totalUnreads = (unreads) => Object.values(unreads || {}).reduce((a, b) => a + b, 0);
