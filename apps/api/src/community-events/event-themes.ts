import { EventType } from '@prisma/client';

/**
 * Chủ đề sự kiện cộng đồng. Cơ chế giống nhau (cả công ty góp năng lượng để đạt mục tiêu),
 * chỉ khác cách kể chuyện: đánh boss, trồng cây chung, thám hiểm…
 */
export interface EventTheme {
  code: string;
  type: EventType;
  title: string;
  description: string;
  villainName?: string;
  icon: string;
  rewardItemCode: string;
  /** Lời kể ở các mốc 25/50/75/100% */
  milestoneLines: Record<number, string>;
}

export const EVENT_THEMES: EventTheme[] = [
  {
    code: 'boss_monday_dragon',
    type: 'BOSS',
    title: 'Đánh bại Rồng Thứ Hai',
    description: 'Rồng Thứ Hai phun ra sương mù uể oải khắp văn phòng. Mỗi ngày làm việc trọn vẹn, mỗi lời cảm ơn đều là một đòn tấn công!',
    villainName: 'Rồng Thứ Hai',
    icon: '🐉',
    rewardItemCode: 'deco_dragon_egg',
    milestoneLines: {
      25: 'Rồng Thứ Hai bắt đầu lảo đảo!',
      50: 'Một nửa sương mù đã tan biến ☀️',
      75: 'Rồng đã thấm mệt, cố lên mọi người!',
      100: 'Rồng Thứ Hai đã bị đánh bại! 🎉',
    },
  },
  {
    code: 'garden_world_tree',
    type: 'GARDEN',
    title: 'Cùng trồng Cây Thế Giới',
    description: 'Một hạt giống thần kỳ vừa được gieo giữa công ty. Năng lượng tích cực của mọi người sẽ giúp nó vươn cao.',
    icon: '🌳',
    rewardItemCode: 'deco_golden_leaf',
    milestoneLines: {
      25: 'Hạt giống đã nảy mầm 🌱',
      50: 'Cây đã cao bằng tòa nhà!',
      75: 'Những nụ hoa đầu tiên xuất hiện 🌸',
      100: 'Cây Thế Giới đã nở hoa rực rỡ! 🎉',
    },
  },
  {
    code: 'boss_deadline_octopus',
    type: 'BOSS',
    title: 'Thuần phục Bạch Tuộc Deadline',
    description: 'Tám xúc tu deadline đang quấn lấy văn phòng. Đoàn kết lại, chúng ta sẽ gỡ từng cái một!',
    villainName: 'Bạch Tuộc Deadline',
    icon: '🐙',
    rewardItemCode: 'sticker_octopus',
    milestoneLines: {
      25: 'Hai xúc tu đã được gỡ ra!',
      50: 'Bạch Tuộc bắt đầu bối rối 😵',
      75: 'Chỉ còn hai xúc tu nữa thôi!',
      100: 'Bạch Tuộc Deadline đã trở thành bạn của chúng ta! 🎉',
    },
  },
  {
    code: 'expedition_coral_island',
    type: 'EXPEDITION',
    title: 'Hải trình tới Đảo San Hô',
    description: 'Con thuyền của công ty đang ra khơi. Mỗi đóng góp là một hải lý tiến gần hơn tới hòn đảo bí ẩn.',
    icon: '⛵',
    rewardItemCode: 'deco_seashell',
    milestoneLines: {
      25: 'Đã rời cảng an toàn ⚓',
      50: 'Nửa chặng đường — nhìn thấy cá heo! 🐬',
      75: 'Hòn đảo đã hiện ra phía chân trời',
      100: 'Cập bến Đảo San Hô! 🎉',
    },
  },
  {
    code: 'boss_sleepy_golem',
    type: 'BOSS',
    title: 'Đánh thức Golem Buồn Ngủ',
    description: 'Golem Buồn Ngủ đang chắn lối vào khu rừng mới. Năng lượng của cả công ty sẽ đánh thức và mời nó tránh đường.',
    villainName: 'Golem Buồn Ngủ',
    icon: '🗿',
    rewardItemCode: 'outfit_star_cape',
    milestoneLines: {
      25: 'Golem khẽ cựa mình…',
      50: 'Golem đã mở một mắt 👁️',
      75: 'Golem đang vươn vai!',
      100: 'Golem đã thức dậy và nhường đường! 🎉',
    },
  },
  {
    code: 'garden_flower_festival',
    type: 'GARDEN',
    title: 'Lễ hội Ngàn Hoa',
    description: 'Cùng nhau gieo một nghìn bông hoa để mở cửa lễ hội mùa xuân của công ty.',
    icon: '🌷',
    rewardItemCode: 'deco_flower_pot',
    milestoneLines: {
      25: 'Những luống hoa đầu tiên đã nở 🌼',
      50: 'Khu vườn rộn ràng ong bướm 🐝',
      75: 'Hương hoa lan tỏa khắp văn phòng',
      100: 'Lễ hội Ngàn Hoa chính thức khai mạc! 🎉',
    },
  },
];

/** Chọn chủ đề xoay vòng theo tháng: tháng này đánh boss, tháng sau trồng cây… */
export function themeForMonth(year: number, month: number): EventTheme {
  const idx = (year * 12 + (month - 1)) % EVENT_THEMES.length;
  return EVENT_THEMES[idx];
}

export function themeByCode(code: string): EventTheme | undefined {
  return EVENT_THEMES.find((t) => t.code === code);
}

/** Nhiệm vụ cộng đồng mặc định cho mỗi sự kiện */
export const DEFAULT_QUESTS = [
  {
    code: 'thanks_3',
    title: 'Gửi 3 lời cảm ơn',
    description: 'Cảm ơn những người đã giúp bạn trong tháng này.',
    icon: '💌',
    actionKey: 'SEND_APPRECIATION',
    targetCount: 3,
    points: 15,
  },
  {
    code: 'cross_team',
    title: 'Kết nối liên team',
    description: 'Gửi lời cảm ơn tới một người ở team khác.',
    icon: '🤝',
    actionKey: 'CROSS_TEAM_THANKS',
    targetCount: 1,
    points: 10,
  },
  {
    code: 'workdays_5',
    title: 'Năm ngày vững vàng',
    description: 'Hoàn thành 5 ngày làm việc theo lịch trong tháng.',
    icon: '📅',
    actionKey: 'COMPLETE_DAY',
    targetCount: 5,
    points: 20,
  },
  {
    code: 'achievement_1',
    title: 'Khám phá bản thân',
    description: 'Mở khóa 1 thành tựu bất kỳ trong tháng.',
    icon: '🏅',
    actionKey: 'UNLOCK_ACHIEVEMENT',
    targetCount: 1,
    points: 10,
  },
];
