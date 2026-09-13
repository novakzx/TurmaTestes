/**
 * Hub de Server-Sent Events — tempo real para mensagens e notificações.
 * SSE em vez de WebSocket: funciona sobre HTTP/1.1+ proxies, reconecta
 * nativamente no browser (EventSource) e usa a mesma autenticação por cookie.
 */
const clients = new Map(); // userId -> Set<res>

export function sseHandler(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 4000\n\n');

  const userId = req.user.id;
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);

  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* ignora */ }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const set = clients.get(userId);
    if (set) {
      set.delete(res);
      if (set.size === 0) clients.delete(userId);
    }
  });
}

export function emitToUser(userId, event, data) {
  const set = clients.get(userId);
  if (!set) return false;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch { set.delete(res); }
  }
  return set.size > 0;
}

export function emitToUsers(userIds, event, data) {
  for (const id of new Set(userIds)) emitToUser(id, event, data);
}

export function isOnline(userId) {
  return (clients.get(userId)?.size || 0) > 0;
}
