export const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const WEEKDAY_LONG = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
export const MONTH_EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export function timeOf(iso: string | null | undefined) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function hours(minutes: number) {
  return Math.round(minutes / 60);
}

export function durationText(minutes: number | null | undefined) {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}p` : ''}` : `${m}p`;
}

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export function dateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/).slice(-1)[0];
}

export const LEAVE_LABEL: Record<string, string> = {
  ANNUAL: 'Nghỉ phép năm',
  SICK: 'Nghỉ ốm',
  PERSONAL: 'Việc cá nhân',
  OTHER: 'Khác',
};

export const LEAVE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Không duyệt',
  CANCELLED: 'Đã huỷ',
};

export const SOURCE_LABEL: Record<string, string> = {
  WORKDAY_COMPLETED: 'hoàn thành một ngày làm việc',
  APPRECIATION_SENT: 'gửi một lời cảm ơn',
  QUEST_COMPLETED: 'hoàn thành nhiệm vụ',
  ACHIEVEMENT_UNLOCKED: 'mở khóa thành tựu',
};
