'use client';

import clsx from 'clsx';
import { Award, Gift, Home, Map, Settings, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { NotificationBell } from './NotificationBell';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/journey', label: 'Hành trình', icon: Map },
  { href: '/achievements', label: 'Thành tựu', icon: Award },
  { href: '/wrapped', label: 'Wrapped', icon: Gift },
  { href: '/community', label: 'Cộng đồng', icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { me } = useAuth();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="min-h-dvh lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-paper/60 p-5 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-black">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun text-xl">🌱</span>
          Happy Attendance
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition',
                isActive(href) ? 'bg-sun-soft text-ink' : 'text-muted hover:bg-cream hover:text-ink',
              )}
            >
              <Icon size={20} strokeWidth={2.4} />
              {label}
            </Link>
          ))}
          {me?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={clsx(
                'mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition',
                isActive('/admin') ? 'bg-lavender-soft' : 'text-muted hover:bg-cream hover:text-ink',
              )}
            >
              <Shield size={20} strokeWidth={2.4} />
              Quản trị
            </Link>
          )}
        </nav>
        <Link href="/profile" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-muted hover:bg-cream hover:text-ink">
          <Settings size={20} /> Cá nhân
        </Link>
        <p className="mt-4 px-4 text-xs text-muted">Show up. Grow up. Feel good.</p>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-cream/85 px-4 py-3 backdrop-blur sm:px-6 lg:justify-end">
          <Link href="/" className="flex items-center gap-2 font-black lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sun">🌱</span>
            Happy Attendance
          </Link>
          <div className="flex items-center gap-1">
            {me?.role === 'ADMIN' && (
              <Link href="/admin" className="rounded-full p-2.5 text-muted hover:bg-paper lg:hidden" aria-label="Quản trị">
                <Shield size={20} />
              </Link>
            )}
            <NotificationBell />
            <Link href="/profile" className="rounded-full p-2.5 text-muted hover:bg-paper lg:hidden" aria-label="Cá nhân">
              <Settings size={20} />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold', isActive(href) ? 'text-ink' : 'text-muted')}
            >
              <span className={clsx('rounded-full px-4 py-1 transition', isActive(href) && 'bg-sun-soft')}>
                <Icon size={20} strokeWidth={2.4} />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
