/** Điểm năng lượng đóng góp cho sự kiện cộng đồng */
export const EVENT_POINTS = {
  WORKDAY_COMPLETED: 10,
  APPRECIATION_SENT: 3,
  ACHIEVEMENT_UNLOCKED: 15,
} as const;

/** Số lời cảm ơn tối đa mỗi ngày được tính điểm (tránh spam) */
export const APPRECIATION_DAILY_REWARD_CAP = 3;

export const XP = {
  CHECK_IN: 5,
  WORKDAY_COMPLETED: 20,
  APPRECIATION_SENT: 5,
  APPRECIATION_RECEIVED: 5,
} as const;

/** Mốc phần trăm của sự kiện cộng đồng để gửi thông báo */
export const EVENT_MILESTONES = [25, 50, 75, 100];

/** Giai đoạn phát triển của khu vườn theo tổng số ngày hoàn thành */
export const GARDEN_STAGES = [
  { stage: 0, minDays: 0, name: 'Hạt giống', icon: '🌰' },
  { stage: 1, minDays: 1, name: 'Mầm non', icon: '🌱' },
  { stage: 2, minDays: 5, name: 'Cây con', icon: '🌿' },
  { stage: 3, minDays: 20, name: 'Cây non', icon: '🪴' },
  { stage: 4, minDays: 50, name: 'Cây trưởng thành', icon: '🌳' },
  { stage: 5, minDays: 100, name: 'Cây nở hoa', icon: '🌸' },
];

/** Phần thưởng vật phẩm khi lên cấp */
export const LEVEL_REWARDS: Record<number, string> = {
  2: 'sticker_sunny',
  3: 'deco_mushroom',
  4: 'outfit_scarf',
  5: 'bg_sakura',
  7: 'outfit_glasses',
  10: 'outfit_crown',
};

export function levelFromXp(xp: number) {
  // Cấp n cần 50 * n * (n - 1) XP tích lũy: 0, 100, 300, 600, 1000…
  let level = 1;
  while (xp >= 50 * (level + 1) * level) level++;
  const currentFloor = 50 * level * (level - 1);
  const nextAt = 50 * (level + 1) * level;
  return { level, xpIntoLevel: xp - currentFloor, xpForNext: nextAt - currentFloor, nextAt };
}
