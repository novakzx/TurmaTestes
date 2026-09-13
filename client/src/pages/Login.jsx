import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { useToast } from '../store/ToastContext.jsx';
import { Spinner } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login(identifier.trim(), password);
      toast('Bem-vindo(a) de volta 👋');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const demo = () => {
    setIdentifier('maria.silva');
    setPassword('Estudante2026!');
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="auth-logo">
          <span className="logo-mark" aria-hidden="true">T<span className="logo-plus">+</span></span>
          <h1>Turma<span className="logo-plus">+</span></h1>
          <p>A app dos estudantes portugueses — feed, calendário oficial, mensagens de turma e apoio ao estudo.</p>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="login-id">Email ou @utilizador</label>
            <input
              id="login-id" className="input" value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username" autoFocus required maxLength={160}
            />
          </div>
          <div className="field">
            <label htmlFor="login-pw">Palavra-passe</label>
            <input
              id="login-pw" type="password" className="input" value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" required
            />
          </div>
          {error && <p className="form-error mb-2" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !identifier || !password}>
            {busy ? <><Spinner size={16} /> A entrar…</> : 'Entrar'}
          </button>
        </form>

        <div className="demo-hint">
          <strong>Conta de demonstração</strong> — <button type="button" onClick={demo}>preencher automaticamente</button>
          <br />@maria.silva · palavra-passe <code>Estudante2026!</code>
        </div>

        <p className="auth-alt">
          Ainda não tens conta? <Link to="/registar">Criar conta gratuita</Link>
        </p>
        <p className="auth-alt small">
          <Link to="/privacidade">Privacidade</Link> · <Link to="/termos">Termos</Link> · <Link to="/sobre">Sobre</Link>
        </p>
      </div>
    </div>
  );
}
