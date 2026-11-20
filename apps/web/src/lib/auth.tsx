'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, getToken, setToken } from './api';
import type { Me } from './types';

interface AuthCtx {
  me: Me | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => setHasToken(!!getToken()), []);

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/me'),
    enabled: !!hasToken,
    staleTime: 60_000,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ accessToken: string }>('/auth/login', { method: 'POST', json: { email, password } });
      setToken(res.accessToken);
      qc.clear();
      setHasToken(true);
      router.replace('/');
    },
    [qc, router],
  );

  const logout = useCallback(() => {
    setToken(null);
    qc.clear();
    setHasToken(false);
    router.replace('/login');
  }, [qc, router]);

  return (
    <Ctx.Provider value={{ me, loading: hasToken === null || (!!hasToken && isLoading), login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
