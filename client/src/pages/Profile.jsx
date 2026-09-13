import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useToast } from '../store/ToastContext.jsx';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';
import FichaCard from '../components/FichaCard.jsx';
import Modal from '../components/Modal.jsx';
import { Tabs, Spinner, Empty } from '../components/ui.jsx';
import {
  IconEdit, IconChat, IconUser, IconMapPin, IconCap, IconBookmark, IconLock,
} from '../components/Icons.jsx';

export default function Profile() {
  const { username } = useParams();
  const { user: me, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const isMe = !username || username.toLowerCase() === me?.username;
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState(params.get('tab') || 'posts');
  const [posts, setPosts] = useState(null);
  const [savedPosts, setSavedPosts] = useState(null);
  const [fichas, setFichas] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => { setTab(params.get('tab') || 'posts'); }, [params]);

  const load = useCallback(async () => {
    setNotFound(false); setForbidden(false);
    try {
      const d = isMe ? await api.get('/users/me') : await api.get(`/users/${username}`);
      setProfile(d.user);
    } catch (e) {
      if (e.status === 404) setNotFound(true);
      else toast(e.message, 'danger');
    }
  }, [isMe, username, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!profile) return;
    if (tab === 'posts') {
      api.get(`/users/${profile.username}/posts`)
        .then((d) => setPosts(d.posts))
        .catch((e) => { if (e.status === 403) setForbidden(true); else setPosts([]); });
    }
    if (tab === 'saved' && isMe) {
      api.get('/posts/saved').then((d) => setSavedPosts(d.posts)).catch(() => setSavedPosts([]));
      api.get('/tutor/fichas?saved=1').then((d) => setFichas(d.fichas)).catch(() => setFichas([]));
    }
  }, [tab, profile?.id]); // eslint-disable-line

  if (notFound) {
    return <div className="page"><Empty icon={<IconUser size={40} />} title="Perfil não encontrado" hint="Verifica o nome de utilizador." /></div>;
  }
  if (!profile) {
    return <div className="page"><div className="block-loader"><Spinner size={28} /></div></div>;
  }

  const updatePost = (updated) => {
    const upd = (arr) => (arr || []).map((p) => (p.id === updated.id ? updated : p));
    setPosts(upd); setSavedPosts(upd);
  };

  const tabsDef = isMe
    ? [
        { id: 'posts', label: 'Publicações', count: profile.stats?.posts },
        { id: 'saved', label: 'Apontamentos' },
      ]
    : [{ id: 'posts', label: 'Publicações', count: profile.stats?.posts }];

  return (
    <div className="page">
      <div className="card profile-head">
        <div className="profile-top">
          <Avatar user={profile} size={72} ring={profile.role === 'admin'} />
          <div className="profile-id">
            <h1>
              {profile.displayName}{' '}
              {profile.role === 'admin' && <span className="tag" title="Conta oficial">Oficial</span>}
              {profile.isPrivate && <IconLock size={15} className="muted" />}
            </h1>
            <span className="profile-handle">@{profile.username}</span>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.school && <span className="chip chip-static"><IconCap size={13} /> {profile.school}</span>}
              {profile.gradeYear && <span className="chip chip-static">{profile.gradeYear}</span>}
              {profile.course && <span className="chip chip-static">{profile.course}</span>}
              {profile.municipality && <span className="chip chip-static"><IconMapPin size={13} /> {profile.municipality}{profile.district ? `, ${profile.district}` : ''}</span>}
            </div>
            <div className="profile-stats">
              <span><strong>{profile.stats?.posts ?? 0}</strong> publicações</span>
              <Link to={`/perfil/${profile.username}/seguidores`} onClick={(e) => { e.preventDefault(); showList(profile, 'followers', toast); }}><strong>{profile.stats?.followers ?? 0}</strong> seguidores</Link>
              <Link to={`/perfil/${profile.username}/a-seguir`} onClick={(e) => { e.preventDefault(); showList(profile, 'following', toast); }}><strong>{profile.stats?.following ?? 0}</strong> a seguir</Link>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          {isMe ? (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => setEditOpen(true)}><IconEdit size={15} /> Editar perfil</button>
              <Link to="/definicoes" className="btn btn-ghost btn-sm">Definições</Link>
            </>
          ) : (
            <>
              <FollowBtn profile={profile} onChanged={load} />
              <DmBtn username={profile.username} onOpen={(id) => navigate(`/mensagens/${id}`)} toast={toast} />
            </>
          )}
        </div>
      </div>

      <Tabs tabs={tabsDef} active={tab} onChange={(t) => { setTab(t); const p = new URLSearchParams(params); t === 'posts' ? p.delete('tab') : p.set('tab', t); setParams(p, { replace: true }); }} />

      {tab === 'posts' && (
        posts === null ? <div className="block-loader"><Spinner /></div>
          : forbidden ? <Empty icon={<IconLock size={40} />} title="Perfil privado" hint="Esta pessoa tem o perfil privado. Segue-a para ver as publicações." />
          : posts.length === 0 ? <Empty icon={<IconEdit size={40} />} title={isMe ? 'Ainda não publicaste nada' : 'Sem publicações'} hint={isMe ? 'Partilha a primeira dúvida ou conquista no feed.' : undefined} />
          : posts.map((p) => <PostCard key={p.id} post={p} onChange={updatePost} onDelete={(id) => setPosts((ps) => ps.filter((x) => x.id !== id))} />)
      )}

      {tab === 'saved' && isMe && (
        <div>
          <h3 className="mb-2" style={{ fontSize: 14 }}>Fichas de estudo guardadas</h3>
          {fichas === null ? <div className="block-loader"><Spinner /></div>
            : fichas.length === 0 ? <p className="muted small mb-3">Nenhuma ficha guardada. Cria-as em <Link to="/apoio" style={{ color: 'var(--brand-ink)', fontWeight: 700 }}>Apoio</Link>.</p>
            : fichas.map((h) => <FichaCard key={h.id} entry={h} collapsed onSave={async (id) => { await api.post(`/tutor/fichas/${id}/save`); const d = await api.get('/tutor/fichas?saved=1'); setFichas(d.fichas); }} />)}
          <h3 className="mt-4 mb-2" style={{ fontSize: 14 }}>Publicações guardadas</h3>
          {savedPosts === null ? <div className="block-loader"><Spinner /></div>
            : savedPosts.length === 0 ? <p className="muted small">As publicações que guardares com o marcador aparecem aqui.</p>
            : savedPosts.map((p) => <PostCard key={p.id} post={p} onChange={updatePost} onDelete={(id) => setSavedPosts((ps) => ps.filter((x) => x.id !== id))} />)}
        </div>
      )}

      {editOpen && <EditProfileModal profile={profile} onClose={() => setEditOpen(false)} onSaved={async (u) => { setEditOpen(false); await refresh(); load(); toast('Perfil atualizado.'); }} />}
    </div>
  );
}

function showList(profile, kind) {
  // lista simples em janela de alerta — versão completa no roadmap
  api.get(`/users/${profile.username}/${kind}`).then((d) => {
    const names = d.users.map((u) => `@${u.username}`).join(', ');
    alert(`${kind === 'followers' ? 'Seguidores' : 'A seguir'}:\n${names || '(ninguém ainda)'}`);
  });
}

function FollowBtn({ profile, onChanged }) {
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try { await api.post(`/users/${profile.username}/follow`); onChanged?.(); } finally { setBusy(false); }
  };
  return (
    <button className={`btn btn-sm ${profile.isFollowing ? 'btn-outline' : 'btn-primary'}`} onClick={toggle} disabled={busy}>
      {profile.isFollowing ? 'A seguir' : 'Seguir'}
    </button>
  );
}

function DmBtn({ username, onOpen, toast }) {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    try {
      const d = await api.post('/conversations', { type: 'dm', username });
      onOpen(d.conversation.id);
    } catch (e) { toast(e.message, 'danger'); } finally { setBusy(false); }
  };
  return <button className="btn btn-outline btn-sm" onClick={open} disabled={busy}><IconChat size={15} /> Mensagem</button>;
}

function EditProfileModal({ profile, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    displayName: profile.displayName || '', bio: profile.bio || '', school: profile.school || '',
    district: profile.district || '', municipality: profile.municipality || '',
    gradeYear: profile.gradeYear || '', course: profile.course || '', isPrivate: !!profile.isPrivate,
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setBusy(true);
    try { await onSaved(await api.patch('/users/me', form)); }
    catch (e) { toast(e.message, 'danger'); }
    finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Editar perfil">
      <div className="field"><label htmlFor="ep-name">Nome</label><input id="ep-name" className="input" value={form.displayName} onChange={set('displayName')} maxLength={60} /></div>
      <div className="field"><label htmlFor="ep-bio">Biografia</label><textarea id="ep-bio" className="textarea" style={{ minHeight: 64 }} value={form.bio} onChange={set('bio')} maxLength={280} /></div>
      <div className="field"><label htmlFor="ep-school">Escola</label><input id="ep-school" className="input" value={form.school} onChange={set('school')} maxLength={120} /></div>
      <div className="grid-2">
        <div className="field"><label htmlFor="ep-dist">Distrito</label><input id="ep-dist" className="input" value={form.district} onChange={set('district')} maxLength={60} /></div>
        <div className="field"><label htmlFor="ep-mun">Município</label><input id="ep-mun" className="input" value={form.municipality} onChange={set('municipality')} maxLength={80} placeholder="ativa o feriado municipal" /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label htmlFor="ep-grade">Ano</label>
          <select id="ep-grade" className="select" value={form.gradeYear} onChange={set('gradeYear')}>
            <option value="">—</option>
            {['7.º ano', '8.º ano', '9.º ano', '10.º ano', '11.º ano', '12.º ano', 'Ensino superior'].map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="ep-course">Curso/percurso</label><input id="ep-course" className="input" value={form.course} onChange={set('course')} maxLength={80} /></div>
      </div>
      <div className="set-row">
        <div className="col"><strong>Perfil privado</strong><small>Apenas seguidores aprovados veem as tuas publicações</small></div>
        <label className="switch"><input type="checkbox" checked={form.isPrivate} onChange={set('isPrivate')} /><span className="track" /></label>
      </div>
      <div className="row mt-3" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={busy || !form.displayName.trim()}>{busy ? 'A guardar…' : 'Guardar'}</button>
      </div>
    </Modal>
  );
}
