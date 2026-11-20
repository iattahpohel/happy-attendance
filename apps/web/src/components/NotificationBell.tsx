'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import type { Notification } from '@/lib/types';
import { Modal } from './Modal';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<{ items: Notification[]; unread: number }>('/notifications'),
    refetchInterval: 60_000,
  });
  const readAll = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          if (data?.unread) readAll.mutate();
        }}
        className="relative rounded-full p-2.5 text-muted hover:bg-paper"
        aria-label={`Thông báo${data?.unread ? `, ${data.unread} chưa đọc` : ''}`}
      >
        <Bell size={20} />
        {!!data?.unread && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-black text-white">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Thông báo">
        {!data?.items.length && <p className="py-8 text-center text-muted">Chưa có thông báo nào 🌤️</p>}
        <ul className="space-y-2">
          {data?.items.map((n) => (
            <li key={n.id} className={`rounded-2xl p-3 ${n.readAt ? 'bg-cream/60' : 'bg-sun-soft'}`}>
              <p className="font-bold">{n.title}</p>
              <p className="text-sm text-muted">{n.body}</p>
              <p className="mt-1 text-xs text-muted">{relativeTime(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
