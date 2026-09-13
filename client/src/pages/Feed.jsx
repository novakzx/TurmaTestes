import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useRealtime } from '../store/RealtimeContext.jsx';
import PostCard from '../components/PostCard.jsx';
import Composer from '../components/Composer.jsx';
import Avatar from '../components/Avatar.jsx';
import { Tabs, Spinner, Empty, timeAgo, shortDate } from '../components/ui.jsx';
import { IconPlus, IconCalendar, IconUsers, IconX, IconRefresh } from '../components/Icons.jsx';

const TYPE_COLORS = {
  holiday_national: 'dot-holiday', holiday_regional: 'dot-holiday', holiday_municipal: 'dot-municipal',
  school_term: 'dot-school', school_break: 'dot-break', strike: 'dot-strike', exam: 'dot-exam', custom: 'dot-custom',
};

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') === 'following' ? 'following' : 'all';
  const subject = params.get('subject') || '';
  const hashtag = params.get('hashtag') || '';
  const focus = params.get('focus');

  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [trending, setTrending] = useState({ hashtags: [], subjects: [] });
  const [upcoming, setUpcoming] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const sentinel = useRef(null);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    q.set('filter', filter);
    if (subject) q.set('subject', subject);
    if (hashtag) q.set('hashtag', hashtag);
    return q;
  }, [filter, subject, hashtag]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get(`/posts/feed?${buildQuery()}`);
      setPosts(d.posts);
      setNextCursor(d.nextCursor);
    } catch { /* offline: SW serve cache */ } finally { setLoading(false); }
  }, [buildQuery]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/posts/trending').then(setTrending).catch(() => {});
    api.get('/calendar/upcoming?days=21').then((d) => setUpcoming(d.events.slice(0, 4))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    // sugestões de pessoas para seguir
    api.get('/users/search?q=a')
      .then((d) => setSuggestions(d.users.filter((u) => u.username !== user.username).slice(0, 4)))
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line

  // foco num post vindo de notificação
  useEffect(() => {
    if (focus) {
      const el = document.getElementById(`post-${focus}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focus, posts]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = buildQuery();
      q.set('cursor', nextCursor);
      const d = await api.get(`/posts/feed?${q}`);
      setPosts((p) => [...p, ...d.posts.filter((x) => !p.some((y) => y.id === x.id))]);
      setNextCursor(d.nextCursor);
    } finally { setLoadingMore(false); }
  }, [nextCursor, loadingMore, buildQuery]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const setParam = (key, value) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('focus');
    setParams(p, { replace: true });
  };

  const updatePost = (updated) => setPosts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
  const removePost = (id) => setPosts((ps) => ps.filter((p) => p.id !== id));

  const activeFilterLabel = hashtag ? `#${hashtag}` : subject;

  return (
    <div className="feed-layout">
      <div className="page" style={{ maxWidth: '100%' }}>
        <Composer compact onPosted={(p) => setPosts((ps) => [p, ...ps])} />

        <div className="row mb-3" style={{ justifyContent: 'space-between' }}>
          <Tabs
            tabs={[
              { id: 'all', label: 'Para ti' },
              { id: 'following', label: 'A seguir' },
            ]}
            active={filter}
            onChange={(id) => setParam('filter', id === 'all' ? '' : id)}
          />
          <button className="icon-btn" onClick={load} aria-label="Atualizar feed" title="Atualizar">
            <IconRefresh size={18} />
          </button>
        </div>

        {activeFilterLabel && (
          <div className="mb-3 row">
            <span className="chip chip-active">
              {activeFilterLabel}
              <button onClick={() => { setParam('subject', ''); setParam('hashtag', ''); }} aria-label="Limpar filtro" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <IconX size={13} />
              </button>
            </span>
          </div>
        )}

        {loading ? (
          <div className="block-loader"><Spinner size={28} /></div>
        ) : posts.length === 0 ? (
          <Empty
            icon={<IconUsers size={40} />}
            title={filter === 'following' ? 'Ainda não segues ninguém' : 'Sem publicações'}
            hint={filter === 'following' ? 'Segue colegas no separador "Para ti" ou nas sugestões da barra lateral.' : 'Partilha a primeira publicação com a comunidade.'}
          />
        ) : (
          posts.map((p) => (
            <PostCard
              key={p.id} post={p} onChange={updatePost} onDelete={removePost}
              highlight={String(p.id) === String(focus)}
            />
          ))
        )}

        <div ref={sentinel} />
        {loadingMore && <div className="block-loader"><Spinner /></div>}
        {!nextCursor && posts.length > 0 && <p className="center muted small" style={{ padding: '10px 0 20px' }}>Não há mais publicações para mostrar.</p>}
      </div>

      {/* Barra lateral (desktop) */}
      <aside className="rail" aria-label="Destaques">
        <div className="card rail-card">
          <h3><IconCalendar size={16} /> Próximos eventos</h3>
          {upcoming.length === 0 && <p className="muted small">Nada nos próximos 21 dias.</p>}
          {upcoming.map((e) => (
            <Link to="/calendario" key={e.id} className="rail-item">
              <span className={`dot ${TYPE_COLORS[e.type] || 'dot-custom'}`} />
              <span className="col" style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</strong>
                <span className="muted">{shortDate(e.dateStart)} · {e.label}</span>
              </span>
            </Link>
          ))}
        </div>

        {trending.hashtags.length > 0 && (
          <div className="card rail-card">
            <h3><IconPlus size={15} style={{ transform: 'rotate(45deg)' }} /> Em destaque</h3>
            {trending.hashtags.map((t) => (
              <div className="rail-item" key={t.tag}>
                <span className="col">
                  <span className="trend-tag" onClick={() => setParam('hashtag', t.tag.slice(1))}>{t.tag}</span>
                  <span className="muted">{t.count} publicações</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="card rail-card">
            <h3><IconUsers size={16} /> Sugestões</h3>
            {suggestions.map((s) => (
              <div className="rail-item" key={s.id}>
                <Avatar user={s} size={34} />
                <Link to={`/perfil/${s.username}`} className="col" style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ fontSize: 13 }}>{s.displayName}</strong>
                  <span className="muted">@{s.username}</span>
                </Link>
                <FollowButton username={s.username} />
              </div>
            ))}
          </div>
        )}
      </aside>

      <button className="fab" onClick={() => setComposerOpen(true)} aria-label="Nova publicação">
        <IconPlus size={26} />
      </button>
      <Composer open={composerOpen} onClose={() => setComposerOpen(false)} onPosted={(p) => setPosts((ps) => [p, ...ps])} />
    </div>
  );
}

function FollowButton({ username }) {
  const [state, setState] = useState(null); // null | true | false
  const toggle = async () => {
    try {
      const d = await api.post(`/users/${username}/follow`);
      setState(d.following);
    } catch { /* ignora */ }
  };
  if (state === true) return <span className="tag">A seguir</span>;
  return <button className="btn btn-soft btn-sm" onClick={toggle}>Seguir</button>;
}
