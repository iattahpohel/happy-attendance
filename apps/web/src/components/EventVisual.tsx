'use client';

import { motion } from 'framer-motion';
import type { EventStatus, EventType } from '@/lib/types';
import { Tree } from './Garden';

/** Hình ảnh sự kiện cộng đồng: đánh boss / trồng cây / thám hiểm — cùng một cơ chế tiến độ */
export function EventVisual({
  type,
  icon,
  pct,
  status,
  compact = false,
}: {
  type: EventType;
  icon: string;
  pct: number;
  status: EventStatus;
  compact?: boolean;
}) {
  const done = status === 'COMPLETED' || pct >= 100;
  const h = compact ? 'h-36' : 'h-56 sm:h-64';

  if (type === 'GARDEN') {
    const stage = Math.min(5, Math.floor(pct / 20) + (pct > 0 ? 1 : 0));
    return (
      <div className={`relative ${h} overflow-hidden rounded-3xl bg-gradient-to-b from-sky-soft to-leaf-soft`}>
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <motion.div animate={{ scale: 0.6 + Math.min(1, pct / 100) * 0.6 }} style={{ originY: 1 }} transition={{ type: 'spring' }}>
            <Tree stage={stage} size={compact ? 140 : 200} />
          </motion.div>
        </div>
        <span className="absolute left-4 top-3 text-3xl">{icon}</span>
        {done && <Sparkles />}
      </div>
    );
  }

  if (type === 'EXPEDITION') {
    const x = Math.min(100, pct);
    return (
      <div className={`relative ${h} overflow-hidden rounded-3xl bg-gradient-to-b from-sky-soft to-[#9FD8F5]`}>
        <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden>
          <path d="M0 30 C60 20 120 40 200 30 C280 20 340 40 400 30 V80 H0 Z" fill="#5FB4E6" />
          <path d="M0 50 C80 40 150 60 230 50 C300 42 350 58 400 50 V80 H0 Z" fill="#3E9AD3" />
        </svg>
        <div className="absolute bottom-10 right-3 text-4xl sm:text-5xl">🏝️</div>
        <div className="absolute bottom-[52px] left-[6%] right-[18%] border-t-2 border-dashed border-white/80" />
        <motion.div
          className="absolute bottom-12 text-4xl sm:text-5xl"
          initial={false}
          animate={{ left: `calc(${4 + x * 0.72}% )`, rotate: [-4, 4, -4] }}
          transition={{ left: { type: 'spring', stiffness: 30 }, rotate: { duration: 2.4, repeat: Infinity } }}
        >
          {icon}
        </motion.div>
        {done && <Sparkles />}
      </div>
    );
  }

  // BOSS
  return (
    <div className={`relative ${h} overflow-hidden rounded-3xl ${done ? 'bg-gradient-to-b from-sun-soft to-leaf-soft' : 'bg-gradient-to-b from-[#3A3D78] to-[#6E5BB8]'}`}>
      {!done && (
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 50% 60%, #ff8a7a 0%, transparent 60%)' }} />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className={compact ? 'text-7xl' : 'text-8xl sm:text-9xl'}
          style={{ filter: done ? 'none' : 'drop-shadow(0 10px 20px rgba(0,0,0,.35))' }}
          animate={done ? { y: [0, -8, 0] } : { x: [0, -3, 3, -2, 0], scale: [1, 1.02, 1] }}
          transition={{ duration: done ? 1.6 : 2.2, repeat: Infinity }}
        >
          {icon}
        </motion.span>
      </div>
      {done && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-black">
          Đã trở thành bạn của cả công ty 💚
        </span>
      )}
      {done && <Sparkles />}
    </div>
  );
}

function Sparkles() {
  return (
    <>
      {[...Array(10)].map((_, i) => (
        <span
          key={i}
          className="animate-twinkle absolute text-lg"
          style={{ left: `${(i * 29) % 95}%`, top: `${(i * 41) % 80}%`, animationDelay: `${i * 0.25}s` }}
        >
          ✨
        </span>
      ))}
    </>
  );
}

export function eventProgressLabel(type: EventType, villain?: string | null) {
  if (type === 'BOSS') return villain ? `Sức mạnh của ${villain}` : 'Sức mạnh của boss';
  if (type === 'GARDEN') return 'Năng lượng nuôi cây';
  return 'Hải trình đã đi';
}
