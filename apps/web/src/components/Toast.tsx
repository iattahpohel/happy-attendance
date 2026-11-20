'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: number; text: string; tone: 'info' | 'error' | 'success' };
const Ctx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              role="status"
              className={`pointer-events-auto max-w-sm rounded-2xl px-4 py-3 text-sm font-bold shadow-soft ${
                t.tone === 'error' ? 'bg-coral-soft text-ink' : t.tone === 'success' ? 'bg-leaf-soft text-ink' : 'bg-ink text-white'
              }`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
