import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useToast } from '../store/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import {
  IconSun, IconMoon, IconBell, IconShield, IconDownload, IconTrash, IconLock, IconLogout,
} from '../components/Icons.jsx';

/** Converte base64url → Uint8Array para a chave pública VAPID. */
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function Settings() {
  const { user, logout, updateMe, setTheme, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const [pushSupported, setPushSupported] = useState('Notification' in window && 'serviceWorker' in navigator);
  const [pushState, setPushState] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggleTheme = async (value) => {
    setDark(value);
    setTheme(value ? 'dark' : 'light');
    updateMe({ theme: value ? 'dark' : 'light' }).catch(() => {});
  };

  const togglePush = async (enable) => {
    try {
      if (enable) {
        const perm = await Notification.requestPermission();
        setPushState(perm);
        if (perm !== 'granted') {
          toast('Permissão de notificações recusada — ativa nas definições do browser.', 'danger');
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const { key } = await api.get('/notifications/push/vapid-key');
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(key),
        });
        await api.post('/notifications/push/subscribe', sub.toJSON());
        await updateMe({ pushEnabled: true });
        toast('Notificações push ativas 🔔');
      } else {
        const reg = await navigator.serviceWorker?.ready;
        const sub = await reg?.pushManager?.getSubscription();
        if (sub) {
          await api.post('/notifications/push/unsubscribe', { endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
        await updateMe({ pushEnabled: false });
        toast('Notificações push desativadas');
      }
    } catch (e) {
      toast(e.message || 'Não foi possível alterar as notificações.', 'danger');
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const blob = await api.blob('/gdpr/export');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'turma-mais-os-meus-dados.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('Os teus dados foram descarregados 📦');
    } catch {
      toast('Falha na exportação.', 'danger');
    } finally {
      setExporting(false);
    }
  };

  const pushOn = user?.pushEnabled && pushState === 'granted';

  return (
    <div className="page">
      <div className="page-head">
        <h1>Definições</h1>
        <p>@{user?.username}</p>
      </div>

      <section className="card set-sec">
        <h2>Aparência</h2>
        <div className="set-row">
          <div className="row" style={{ gap: 12 }}>
            {dark ? <IconMoon size={20} /> : <IconSun size={20} />}
            <div className="col"><strong>Modo escuro</strong><small>Guardado na tua conta e neste dispositivo</small></div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={dark} onChange={(e) => toggleTheme(e.target.checked)} aria-label="Modo escuro" />
            <span className="track" />
          </label>
        </div>
      </section>

      <section className="card set-sec">
        <h2>Notificações</h2>
        <div className="set-row">
          <div className="row" style={{ gap: 12 }}>
            <IconBell size={20} />
            <div className="col">
              <strong>Notificações push</strong>
              <small>
                {pushSupported
                  ? 'Mensagens, gostos e lembretes de feriados/greves do teu município — mesmo com a app fechada'
                  : 'Este browser não suporta notificações push'}
              </small>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" disabled={!pushSupported} checked={!!pushOn} onChange={(e) => togglePush(e.target.checked)} aria-label="Notificações push" />
            <span className="track" />
          </label>
        </div>
        <div className="set-row">
          <div className="row" style={{ gap: 12 }}>
            <IconLock size={20} />
            <div className="col"><strong>Palavra-passe</strong><small>Altera regularmente; mínimo 8 caracteres com letras e números</small></div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setPwOpen(true)}>Alterar</button>
        </div>
      </section>

      <section className="card set-sec">
        <h2>Privacidade e dados (RGPD)</h2>
        <div className="set-row">
          <div className="col"><strong>Os teus dados</strong><small>Exporta tudo o que guardámos sobre ti (JSON legível)</small></div>
          <button className="btn btn-outline btn-sm" onClick={exportData} disabled={exporting}>
            <IconDownload size={15} /> {exporting ? 'A preparar…' : 'Exportar'}
          </button>
        </div>
        <div className="set-row">
          <div className="col"><strong>Política de Privacidade</strong><small>Como tratamos os dados e quais os teus direitos</small></div>
          <Link to="/privacidade" className="btn btn-ghost btn-sm"><IconShield size={15} /> Ler</Link>
        </div>
        <div className="set-row">
          <div className="col"><strong>Termos de Utilização</strong><small>Regras da comunidade e utilização aceitável</small></div>
          <Link to="/termos" className="btn btn-ghost btn-sm">Ler</Link>
        </div>
        <div className="set-row">
          <div className="col" style={{ color: 'var(--danger)' }}>
            <strong>Eliminar conta</strong>
            <small>Apaga permanentemente todos os teus dados (direito ao apagamento, RGPD art. 17)</small>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}><IconTrash size={15} /> Eliminar</button>
        </div>
      </section>

      <section className="card set-sec">
        <h2>Sessão</h2>
        <div className="set-row">
          <div className="col"><strong>Terminar sessão</strong><small>Podes voltar quando quiseres — o teu conteúdo fica guardado</small></div>
          <button className="btn btn-outline btn-sm" onClick={async () => { await logout(); navigate('/entrar'); }}>
            <IconLogout size={15} /> Sair
          </button>
        </div>
      </section>

      <p className="center muted small mt-3">Turma+ · versão 1.0.0 · feito por e para estudantes em Portugal 🇵🇹</p>

      {pwOpen && <PasswordModal onClose={() => setPwOpen(false)} onDone={() => { setPwOpen(false); toast('Palavra-passe alterada 🔐'); }} />}
      {deleteOpen && <DeleteModal onClose={() => setDeleteOpen(false)} onDeleted={() => navigate('/entrar')} />}
    </div>
  );
}

function PasswordModal({ onClose, onDone }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (form.newPassword !== form.confirm) return toast('As palavras-passes não coincidem.', 'danger');
    setBusy(true);
    try {
      await api.patch('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      onDone();
    } catch (e) { toast(e.message, 'danger'); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Alterar palavra-passe">
      <div className="field"><label htmlFor="pw-cur">Palavra-passe atual</label><input id="pw-cur" type="password" className="input" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} autoComplete="current-password" /></div>
      <div className="field"><label htmlFor="pw-new">Nova palavra-passe</label><input id="pw-new" type="password" className="input" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} autoComplete="new-password" /><small className="muted">Mínimo 8 caracteres, com letras e números</small></div>
      <div className="field"><label htmlFor="pw-conf">Confirmar</label><input id="pw-conf" type="password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} autoComplete="new-password" /></div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy || !form.currentPassword || form.newPassword.length < 8}>Alterar</button>
      </div>
    </Modal>
  );
}

function DeleteModal({ onClose, onDeleted }) {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api.del('/gdpr/account', { password });
      toast('Conta eliminada. Até já 👋');
      await logout();
      onDeleted();
    } catch (e) { toast(e.message, 'danger'); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Eliminar conta">
      <div className="notice">
        <IconTrash size={16} />
        <span>Esta ação é <strong>irreversível</strong>: publicações, mensagens, fichas e perfil são apagados permanentemente (RGPD art. 17).</span>
      </div>
      <div className="field">
        <label htmlFor="del-pw">Confirma com a tua palavra-passe</label>
        <input id="del-pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-danger" onClick={submit} disabled={busy || !password}>{busy ? 'A eliminar…' : 'Eliminar para sempre'}</button>
      </div>
    </Modal>
  );
}
