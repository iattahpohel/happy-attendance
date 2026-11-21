'use client';

import clsx from 'clsx';
import { useState } from 'react';
import {
  EventsSection,
  HolidaysSection,
  LeavesSection,
  OfficeSection,
  OverviewSection,
  RulesSection,
  ScheduleSection,
  UsersSection,
} from '@/components/admin/Sections';
import { useAuth } from '@/lib/auth';

const TABS = [
  { key: 'overview', label: 'Hôm nay', el: OverviewSection },
  { key: 'users', label: 'Nhân viên', el: UsersSection },
  { key: 'schedule', label: 'Lịch làm', el: ScheduleSection },
  { key: 'leaves', label: 'Nghỉ phép', el: LeavesSection },
  { key: 'office', label: 'Vị trí công ty', el: OfficeSection },
  { key: 'holidays', label: 'Ngày lễ', el: HolidaysSection },
  { key: 'events', label: 'Sự kiện', el: EventsSection },
  { key: 'rules', label: 'Tổng kết & quy tắc', el: RulesSection },
] as const;

export default function AdminPage() {
  const { me } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('overview');
  if (me?.role !== 'ADMIN') return <p className="card p-8 text-center text-muted">Bạn không có quyền truy cập trang này.</p>;
  const Section = TABS.find((t) => t.key === tab)!.el;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Quản trị</h1>
        <p className="font-semibold text-muted">Quản lý nhân viên, lịch làm việc, ngày nghỉ và sự kiện cộng đồng.</p>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={clsx('btn shrink-0', tab === t.key ? 'bg-ink text-white' : 'bg-paper text-muted')}>
            {t.label}
          </button>
        ))}
      </div>
      <Section />
    </div>
  );
}
