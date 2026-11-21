'use client';

import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { Avatar } from '@/components/Character';
import { Modal } from '@/components/Modal';
import { api } from '@/lib/api';
import { LEAVE_LABEL, LEAVE_STATUS_LABEL, timeOf, WEEKDAY_SHORT } from '@/lib/format';
import { getCurrentLocation } from '@/lib/geo';
import type { DayPlan, EventSummary, Leave, LeaveStatus, LocationStatus, Me, OfficeConfig, Role } from '@/lib/types';
import { Table, Td, Th, useAdminMutation } from './shared';

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => ({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

/* ---------- Tổng quan ngày ---------- */
interface OverviewRow {
  user: { id: string; fullName: string; team: { name: string } | null };
  kind: string;
  scheduled: boolean;
  startTime: string;
  record: {
    id: string;
    checkInAt: string;
    checkOutAt: string | null;
    isLate: boolean;
    completed: boolean;
    checkInLat: number | null;
    checkInLng: number | null;
    checkInDistance: number | null;
    checkInLocStatus: LocationStatus;
    checkOutLat: number | null;
    checkOutLng: number | null;
    checkOutDistance: number | null;
    checkOutLocStatus: LocationStatus | null;
  } | null;
}

export function OverviewSection() {
  const [date, setDate] = useState(today());
  const { data } = useQuery({
    queryKey: ['admin-overview', date],
    queryFn: () => api<{ totals: Record<string, number>; rows: OverviewRow[] }>(`/admin/overview?date=${date}`),
  });
  const [edit, setEdit] = useState<OverviewRow | null>(null);
  return (
    <div className="space-y-4">
      <input type="date" className="input max-w-48" value={date} onChange={(e) => setDate(e.target.value)} />
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Theo lịch', data.totals.scheduled, 'bg-sky-soft'],
            ['Đã check-in', data.totals.checkedIn, 'bg-sun-soft'],
            ['Hoàn thành', data.totals.completed, 'bg-leaf-soft'],
            ['Nghỉ phép', data.totals.onLeave, 'bg-lavender-soft'],
            ['Chưa ghi nhận', data.totals.notYet, 'bg-cream'],
          ].map(([l, v, c]) => (
            <div key={l as string} className={`rounded-3xl p-4 ${c}`}>
              <p className="text-3xl font-black">{v}</p>
              <p className="text-xs font-bold text-muted">{l}</p>
            </div>
          ))}
        </div>
      )}
      <Table>
        <thead>
          <tr>
            <Th>Nhân viên</Th>
            <Th>Team</Th>
            <Th>Lịch</Th>
            <Th>Vào</Th>
            <Th>Ra</Th>
            <Th>Vị trí</Th>
            <Th>Trạng thái</Th>
            <Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data?.rows.map((r) => (
            <tr key={r.user.id}>
              <Td className="font-bold">{r.user.fullName}</Td>
              <Td>{r.user.team?.name}</Td>
              <Td>{r.scheduled ? r.startTime : { OFF: 'Nghỉ', HOLIDAY: 'Lễ', LEAVE: 'Phép', WORK: '' }[r.kind]}</Td>
              <Td>{r.record ? timeOf(r.record.checkInAt) : '—'}</Td>
              <Td>{r.record?.checkOutAt ? timeOf(r.record.checkOutAt) : '—'}</Td>
              <Td>{r.record && <LocationCell r={r.record} />}</Td>
              <Td>
                {r.record?.completed ? (
                  <span className="chip bg-leaf-soft">Hoàn thành</span>
                ) : r.record ? (
                  <span className="chip bg-sun-soft">Đang làm</span>
                ) : r.scheduled ? (
                  <span className="chip bg-cream">Chưa ghi nhận</span>
                ) : null}
                {r.record?.isLate && <span className="chip ml-1 bg-sky-soft">muộn</span>}
              </Td>
              <Td>
                {r.record && (
                  <button className="text-xs font-bold underline" onClick={() => setEdit(r)}>
                    Điều chỉnh
                  </button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <CorrectionModal row={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

const mapLink = (lat: number | null, lng: number | null) => (lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null);

function LocPart({ label, status, distance, lat, lng }: { label: string; status: LocationStatus; distance: number | null; lat: number | null; lng: number | null }) {
  const cls = status === 'OK' ? 'bg-leaf-soft' : status === 'OUT_OF_RANGE' ? 'bg-sun-soft' : 'bg-cream';
  const text = status === 'OK' ? 'Hợp lệ' : status === 'OUT_OF_RANGE' ? `Ngoài phạm vi ${distance?.toLocaleString('vi-VN')} m` : 'Không có vị trí';
  const link = mapLink(lat, lng);
  return (
    <span className="flex items-center gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className={`chip ${cls}`}>{status !== 'OK' && '⚠️ '}{text}</span>
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className="text-xs font-bold underline">
          Bản đồ
        </a>
      )}
    </span>
  );
}

function LocationCell({ r }: { r: NonNullable<OverviewRow['record']> }) {
  return (
    <div className="space-y-1">
      <LocPart label="Vào" status={r.checkInLocStatus} distance={r.checkInDistance} lat={r.checkInLat} lng={r.checkInLng} />
      {r.checkOutLocStatus && <LocPart label="Ra" status={r.checkOutLocStatus} distance={r.checkOutDistance} lat={r.checkOutLat} lng={r.checkOutLng} />}
    </div>
  );
}

/* ---------- Vị trí công ty ---------- */
export function OfficeSection() {
  const { data } = useQuery({ queryKey: ['admin-office'], queryFn: () => api<OfficeConfig>('/admin/office') });
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', maxDistanceMeters: '200' });
  const [loaded, setLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  if (data && !loaded) {
    setLoaded(true);
    setForm({
      name: data.name,
      latitude: data.latitude?.toString() ?? '',
      longitude: data.longitude?.toString() ?? '',
      maxDistanceMeters: String(data.maxDistanceMeters),
    });
  }
  const save = useAdminMutation(
    () => ({
      path: '/admin/office',
      method: 'PUT',
      json: {
        name: form.name.trim() || undefined,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        maxDistanceMeters: Number(form.maxDistanceMeters),
      },
    }),
    ['admin-office', 'office'],
    'Đã lưu vị trí công ty',
  );
  const useHere = async () => {
    setLocating(true);
    const r = await getCurrentLocation();
    setLocating(false);
    if (r.ok) setForm((f) => ({ ...f, latitude: r.coords.latitude.toFixed(6), longitude: r.coords.longitude.toFixed(6) }));
    else alert('Không lấy được vị trí hiện tại. Hãy cho phép truy cập vị trí hoặc nhập toạ độ thủ công.');
  };
  const link = mapLink(Number(form.latitude) || null, Number(form.longitude) || null);
  return (
    <section className="card max-w-xl space-y-3 p-5">
      <p className="font-black">Vị trí công ty & khoảng cách chấm công</p>
      <p className="text-sm text-muted">
        Nhân viên vẫn chấm công được khi không có vị trí hoặc ở ngoài khoảng cách cho phép; lần chấm công đó sẽ được đánh dấu ở bảng "Hôm nay" để HR xử lý. Để trống toạ độ
        = không kiểm tra khoảng cách.
      </p>
      <label className="block text-sm font-bold">
        Tên địa điểm
        <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-bold">
          Vĩ độ (latitude)
          <input className="input mt-1" inputMode="decimal" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        </label>
        <label className="block text-sm font-bold">
          Kinh độ (longitude)
          <input className="input mt-1" inputMode="decimal" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn bg-paper text-muted" onClick={useHere} disabled={locating}>
          📍 Dùng vị trí hiện tại của tôi
        </button>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="text-sm font-bold underline">
            Xem trên bản đồ
          </a>
        )}
      </div>
      <label className="block text-sm font-bold">
        Khoảng cách tối đa cho phép (mét)
        <input type="number" min={10} className="input mt-1 max-w-40" value={form.maxDistanceMeters} onChange={(e) => setForm({ ...form, maxDistanceMeters: e.target.value })} />
      </label>
      <button className="btn-primary" onClick={() => save.mutate(undefined)} disabled={save.isPending}>
        Lưu
      </button>
    </section>
  );
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function CorrectionModal({ row, onClose }: { row: OverviewRow | null; onClose: () => void }) {
  const [form, setForm] = useState({ checkInAt: '', checkOutAt: '', note: '' });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (row?.record && loadedFor !== row.record.id) {
    setLoadedFor(row.record.id);
    setForm({ checkInAt: toLocalInput(row.record.checkInAt), checkOutAt: toLocalInput(row.record.checkOutAt), note: '' });
  }
  const save = useAdminMutation(
    () => ({
      path: `/admin/attendance/${row!.record!.id}`,
      method: 'PATCH',
      json: {
        checkInAt: form.checkInAt ? new Date(form.checkInAt).toISOString() : undefined,
        checkOutAt: form.checkOutAt ? new Date(form.checkOutAt).toISOString() : undefined,
        note: form.note || undefined,
      },
    }),
    ['admin-overview'],
    'Đã cập nhật chấm công',
  );
  return (
    <Modal open={!!row} onClose={onClose} title={`Điều chỉnh: ${row?.user.fullName ?? ''}`}>
      <div className="space-y-3">
        <label className="block text-sm font-bold">
          Giờ vào
          <input type="datetime-local" className="input mt-1" value={form.checkInAt} onChange={(e) => setForm({ ...form, checkInAt: e.target.value })} />
        </label>
        <label className="block text-sm font-bold">
          Giờ ra
          <input type="datetime-local" className="input mt-1" value={form.checkOutAt} onChange={(e) => setForm({ ...form, checkOutAt: e.target.value })} />
        </label>
        <label className="block text-sm font-bold">
          Ghi chú
          <input className="input mt-1" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </label>
        <button className="btn-primary w-full" onClick={() => save.mutate(undefined, { onSuccess: onClose })} disabled={save.isPending}>
          Lưu
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Nhân viên ---------- */
type AdminUser = Me & { createdAt: string };
interface Team {
  id: string;
  name: string;
  _count: { users: number };
}

const EMPTY_USER = {
  email: '',
  fullName: '',
  password: '',
  role: 'EMPLOYEE' as Role,
  teamId: '',
  workWeekdays: [1, 2, 3, 4, 5],
  defaultStartTime: '08:30',
  defaultEndTime: '17:30',
  isActive: true,
};

export function UsersSection() {
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => api<AdminUser[]>('/admin/users') });
  const teams = useQuery({ queryKey: ['admin-teams'], queryFn: () => api<Team[]>('/admin/teams') });
  const [editing, setEditing] = useState<(typeof EMPTY_USER & { id?: string }) | null>(null);
  const [teamName, setTeamName] = useState('');
  const addTeam = useAdminMutation(() => ({ path: '/admin/teams', method: 'POST', json: { name: teamName } }), ['admin-teams'], 'Đã tạo team');
  const save = useAdminMutation(
    (u: typeof EMPTY_USER & { id?: string }) => {
      const { id, password, teamId, isActive, ...rest } = u;
      return id
        ? { path: `/admin/users/${id}`, method: 'PATCH', json: { ...rest, teamId: teamId || undefined, isActive, ...(password && { password }) } }
        : { path: '/admin/users', method: 'POST', json: { ...rest, password, teamId: teamId || undefined } };
    },
    ['admin-users', 'event'],
    'Đã lưu nhân viên',
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => setEditing({ ...EMPTY_USER })}>
          + Thêm nhân viên
        </button>
        <div className="flex gap-2">
          <input className="input w-44" placeholder="Tên team mới" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          <button className="btn-soft" disabled={teamName.length < 2} onClick={() => addTeam.mutate(undefined, { onSuccess: () => setTeamName('') })}>
            + Team
          </button>
        </div>
      </div>
      <p className="text-sm text-muted">
        💡 Thêm/ngưng kích hoạt nhân viên hoặc đổi lịch sẽ tự động tính lại mục tiêu sự kiện cộng đồng theo quy mô công ty.
      </p>
      <Table>
        <thead>
          <tr>
            <Th>Nhân viên</Th>
            <Th>Team</Th>
            <Th>Vai trò</Th>
            <Th>Lịch</Th>
            <Th>Trạng thái</Th>
            <Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.data?.map((u) => (
            <tr key={u.id} className={clsx(!u.isActive && 'opacity-50')}>
              <Td>
                <div className="flex items-center gap-2">
                  <Avatar kind={u.character} size={28} />
                  <div>
                    <p className="font-bold">{u.fullName}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td>{u.team?.name ?? '—'}</Td>
              <Td>{u.role === 'ADMIN' ? <span className="chip bg-lavender-soft">Admin</span> : 'Nhân viên'}</Td>
              <Td>
                {u.workWeekdays.map((d) => WEEKDAY_SHORT[d]).join(' ')} · {u.defaultStartTime}–{u.defaultEndTime}
              </Td>
              <Td>{u.isActive ? 'Đang làm việc' : 'Ngưng'}</Td>
              <Td>
                <button
                  className="text-xs font-bold underline"
                  onClick={() =>
                    setEditing({
                      id: u.id,
                      email: u.email,
                      fullName: u.fullName,
                      password: '',
                      role: u.role,
                      teamId: u.team?.id ?? '',
                      workWeekdays: u.workWeekdays,
                      defaultStartTime: u.defaultStartTime,
                      defaultEndTime: u.defaultEndTime,
                      isActive: u.isActive,
                    })
                  }
                >
                  Sửa
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Sửa nhân viên' : 'Thêm nhân viên'}>
        {editing && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(editing, { onSuccess: () => setEditing(null) });
            }}
          >
            <input className="input" placeholder="Họ tên" value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} required />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={editing.email}
              disabled={!!editing.id}
              onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              required
            />
            <input
              className="input"
              type="password"
              placeholder={editing.id ? 'Đặt lại mật khẩu (để trống nếu giữ nguyên)' : 'Mật khẩu (≥ 8 ký tự)'}
              value={editing.password}
              onChange={(e) => setEditing({ ...editing, password: e.target.value })}
              required={!editing.id}
              minLength={editing.id ? undefined : 8}
            />
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}>
                <option value="EMPLOYEE">Nhân viên</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select className="input" value={editing.teamId} onChange={(e) => setEditing({ ...editing, teamId: e.target.value })}>
                <option value="">— Team —</option>
                {teams.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-sm font-bold">Ngày làm trong tuần</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const on = editing.workWeekdays.includes(d);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() =>
                        setEditing({ ...editing, workWeekdays: on ? editing.workWeekdays.filter((x) => x !== d) : [...editing.workWeekdays, d].sort() })
                      }
                      className={clsx('h-10 flex-1 rounded-xl text-sm font-black', on ? 'bg-leaf text-white' : 'bg-cream text-muted')}
                    >
                      {WEEKDAY_SHORT[d]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-bold">
                Giờ bắt đầu
                <input type="time" className="input mt-1" value={editing.defaultStartTime} onChange={(e) => setEditing({ ...editing, defaultStartTime: e.target.value })} />
              </label>
              <label className="text-sm font-bold">
                Giờ kết thúc
                <input type="time" className="input mt-1" value={editing.defaultEndTime} onChange={(e) => setEditing({ ...editing, defaultEndTime: e.target.value })} />
              </label>
            </div>
            {editing.id && (
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
                Đang làm việc
              </label>
            )}
            <button className="btn-primary w-full" disabled={save.isPending}>
              Lưu
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------- Lịch làm việc ---------- */
export function ScheduleSection() {
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => api<AdminUser[]>('/admin/users') });
  const [userId, setUserId] = useState('');
  const [ym, setYm] = useState(thisMonth());
  const uid = userId || users.data?.[0]?.id || '';
  const plan = useQuery({
    queryKey: ['admin-schedule', uid, ym.year, ym.month],
    queryFn: () => api<DayPlan[]>(`/admin/schedules?userId=${uid}&year=${ym.year}&month=${ym.month}`),
    enabled: !!uid,
  });
  const toggle = useAdminMutation(
    (d: DayPlan) => ({ path: `/admin/schedules/${uid}/${d.date}`, method: 'PUT', json: { isWorkday: d.kind === 'OFF' } }),
    ['admin-schedule'],
  );
  const generate = useAdminMutation(
    () => ({ path: '/admin/schedules/generate', method: 'POST', json: { ...ym, overwrite: true } }),
    ['admin-schedule', 'event'],
    'Đã tạo lại lịch cho cả công ty theo mẫu tuần',
  );
  const first = plan.data ? (new Date(`${plan.data[0].date}T00:00:00`).getDay() + 6) % 7 : 0;
  const workdays = plan.data?.filter((d) => d.scheduled).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select className="input max-w-64" value={uid} onChange={(e) => setUserId(e.target.value)}>
          {users.data?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
        <input
          type="month"
          className="input max-w-44"
          value={`${ym.year}-${String(ym.month).padStart(2, '0')}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number);
            if (y && m) setYm({ year: y, month: m });
          }}
        />
        <button
          className="btn-soft"
          onClick={() => confirm('Tạo lại lịch tháng này cho tất cả nhân viên theo mẫu tuần mặc định? Các chỉnh sửa thủ công sẽ bị ghi đè.') && generate.mutate(undefined)}
        >
          Tạo lại lịch cả công ty
        </button>
      </div>
      <div className="card p-4">
        <p className="mb-3 text-sm font-bold">
          {workdays} ngày làm việc thực tế · bấm vào một ngày để bật/tắt ngày làm
        </p>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <div key={d} className="text-xs font-black text-muted">
              {d}
            </div>
          ))}
          {Array.from({ length: first }).map((_, i) => (
            <div key={i} />
          ))}
          {plan.data?.map((d) => (
            <button
              key={d.date}
              disabled={d.kind === 'HOLIDAY' || d.kind === 'LEAVE'}
              onClick={() => toggle.mutate(d)}
              title={d.holidayName ?? (d.leave ? LEAVE_LABEL[d.leave.type] : undefined)}
              className={clsx(
                'aspect-square rounded-xl text-sm font-black',
                d.kind === 'WORK' && 'bg-leaf-soft',
                d.kind === 'OFF' && 'bg-cream text-muted',
                d.kind === 'HOLIDAY' && 'bg-coral-soft',
                d.kind === 'LEAVE' && 'bg-sky-soft',
              )}
            >
              {Number(d.date.slice(8))}
              <span className="block text-[10px]">{{ WORK: d.startTime, OFF: 'nghỉ', HOLIDAY: '🎉', LEAVE: '🌴' }[d.kind]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Nghỉ phép ---------- */
export function LeavesSection() {
  const [status, setStatus] = useState<LeaveStatus | ''>('PENDING');
  const { data } = useQuery({ queryKey: ['admin-leaves', status], queryFn: () => api<Leave[]>(`/admin/leaves${status ? `?status=${status}` : ''}`) });
  const review = useAdminMutation(
    ({ id, s }: { id: string; s: 'APPROVED' | 'REJECTED' }) => ({ path: `/admin/leaves/${id}`, method: 'PATCH', json: { status: s } }),
    ['admin-leaves', 'event'],
    'Đã xử lý đơn',
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map((s) => (
          <button key={s} className={clsx('btn', status === s ? 'bg-ink text-white' : 'bg-paper text-muted')} onClick={() => setStatus(s)}>
            {s ? LEAVE_STATUS_LABEL[s] : 'Tất cả'}
          </button>
        ))}
      </div>
      {!data?.length && <p className="card p-6 text-center text-muted">Không có đơn nào.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((l) => (
          <div key={l.id} className="card p-4">
            <p className="font-black">{l.user?.fullName}</p>
            <p className="text-sm">
              {LEAVE_LABEL[l.type]} · {l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}
            </p>
            {l.reason && <p className="mt-1 text-sm text-muted">“{l.reason}”</p>}
            {l.status === 'PENDING' ? (
              <div className="mt-3 flex gap-2">
                <button className="btn-leaf flex-1" onClick={() => review.mutate({ id: l.id, s: 'APPROVED' })}>
                  Duyệt
                </button>
                <button className="btn-soft flex-1" onClick={() => review.mutate({ id: l.id, s: 'REJECTED' })}>
                  Từ chối
                </button>
              </div>
            ) : (
              <span className="chip mt-2 bg-cream">{LEAVE_STATUS_LABEL[l.status]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Ngày lễ ---------- */
export function HolidaysSection() {
  const year = new Date().getFullYear();
  const { data } = useQuery({ queryKey: ['admin-holidays'], queryFn: () => api<{ id: string; date: string; name: string }[]>(`/admin/holidays?year=${year}`) });
  const [form, setForm] = useState({ date: today(), name: '' });
  const add = useAdminMutation(() => ({ path: '/admin/holidays', method: 'POST', json: form }), ['admin-holidays', 'event'], 'Đã thêm ngày lễ');
  const del = useAdminMutation((id: string) => ({ path: `/admin/holidays/${id}`, method: 'DELETE' }), ['admin-holidays', 'event']);
  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate(undefined, { onSuccess: () => setForm({ ...form, name: '' }) });
        }}
      >
        <input type="date" className="input max-w-48" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input className="input max-w-64" placeholder="Tên ngày lễ" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <button className="btn-primary">Thêm</button>
      </form>
      <Table>
        <tbody className="divide-y divide-line">
          {data?.map((h) => (
            <tr key={h.id}>
              <Td className="font-bold">{h.date.slice(0, 10).split('-').reverse().join('/')}</Td>
              <Td>{h.name}</Td>
              <Td className="text-right">
                <button className="text-xs font-bold text-coral underline" onClick={() => del.mutate(h.id)}>
                  Xoá
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

/* ---------- Sự kiện cộng đồng ---------- */
export function EventsSection() {
  const events = useQuery({ queryKey: ['admin-events'], queryFn: () => api<EventSummary[]>('/admin/events') });
  const themes = useQuery({
    queryKey: ['admin-themes'],
    queryFn: () => api<{ code: string; type: string; title: string; icon: string; description: string }[]>('/admin/events/themes'),
  });
  const next = (() => {
    const t = thisMonth();
    return t.month === 12 ? { year: t.year + 1, month: 1 } : { year: t.year, month: t.month + 1 };
  })();
  const [form, setForm] = useState({ ...next, themeCode: '', difficulty: 0.85 });
  const create = useAdminMutation(
    () => ({ path: '/admin/events', method: 'POST', json: { ...form, themeCode: form.themeCode || themes.data?.[0]?.code } }),
    ['admin-events', 'event'],
    'Đã lên lịch sự kiện',
  );
  const recalc = useAdminMutation(
    ({ id, difficulty }: { id: string; difficulty?: number }) => ({ path: `/admin/events/${id}/recalculate`, method: 'POST', json: { difficulty } }),
    ['admin-events', 'event'],
    'Đã tính lại mục tiêu',
  );

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="mb-1 font-black">Lên lịch chủ đề cho tháng</p>
        <p className="mb-3 text-sm text-muted">Tháng này đánh boss, tháng sau trồng cây… Nếu không chọn, hệ thống tự xoay vòng chủ đề.</p>
        <div className="grid gap-2 sm:grid-cols-4">
          <input
            type="month"
            className="input"
            value={`${form.year}-${String(form.month).padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number);
              if (y && m) setForm({ ...form, year: y, month: m });
            }}
          />
          <select className="input sm:col-span-2" value={form.themeCode} onChange={(e) => setForm({ ...form, themeCode: e.target.value })}>
            {themes.data?.map((t) => (
              <option key={t.code} value={t.code}>
                {t.icon} {t.title} ({t.type})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-bold">
            Độ khó
            <input
              type="number"
              step="0.05"
              min="0.3"
              max="1.5"
              className="input"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
            />
          </label>
        </div>
        <button className="btn-primary mt-3" onClick={() => create.mutate(undefined)} disabled={create.isPending}>
          Lưu chủ đề
        </button>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {events.data?.map((e) => (
          <div key={e.id} className="card p-4">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{e.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-black">{e.title}</p>
                <p className="text-xs text-muted">
                  Tháng {e.month}/{e.year} · {e.status} · {e._count.contributions} lượt đóng góp
                </p>
                <p className="mt-1 text-sm font-bold">
                  {e.currentPoints.toLocaleString('vi-VN')} / {e.targetPoints.toLocaleString('vi-VN')} ({Math.round((e.currentPoints / e.targetPoints) * 100)}%)
                </p>
              </div>
            </div>
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-bold text-muted">Công thức mục tiêu</summary>
              <ul className="mt-2 grid grid-cols-2 gap-1">
                <li>Nhân viên: {e.formula.activeUsers}</li>
                <li>Ngày theo lịch: {e.formula.totalScheduledDays}</li>
                <li>Điểm ngày làm: {e.formula.workdayPoints}</li>
                <li>Điểm cảm ơn: {e.formula.socialPoints}</li>
                <li>Điểm nhiệm vụ: {e.formula.questPoints}</li>
                <li>Điểm thành tựu: {e.formula.achievementPoints}</li>
                <li>Kỳ vọng: {e.formula.expectedPoints}</li>
                <li>Độ khó: × {e.formula.difficulty}</li>
              </ul>
            </details>
            {(e.status === 'ACTIVE' || e.status === 'UPCOMING') && (
              <button className="btn-soft mt-3 w-full text-sm" onClick={() => recalc.mutate({ id: e.id })}>
                Tính lại theo số nhân viên hiện tại
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Tổng kết tháng & quy tắc thành tựu ---------- */
interface AdminAchievement {
  id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  threshold: number | null;
  xpReward: number;
  isActive: boolean;
  _count: { users: number };
}

export function RulesSection() {
  const prev = (() => {
    const t = thisMonth();
    return t.month === 1 ? { year: t.year - 1, month: 12 } : { year: t.year, month: t.month - 1 };
  })();
  const [ym, setYm] = useState(prev);
  const finalize = useAdminMutation(
    () => ({ path: '/admin/months/finalize', method: 'POST', json: ym }),
    ['honors', 'wrapped-history', 'admin-events'],
    'Đã chốt tháng & trao danh hiệu',
  );
  const { data } = useQuery({ queryKey: ['admin-achievements'], queryFn: () => api<AdminAchievement[]>('/admin/achievements') });
  const update = useAdminMutation(
    ({ id, ...json }: { id: string; isActive?: boolean; threshold?: number; xpReward?: number }) => ({
      path: `/admin/achievements/${id}`,
      method: 'PATCH',
      json,
    }),
    ['admin-achievements'],
  );
  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="font-black">Chốt tháng</p>
        <p className="mb-3 text-sm text-muted">
          Hệ thống tự chốt vào 00:05 ngày 1 hằng tháng. Bạn có thể chốt lại thủ công (an toàn khi chạy nhiều lần): lưu Monthly Wrapped, trao danh hiệu, xét thành
          tựu theo tháng.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            className="input max-w-44"
            value={`${ym.year}-${String(ym.month).padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number);
              if (y && m) setYm({ year: y, month: m });
            }}
          />
          <button className="btn-primary" onClick={() => finalize.mutate(undefined)} disabled={finalize.isPending}>
            Chốt tháng {ym.month}/{ym.year}
          </button>
        </div>
      </section>
      <Table>
        <thead>
          <tr>
            <Th>Thành tựu</Th>
            <Th>Ngưỡng</Th>
            <Th>XP</Th>
            <Th>Đã mở khóa</Th>
            <Th>Bật</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data?.map((a) => (
            <tr key={a.id}>
              <Td>
                <p className="font-bold">
                  {a.icon} {a.name}
                </p>
                <p className="max-w-xs whitespace-normal text-xs text-muted">{a.description}</p>
              </Td>
              <Td>
                {a.threshold != null ? (
                  <input
                    type="number"
                    min={1}
                    defaultValue={a.threshold}
                    className="input w-20 py-1"
                    onBlur={(e) => Number(e.target.value) !== a.threshold && update.mutate({ id: a.id, threshold: Number(e.target.value) })}
                  />
                ) : (
                  '—'
                )}
              </Td>
              <Td>
                <input
                  type="number"
                  min={0}
                  defaultValue={a.xpReward}
                  className="input w-20 py-1"
                  onBlur={(e) => Number(e.target.value) !== a.xpReward && update.mutate({ id: a.id, xpReward: Number(e.target.value) })}
                />
              </Td>
              <Td>{a._count.users} người</Td>
              <Td>
                <input type="checkbox" checked={a.isActive} onChange={(e) => update.mutate({ id: a.id, isActive: e.target.checked })} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
