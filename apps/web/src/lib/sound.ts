/** Âm thanh nhẹ nhàng tổng hợp bằng Web Audio — không cần file âm thanh */
let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === 'undefined') return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, volume = 0.12, type: OscillatorType = 'sine') {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + start;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sounds = {
  /** Buổi sáng: hợp âm đi lên */
  checkIn() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.6));
  },
  /** Cuối ngày: hợp âm đi xuống, dịu dàng */
  checkOut() {
    [783.99, 659.25, 523.25, 392].forEach((f, i) => tone(f, i * 0.14, 0.9, 0.09, 'triangle'));
  },
  achievement() {
    [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => tone(f, i * 0.07, 0.5, 0.1));
    tone(1567.98, 0.32, 0.8, 0.06);
  },
  pop() {
    tone(880, 0, 0.15, 0.08);
  },
};
