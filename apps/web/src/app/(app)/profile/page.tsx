'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Character, CHARACTER_INFO } from '@/components/Character';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { WEEKDAY_SHORT } from '@/lib/format';
import { sounds } from '@/lib/sound';
import type { CharacterKey, Me } from '@/lib/types';

export default function ProfilePage() {
  const { me, logout } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const update = useMutation({
    mutationFn: (data: Partial<Pick<Me, 'character' | 'soundEnabled' | 'reminderEnabled'>>) =>
      api<Me>('/me/preferences', { method: 'PATCH', json: data }),
    onSuccess: (m) => {
      qc.setQueryData(['me'], m);
      qc.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const changePw = useMutation({
    mutationFn: () => api('/auth/change-password', { method: 'POST', json: pw }),
    onSuccess: () => {
      toast('Đã đổi mật khẩu', 'success');
      setPw({ currentPassword: '', newPassword: '' });
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });
  if (!me) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Cá nhân</h1>
        <p className="font-semibold text-muted">
          {me.fullName} · {me.team?.name ?? 'Chưa có team'}
        </p>
      </div>

      <section className="card p-5">
        <p className="mb-1 font-black">Người bạn đồng hành</p>
        <p className="mb-4 text-sm text-muted">Nhân vật sẽ thay đổi biểu cảm theo hành trình mỗi ngày của bạn.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.keys(CHARACTER_INFO) as CharacterKey[]).map((k) => (
            <button
              key={k}
              onClick={() => update.mutate({ character: k })}
              className={clsx('flex flex-col items-center rounded-3xl border-2 p-3 transition', me.character === k ? 'border-ink bg-sun-soft' : 'border-transparent bg-cream hover:bg-line')}
              aria-pressed={me.character === k}
            >
              <Character kind={k} mood={me.character === k ? 'excited' : 'happy'} size={80} />
              <span className="font-black">{CHARACTER_INFO[k].name}</span>
              <span className="text-center text-xs text-muted">{CHARACTER_INFO[k].desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card divide-y divide-line">
        <Toggle
          label="Âm thanh"
          desc="Âm thanh nhẹ khi chấm công và mở khóa thành tựu"
          checked={me.soundEnabled}
          onChange={(v) => {
            update.mutate({ soundEnabled: v });
            if (v) sounds.checkIn();
          }}
        />
        <Toggle
          label="Nhắc nhở nhẹ nhàng"
          desc="Một lời chào buổi sáng nếu bạn chưa check-in (không nhắc vào ngày nghỉ)"
          checked={me.reminderEnabled}
          onChange={(v) => update.mutate({ reminderEnabled: v })}
        />
        <div className="p-5">
          <p className="font-black">Lịch làm việc mặc định</p>
          <p className="text-sm text-muted">
            {me.workWeekdays.map((d) => WEEKDAY_SHORT[d]).join(', ')} · {me.defaultStartTime}–{me.defaultEndTime}
          </p>
          <p className="mt-1 text-xs text-muted">Liên hệ HR nếu lịch của bạn cần thay đổi.</p>
        </div>
      </section>

      <section className="card p-5">
        <p className="mb-3 font-black">Đổi mật khẩu</p>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            changePw.mutate();
          }}
        >
          <input
            className="input"
            type="password"
            placeholder="Mật khẩu hiện tại"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Mật khẩu mới (≥ 8 ký tự)"
            autoComplete="new-password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
          />
          <button className="btn-primary" disabled={pw.newPassword.length < 8 || !pw.currentPassword}>
            Lưu
          </button>
        </form>
      </section>

      <button className="btn-soft" onClick={logout}>
        <LogOut size={18} /> Đăng xuất
      </button>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
      <span>
        <span className="block font-black">{label}</span>
        <span className="text-sm text-muted">{desc}</span>
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx('relative h-8 w-14 shrink-0 rounded-full transition', checked ? 'bg-leaf' : 'bg-line')}
      >
        <span className={clsx('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-7' : 'left-1')} />
      </button>
    </label>
  );
}
