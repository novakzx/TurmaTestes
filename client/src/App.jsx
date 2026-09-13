import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Feed from './pages/Feed.jsx';
import CalendarPage from './pages/Calendar.jsx';
import Messages from './pages/Messages.jsx';
import Chat from './pages/Chat.jsx';
import Tutor from './pages/Tutor.jsx';
import Profile from './pages/Profile.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Static, { PrivacyPage, TermsPage, AboutPage } from './pages/Static.jsx';
import NotFound from './pages/NotFound.jsx';
import { useEffect } from 'react';

function ThemeEffect() {
  const { user } = useAuth();
  useEffect(() => {
    const stored = localStorage.getItem('tm-theme');
    const theme = user?.theme || stored || 'light';
    document.documentElement.dataset.theme = theme;
  }, [user?.theme]);
  return null;
}

export default function App() {
  return (
    <>
      <ThemeEffect />
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/registar" element={<Register />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/sobre" element={<AboutPage />} />
        <Route element={<Layout />}>
          <Route index element={<Feed />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="apoio" element={<Tutor />} />
          <Route path="mensagens" element={<Messages />} />
          <Route path="mensagens/:id" element={<Chat />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="perfil/:username" element={<Profile />} />
          <Route path="notificacoes" element={<Notifications />} />
          <Route path="definicoes" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
