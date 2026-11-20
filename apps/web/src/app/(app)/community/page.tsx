'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Info, Lock, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/Character';
import { EventVisual, eventProgressLabel } from '@/components/EventVisual';
import { Modal } from '@/components/Modal';
import { Bar } from '@/components/ProgressRing';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { firstName, relativeTime, SOURCE_LABEL } from '@/lib/format';
import { sounds } from '@/lib/sound';
import type { Appreciation, CommunityEventDetail, EventSummary, Honors, UserLite, Zone } from '@/lib/types';

const TABS = [
  { key: 'event', label: '⚔️ Sự kiện tháng' },
  { key: 'thanks', label: '💌 Lời cảm ơn' },
  { key: 'honors', label: '🌟 Vinh danh' },
] as const;

export default function CommunityPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('event');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Cộng đồng</h1>
        <p className="font-semibold text-muted">Cùng nhau, không ai phải cạnh tranh với ai.</p>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx('btn shrink-0', tab === t.key ? 'bg-ink text-white' : 'bg-paper text-muted')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'event' && <EventTab />}
      {tab === 'thanks' && <ThanksTab />}
      {tab === 'honors' && <HonorsTab />}
    </div>
  );
}

/* ---------------- World Boss / sự kiện tháng ---------------- */

function EventTab() {
  const { data: e } = useQuery({ queryKey: ['event'], queryFn: () => api<CommunityEventDetail>('/events/current') });
  const zones = useQuery({ queryKey: ['zones'], queryFn: () => api<Zone[]>('/world/zones') });
  const history = useQuery({ queryKey: ['events-history'], queryFn: () => api<EventSummary[]>('/events') });
  const [formulaOpen, setFormulaOpen] = useState(false);
  if (!e) return <div className="h-96 animate-pulse rounded-[2rem] bg-line" />;

  const done = e.status === 'COMPLETED';
  const remainingPct = Math.max(0, 100 - e.progressPct);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-5">
        <section className="card overflow-hidden p-3">
          <EventVisual type={e.type} icon={e.icon} pct={e.progressPct} status={e.status} />
          <div className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-coral-soft">Tháng {e.month}</span>
              <span className={clsx('chip', done ? 'bg-leaf-soft' : 'bg-sun-soft')}>
                {done ? 'Đã hoàn thành 🎉' : e.status === 'ENDED' ? 'Đã khép lại' : 'Đang diễn ra'}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black">{e.title}</h2>
            <p className="mt-1 text-muted">{e.description}</p>

            {e.type === 'BOSS' && !done ? (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm font-black">
                  <span>❤️ {eventProgressLabel(e.type, e.villainName)}</span>
                  <span>{remainingPct.toFixed(1)}%</span>
                </div>
                <div className="h-5 overflow-hidden rounded-full bg-line">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-coral to-[#E8546B]"
                    initial={{ width: '100%' }}
                    animate={{ width: `${remainingPct}%` }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm font-black">
                  <span>⚡ {eventProgressLabel(e.type, e.villainName)}</span>
                  <span>{e.progressPct}%</span>
                </div>
                <Bar value={e.currentPoints} max={e.targetPoints} color="bg-leaf" className="h-5" />
              </div>
            )}
            <p className="mt-2 text-sm font-bold text-muted">
              {e.currentPoints.toLocaleString('vi-VN')} / {e.targetPoints.toLocaleString('vi-VN')} năng lượng · {e.contributorsCount} người đã góp sức
              <button onClick={() => setFormulaOpen(true)} className="ml-2 inline-flex items-center gap-1 underline">
                <Info size={13} /> cách tính
              </button>
            </p>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {e.milestones.map((m) => (
                <div key={m.pct} className={clsx('rounded-2xl p-2 text-center', m.reached ? 'bg-leaf-soft' : 'bg-cream')} title={m.line}>
                  <p className="text-lg">{m.reached ? '✅' : '⬜'}</p>
                  <p className="text-xs font-black">{m.pct}%</p>
                </div>
              ))}
            </div>
            {e.milestones.filter((m) => m.reached).slice(-1)[0] && (
              <p className="mt-3 rounded-2xl bg-sun-soft p-3 text-sm font-bold">📣 {e.milestones.filter((m) => m.reached).slice(-1)[0].line}</p>
            )}
          </div>
        </section>

        <section className="card p-5">
          <p className="mb-1 font-black">Nhiệm vụ cộng đồng</p>
          <p className="mb-3 text-sm text-muted">Mỗi nhiệm vụ bạn hoàn thành đều góp thêm năng lượng cho cả công ty.</p>
          <ul className="space-y-2">
            {e.quests.map((q) => (
              <li key={q.id} className={clsx('flex items-center gap-3 rounded-2xl p-3', q.completed ? 'bg-leaf-soft' : 'bg-cream')}>
                <span className="text-2xl">{q.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-black">{q.title}</p>
                    <span className="shrink-0 text-xs font-black text-muted">+{q.points} ⚡</span>
                  </div>
                  <p className="text-xs text-muted">{q.description}</p>
                  {!q.completed && <Bar value={q.count} max={q.targetCount} color="bg-sun" className="mt-2 h-1.5" />}
                </div>
                {q.completed ? <span className="text-xl">✅</span> : <span className="text-xs font-black">{q.count}/{q.targetCount}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-5">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <p className="font-black">Đóng góp của bạn</p>
            <span className="chip bg-cream text-muted">
              <Lock size={11} /> chỉ mình bạn thấy
            </span>
          </div>
          <p className="mt-2 text-4xl font-black">
            {e.myContribution.total} <span className="text-lg">⚡</span>
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(e.myContribution.bySource).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="text-muted">{SOURCE_LABEL[k]}</span>
                <b>+{v}</b>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Không có bảng xếp hạng — mỗi đóng góp đều quý như nhau.</p>
        </section>

        {(e.zone || done) && (
          <section className="card p-5">
            <p className="font-black">{done ? 'Khu vực vừa mở khóa' : 'Phần thưởng khi hoàn thành'}</p>
            {e.zone && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-sky-soft p-3">
                <span className="text-4xl">{e.zone.icon}</span>
                <div>
                  <p className="font-black">{e.zone.name}</p>
                  <p className="text-sm text-muted">{e.zone.description}</p>
                </div>
              </div>
            )}
            <p className="mt-3 text-sm">🎁 Tất cả nhân viên đều nhận được vật phẩm kỷ niệm chung.</p>
          </section>
        )}

        <section className="card p-5">
          <p className="mb-3 font-black">Hoạt động gần đây</p>
          <ul className="space-y-2">
            {e.recentActivity.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <Avatar kind={a.character} size={28} />
                <span className="min-w-0 flex-1">
                  <b>{firstName(a.name)}</b> {SOURCE_LABEL[a.source]}
                </span>
                <span className="shrink-0 text-xs text-muted">{relativeTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <p className="mb-3 font-black">Bản đồ thế giới chung</p>
          <div className="grid grid-cols-3 gap-2">
            {zones.data?.map((z) => (
              <div
                key={z.id}
                title={z.description}
                className={clsx('flex flex-col items-center rounded-2xl p-2 text-center', z.unlockedAt ? 'bg-leaf-soft' : 'bg-cream opacity-50')}
              >
                <span className={clsx('text-3xl', !z.unlockedAt && 'grayscale')}>{z.unlockedAt ? z.icon : '❔'}</span>
                <span className="mt-1 text-[11px] font-bold leading-tight">{z.unlockedAt ? z.name : 'Chưa khám phá'}</span>
              </div>
            ))}
          </div>
        </section>

        {!!history.data?.filter((h) => h.id !== e.id).length && (
          <section className="card p-5">
            <p className="mb-3 font-black">Các tháng trước</p>
            <ul className="space-y-2">
              {history.data
                .filter((h) => h.id !== e.id)
                .map((h) => (
                  <li key={h.id} className="flex items-center gap-3 rounded-2xl bg-cream p-3 text-sm">
                    <span className="text-2xl">{h.icon}</span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate">{h.title}</b>
                      <span className="text-xs text-muted">Tháng {h.month}/{h.year}</span>
                    </span>
                    <span className={clsx('chip', h.status === 'COMPLETED' ? 'bg-leaf-soft' : 'bg-line')}>
                      {h.status === 'COMPLETED' ? 'Chiến thắng' : `${Math.round((h.currentPoints / h.targetPoints) * 100)}%`}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>

      <Modal open={formulaOpen} onClose={() => setFormulaOpen(false)} title="Mục tiêu được tính thế nào?">
        <p className="text-sm text-muted">
          Mục tiêu tự co giãn theo số nhân viên và lịch làm việc thực tế, để công ty 10 người hay 1.000 người đều có thử thách công bằng như nhau.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <FRow k="Nhân viên tham gia" v={e.formula.activeUsers} />
          <FRow k="Tổng ngày làm việc theo lịch" v={e.formula.totalScheduledDays} />
          <FRow k="× 10 năng lượng mỗi ngày" v={e.formula.workdayPoints} />
          <FRow k="Lời cảm ơn kỳ vọng (4/người × 3)" v={e.formula.socialPoints} />
          <FRow k="Nhiệm vụ kỳ vọng (50%)" v={e.formula.questPoints} />
          <FRow k="Thành tựu kỳ vọng (1/người × 15)" v={e.formula.achievementPoints} />
          <FRow k="Tổng kỳ vọng" v={e.formula.expectedPoints} bold />
          <FRow k="Hệ số độ khó" v={`× ${e.formula.difficulty}`} />
          <FRow k="Mục tiêu" v={e.formula.targetPoints} bold />
        </dl>
      </Modal>
    </div>
  );
}

function FRow({ k, v, bold }: { k: string; v: number | string; bold?: boolean }) {
  return (
    <div className={clsx('flex justify-between rounded-xl px-3 py-2', bold ? 'bg-sun-soft font-black' : 'bg-cream')}>
      <dt>{k}</dt>
      <dd className="font-black">{typeof v === 'number' ? v.toLocaleString('vi-VN') : v}</dd>
    </div>
  );
}

/* ---------------- Appreciation Wall ---------------- */

const EMOJIS = ['💚', '🙏', '🌻', '✨', '☕', '🎉', '💪', '🌈'];
const SUGGESTIONS = ['Cảm ơn bạn đã luôn hỗ trợ mình.', 'Bạn luôn mang đến năng lượng tích cực!', 'Cảm ơn vì đã giúp team hoàn thành công việc.'];

function ThanksTab() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'wall' | 'mine'>('wall');
  const wall = useInfiniteQuery({
    queryKey: ['wall'],
    queryFn: ({ pageParam }) => api<{ items: Appreciation[]; nextCursor: string | null }>(`/appreciations/wall${pageParam ? `?cursor=${pageParam}` : ''}`),
    initialPageParam: '' as string,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const mine = useQuery({ queryKey: ['received'], queryFn: () => api<Appreciation[]>('/appreciations/received'), enabled: view === 'mine' });
  const items = view === 'wall' ? wall.data?.pages.flatMap((p) => p.items) ?? [] : mine.data ?? [];

  return (
    <div className="space-y-4">
      <div className="card flex flex-col items-start justify-between gap-3 bg-gradient-to-r from-coral-soft to-sun-soft p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-lg font-black">Appreciation Wall</p>
          <p className="text-sm text-ink/70">Một lời cảm ơn nhỏ, một ngày làm việc ấm áp hơn.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Send size={16} /> Gửi lời cảm ơn
        </button>
      </div>
      <div className="flex gap-2">
        <button className={clsx('btn', view === 'wall' ? 'bg-ink text-white' : 'bg-paper text-muted')} onClick={() => setView('wall')}>
          Bức tường chung
        </button>
        <button className={clsx('btn', view === 'mine' ? 'bg-ink text-white' : 'bg-paper text-muted')} onClick={() => setView('mine')}>
          Thiệp của tôi
        </button>
      </div>

      {view === 'mine' && !items.length && !mine.isLoading && (
        <p className="card p-8 text-center text-muted">Những lời cảm ơn bạn nhận được sẽ xuất hiện ở đây 💌</p>
      )}

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.03 }}
            className={clsx('card mb-4 break-inside-avoid p-4', ['', 'bg-sun-soft/40', 'bg-leaf-soft/40', 'bg-sky-soft/40'][i % 4])}
            style={{ rotate: `${((i % 5) - 2) * 0.4}deg` }}
          >
            <p className="text-2xl">{m.emoji}</p>
            <p className="mt-1 font-semibold leading-relaxed">{m.message}</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Avatar kind={m.sender.character} size={24} />
              <span className="min-w-0 flex-1 truncate">
                <b>{m.sender.fullName}</b>
                {m.receiver && (
                  <>
                    {' '}
                    → <b>{m.receiver.fullName}</b>
                  </>
                )}
              </span>
              <span className="shrink-0 text-muted">{relativeTime(m.createdAt)}</span>
            </div>
          </motion.div>
        ))}
      </div>
      {view === 'wall' && wall.hasNextPage && (
        <div className="text-center">
          <button className="btn-soft" onClick={() => wall.fetchNextPage()} disabled={wall.isFetchingNextPage}>
            Xem thêm
          </button>
        </div>
      )}
      <SendThanks open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function SendThanks({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const people = useQuery({ queryKey: ['directory'], queryFn: () => api<UserLite[]>('/users/directory'), enabled: open });
  const [q, setQ] = useState('');
  const [to, setTo] = useState<UserLite | null>(null);
  const [message, setMessage] = useState('');
  const [emoji, setEmoji] = useState('💚');
  const [isPublic, setIsPublic] = useState(true);
  const filtered = useMemo(
    () => people.data?.filter((p) => p.fullName.toLowerCase().includes(q.toLowerCase())).slice(0, 8) ?? [],
    [people.data, q],
  );

  const send = useMutation({
    mutationFn: () => api<{ rewarded: boolean; contribution: { points: number } | null }>('/appreciations', {
      method: 'POST',
      json: { receiverId: to!.id, message, emoji, isPublic },
    }),
    onSuccess: (r) => {
      if (me?.soundEnabled) sounds.pop();
      toast(r.contribution ? `Đã gửi! +${r.contribution.points} năng lượng cho cả công ty ⚡` : 'Đã gửi lời cảm ơn 💌', 'success');
      for (const k of ['wall', 'event', 'home', 'achievements']) qc.invalidateQueries({ queryKey: [k] });
      setTo(null);
      setMessage('');
      setQ('');
      onClose();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Gửi lời cảm ơn 💌">
      <div className="space-y-4">
        {to ? (
          <div className="flex items-center gap-3 rounded-2xl bg-cream p-3">
            <Avatar kind={to.character} />
            <div className="flex-1">
              <p className="font-black">{to.fullName}</p>
              <p className="text-xs text-muted">{to.team?.name}</p>
            </div>
            <button className="text-sm font-bold underline" onClick={() => setTo(null)}>
              Đổi
            </button>
          </div>
        ) : (
          <div>
            <input className="input" placeholder="Tìm đồng nghiệp…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setTo(p)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-cream">
                    <Avatar kind={p.character} size={32} />
                    <span className="font-bold">{p.fullName}</span>
                    <span className="ml-auto text-xs text-muted">{p.team?.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={clsx('h-10 w-10 rounded-xl text-xl', emoji === e ? 'bg-sun ring-2 ring-ink' : 'bg-cream')}
              aria-label={`Chọn ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
        <textarea
          className="input min-h-24"
          placeholder="Viết vài lời từ trái tim…"
          maxLength={280}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip bg-cream text-left font-semibold" onClick={() => setMessage(s)}>
              {s}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-[#4CAF72]" />
          Hiển thị trên bức tường chung
        </label>
        <button className="btn-primary w-full" disabled={!to || message.trim().length < 3 || send.isPending} onClick={() => send.mutate()}>
          <Send size={16} /> Gửi
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Vinh danh ---------------- */

function HonorsTab() {
  const { data } = useQuery({ queryKey: ['honors'], queryFn: () => api<Honors>('/recognition/honors') });
  const feed = useQuery({
    queryKey: ['feed'],
    queryFn: () =>
      api<{ thanksThisMonth: number; achievements: { id: string; user: UserLite; name: string; icon: string; unlockedAt: string }[] }>('/community/feed'),
  });
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <div className="card bg-gradient-to-r from-lavender-soft to-sky-soft p-5">
          <p className="text-lg font-black">Vinh danh tháng {data.month}/{data.year}</p>
          <p className="text-sm text-ink/70">
            Không có Top 1, không có bảng xếp hạng. Mỗi người có thể nhận nhiều danh hiệu, và nhiều người có thể cùng nhận một danh hiệu.
          </p>
        </div>
        {data.groups.map((g) => (
          <section key={g.code} className="card p-5">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{g.icon}</span>
              <div>
                <p className="text-lg font-black">{g.name}</p>
                <p className="text-sm text-muted">{g.meaning}</p>
              </div>
            </div>
            {g.people.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {g.people.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-full bg-cream py-1 pl-1 pr-3" title={p.reason}>
                    <Avatar kind={p.character} size={30} />
                    <span className="text-sm font-bold">{p.fullName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Danh hiệu này đang chờ người toả sáng tháng tới ✨</p>
            )}
          </section>
        ))}
      </div>
      <div className="space-y-5">
        <section className="card p-5 text-center">
          <p className="text-5xl">💌</p>
          <p className="mt-2 text-3xl font-black">{feed.data?.thanksThisMonth ?? 0}</p>
          <p className="text-sm font-bold text-muted">lời cảm ơn đã được gửi trong tháng này</p>
        </section>
        <section className="card p-5">
          <p className="mb-3 font-black">Thành tựu mới của mọi người</p>
          <ul className="space-y-2">
            {feed.data?.achievements.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <Avatar kind={a.user.character} size={28} />
                <span className="min-w-0 flex-1">
                  <b>{firstName(a.user.fullName)}</b> mở khóa {a.icon} {a.name}
                </span>
                <span className="shrink-0 text-xs text-muted">{relativeTime(a.unlockedAt)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Hãy chúc mừng họ bằng một lời cảm ơn nhé 💚</p>
        </section>
      </div>
    </div>
  );
}
