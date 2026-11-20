'use client';

import { motion } from 'framer-motion';

/** Cây trong khu vườn cá nhân — lớn lên theo số ngày làm việc hoàn thành */
export function Tree({ stage, size = 160 }: { stage: number; size?: number }) {
  const trunkH = [0, 14, 26, 40, 52, 56][stage] ?? 56;
  const crown = [0, 0, 18, 30, 42, 46][stage] ?? 46;
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} aria-label={`Cây giai đoạn ${stage}`}>
      <ellipse cx="80" cy="146" rx="46" ry="8" fill="#B7864F" opacity="0.35" />
      <path d="M44 146 q36 -14 72 0 z" fill="#8B5E34" />
      {stage === 0 && <ellipse cx="80" cy="140" rx="8" ry="6" fill="#8B5E34" stroke="#6B4423" strokeWidth="2" />}
      {stage >= 1 && (
        <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: 1, originX: 0.5 }} transition={{ duration: 0.8 }}>
          <rect x={80 - (stage >= 3 ? 6 : 2.5)} y={142 - trunkH} width={stage >= 3 ? 12 : 5} height={trunkH} rx="3" fill={stage >= 3 ? '#8B5E34' : '#4CAF72'} />
          {stage === 1 && (
            <>
              <path d="M80 130 c-14 -12 -24 -2 -20 4 c8 2 14 0 20 -4z" fill="#5FC587" />
              <path d="M80 128 c14 -12 24 -2 20 4 c-8 2 -14 0 -20 -4z" fill="#4CAF72" />
            </>
          )}
          {stage >= 2 && (
            <motion.g
              animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ originX: 0.5, originY: 1 }}
            >
              <circle cx="80" cy={142 - trunkH} r={crown} fill="#4CAF72" />
              <circle cx={80 - crown * 0.6} cy={142 - trunkH + crown * 0.3} r={crown * 0.7} fill="#5FC587" />
              <circle cx={80 + crown * 0.6} cy={142 - trunkH + crown * 0.3} r={crown * 0.7} fill="#5FC587" />
              <circle cx={80 - crown * 0.3} cy={142 - trunkH - crown * 0.35} r={crown * 0.35} fill="#7ED6A0" opacity="0.8" />
              {stage >= 4 &&
                [0, 1, 2, 3, 4].map((i) => (
                  <circle
                    key={i}
                    cx={80 + Math.cos(i * 1.3) * crown * 0.7}
                    cy={142 - trunkH + Math.sin(i * 1.3) * crown * 0.6}
                    r={stage >= 5 ? 5 : 4}
                    fill={stage >= 5 ? '#FFB8C6' : '#FF8A7A'}
                  />
                ))}
            </motion.g>
          )}
        </motion.g>
      )}
    </svg>
  );
}

export function Garden({
  stage,
  stageName,
  completedDays,
  next,
  decorations = [],
}: {
  stage: number;
  stageName: string;
  completedDays: number;
  next: { name: string; icon: string; daysLeft: number } | null;
  decorations?: string[];
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-leaf-soft to-transparent" />
      <div className="relative flex items-center gap-4">
        <div className="relative shrink-0">
          <Tree stage={stage} size={128} />
          {decorations.slice(0, 3).map((d, i) => (
            <span key={i} className="absolute text-xl" style={{ left: [4, 98, 18][i], bottom: [10, 14, 0][i] }}>
              {d}
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Khu vườn của bạn</p>
          <p className="text-xl font-black">{stageName}</p>
          <p className="mt-1 text-sm text-muted">
            Đã chăm sóc <b className="text-ink">{completedDays}</b> ngày
          </p>
          {next ? (
            <p className="mt-2 text-sm">
              Còn <b>{next.daysLeft}</b> ngày nữa để thành {next.icon} {next.name}
            </p>
          ) : (
            <p className="mt-2 text-sm">Khu vườn đã nở hoa rực rỡ 🌸</p>
          )}
        </div>
      </div>
      <p className="relative mt-3 text-sm font-semibold text-leaf">Bạn đang chăm sóc khu vườn của mình rất tốt!</p>
    </div>
  );
}
