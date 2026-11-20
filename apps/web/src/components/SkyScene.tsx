'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Phase } from '@/lib/types';

const SKY: Record<Phase, string> = {
  BEFORE_CHECK_IN: 'linear-gradient(180deg,#FFD9B8 0%,#FFE9C9 45%,#FFF6E4 100%)',
  WORKING: 'linear-gradient(180deg,#8FD3FF 0%,#C6EAFF 55%,#EAF7FF 100%)',
  DONE: 'linear-gradient(180deg,#232552 0%,#3A3D78 55%,#565A9E 100%)',
};

const BG_TINT: Record<string, string> = {
  bg_sakura: 'radial-gradient(circle at 80% 20%, rgba(255,184,198,.55), transparent 55%)',
  bg_sunflower: 'radial-gradient(circle at 20% 15%, rgba(255,201,74,.5), transparent 55%)',
  bg_starry: 'radial-gradient(circle at 50% 0%, rgba(164,141,240,.45), transparent 60%)',
};

/** Bầu trời thay đổi theo hành trình trong ngày: bình minh → ban ngày → đêm */
export function SkyScene({ phase, background, children }: { phase: Phase; background?: string | null; children?: React.ReactNode }) {
  const night = phase === 'DONE';
  return (
    <motion.div
      className="relative h-72 overflow-hidden rounded-[2rem] sm:h-80"
      animate={{ background: SKY[phase] }}
      initial={false}
      transition={{ duration: 1.2 }}
      style={{ background: SKY[phase] }}
    >
      {background && BG_TINT[background] && <div className="absolute inset-0" style={{ background: BG_TINT[background] }} />}

      {/* Mặt trời */}
      <motion.div
        className="absolute left-[14%] h-16 w-16 rounded-full"
        style={{ background: 'radial-gradient(circle,#FFE27A 0%,#FFC94A 60%,#FFB020 100%)', boxShadow: '0 0 60px 20px rgba(255,201,74,.45)' }}
        initial={false}
        animate={{ top: phase === 'BEFORE_CHECK_IN' ? '62%' : phase === 'WORKING' ? '12%' : '110%', opacity: night ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 40, damping: 14 }}
      />

      {/* Mặt trăng & sao */}
      <AnimatePresence>
        {night && (
          <>
            <motion.div
              key="moon"
              className="absolute right-[14%] top-[12%] h-14 w-14 rounded-full bg-[#FFF6D5]"
              style={{ boxShadow: 'inset -10px -4px 0 0 #E8DDB0, 0 0 40px 10px rgba(255,246,213,.25)' }}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 1.2 }}
            />
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.span
                key={`s${i}`}
                className="animate-twinkle absolute h-1 w-1 rounded-full bg-white"
                style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 55}%`, animationDelay: `${(i % 6) * 0.4}s` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Mây */}
      {!night && (
        <>
          <div className="animate-float absolute right-[10%] top-[18%] h-6 w-20 rounded-full bg-white/80" />
          <div className="animate-float absolute right-[22%] top-[14%] h-8 w-10 rounded-full bg-white/80" style={{ animationDelay: '0.8s' }} />
          <div className="animate-float absolute left-[40%] top-[30%] h-5 w-14 rounded-full bg-white/60" style={{ animationDelay: '1.6s' }} />
        </>
      )}

      {/* Đồi */}
      <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 400 110" preserveAspectRatio="none" aria-hidden>
        <path d="M0 60 C80 20 150 40 220 55 C290 70 340 30 400 45 V110 H0 Z" fill={night ? '#3F6B5A' : '#9BDDAE'} />
        <path d="M0 80 C90 55 170 75 240 82 C320 90 360 70 400 72 V110 H0 Z" fill={night ? '#2F5546' : '#76CC91'} />
      </svg>

      <div className="absolute inset-x-0 bottom-3 flex justify-center">{children}</div>
    </motion.div>
  );
}
