'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Celebration, CelebrationData } from '@/components/Celebration';
import { Character, Mood } from '@/components/Character';
import { EventVisual } from '@/components/EventVisual';
import { Garden } from '@/components/Garden';
import { Bar, ProgressRing } from '@/components/ProgressRing';
import { SkyScene } from '@/components/SkyScene';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { firstName, timeOf } from '@/lib/format';
import { sounds } from '@/lib/sound';
import type { CheckInResult, CheckOutResult, HomeData } from '@/lib/types';

function greetingByHour(min: number) {
  if (min < 11 * 60) return 'Chào buổi sáng';
  if (min < 13 * 60) return 'Chào buổi trưa';
  if (min < 18 * 60) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function HomePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['home'], queryFn: () => api<HomeData>('/home') });

  const refreshAll = () => {
    for (const k of ['home', 'calendar', 'achievements', 'event', 'notifications', 'items', 'me']) qc.invalidateQueries({ queryKey: [k] });
  };

  const checkIn = useMutation({
    mutationFn: () => api<CheckInResult>('/attendance/check-in', { method: 'POST' }),
    onSuccess: (r) => {
      if (data?.me.soundEnabled) (r.newAchievements.length ? sounds.achievement : sounds.checkIn)();
      setCelebration({
        kind: 'checkin',
        greeting: r.greeting,
        headline: r.isScheduledDay ? '+1 ngày nỗ lực' : 'Hôm nay là ngày nghỉ của bạn',
        xpGained: r.xpGained,
        leveledUp: r.leveledUp,
        achievements: r.newAchievements,
      });
      refreshAll();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const checkOut = useMutation({
    mutationFn: () => api<CheckOutResult>('/attendance/check-out', { method: 'POST' }),
    onSuccess: (r) => {
      if (data?.me.soundEnabled) sounds.checkOut();
      setCelebration({
        kind: 'checkout',
        greeting: r.greeting,
        headline: r.record.completed ? 'Hoàn thành ngày làm việc ✓' : 'Đã check-out',
        xpGained: r.xpGained,
        leveledUp: r.leveledUp,
        achievements: r.newAchievements,
        contribution: r.contribution,
        quests: r.questsCompleted,
      });
      refreshAll();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const accessory = useMemo(() => data?.equipped.find((i) => i.type === 'OUTFIT')?.icon ?? null, [data]);
  const background = useMemo(() => data?.equipped.find((i) => i.type === 'BACKGROUND')?.code ?? null, [data]);
  const decorations = useMemo(() => data?.equipped.filter((i) => i.type === 'DECORATION').map((i) => i.icon) ?? [], [data]);

  if (isLoading || !data) return <HomeSkeleton />;

  const { me, today, monthProgress, profile, streak, event } = data;
  const phase = today.phase;
  const mood: Mood = phase === 'BEFORE_CHECK_IN' ? 'sleepy' : phase === 'WORKING' ? 'happy' : 'sleeping';
  const plan = today.plan;
  const dayOff = !plan.scheduled;
  const bubble =
    phase === 'DONE'
      ? 'Hôm nay bạn đã làm rất tốt. Nghỉ ngơi nhé! 🌙'
      : phase === 'WORKING'
        ? today.record?.greeting ?? 'Cố lên nhé, mình ở đây cổ vũ bạn!'
        : dayOff
          ? plan.kind === 'LEAVE'
            ? 'Hôm nay bạn nghỉ phép. Nghỉ ngơi thật tốt nhé 🌴'
            : plan.kind === 'HOLIDAY'
              ? `Hôm nay là ${plan.holidayName}. Tận hưởng ngày nghỉ nhé 🎉`
              : 'Hôm nay là ngày nghỉ của bạn. Thư giãn nhé 🌿'
          : 'Ưm… mình vẫn còn buồn ngủ. Check-in để đánh thức mặt trời nhé!';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">
          {greetingByHour(today.minutesOfDay)}, {firstName(me.fullName)} 👋
        </h1>
        <p className="font-semibold text-muted">
          {new Date(`${today.date}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          {plan.scheduled && ` · Ca làm ${plan.startTime}–${plan.endTime}`}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Khoảnh khắc chấm công */}
        <section className="card p-3">
          <SkyScene phase={phase} background={background}>
            <div className="flex flex-col items-center">
              <motion.div
                key={bubble}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-1 max-w-[16rem] rounded-2xl px-3 py-2 text-center text-sm font-bold shadow-soft ${
                  phase === 'DONE' ? 'bg-white/90 text-night' : 'bg-white'
                }`}
              >
                {bubble}
              </motion.div>
              <Character kind={me.character} mood={mood} size={128} accessory={accessory} />
            </div>
          </SkyScene>

          <div className="p-3 pt-4">
            {phase === 'BEFORE_CHECK_IN' && (
              <BigButton onClick={() => checkIn.mutate()} busy={checkIn.isPending} tone="sun" icon={<Sun size={26} />}>
                {dayOff ? 'Check-in (ngày nghỉ)' : 'Check-in'}
              </BigButton>
            )}
            {phase === 'WORKING' && (
              <>
                <BigButton onClick={() => checkOut.mutate()} busy={checkOut.isPending} tone="night" icon={<Moon size={24} />}>
                  Check-out
                </BigButton>
                <p className="mt-2 text-center text-sm font-semibold text-muted">
                  Bạn đã check-in lúc <b className="text-ink">{timeOf(today.record?.checkInAt)}</b>
                </p>
              </>
            )}
            {phase === 'DONE' && (
              <div className="rounded-2xl bg-lavender-soft p-4 text-center">
                <p className="font-black">Hoàn thành ngày làm việc 🌙</p>
                <p className="text-sm text-muted">
                  {timeOf(today.record?.checkInAt)} → {timeOf(today.record?.checkOutAt)}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Tiến độ tháng */}
        <section className="grid gap-5">
          <div className="card flex items-center gap-5 p-5">
            <ProgressRing value={monthProgress.completedDays} max={monthProgress.scheduledDays}>
              <span className="text-2xl font-black leading-none">{monthProgress.completedDays}</span>
              <span className="text-xs font-bold text-muted">/ {monthProgress.scheduledDays} ngày</span>
            </ProgressRing>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Tháng {monthProgress.month}</p>
              <p className="text-lg font-black leading-tight">Hành trình của riêng bạn</p>
              <p className="mt-1 text-sm text-muted">
                {monthProgress.remainingDays > 0
                  ? `Còn ${monthProgress.remainingDays} ngày làm việc theo lịch`
                  : 'Bạn đã đi hết lịch tháng này 🌻'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat icon="🌟" label="Chuỗi đều đặn" value={`${streak} ngày`} hint="Nghỉ phép không làm đứt chuỗi" />
            <Stat icon="🌱" label="Ngày nỗ lực" value={`${profile.completedDaysTotal}`} hint="Tổng ngày đã hoàn thành" />
            <div className="card col-span-2 p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="font-black">Cấp {profile.level}</p>
                <p className="text-xs font-bold text-muted">
                  {profile.xpIntoLevel}/{profile.xpForNext} XP
                </p>
              </div>
              <Bar value={profile.xpIntoLevel} max={profile.xpForNext} color="bg-sun" />
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Garden
          stage={profile.garden.stage}
          stageName={`${profile.garden.icon} ${profile.garden.name}`}
          completedDays={profile.completedDaysTotal}
          next={profile.garden.next}
          decorations={decorations}
        />

        <Link href="/community" className="card group block overflow-hidden p-4 transition hover:-translate-y-0.5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Sự kiện cả công ty</p>
            <ChevronRight size={18} className="text-muted transition group-hover:translate-x-1" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-28 shrink-0">
              <EventVisual type={event.type} icon={event.icon} pct={event.progressPct} status={event.status} compact />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black leading-tight">{event.title}</p>
              <Bar value={event.currentPoints} max={event.targetPoints} color="bg-coral" className="mt-3" />
              <p className="mt-1 text-xs font-bold text-muted">
                {event.currentPoints.toLocaleString('vi-VN')} / {event.targetPoints.toLocaleString('vi-VN')} năng lượng · {event.progressPct}%
              </p>
              <p className="mt-2 text-sm font-semibold">Mỗi ngày làm việc trọn vẹn = +10 năng lượng ⚡</p>
            </div>
          </div>
        </Link>
      </div>

      <Celebration data={celebration} character={me.character} accessory={accessory} onClose={() => setCelebration(null)} />
    </div>
  );
}

function BigButton({
  children,
  onClick,
  busy,
  tone,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone: 'sun' | 'night';
  icon: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      disabled={busy}
      className={`flex w-full items-center justify-center gap-3 rounded-3xl py-5 text-xl font-black shadow-[0_8px_0_0_rgba(0,0,0,0.12)] transition active:shadow-none disabled:opacity-60 ${
        tone === 'sun' ? 'bg-sun text-ink' : 'bg-night text-white'
      }`}
    >
      {busy ? <span className="animate-spin">⏳</span> : icon}
      {children}
    </motion.button>
  );
}

function Stat({ icon, label, value, hint }: { icon: string; label: string; value: string; hint: string }) {
  return (
    <div className="card p-4" title={hint}>
      <p className="text-2xl">{icon}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
      <p className="text-xs font-bold text-muted">{label}</p>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-line" />
      <div className="h-96 rounded-[2rem] bg-line" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-3xl bg-line" />
        <div className="h-28 rounded-3xl bg-line" />
      </div>
    </div>
  );
}
