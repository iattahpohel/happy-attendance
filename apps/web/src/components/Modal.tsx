'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  open,
  onClose,
  children,
  title,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  // Portal ra body: tránh bị containing block của ancestor có backdrop-filter/transform
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-paper p-6 shadow-soft sm:max-w-md sm:rounded-[2rem] ${className}`}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-cream" aria-label="Đóng">
              <X size={18} />
            </button>
            {title && <h2 className="mb-4 pr-8 text-lg font-black">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
