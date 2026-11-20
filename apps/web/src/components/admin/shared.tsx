'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';

/** Mutation dùng chung cho trang admin: gọi API, báo toast, làm mới các query liên quan */
export function useAdminMutation<TVars>(
  fn: (v: TVars) => { path: string; method: string; json?: unknown },
  invalidate: string[],
  success?: string,
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (v: TVars) => {
      const { path, method, json } = fn(v);
      return api(path, { method, json });
    },
    onSuccess: () => {
      for (const k of invalidate) qc.invalidateQueries({ queryKey: [k] });
      if (success) toast(success, 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });
}

export function Th({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-black uppercase tracking-wider text-muted">{children}</th>;
}

export function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-3 py-2.5 text-sm ${className}`}>{children}</td>;
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full">{children}</table>
    </div>
  );
}
