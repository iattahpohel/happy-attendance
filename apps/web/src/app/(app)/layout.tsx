'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Character } from '@/components/Character';
import { getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  if (loading || !me) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <Character kind="sunny" mood="sleepy" size={110} />
        <p className="font-bold text-muted">Đang đánh thức mặt trời…</p>
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
