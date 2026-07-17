/* eslint-disable react-refresh/only-export-components -- context module exports both a provider and its hook by design */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from './api';

export interface AuthUser {
  username: string;
  role: 'staff' | 'organizer';
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ff26_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/**
 * App-wide auth state. Holds the signed-in operator and exposes login/logout.
 * On login it stores the JWT (via setAuthToken) so the API client attaches it
 * as a Bearer token on every request; the user profile is persisted separately
 * so the header can reflect auth state across reloads.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const persist = (res: { token: string; username: string; role: AuthUser['role'] }) => {
    setAuthToken(res.token);
    const profile: AuthUser = { username: res.username, role: res.role };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ff26_user', JSON.stringify(profile));
    }
    setUser(profile);
  };

  const login = async (username: string, password: string) => {
    persist(await api.login(username, password));
  };

  const signup = async (username: string, password: string) => {
    persist(await api.signup(username, password));
  };

  const logout = () => {
    setAuthToken(null);
    if (typeof localStorage !== 'undefined') localStorage.removeItem('ff26_user');
    setUser(null);
  };

  // Auto-logout when the API reports the session is no longer valid (401).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (typeof localStorage !== 'undefined') localStorage.removeItem('ff26_user');
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
