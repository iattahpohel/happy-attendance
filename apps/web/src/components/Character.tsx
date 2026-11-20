'use client';

import { motion } from 'framer-motion';
import type { CharacterKey } from '@/lib/types';

export type Mood = 'sleepy' | 'happy' | 'excited' | 'sleeping' | 'calm';

export const CHARACTER_INFO: Record<CharacterKey, { name: string; color: string; shade: string; desc: string }> = {
  sunny: { name: 'Sunny', color: '#FFC94A', shade: '#F5A623', desc: 'Tia nắng nhỏ luôn lạc quan' },
  mochi: { name: 'Mochi', color: '#FFB8C6', shade: '#F48FA7', desc: 'Bánh mochi mềm mại, hay cười' },
  leaf: { name: 'Leaf', color: '#86D9A3', shade: '#4CAF72', desc: 'Chồi non chăm chỉ lớn lên mỗi ngày' },
  cloud: { name: 'Cloud', color: '#C9E8FF', shade: '#8CC8F2', desc: 'Đám mây nhẹ nhàng, điềm tĩnh' },
  berry: { name: 'Berry', color: '#C9AEFF', shade: '#A48DF0', desc: 'Quả mọng tím tràn năng lượng' },
};

function Eyes({ mood }: { mood: Mood }) {
  const ink = '#2F2A24';
  if (mood === 'sleeping' || mood === 'sleepy') {
    return (
      <g stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d={mood === 'sleeping' ? 'M40 66 q6 5 12 0' : 'M40 67 h12'} />
        <path d={mood === 'sleeping' ? 'M68 66 q6 5 12 0' : 'M68 67 h12'} />
      </g>
    );
  }
  if (mood === 'excited') {
    return (
      <g stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d="M39 68 l7 -7 l7 7" />
        <path d="M67 68 l7 -7 l7 7" />
      </g>
    );
  }
  return (
    <g fill={ink}>
      <ellipse cx="46" cy="65" rx="4.6" ry={mood === 'calm' ? 4 : 5.4} />
      <ellipse cx="74" cy="65" rx="4.6" ry={mood === 'calm' ? 4 : 5.4} />
      <circle cx="47.6" cy="63" r="1.6" fill="#fff" />
      <circle cx="75.6" cy="63" r="1.6" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const ink = '#2F2A24';
  switch (mood) {
    case 'excited':
      return <path d="M50 77 q10 14 20 0 z" fill="#E8546B" stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />;
    case 'happy':
      return <path d="M51 77 q9 9 18 0" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />;
    case 'sleepy':
      return <ellipse cx="60" cy="80" rx="3.5" ry="4.5" fill={ink} />;
    case 'sleeping':
      return <path d="M55 80 q5 3 10 0" stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none" />;
    default:
      return <path d="M54 79 q6 4 12 0" stroke={ink} strokeWidth="2.8" strokeLinecap="round" fill="none" />;
  }
}

function TopFeature({ kind, color, shade }: { kind: CharacterKey; color: string; shade: string }) {
  switch (kind) {
    case 'sunny':
      return (
        <g fill={shade}>
          {[-40, -20, 0, 20, 40].map((a) => (
            <path key={a} d="M60 22 l-5 12 h10 z" transform={`rotate(${a} 60 62)`} />
          ))}
        </g>
      );
    case 'mochi':
      return (
        <g fill={color} stroke={shade} strokeWidth="2">
          <ellipse cx="42" cy="28" rx="8" ry="16" transform="rotate(-14 42 28)" />
          <ellipse cx="78" cy="28" rx="8" ry="16" transform="rotate(14 78 28)" />
        </g>
      );
    case 'leaf':
      return (
        <g>
          <path d="M60 34 v-10" stroke="#3D8B5A" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 25 c-12 -10 -20 -2 -18 4 c8 2 14 0 18 -4z" fill="#4CAF72" />
          <path d="M60 25 c12 -10 20 -2 18 4 c-8 2 -14 0 -18 -4z" fill="#5FC587" />
        </g>
      );
    case 'cloud':
      return (
        <g fill={color}>
          <circle cx="40" cy="40" r="13" />
          <circle cx="60" cy="33" r="15" />
          <circle cx="80" cy="40" r="13" />
        </g>
      );
    case 'berry':
      return (
        <g fill="#4CAF72">
          <path d="M60 32 c-10 -8 -18 -4 -20 0 c8 4 14 4 20 0z" />
          <path d="M60 32 c10 -8 18 -4 20 0 c-8 4 -14 4 -20 0z" />
          <circle cx="60" cy="30" r="3" fill="#3D8B5A" />
        </g>
      );
  }
}

export function Character({
  kind = 'sunny',
  mood = 'happy',
  size = 140,
  accessory,
  className,
}: {
  kind?: CharacterKey;
  mood?: Mood;
  size?: number;
  accessory?: string | null;
  className?: string;
}) {
  const info = CHARACTER_INFO[kind] ?? CHARACTER_INFO.sunny;
  const sleeping = mood === 'sleeping';
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={
        mood === 'excited'
          ? { y: [0, -14, 0], rotate: [0, -3, 3, 0] }
          : { scaleY: [1, sleeping ? 1.02 : 1.035, 1], scaleX: [1, sleeping ? 0.99 : 0.985, 1] }
      }
      transition={{ duration: mood === 'excited' ? 0.7 : sleeping ? 3.6 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${info.name} đang ${moodLabel(mood)}`}>
        <ellipse cx="60" cy="110" rx="30" ry="5" fill="#000" opacity="0.08" />
        <TopFeature kind={kind} color={info.color} shade={info.shade} />
        <path d="M20 72 C20 42 38 30 60 30 C82 30 100 42 100 72 C100 96 84 106 60 106 C36 106 20 96 20 72 Z" fill={info.color} />
        <path d="M24 82 C30 100 46 106 60 106 C74 106 90 100 96 82 C88 96 74 100 60 100 C46 100 32 96 24 82 Z" fill={info.shade} opacity="0.45" />
        <ellipse cx="44" cy="44" rx="10" ry="6" fill="#fff" opacity="0.35" transform="rotate(-20 44 44)" />
        <ellipse cx="36" cy="76" rx="7" ry="4.5" fill="#FF8FA3" opacity="0.55" />
        <ellipse cx="84" cy="76" rx="7" ry="4.5" fill="#FF8FA3" opacity="0.55" />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        {sleeping && (
          <g fill="#6B6FA8" fontWeight="900" fontFamily="sans-serif">
            <text x="92" y="36" fontSize="12" className="animate-twinkle">z</text>
            <text x="102" y="24" fontSize="9" className="animate-twinkle" style={{ animationDelay: '0.6s' }}>z</text>
          </g>
        )}
        {accessory && (
          <text x="60" y="30" fontSize="24" textAnchor="middle">
            {accessory}
          </text>
        )}
      </svg>
    </motion.div>
  );
}

function moodLabel(m: Mood) {
  return { sleepy: 'ngái ngủ', happy: 'vui vẻ', excited: 'phấn khích', sleeping: 'ngủ ngon', calm: 'thư thái' }[m];
}

/** Avatar nhỏ cho danh sách người dùng */
export function Avatar({ kind, size = 36 }: { kind: CharacterKey; size?: number }) {
  const info = CHARACTER_INFO[kind] ?? CHARACTER_INFO.sunny;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: info.color }}
      aria-hidden
    >
      <svg viewBox="20 40 80 60" width={size * 0.8} height={size * 0.6}>
        <ellipse cx="46" cy="65" rx="4.6" ry="5.4" fill="#2F2A24" />
        <ellipse cx="74" cy="65" rx="4.6" ry="5.4" fill="#2F2A24" />
        <ellipse cx="36" cy="76" rx="7" ry="4.5" fill="#FF8FA3" opacity="0.6" />
        <ellipse cx="84" cy="76" rx="7" ry="4.5" fill="#FF8FA3" opacity="0.6" />
        <path d="M51 77 q9 9 18 0" stroke="#2F2A24" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}
