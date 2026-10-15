import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, AUTH_TOKEN_KEY, jsonBody } from '../lib/api';
import type { AuthResponse, Player, User } from '../types';

interface AuthContextValue {
  user: User | null; token: string | null; ready: boolean;
  login(email: string, password: string): Promise<void>;
  register(payload: Record<string, string | number>): Promise<Player | undefined>;
  logout(): void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) { setReady(true); return; }
    api<{ user: User; player: Player | null }>('/auth/me')
      .then((result) => setUser(result.user))
      .catch(() => { localStorage.removeItem(AUTH_TOKEN_KEY); setToken(null); setUser(null); })
      .finally(() => setReady(true));
  }, [token]);

  const accept = useCallback((result: AuthResponse) => {
    localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const result = await api<AuthResponse>('/auth/login', { method: 'POST', body: jsonBody({ email, password }) });
    accept(result);
  }, [accept]);
  const register = useCallback(async (payload: Record<string, string | number>) => {
    const result = await api<AuthResponse>('/auth/register', { method: 'POST', body: jsonBody(payload) });
    accept(result);
    return result.player;
  }, [accept]);
  const logout = useCallback(() => { localStorage.removeItem(AUTH_TOKEN_KEY); setToken(null); setUser(null); }, []);
  const value = useMemo(() => ({ user, token, ready, login, register, logout }), [user, token, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
