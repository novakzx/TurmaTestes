/** Cliente HTTP — same-origin.
 *  Autenticação dupla: cookie httpOnly (preferido) OU Bearer token em
 *  localStorage (fallback para browsers que bloqueiam cookies de terceiros,
 *  ex.: preview embebido em iframe). O header CSRF só é necessário no modo cookie. */

let bearer = null;
try {
  bearer = localStorage.getItem('tm-token');
} catch { /* storage indisponível */ }

export const getBearer = () => bearer;
export function setBearer(token) {
  bearer = token || null;
  try {
    if (token) localStorage.setItem('tm-token', token);
    else localStorage.removeItem('tm-token');
  } catch { /* ignora */ }
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const csrf = getCookie('tm_csrf');
  if (csrf) headers['x-csrf-token'] = csrf;

  const res = await fetch('/api' + path, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  if (raw) {
    if (!res.ok) throw new Error('Falha na transferência');
    return res.blob();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Erro inesperado no servidor.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p, body) => request(p, { method: 'DELETE', body }),
  blob: (p) => request(p, { raw: true }),
};
