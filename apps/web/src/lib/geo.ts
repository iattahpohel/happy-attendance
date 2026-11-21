import type { Coords, OfficeConfig } from './types';

export type LocationResult = { ok: true; coords: Coords } | { ok: false; reason: 'DENIED' | 'UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED' };

/** Lấy vị trí hiện tại; không bao giờ throw — trả về lý do để UI hiện cảnh báo */
export function getCurrentLocation(timeoutMs = 10000): Promise<LocationResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve({ ok: false, reason: 'UNSUPPORTED' });
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ ok: true, coords: { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy } }),
      (e) => resolve({ ok: false, reason: e.code === e.PERMISSION_DENIED ? 'DENIED' : e.code === e.TIMEOUT ? 'TIMEOUT' : 'UNAVAILABLE' }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(a))));
}

/** Khoảng cách tới công ty nếu vượt ngưỡng cho phép, ngược lại null */
export function outOfRangeBy(c: Coords, office: OfficeConfig | undefined): number | null {
  if (!office?.configured) return null;
  const d = distanceMeters(c.latitude, c.longitude, office.latitude!, office.longitude!);
  return d > office.maxDistanceMeters ? d : null;
}

export const LOCATION_REASON: Record<string, string> = {
  DENIED: 'Bạn chưa cho phép ứng dụng truy cập vị trí.',
  UNAVAILABLE: 'Không xác định được vị trí của bạn.',
  TIMEOUT: 'Lấy vị trí quá lâu, chưa có kết quả.',
  UNSUPPORTED: 'Thiết bị/trình duyệt không hỗ trợ định vị.',
};
