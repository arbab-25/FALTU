/** Auth context — simulated session with role-based helpers. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, cachedUser, clearSession, getToken, setSession } from '@/services/api';
import type { Role, User } from '@/types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginDemo: (role: Role) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const DEMO_ACCOUNTS: Record<Role, string> = {
  customer: 'customer@demo.com',
  collector: 'collector@demo.com',
  recycler: 'recycler@demo.com',
  admin: 'admin@demo.com',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => cachedUser());
  const [loading, setLoading] = useState<boolean>(() => Boolean(getToken()));

  const refreshUser = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api.post<{ token: string; user: User }>('/auth/refresh');
      setSession({ token: data.token, user: data.user });
      setUser(data.user);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) void refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setSession({ token: data.token, user: data.user });
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const loginDemo = useCallback(async (role: Role) => {
    return login(DEMO_ACCOUNTS[role], 'demo123');
  }, [login]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, loginDemo, logout, refreshUser }),
    [user, loading, login, loginDemo, logout, refreshUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
