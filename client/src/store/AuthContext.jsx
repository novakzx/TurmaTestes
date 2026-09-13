import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/session')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const d = await api.post('/auth/login', { identifier, password });
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (payload) => {
    const d = await api.post('/auth/register', payload);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignora */ }
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const d = await api.get('/users/me');
      setUser(d.user);
      return d.user;
    } catch {
      return null;
    }
  }, []);

  /** Atualização parcial do perfil (PATCH /users/me) com estado local sincronizado. */
  const updateMe = useCallback(async (patch) => {
    const d = await api.patch('/users/me', patch);
    setUser((prev) => ({ ...(prev || {}), ...d.user }));
    return d.user;
  }, []);

  const setTheme = useCallback((theme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tm-theme', theme);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh, updateMe, setTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
