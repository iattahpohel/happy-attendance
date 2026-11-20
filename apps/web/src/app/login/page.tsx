'use client';

import { useState } from 'react';
import { Character } from '@/components/Character';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const isDev = process.env.NODE_ENV !== 'production';
  const [email, setEmail] = useState(isDev ? 'an@happy.local' : '');
  const [password, setPassword] = useState(isDev ? 'happy123' : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-[#FFE3C4] via-cream to-cream p-4">
      <div className="w-full max-w-sm">
        <div className="mb-2 flex justify-center">
          <Character kind="sunny" mood="happy" size={150} />
        </div>
        <h1 className="text-center text-3xl font-black">Happy Attendance</h1>
        <p className="mt-1 text-center font-semibold text-muted">Mỗi ngày đi làm, một niềm vui nhỏ.</p>

        <form onSubmit={submit} className="card mt-6 space-y-3 p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Email</span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Mật khẩu</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="rounded-xl bg-coral-soft px-3 py-2 text-sm font-bold">{error}</p>}
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Đang vào…' : 'Bắt đầu ngày mới ☀️'}
          </button>
          {isDev && (
            <p className="text-center text-xs text-muted">
              Demo: an@happy.local (nhân viên) · ha@happy.local (admin) · mật khẩu happy123
            </p>
          )}
        </form>
        <p className="mt-6 text-center text-sm font-bold text-muted">Show up. Grow up. Feel good.</p>
      </div>
    </div>
  );
}
