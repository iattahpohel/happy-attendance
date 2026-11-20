'use client';

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import type { CharacterKey, Contribution, QuestDone, UnlockedAchievement } from '@/lib/types';
import { Character } from './Character';

export interface CelebrationData {
  kind: 'checkin' | 'checkout';
  greeting: string;
  headline: string;
  xpGained: number;
  leveledUp?: boolean;
  achievements: UnlockedAchievement[];
  contribution?: Contribution | null;
  quests?: QuestDone[];
}

export function Celebration({
  data,
  character,
  accessory,
  onClose,
}: {
  data: CelebrationData | null;
  character: CharacterKey;
  accessory?: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!data) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const colors = data.kind === 'checkin' ? ['#FFC94A', '#FF8A7A', '#4CAF72', '#6BBCEC'] : ['#FFF6D5', '#A48DF0', '#C9E8FF'];
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors, scalar: data.kind === 'checkout' ? 0.8 : 1 });
    if (data.achievements.length) {
      setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.3 }, shapes: ['star'], colors: ['#FFC94A', '#FFE27A'] }), 400);
    }
  }, [data]);

  const night = data?.kind === 'checkout';
  return (
    <AnimatePresence>
      {data && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={data.headline}
            className={`relative w-full max-w-sm overflow-hidden rounded-[2rem] p-6 text-center shadow-2xl ${
              night ? 'bg-gradient-to-b from-night to-[#4A4E92] text-white' : 'bg-gradient-to-b from-sun-soft to-paper'
            }`}
            initial={{ scale: 0.7, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center">
              <Character kind={character} mood={night ? 'sleeping' : 'excited'} size={130} accessory={accessory} />
            </div>
            <p className="mt-2 text-lg font-black leading-snug">{data.greeting}</p>
            <motion.p
              className={`mx-auto mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-black ${night ? 'bg-white/15' : 'bg-leaf text-white'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              {data.headline}
            </motion.p>

            <div className="mt-4 space-y-2 text-left text-sm">
              {data.xpGained > 0 && (
                <Row night={night} delay={0.45}>
                  ⭐ +{data.xpGained} XP{data.leveledUp ? ' — Lên cấp!' : ''}
                </Row>
              )}
              {data.contribution && (
                <Row night={night} delay={0.55}>
                  {data.contribution.icon} +{data.contribution.points} năng lượng cho “{data.contribution.title}”
                </Row>
              )}
              {data.quests?.map((q) => (
                <Row key={q.title} night={night} delay={0.65}>
                  {q.icon} Hoàn thành nhiệm vụ “{q.title}” (+{q.points})
                </Row>
              ))}
              {data.achievements.map((a, i) => (
                <motion.div
                  key={a.code}
                  className="flex items-center gap-3 rounded-2xl bg-sun p-3 text-ink"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                >
                  <span className="text-3xl">{a.icon}</span>
                  <span>
                    <span className="block text-xs font-bold uppercase">Thành tựu mới</span>
                    <span className="font-black">{a.name}</span>
                  </span>
                </motion.div>
              ))}
            </div>

            <button onClick={onClose} className={`btn mt-5 w-full ${night ? 'bg-white text-night' : 'bg-ink text-white'}`}>
              {night ? 'Chúc ngủ ngon 🌙' : 'Bắt đầu thôi! ☀️'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ children, night, delay }: { children: React.ReactNode; night: boolean; delay: number }) {
  return (
    <motion.p
      className={`rounded-2xl px-3 py-2 font-bold ${night ? 'bg-white/10' : 'bg-white'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      {children}
    </motion.p>
  );
}
