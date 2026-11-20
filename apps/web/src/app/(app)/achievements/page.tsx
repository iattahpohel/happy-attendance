'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Character } from '@/components/Character';
import { Bar } from '@/components/ProgressRing';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AchievementView, CatalogItem, ItemType, TitleView } from '@/lib/types';

const TABS = [
  { key: 'achievements', label: 'Thành tựu' },
  { key: 'titles', label: 'Danh hiệu' },
  { key: 'collection', label: 'Bộ sưu tập' },
] as const;

export default function AchievementsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('achievements');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Thành tựu của tôi</h1>
        <p className="font-semibold text-muted">Không có cuộc đua nào ở đây — chỉ có hành trình của riêng bạn.</p>
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
      {tab === 'achievements' && <AchievementGrid />}
      {tab === 'titles' && <Titles />}
      {tab === 'collection' && <Collection />}
    </div>
  );
}

function AchievementGrid() {
  const { data } = useQuery({ queryKey: ['achievements'], queryFn: () => api<AchievementView[]>('/achievements') });
  const unlocked = data?.filter((a) => a.unlocked).length ?? 0;
  return (
    <>
      <div className="card flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Đã mở khóa</p>
          <p className="text-3xl font-black">
            {unlocked}
            <span className="text-lg text-muted"> / {data?.length ?? 0}</span>
          </p>
        </div>
        <span className="text-5xl">🏅</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data?.map((a, i) => (
          <motion.div
            key={a.code}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={clsx('card relative flex flex-col items-center p-4 text-center', !a.unlocked && 'bg-cream/50')}
          >
            <span
              className={clsx(
                'flex h-16 w-16 items-center justify-center rounded-full text-4xl',
                a.unlocked ? 'bg-sun-soft' : 'bg-line grayscale opacity-50',
              )}
            >
              {a.icon}
            </span>
            {!a.unlocked && <Lock size={14} className="absolute right-3 top-3 text-muted" />}
            <p className="mt-2 font-black leading-tight">{a.name}</p>
            <p className="mt-1 text-xs text-muted">{a.description}</p>
            {a.unlocked ? (
              <p className="mt-2 text-xs font-bold text-leaf">✓ {new Date(a.unlockedAt!).toLocaleDateString('vi-VN')}</p>
            ) : (
              a.threshold != null &&
              a.progress != null && (
                <div className="mt-2 w-full">
                  <Bar value={a.progress} max={a.threshold} color="bg-sun" />
                  <p className="mt-1 text-xs font-bold text-muted">
                    {Math.min(a.progress, a.threshold)}/{a.threshold}
                  </p>
                </div>
              )
            )}
          </motion.div>
        ))}
      </div>
    </>
  );
}

function Titles() {
  const { data } = useQuery({ queryKey: ['titles'], queryFn: () => api<TitleView[]>('/titles/mine') });
  if (!data) return null;
  if (!data.length)
    return <p className="card p-8 text-center text-muted">Danh hiệu được trao vào đầu mỗi tháng. Hẹn gặp bạn ở tháng tới nhé 🌈</p>;
  const groups = data.reduce<Record<string, TitleView[]>>((acc, t) => {
    const k = `${t.year}-${t.month}`;
    (acc[k] ||= []).push(t);
    return acc;
  }, {});
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([k, titles]) => (
        <section key={k} className="card p-5">
          <p className="mb-3 font-black">
            Tháng {titles[0].month}/{titles[0].year}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {titles.map((t) => (
              <div key={t.id} className="flex items-start gap-3 rounded-2xl bg-cream p-3">
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <p className="font-black">{t.name}</p>
                  <p className="text-xs font-bold text-muted">{t.meaning}</p>
                  <p className="mt-1 text-sm">{t.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const TYPE_LABEL: Record<ItemType, string> = {
  OUTFIT: 'Trang phục',
  BACKGROUND: 'Phông nền',
  DECORATION: 'Trang trí vườn',
  STICKER: 'Sticker',
};

function Collection() {
  const { me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const { data } = useQuery({ queryKey: ['items'], queryFn: () => api<CatalogItem[]>('/items') });
  const equip = useMutation({
    mutationFn: ({ id, equipped }: { id: string; equipped: boolean }) => api(`/items/${id}/equip`, { method: 'PATCH', json: { equipped } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });
  const outfit = data?.find((i) => i.type === 'OUTFIT' && i.equipped)?.icon;
  const owned = data?.filter((i) => i.owned).length ?? 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
      <div className="card flex flex-col items-center p-6 lg:sticky lg:top-20 lg:self-start">
        <Character kind={me?.character ?? 'sunny'} mood="happy" size={150} accessory={outfit} />
        <p className="mt-2 font-black">
          {owned} / {data?.length ?? 0} vật phẩm
        </p>
        <p className="text-center text-sm text-muted">Mở khóa vật phẩm từ thành tựu, lên cấp và các sự kiện cả công ty.</p>
      </div>
      <div className="space-y-5">
        {(['OUTFIT', 'BACKGROUND', 'DECORATION', 'STICKER'] as ItemType[]).map((type) => (
          <section key={type}>
            <p className="mb-2 font-black">{TYPE_LABEL[type]}</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {data
                ?.filter((i) => i.type === type)
                .map((i) => (
                  <button
                    key={i.id}
                    disabled={!i.owned || equip.isPending}
                    onClick={() => equip.mutate({ id: i.id, equipped: !i.equipped })}
                    title={i.description}
                    className={clsx(
                      'card relative flex flex-col items-center p-3 text-center transition',
                      i.equipped && 'ring-4 ring-sun',
                      !i.owned && 'opacity-45',
                      i.owned && 'hover:-translate-y-0.5',
                    )}
                  >
                    <span className={clsx('text-3xl', !i.owned && 'grayscale')}>{i.icon}</span>
                    <span className="mt-1 text-xs font-bold leading-tight">{i.name}</span>
                    {i.rarity !== 'common' && (
                      <span className={clsx('chip mt-1', i.rarity === 'epic' ? 'bg-lavender-soft' : 'bg-sky-soft')}>{i.rarity}</span>
                    )}
                    {i.equipped && <span className="absolute -right-1 -top-1 rounded-full bg-sun px-1.5 text-[10px] font-black">ON</span>}
                    {!i.owned && <Lock size={12} className="absolute right-2 top-2 text-muted" />}
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
