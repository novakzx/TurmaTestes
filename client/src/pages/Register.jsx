import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { useToast } from '../store/ToastContext.jsx';
import { Spinner } from '../components/ui.jsx';

const YEARS = ['7.º ano', '8.º ano', '9.º ano', '10.º ano', '11.º ano', '12.º ano', 'Ensino superior'];

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '', username: '', email: '', password: '',
    school: '', gradeYear: '', municipality: '', district: '',
    consentTerms: false, consentPrivacy: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.consentTerms || !form.consentPrivacy) {
      return setError('Tens de aceitar os Termos e a Política de Privacidade.');
    }
    setBusy(true);
    setError('');
    try {
      await register({ ...form, username: form.username.toLowerCase().trim(), email: form.email.toLowerCase().trim() });
      toast('Conta criada — bem-vindo(a) ao Turma+ 🎉');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.data?.details?.map((d) => d.message).join(' · ') || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <span className="logo-mark" aria-hidden="true">T<span className="logo-plus">+</span></span>
          <h1>Criar conta</h1>
          <p>Gratuita, para estudantes em Portugal. Precisamos do mínimo de dados — ver a <Link to="/privacidade" style={{ color: 'var(--brand-ink)', fontWeight: 700 }}>Política de Privacidade</Link>.</p>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="r-name">Nome (como apareces na app)</label>
            <input id="r-name" className="input" value={form.displayName} onChange={set('displayName')} required minLength={2} maxLength={60} autoFocus autoComplete="name" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="r-user">@utilizador</label>
              <input id="r-user" className="input" value={form.username} onChange={set('username')} required minLength={3} maxLength={24} autoComplete="username" placeholder="ex.: ana.sofia" />
            </div>
            <div className="field">
              <label htmlFor="r-email">Email</label>
              <input id="r-email" type="email" className="input" value={form.email} onChange={set('email')} required maxLength={160} autoComplete="email" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="r-pw">Palavra-passe</label>
            <input id="r-pw" type="password" className="input" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
            <small>Mínimo 8 caracteres, com letras e números</small>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="r-school">Escola <span className="muted">(opcional)</span></label>
              <input id="r-school" className="input" value={form.school} onChange={set('school')} maxLength={120} autoComplete="organization" />
            </div>
            <div className="field">
              <label htmlFor="r-year">Ano de escolaridade</label>
              <select id="r-year" className="select" value={form.gradeYear} onChange={set('gradeYear')}>
                <option value="">—</option>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="r-dist">Distrito / Região</label>
              <input id="r-dist" className="input" value={form.district} onChange={set('district')} maxLength={60} placeholder="ex.: Lisboa, Porto, Açores…" />
            </div>
            <div className="field">
              <label htmlFor="r-mun">Município</label>
              <input id="r-mun" className="input" value={form.municipality} onChange={set('municipality')} maxLength={80} placeholder="ativa o feriado municipal" />
            </div>
          </div>

          <div className="consent-row">
            <input id="r-terms" type="checkbox" checked={form.consentTerms} onChange={set('consentTerms')} />
            <label htmlFor="r-terms">Li e aceito os <Link to="/termos">Termos de Utilização</Link>. Tenho 13 anos ou mais (ou autorização do encarregado de educação).</label>
          </div>
          <div className="consent-row">
            <input id="r-privacy" type="checkbox" checked={form.consentPrivacy} onChange={set('consentPrivacy')} />
            <label htmlFor="r-privacy">Li a <Link to="/privacidade">Política de Privacidade</Link> e compreendo como os meus dados são tratados (RGPD).</label>
          </div>

          {error && <p className="form-error mb-2" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <><Spinner size={16} /> A criar conta…</> : 'Criar conta gratuita'}
          </button>
        </form>

        <p className="auth-alt">Já tens conta? <Link to="/entrar">Iniciar sessão</Link></p>
      </div>
    </div>
  );
}
