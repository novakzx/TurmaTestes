import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { useRealtime, totalUnreads } from '../store/RealtimeContext.jsx';
import Avatar from './Avatar.jsx';
import {
  IconHome, IconCalendar, IconBook, IconChat, IconUser, IconBell,
  IconSettings, IconLogout, IconWifiOff,
} from './Icons.jsx';
import { Spinner } from './ui.jsx';

function Logo({ compact = false }) {
  return (
    <span className="logo" aria-label="Turma+">
      <span className="logo-mark" aria-hidden="true">
        T<span className="logo-plus">+</span>
      </span>
      {!compact && <span className="logo-text">Turma<span className="logo-plus">+</span></span>}
    </span>
  );
}

function Badge({ n, max = 99 }) {
  if (!n) return null;
  return <span className="badge">{n > max ? `${max}+` : n}</span>;
}

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { unreads, notifCount, online } = useRealtime();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate('/entrar', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="page-loader">
        <Spinner size={34} />
        <p>A carregar o Turma+…</p>
      </div>
    );
  }
  if (!user) return null;

  const msgTotal = totalUnreads(unreads);

  const items = [
    { to: '/', label: 'Início', Icon: IconHome, end: true },
    { to: '/calendario', label: 'Calendário', Icon: IconCalendar },
    { to: '/apoio', label: 'Apoio', Icon: IconBook },
    { to: '/mensagens', label: 'Mensagens', Icon: IconChat, badge: msgTotal },
    { to: '/perfil', label: 'Perfil', Icon: IconUser },
  ];

  return (
    <div className="app-shell">
      {!online && (
        <div className="offline-banner" role="status">
          <IconWifiOff size={16} /> Sem ligação — a mostrar conteúdo guardado no dispositivo
        </div>
      )}

      {/* Barra lateral (desktop) */}
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-logo"><Logo /></NavLink>
        <nav className="sidebar-nav" aria-label="Principal">
          {items.map(({ to, label, Icon, badge, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
              <span className="nav-icon">
                <Icon size={22} />
                {badge ? <Badge n={badge} /> : null}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
          <NavLink to="/notificacoes" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
            <span className="nav-icon">
              <IconBell size={22} />
              {notifCount ? <Badge n={notifCount} /> : null}
            </span>
            <span>Notificações</span>
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          <NavLink to="/perfil" className="me-chip">
            <Avatar user={user} size={36} />
            <span className="me-info">
              <strong>{user.displayName}</strong>
              <small>@{user.username}</small>
            </span>
          </NavLink>
          <div className="sidebar-actions">
            <NavLink to="/definicoes" className="icon-btn" aria-label="Definições" title="Definições">
              <IconSettings size={20} />
            </NavLink>
            <button className="icon-btn" aria-label="Terminar sessão" title="Terminar sessão" onClick={async () => { await logout(); navigate('/entrar'); }}>
              <IconLogout size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Barra superior (mobile) */}
      <header className="topbar">
        <NavLink to="/"><Logo /></NavLink>
        <div className="topbar-actions">
          <NavLink to="/notificacoes" className="icon-btn" aria-label={`Notificações${notifCount ? `, ${notifCount} por ler` : ''}`}>
            <IconBell size={21} />
            {notifCount ? <Badge n={notifCount} /> : null}
          </NavLink>
        </div>
      </header>

      <main className="main-col">
        <Outlet />
      </main>

      {/* Navegação inferior (mobile) */}
      <nav className="bottom-nav" aria-label="Principal">
        {items.map(({ to, label, Icon, badge, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `bnav-item ${isActive ? 'bnav-active' : ''}`}>
            <span className="bnav-icon">
              <Icon size={23} />
              {badge ? <Badge n={badge} /> : null}
            </span>
            <span className="bnav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
