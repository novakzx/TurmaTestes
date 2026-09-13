/// <reference lib="webworker" />
/**
 * Turma+ · Service Worker (Workbox, estratégia injectManifest)
 *  - Pré-cache do app shell → abre offline e instala como PWA
 *  - Feed/Calendário/Tendências: stale-while-revalidate (leitura offline)
 *  - Navegações: network-first com fallback para a cache
 *  - Envio de mensagens offline: fila com Background Sync
 *  - Web Push: notificações nativas + clique abre o destino
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navegações (rotas da SPA) — rede primeiro, cache como rede de segurança
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'tm-pages',
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
);

// Leituras da API que fazem sentido offline (feed, calendário, tendências, municípios)
registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    (url.pathname.startsWith('/api/posts/feed') ||
      url.pathname.startsWith('/api/posts/trending') ||
      url.pathname.startsWith('/api/calendar/') ||
      url.pathname.startsWith('/api/tutor/subjects')),
  new StaleWhileRevalidate({
    cacheName: 'tm-api-read',
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
);

// Envio de mensagens offline → reenviado automaticamente quando há rede
const messageSync = new BackgroundSyncPlugin('tm-message-queue', {
  maxRetentionTime: 24 * 60, // minutos
});
registerRoute(
  ({ url, request }) => request.method === 'POST' && /\/api\/conversations\/\d+\/messages$/.test(url.pathname),
  new NetworkOnly({ plugins: [messageSync] }),
  'POST'
);

// ---------------------------------------------------------------------------
// Web Push
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = { title: 'Turma+', body: 'Tens novidades.', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch { /* payload não-JSON */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'turma-mais',
      data: { url: data.url },
      lang: 'pt-PT',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
