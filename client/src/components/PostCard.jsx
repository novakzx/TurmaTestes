import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useToast } from '../store/ToastContext.jsx';
import Avatar from './Avatar.jsx';
import { timeAgo } from './ui.jsx';
import { IconHeart, IconComment, IconBookmark, IconShare, IconTrash, IconPoll, FILLED } from './Icons.jsx';

/** Renderiza texto com #hashtags clicáveis — sem innerHTML (imune a XSS). */
function PostContent({ text }) {
  const navigate = useNavigate();
  const parts = text.split(/(#[\p{L}\p{N}]{2,30})/gu);
  return (
    <div className="post-body">
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <span key={i} className="hashtag" role="link" tabIndex={0}
            onClick={() => navigate(`/?hashtag=${encodeURIComponent(part.slice(1))}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/?hashtag=${encodeURIComponent(part.slice(1))}`)}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
}

function Poll({ post, onChanged }) {
  const { user } = useAuth();
  const poll = post.poll;
  const voted = poll.myVote !== null;
  const total = poll.totalVotes || 0;

  const vote = async (optionId) => {
    if (voted) return;
    const d = await api.post(`/posts/${post.id}/vote`, { optionId });
    onChanged?.(d.post);
  };

  return (
    <div className="poll" role="group" aria-label={`Sondagem: ${poll.question}`}>
      <div className="poll-q"><IconPoll size={16} /> {poll.question}</div>
      {poll.options.map((o) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        const mine = poll.myVote === o.id;
        return (
          <button key={o.id} className={`poll-opt ${mine ? 'poll-opt-voted' : ''}`} onClick={() => vote(o.id)} disabled={voted}>
            {voted && <span className="poll-fill" style={{ width: `${pct}%` }} />}
            <span>
              <span>{mine ? '✓ ' : ''}{o.text}</span>
              {voted && <strong>{pct}%</strong>}
            </span>
          </button>
        );
      })}
      <div className="poll-meta">{total} {total === 1 ? 'voto' : 'votos'}{voted ? '' : ' · toca numa opção para votar'}</div>
    </div>
  );
}

function Comments({ post }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get(`/posts/${post.id}/comments`).then((d) => setComments(d.comments)).catch(() => setComments([]));
  }, [post.id]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const d = await api.post(`/posts/${post.id}/comments`, { content: text });
      setComments((c) => [d.comment, ...(c || [])]);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="comments">
      {comments === null && <div className="block-loader"><span className="spinner" /></div>}
      {(comments || []).map((c) => (
        <div className="comment" key={c.id}>
          <Avatar user={c.author} size={30} />
          <div className="comment-bubble">
            <Link to={`/perfil/${c.author.username}`} className="post-name">{c.author.displayName}</Link>
            <p>{c.content}</p>
          </div>
        </div>
      ))}
      <form className="comment-form" onSubmit={send}>
        <Avatar user={user} size={30} />
        <input
          className="input" placeholder="Escreve um comentário…" value={text}
          onChange={(e) => setText(e.target.value)} maxLength={600} aria-label="Comentário"
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={!text.trim() || sending}>Enviar</button>
      </form>
    </div>
  );
}

export default function PostCard({ post, onChange, onDelete, highlight = false }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);

  const patch = (changes) => onChange?.({ ...post, ...changes });

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const d = await api.post(`/posts/${post.id}/like`);
      patch({ likedByMe: d.liked, likes: d.likes });
    } finally { setBusy(false); }
  };

  const toggleSave = async () => {
    const d = await api.post(`/posts/${post.id}/save`);
    patch({ savedByMe: d.saved });
    toast(d.saved ? 'Guardado nos teus Apontamentos 🔖' : 'Removido dos Apontamentos');
  };

  const share = async () => {
    const url = `${location.origin}/?focus=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Turma+', url });
      else { await navigator.clipboard.writeText(url); toast('Ligação copiada'); }
    } catch { /* cancelado */ }
  };

  const remove = async () => {
    if (!confirm('Apagar esta publicação?')) return;
    await api.del(`/posts/${post.id}`);
    toast('Publicação apagada');
    onDelete?.(post.id);
  };

  return (
    <article className={`card post ${highlight ? 'post-highlight' : ''}`} id={`post-${post.id}`}>
      <div className="post-head">
        <Link to={`/perfil/${post.author.username}`} aria-hidden="true" tabIndex={-1}>
          <Avatar user={post.author} size={42} />
        </Link>
        <div className="post-id">
          <div className="row">
            <Link to={`/perfil/${post.author.username}`} className="post-name">{post.author.displayName}</Link>
            <span className="post-user">@{post.author.username}</span>
            <span className="post-time" title={new Date(post.createdAt).toLocaleString('pt-PT')}>· {timeAgo(post.createdAt)}</span>
          </div>
          {post.author.school && <span className="post-school">{post.author.school}</span>}
        </div>
        {(post.isMine || user?.role === 'admin') && (
          <button className="icon-btn" onClick={remove} aria-label="Apagar publicação" title="Apagar">
            <IconTrash size={17} />
          </button>
        )}
      </div>

      <PostContent text={post.content} />
      {post.subject && <div className="post-subject"><span className="tag">{post.subject}</span></div>}
      {post.poll && <Poll post={post} onChanged={onChange} />}

      <div className="post-actions">
        <button className={`post-action ${post.likedByMe ? 'liked' : ''}`} onClick={toggleLike} aria-pressed={post.likedByMe}>
          <IconHeart size={18} {...(post.likedByMe ? FILLED : {})} /> {post.likes || ''}
          <span className="sr-only">gostos</span>
        </button>
        <button className="post-action" onClick={() => setShowComments((s) => !s)} aria-expanded={showComments}>
          <IconComment size={18} /> {post.comments || ''}
        </button>
        <button className={`post-action ${post.savedByMe ? 'saved' : ''}`} onClick={toggleSave} aria-pressed={post.savedByMe}>
          <IconBookmark size={18} {...(post.savedByMe ? FILLED : {})} />
        </button>
        <button className="post-action" onClick={share}>
          <IconShare size={18} />
        </button>
      </div>

      {showComments && <Comments post={post} />}
    </article>
  );
}
