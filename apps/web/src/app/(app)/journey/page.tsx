'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { ProgressRing } from '@/components/ProgressRing';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { dateLabel, durationText, hours, LEAVE_LABEL, LEAVE_STATUS_LABEL, timeOf } from '@/lib/format';
import type { CalendarDay, DayStatus, Leave, LeaveType, MonthCalendar } from '@/lib/types';

const STATUS_STYLE: Record<DayStatus, { cls: string; icon: string; label: string }> = {
  COMPLETED: { cls: 'bg-leaf-soft text-ink', icon: '🌼', label: 'Hoàn thành' },
  IN_PROGRESS: { cls: 'bg-sun-soft text-ink', icon: '☀️', label: 'Đang làm việc' },
  TODAY: { cls: 'bg-paper ring-2 ring-sun text-ink', icon: '', label: 'Hôm nay' },
  MISSED: { cls: 'bg-cream text-muted', icon: '·', label: 'Chưa ghi nhận' },
  UPCOMING: { cls: 'bg-paper border border-dashed border-line text-ink', icon: '', label: 'Sắp tới' },
  OFF: { cls: 'text-muted/60', icon: '', label: 'Ngày nghỉ' },
  HOLIDAY: { cls: 'bg-coral-soft text-ink', icon: '🎉', label: 'Ngày lễ' },
  LEAVE: { cls: 'bg-sky-soft text-ink', icon: '🌴', label: 'Nghỉ phép' },
  EXTRA: { cls: 'bg-lavender-soft text-ink', icon: '✨', label: 'Có mặt ngoài lịch' },
};

export default function JourneyPage() {
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['calendar', ym.year, ym.month],
    queryFn: () => api<MonthCalendar>(`/attendance/month?year=${ym.year}&month=${ym.month}`),
  });
  const leaves = useQuery({ queryKey: ['leaves'], queryFn: () => api<Leave[]>('/leaves/mine') });

  const shift = (d: number) =>
    setYm(({ year, month }) => {
      const m = month + d;
      return m < 1 ? { year: year - 1, month: 12 } : m > 12 ? { year: year + 1, month: 1 } : { year, month: m };
    });
  const isFuture = ym.year * 12 + ym.month > now.getFullYear() * 12 + now.getMonth() + 1;

  // Lịch bắt đầu từ thứ 2
  const firstWeekday = data ? (new Date(`${data.days[0].date}T00:00:00`).getDay() + 6) % 7 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Hành trình của tôi</h1>
          <p className="font-semibold text-muted">Mỗi bông hoa là một ngày bạn đã có mặt 🌼</p>
        </div>
        <button className="btn-soft" onClick={() => setLeaveOpen(true)}>
          <Plus size={18} /> Xin nghỉ phép
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button className="rounded-full p-2 hover:bg-cream" onClick={() => shift(-1)} aria-label="Tháng trước">
              <ChevronLeft />
            </button>
            <p className="text-lg font-black">
              Tháng {ym.month}, {ym.year}
            </p>
            <button className="rounded-full p-2 hover:bg-cream disabled:opacity-30" onClick={() => shift(1)} disabled={isFuture} aria-label="Tháng sau">
              <ChevronRight />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-black text-muted">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {data?.days.map((d) => {
              const s = STATUS_STYLE[d.status];
              return (
                <button
                  key={d.date}
                  onClick={() => setSelected(d)}
                  className={clsx('relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-black transition hover:scale-105', s.cls)}
                  aria-label={`${dateLabel(d.date)}: ${s.label}`}
                >
                  <span className={clsx('text-[11px] sm:text-sm', s.icon && 'absolute left-1.5 top-1 text-[10px] sm:text-xs')}>{Number(d.date.slice(8))}</span>
                  {s.icon && <span className="text-lg sm:text-2xl">{s.icon}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            {(['COMPLETED', 'LEAVE', 'HOLIDAY', 'MISSED', 'UPCOMING'] as DayStatus[]).map((k) => (
              <span key={k} className={clsx('chip', STATUS_STYLE[k].cls)}>
                {STATUS_STYLE[k].icon} {STATUS_STYLE[k].label}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          {data && (
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <ProgressRing value={data.stats.completedDays} max={data.stats.scheduledDays} size={96} stroke={10}>
                  <span className="text-xl font-black">{data.stats.completedDays}</span>
                  <span className="text-[10px] font-bold text-muted">/ {data.stats.scheduledDays}</span>
                </ProgressRing>
                <div>
                  <p className="font-black">Lịch của riêng bạn</p>
                  <p className="text-sm text-muted">
                    Mục tiêu tháng dựa trên {data.stats.scheduledDays} ngày làm việc được giao — đã trừ ngày lễ và nghỉ phép.
                  </p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Mini label="Đúng giờ" value={`${data.stats.onTimeDays} ngày`} />
                <Mini label="Giờ làm việc" value={`${hours(data.stats.workedMinutes)}h`} />
                <Mini label="Nghỉ phép" value={`${data.stats.leaveDays} ngày`} />
                <Mini label="Còn lại" value={`${data.stats.remainingDays} ngày`} />
              </dl>
            </div>
          )}

          <div className="card p-5">
            <p className="mb-3 font-black">Đơn nghỉ phép</p>
            {!leaves.data?.length && <p className="text-sm text-muted">Bạn chưa có đơn nghỉ nào.</p>}
            <ul className="space-y-2">
              {leaves.data?.slice(0, 6).map((l) => (
                <LeaveRow key={l.id} leave={l} />
              ))}
            </ul>
          </div>
        </section>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? dateLabel(selected.date) : ''}>
        {selected && <DayDetail day={selected} />}
      </Modal>
      <LeaveForm open={leaveOpen} onClose={() => setLeaveOpen(false)} />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream p-3">
      <dt className="text-xs font-bold text-muted">{label}</dt>
      <dd className="font-black">{value}</dd>
    </div>
  );
}

function DayDetail({ day }: { day: CalendarDay }) {
  const s = STATUS_STYLE[day.status];
  return (
    <div className="space-y-3">
      <span className={clsx('chip text-sm', s.cls)}>
        {s.icon} {s.label}
      </span>
      {day.holidayName && <p className="font-bold">🎉 {day.holidayName}</p>}
      {day.leave && (
        <p className="font-bold">
          🌴 {LEAVE_LABEL[day.leave.type]} · {LEAVE_STATUS_LABEL[day.leave.status]}
        </p>
      )}
      {day.scheduled && (
        <p className="text-sm text-muted">
          Ca làm theo lịch: {day.startTime} – {day.endTime}
        </p>
      )}
      {day.attendance ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-sun-soft p-3">
            <p className="text-xs font-bold text-muted">Vào</p>
            <p className="font-black">{timeOf(day.attendance.checkInAt)}</p>
          </div>
          <div className="rounded-2xl bg-lavender-soft p-3">
            <p className="text-xs font-bold text-muted">Ra</p>
            <p className="font-black">{timeOf(day.attendance.checkOutAt)}</p>
          </div>
          <div className="rounded-2xl bg-leaf-soft p-3">
            <p className="text-xs font-bold text-muted">Thời gian</p>
            <p className="font-black">{durationText(day.attendance.workedMinutes)}</p>
          </div>
        </div>
      ) : (
        day.status === 'MISSED' && <p className="text-sm text-muted">Không có ghi nhận chấm công cho ngày này. Nếu có nhầm lẫn, hãy liên hệ HR nhé.</p>
      )}
      {day.attendance?.autoCheckedOut && <p className="text-xs text-muted">Hệ thống đã tự động check-out giúp bạn vào cuối ngày.</p>}
    </div>
  );
}

function LeaveRow({ leave }: { leave: Leave }) {
  const qc = useQueryClient();
  const toast = useToast();
  const cancel = useMutation({
    mutationFn: () => api(`/leaves/${leave.id}/cancel`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      toast('Đã huỷ đơn nghỉ');
    },
  });
  const tone = { PENDING: 'bg-sun-soft', APPROVED: 'bg-leaf-soft', REJECTED: 'bg-coral-soft', CANCELLED: 'bg-cream' }[leave.status];
  return (
    <li className="flex items-center justify-between gap-2 rounded-2xl bg-cream/60 p-3 text-sm">
      <div>
        <p className="font-bold">{LEAVE_LABEL[leave.type]}</p>
        <p className="text-xs text-muted">
          {leave.startDate.slice(0, 10).split('-').reverse().join('/')} → {leave.endDate.slice(0, 10).split('-').reverse().join('/')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`chip ${tone}`}>{LEAVE_STATUS_LABEL[leave.status]}</span>
        {leave.status === 'PENDING' && (
          <button className="text-xs font-bold text-muted underline" onClick={() => cancel.mutate()}>
            Huỷ
          </button>
        )}
      </div>
    </li>
  );
}

function LeaveForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ startDate: today, endDate: today, type: 'ANNUAL' as LeaveType, reason: '' });
  const submit = useMutation({
    mutationFn: () => api('/leaves', { method: 'POST', json: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      toast('Đã gửi đơn nghỉ. Nghỉ ngơi không làm ảnh hưởng hành trình của bạn 🌴', 'success');
      onClose();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });
  return (
    <Modal open={open} onClose={onClose} title="Xin nghỉ phép">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-sm font-bold">Từ ngày</span>
            <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-bold">Đến ngày</span>
            <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Loại nghỉ</span>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LeaveType })}>
            {Object.entries(LEAVE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Ghi chú (không bắt buộc)</span>
          <textarea className="input min-h-20" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </label>
        <p className="rounded-2xl bg-sky-soft p-3 text-sm">
          💙 Ngày nghỉ được duyệt sẽ không tính vào mục tiêu tháng và không làm đứt chuỗi đều đặn của bạn.
        </p>
        <button className="btn-primary w-full" disabled={submit.isPending}>
          Gửi đơn
        </button>
      </form>
    </Modal>
  );
}
