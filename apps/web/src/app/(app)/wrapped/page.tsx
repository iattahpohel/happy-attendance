'use client';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { ChevronLeft, ChevronRight, Download, Play, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Character } from '@/components/Character';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { hours, MONTH_EN, WEEKDAY_LONG } from '@/lib/format';
import type { SummaryRow, Wrapped } from '@/lib/types';

const GRADIENTS = [
  'from-[#FF9A6B] via-[#FFC94A] to-[#FFE7A0]',
  'from-[#4CAF72] via-[#86D9A3] to-[#DDF4E4]',
  'from-[#6BBCEC] via-[#A6D8F7] to-[#E4F4FD]',
  'from-[#A48DF0] via-[#C9AEFF] to-[#EEE8FF]',
  'from-[#FF8A7A] via-[#FFB5A8] to-[#FFE4DF]',
  'from-[#2B2D5C] via-[#4A4E92] to-[#7A6FD0]',
];

export default function WrappedPage() {
  const [current] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const history = useQuery({ queryKey: ['wrapped-history'], queryFn: () => api<SummaryRow[]>('/wrapped/history') });
  const [sel, setSel] = useState<{ year: number; month: number } | null>(null);
  const [playing, setPlaying] = useState(false);

  // Mặc định mở tháng gần nhất đã chốt
  useEffect(() => {
    if (sel || !history.data) return;
    const latest = history.data[0];
    setSel(latest ? { year: latest.year, month: latest.month } : current);
  }, [history.data, sel, current]);

  const options = [current, ...(history.data ?? []).map((h) => ({ year: h.year, month: h.month }))].filter(
    (o, i, arr) => arr.findIndex((x) => x.year === o.year && x.month === o.month) === i,
  );

  const { data } = useQuery({
    queryKey: ['wrapped', sel?.year, sel?.month],
    queryFn: () => api<Wrapped>(`/wrapped/${sel!.year}/${sel!.month}`),
    enabled: !!sel,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Monthly Wrapped</h1>
        <p className="font-semibold text-muted">Your journey, your achievement.</p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {options.map((o) => {
          const active = sel?.year === o.year && sel?.month === o.month;
          const isCur = o.year === current.year && o.month === current.month;
          return (
            <button
              key={`${o.year}-${o.month}`}
              onClick={() => setSel(o)}
              className={`btn shrink-0 ${active ? 'bg-ink text-white' : 'bg-paper text-muted'}`}
            >
              Tháng {o.month}/{o.year}
              {isCur && <span className="chip bg-sun-soft text-ink">đang diễn ra</span>}
            </button>
          );
        })}
      </div>

      {data && (
        <>
          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPlaying(true)}
            className={`relative block w-full overflow-hidden rounded-[2rem] bg-gradient-to-br ${GRADIENTS[data.month % GRADIENTS.length]} p-6 text-left shadow-soft sm:p-8`}
          >
            <p className="text-xs font-black tracking-[0.3em] text-ink/70">YOUR {MONTH_EN[data.month - 1]} JOURNEY</p>
            <p className="mt-1 text-3xl font-black sm:text-4xl">Tháng {data.month} của bạn 🌻</p>
            <p className="mt-2 max-w-md font-semibold text-ink/80">
              {data.isCurrentMonth
                ? `Tháng vẫn đang diễn ra — còn ${data.daysLeftInMonth} ngày nữa. Đây là bản xem trước.`
                : 'Bấm để xem lại câu chuyện tháng của bạn.'}
            </p>
            <span className="btn mt-5 bg-ink text-white">
              <Play size={18} /> Xem câu chuyện
            </span>
            <div className="absolute -bottom-4 right-2 sm:right-8">
              <Character kind={data.user.character} mood="excited" size={130} />
            </div>
          </motion.button>

          <SummaryCard data={data} />

          {!!history.data?.length && (
            <section className="card p-5">
              <p className="mb-3 font-black">Lịch sử các tháng</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {history.data.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSel({ year: h.year, month: h.month })}
                    className="flex items-center justify-between rounded-2xl bg-cream p-3 text-left hover:bg-line"
                  >
                    <span className="font-bold">
                      Tháng {h.month}/{h.year}
                    </span>
                    <span className="text-sm font-bold text-muted">
                      {h.completedDays}/{h.scheduledDays} ngày · {Math.round(h.completionRate * 100)}%
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <AnimatePresence>{playing && data && <Story data={data} onClose={() => setPlaying(false)} />}</AnimatePresence>
    </div>
  );
}

/** Thẻ tổng kết — có thể xuất ảnh để chia sẻ */
function SummaryCard({ data }: { data: Wrapped }) {
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const s = data.stats;

  async function exportImage() {
    if (!ref.current) return;
    try {
      const url = await toPng(ref.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = url;
      a.download = `happy-wrapped-${data.year}-${String(data.month).padStart(2, '0')}.png`;
      a.click();
    } catch {
      toast('Không xuất được ảnh, thử lại nhé', 'error');
    }
  }

  return (
    <section className="space-y-3">
      <div ref={ref} className="overflow-hidden rounded-[2rem] bg-paper p-6 shadow-soft sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.3em] text-muted">YOUR {MONTH_EN[data.month - 1]} JOURNEY</p>
            <p className="text-2xl font-black">
              Tháng {data.month} của {data.user.firstName} 🌻
            </p>
          </div>
          <Character kind={data.user.character} mood="happy" size={72} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Tile big={`${s.completedDays} / ${s.scheduledDays}`} label="Ngày làm việc hoàn thành" color="bg-leaf-soft" />
          <Tile big={`${s.onTimeDays}`} label="Ngày chuyên cần" color="bg-sun-soft" />
          <Tile big={`${s.lateDays}`} label="Ngày đi muộn" color="bg-sky-soft" />
          <Tile big={`${hours(s.workedMinutes)}h`} label="Thời gian làm việc" color="bg-lavender-soft" />
          <Tile big={`${s.achievementsUnlocked}`} label="Thành tựu mở khóa" color="bg-coral-soft" />
        </div>
        {!!data.titles.length && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.titles.map((t) => (
              <span key={t.code} className="chip bg-cream px-3 py-1.5 text-sm">
                {t.icon} {t.name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-5 rounded-2xl bg-cream p-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Lời nhắn dành cho bạn</p>
          <p className="mt-1 font-semibold leading-relaxed">“{data.message}”</p>
        </div>
        <p className="mt-4 text-center text-xs font-black tracking-widest text-muted">HAPPY ATTENDANCE · YOUR JOURNEY, YOUR ACHIEVEMENT.</p>
      </div>
      <button onClick={exportImage} className="btn-soft">
        <Download size={18} /> Lưu ảnh tổng kết
      </button>
    </section>
  );
}

function Tile({ big, label, color }: { big: string; label: string; color: string }) {
  return (
    <div className={`rounded-2xl p-3 ${color}`}>
      <p className="text-2xl font-black">{big}</p>
      <p className="text-xs font-bold text-ink/70">{label}</p>
    </div>
  );
}

/* ---------------- Story player ---------------- */

function useSlides(d: Wrapped) {
  const s = d.stats;
  const slides: { key: string; render: () => React.ReactNode }[] = [
    {
      key: 'intro',
      render: () => (
        <>
          <p className="text-sm font-black tracking-[0.3em] opacity-80">YOUR {MONTH_EN[d.month - 1]} JOURNEY</p>
          <h2 className="mt-3 text-5xl font-black leading-tight">Tháng {d.month} của bạn 🌻</h2>
          <p className="mt-4 text-lg font-semibold opacity-90">Cùng nhìn lại hành trình của {d.user.firstName} nhé!</p>
          <div className="mt-8 flex justify-center">
            <Character kind={d.user.character} mood="excited" size={170} />
          </div>
        </>
      ),
    },
    {
      key: 'days',
      render: () => (
        <>
          <p className="text-lg font-bold opacity-90">Tháng này, bạn đã có mặt</p>
          <p className="mt-2 text-8xl font-black">
            {s.completedDays}
            <span className="text-4xl opacity-70"> / {s.scheduledDays}</span>
          </p>
          <p className="mt-2 text-xl font-black">ngày làm việc hoàn thành</p>
          <p className="mt-6 text-lg font-semibold opacity-90">
            {s.scheduledDays && s.completedDays >= s.scheduledDays
              ? 'Trọn vẹn từng ngày. Thật đáng tự hào! 🏆'
              : 'Mỗi ngày bạn có mặt đều là một bông hoa trong khu vườn 🌼'}
          </p>
        </>
      ),
    },
    {
      key: 'rhythm',
      render: () => (
        <>
          <p className="text-lg font-bold opacity-90">Nhịp làm việc của bạn</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <Big n={`${s.onTimeDays}`} l="ngày chuyên cần" />
            <Big n={`${hours(s.workedMinutes)}h`} l="thời gian làm việc" />
            <Big n={`${s.longestStreak}`} l="ngày liên tiếp dài nhất" />
            <Big n={d.avgCheckInTime ?? '--:--'} l="giờ check-in trung bình" />
          </div>
          {d.favoriteWeekday != null && (
            <p className="mt-6 text-lg font-semibold">
              {WEEKDAY_LONG[d.favoriteWeekday]} là ngày bạn có mặt nhiều nhất ✨
            </p>
          )}
        </>
      ),
    },
  ];

  if (d.comparison) {
    const c = d.comparison;
    const delta = Math.round((s.completionRate - c.completionRate) * 100);
    slides.push({
      key: 'compare',
      render: () => (
        <>
          <p className="text-lg font-bold opacity-90">So với chính bạn tháng {c.month}</p>
          <p className="mt-4 text-7xl font-black">
            {delta > 0 ? `+${delta}%` : delta === 0 ? '=' : `${delta}%`}
          </p>
          <p className="mt-2 text-lg font-bold">tỉ lệ hoàn thành lịch</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <Big n={`${c.completedDays}/${c.scheduledDays}`} l={`tháng ${c.month}`} />
            <Big n={`${s.completedDays}/${s.scheduledDays}`} l={`tháng ${d.month}`} />
          </div>
          <p className="mt-6 text-lg font-semibold opacity-90">
            {delta > 0 ? 'Bạn đang tiến bộ từng ngày 🌱' : delta === 0 ? 'Ổn định là một siêu năng lực 💪' : 'Mỗi tháng một nhịp — không sao cả, bạn vẫn đang ở đây 💛'}
          </p>
        </>
      ),
    });
  }

  if (d.achievements.length || d.titles.length) {
    slides.push({
      key: 'titles',
      render: () => (
        <>
          <p className="text-lg font-bold opacity-90">Bạn đã sưu tầm được</p>
          <div className="mt-5 space-y-2 text-left">
            {d.titles.map((t) => (
              <div key={t.code} className="flex items-center gap-3 rounded-2xl bg-white/20 p-3">
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <p className="font-black">{t.name}</p>
                  <p className="text-sm opacity-90">{t.reason}</p>
                </div>
              </div>
            ))}
            {d.achievements.map((a) => (
              <div key={a.code} className="flex items-center gap-3 rounded-2xl bg-white/15 p-3">
                <span className="text-3xl">{a.icon}</span>
                <p className="font-black">{a.name}</p>
              </div>
            ))}
          </div>
        </>
      ),
    });
  }

  if (d.appreciationCard.length) {
    slides.push({
      key: 'thanks',
      render: () => (
        <>
          <p className="text-lg font-bold opacity-90">Đồng nghiệp đã gửi tới bạn</p>
          <p className="text-6xl font-black">{d.appreciationCard.length} lời cảm ơn 💌</p>
          <div className="mt-5 max-h-[45vh] space-y-2 overflow-y-auto text-left">
            {d.appreciationCard.slice(0, 6).map((m) => (
              <div key={m.id} className="rounded-2xl bg-white/90 p-3 text-ink">
                <p className="font-semibold">
                  {m.emoji} {m.message}
                </p>
                <p className="mt-1 text-xs font-bold text-muted">— {m.from}</p>
              </div>
            ))}
          </div>
        </>
      ),
    });
  }

  if (d.communityEvent) {
    const e = d.communityEvent;
    slides.push({
      key: 'event',
      render: () => (
        <>
          <p className="text-lg font-bold opacity-90">Cùng cả công ty</p>
          <p className="mt-3 text-8xl">{e.icon}</p>
          <p className="mt-3 text-2xl font-black">{e.title}</p>
          <p className="mt-4 text-lg font-semibold">
            Bạn đã góp <b className="text-3xl">{s.eventPoints}</b> năng lượng
          </p>
          <p className="mt-2 font-semibold opacity-90">
            {e.status === 'COMPLETED' ? 'Và cả công ty đã chiến thắng! 🎉' : `Cả công ty đã đi được ${e.progressPct}% chặng đường`}
          </p>
        </>
      ),
    });
  }

  slides.push({
    key: 'outro',
    render: () => (
      <>
        <p className="text-sm font-black uppercase tracking-widest opacity-80">Lời nhắn dành cho bạn</p>
        <p className="mt-4 text-2xl font-black leading-snug">“{d.message}”</p>
        <div className="mt-6 flex justify-center">
          <Character kind={d.user.character} mood="happy" size={140} />
        </div>
        <p className="mt-4 font-black tracking-widest">YOUR JOURNEY, YOUR ACHIEVEMENT.</p>
      </>
    ),
  });
  return slides;
}

function Big({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl bg-white/20 p-4">
      <p className="text-3xl font-black">{n}</p>
      <p className="text-sm font-bold opacity-90">{l}</p>
    </div>
  );
}

const STORY_MS = 6500;

function Story({ data, onClose }: { data: Wrapped; onClose: () => void }) {
  const slides = useSlides(data);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const next = useCallback(() => setI((x) => (x + 1 < slides.length ? x + 1 : x)), [slides.length]);
  const prev = useCallback(() => setI((x) => Math.max(0, x - 1)), []);

  useEffect(() => {
    if (paused || i === slides.length - 1) return;
    const t = setTimeout(next, STORY_MS);
    return () => clearTimeout(t);
  }, [i, paused, next, slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const dark = i % GRADIENTS.length === GRADIENTS.length - 1;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className={`relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b ${GRADIENTS[i % GRADIENTS.length]} ${dark ? 'text-white' : 'text-ink'} sm:h-[90dvh] sm:max-w-md sm:rounded-[2rem]`}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
      >
        <div className="flex gap-1 p-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          {slides.map((s, idx) => (
            <div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-black/15">
              <motion.div
                className={`h-full ${dark ? 'bg-white' : 'bg-ink'}`}
                initial={{ width: idx < i ? '100%' : '0%' }}
                animate={{ width: idx < i ? '100%' : idx === i ? '100%' : '0%' }}
                transition={{ duration: idx === i && !paused && i < slides.length - 1 ? STORY_MS / 1000 : 0, ease: 'linear' }}
              />
            </div>
          ))}
        </div>
        <button onClick={onClose} className="absolute right-3 top-6 z-10 rounded-full bg-black/10 p-2" aria-label="Đóng">
          <X size={18} />
        </button>

        <div className="relative flex flex-1 items-center justify-center px-7 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[i].key}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45 }}
              className="w-full"
            >
              {slides[i].render()}
            </motion.div>
          </AnimatePresence>
          <button className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-label="Trước" />
          <button className="absolute inset-y-0 right-0 w-1/3" onClick={next} aria-label="Tiếp" />
        </div>

        <div className="flex items-center justify-between p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button onClick={prev} disabled={i === 0} className="rounded-full bg-black/10 p-3 disabled:opacity-30" aria-label="Trước">
            <ChevronLeft />
          </button>
          <span className="text-sm font-black opacity-70">
            {i + 1} / {slides.length}
          </span>
          {i < slides.length - 1 ? (
            <button onClick={next} className="rounded-full bg-black/10 p-3" aria-label="Tiếp">
              <ChevronRight />
            </button>
          ) : (
            <button onClick={onClose} className={`btn ${dark ? 'bg-white text-ink' : 'bg-ink text-white'}`}>
              Xong 💛
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
