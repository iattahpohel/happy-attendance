import { ItemType } from '@prisma/client';

export const ACHIEVEMENTS = [
  { code: 'FIRST_STEP', name: 'Khởi đầu tốt', icon: '🌱', category: 'journey', threshold: 1, xpReward: 30, rewardItemCode: 'sticker_sprout', description: 'Ngày đầu tiên chấm công trên Happy Attendance' },
  { code: 'STEADY_5', name: 'Đều đặn', icon: '🌿', category: 'journey', threshold: 5, xpReward: 50, rewardItemCode: 'deco_watering_can', description: 'Hoàn thành 5 ngày làm việc theo lịch' },
  { code: 'RESILIENT_20', name: 'Bền bỉ', icon: '🌳', category: 'journey', threshold: 20, xpReward: 100, rewardItemCode: 'outfit_leaf_hat', description: 'Hoàn thành 20 ngày làm việc theo lịch' },
  { code: 'CENTURY_100', name: 'Khu vườn trăm ngày', icon: '🏡', category: 'journey', threshold: 100, xpReward: 300, rewardItemCode: 'bg_starry', description: 'Hoàn thành 100 ngày làm việc theo lịch' },
  { code: 'FULL_MONTH', name: 'Một tháng trọn vẹn', icon: '🌻', category: 'month', threshold: null, xpReward: 150, rewardItemCode: 'bg_sunflower', description: 'Hoàn thành toàn bộ ngày làm việc theo lịch của bạn trong tháng — dù lịch của bạn là 22 hay 12 ngày' },
  { code: 'PERSISTENT_3M', name: 'Kiên trì', icon: '💎', category: 'month', threshold: null, xpReward: 300, rewardItemCode: 'deco_crystal', description: 'Duy trì tỉ lệ hoàn thành lịch từ 90% trở lên trong 3 tháng liên tiếp' },
  { code: 'INSPIRER', name: 'Người truyền cảm hứng', icon: '🎨', category: 'social', threshold: 3, xpReward: 80, rewardItemCode: 'sticker_heart', description: 'Nhận được 3 lời cảm ơn từ đồng nghiệp' },
  { code: 'KIND_HEART', name: 'Trái tim ấm áp', icon: '💌', category: 'social', threshold: 10, xpReward: 80, rewardItemCode: 'sticker_letter', description: 'Gửi 10 lời cảm ơn tới đồng nghiệp' },
  { code: 'QUEST_HELPER', name: 'Đồng đội tận tâm', icon: '🧩', category: 'community', threshold: 5, xpReward: 80, rewardItemCode: 'deco_lantern', description: 'Hoàn thành 5 nhiệm vụ cộng đồng' },
  { code: 'WORLD_GUARDIAN', name: 'Người bảo vệ thế giới', icon: '🛡️', category: 'community', threshold: null, xpReward: 100, rewardItemCode: 'outfit_hero_band', description: 'Góp sức để cả công ty hoàn thành một sự kiện cộng đồng' },
].map((a, i) => ({ ...a, sortOrder: i }));

export const ITEMS: { code: string; name: string; type: ItemType; icon: string; description: string; rarity?: string }[] = [
  // Sticker
  { code: 'sticker_sprout', name: 'Sticker Mầm Xanh', type: 'STICKER', icon: '🌱', description: 'Kỷ niệm ngày đầu tiên' },
  { code: 'sticker_sunny', name: 'Sticker Nắng Mai', type: 'STICKER', icon: '🌞', description: 'Phần thưởng lên cấp 2' },
  { code: 'sticker_heart', name: 'Sticker Trái Tim', type: 'STICKER', icon: '💖', description: 'Bạn là nguồn cảm hứng' },
  { code: 'sticker_letter', name: 'Sticker Lá Thư', type: 'STICKER', icon: '💌', description: 'Người gửi yêu thương' },
  { code: 'sticker_octopus', name: 'Sticker Bạch Tuộc', type: 'STICKER', icon: '🐙', description: 'Kỷ niệm thuần phục Bạch Tuộc Deadline', rarity: 'rare' },
  // Trang trí khu vườn
  { code: 'deco_watering_can', name: 'Bình tưới cây', type: 'DECORATION', icon: '🚿', description: 'Chăm cây đều đặn' },
  { code: 'deco_mushroom', name: 'Nấm nhỏ', type: 'DECORATION', icon: '🍄', description: 'Phần thưởng lên cấp 3' },
  { code: 'deco_crystal', name: 'Pha lê kiên trì', type: 'DECORATION', icon: '💎', description: 'Ba tháng bền bỉ', rarity: 'epic' },
  { code: 'deco_lantern', name: 'Đèn lồng', type: 'DECORATION', icon: '🏮', description: 'Đồng đội tận tâm' },
  { code: 'deco_dragon_egg', name: 'Trứng rồng', type: 'DECORATION', icon: '🥚', description: 'Kỷ niệm đánh bại Rồng Thứ Hai', rarity: 'rare' },
  { code: 'deco_golden_leaf', name: 'Lá vàng Thế Giới', type: 'DECORATION', icon: '🍂', description: 'Kỷ niệm Cây Thế Giới nở hoa', rarity: 'rare' },
  { code: 'deco_seashell', name: 'Vỏ sò San Hô', type: 'DECORATION', icon: '🐚', description: 'Kỷ niệm cập bến Đảo San Hô', rarity: 'rare' },
  { code: 'deco_flower_pot', name: 'Chậu Ngàn Hoa', type: 'DECORATION', icon: '🌷', description: 'Kỷ niệm Lễ hội Ngàn Hoa', rarity: 'rare' },
  // Trang phục nhân vật
  { code: 'outfit_leaf_hat', name: 'Mũ lá', type: 'OUTFIT', icon: '🍃', description: 'Bền bỉ 20 ngày' },
  { code: 'outfit_scarf', name: 'Khăn quàng ấm', type: 'OUTFIT', icon: '🧣', description: 'Phần thưởng lên cấp 4' },
  { code: 'outfit_glasses', name: 'Kính tri thức', type: 'OUTFIT', icon: '👓', description: 'Phần thưởng lên cấp 7' },
  { code: 'outfit_crown', name: 'Vương miện', type: 'OUTFIT', icon: '👑', description: 'Phần thưởng lên cấp 10', rarity: 'epic' },
  { code: 'outfit_hero_band', name: 'Băng đô anh hùng', type: 'OUTFIT', icon: '🎗️', description: 'Người bảo vệ thế giới' },
  { code: 'outfit_star_cape', name: 'Áo choàng sao', type: 'OUTFIT', icon: '⭐', description: 'Kỷ niệm đánh thức Golem', rarity: 'rare' },
  // Phông nền
  { code: 'bg_sakura', name: 'Nền hoa anh đào', type: 'BACKGROUND', icon: '🌸', description: 'Phần thưởng lên cấp 5' },
  { code: 'bg_sunflower', name: 'Nền hướng dương', type: 'BACKGROUND', icon: '🌻', description: 'Một tháng trọn vẹn' },
  { code: 'bg_starry', name: 'Nền trời sao', type: 'BACKGROUND', icon: '🌌', description: 'Khu vườn trăm ngày', rarity: 'epic' },
];

export const ZONES = [
  { code: 'zone_home', name: 'Văn phòng Ấm Áp', icon: '🏡', description: 'Nơi hành trình bắt đầu.' },
  { code: 'zone_dawn_valley', name: 'Thung lũng Bình Minh', icon: '🌄', description: 'Nơi mặt trời mọc sớm nhất.' },
  { code: 'zone_sakura_forest', name: 'Rừng Anh Đào', icon: '🌸', description: 'Hoa nở quanh năm, gió thơm dịu nhẹ.' },
  { code: 'zone_coral_island', name: 'Đảo San Hô', icon: '🏝️', description: 'Hòn đảo của những khởi đầu mới.' },
  { code: 'zone_cloud_peak', name: 'Đỉnh Mây', icon: '🏔️', description: 'Nơi có thể nhìn thấy cả thế giới.' },
  { code: 'zone_moon_lake', name: 'Hồ Ánh Trăng', icon: '🌙', description: 'Mặt hồ phẳng lặng để nghỉ ngơi.' },
  { code: 'zone_firefly_village', name: 'Làng Đom Đóm', icon: '✨', description: 'Ngôi làng sáng lấp lánh mỗi đêm.' },
  { code: 'zone_wind_meadow', name: 'Thảo nguyên Gió', icon: '🌾', description: 'Cánh đồng bất tận dưới bầu trời xanh.' },
  { code: 'zone_rainbow_castle', name: 'Lâu đài Cầu Vồng', icon: '🌈', description: 'Đích đến huyền thoại của cả công ty.' },
].map((z, i) => ({ ...z, sortOrder: i }));

export const HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'Tết Dương lịch' },
  { date: '2026-02-16', name: 'Tết Nguyên Đán' },
  { date: '2026-02-17', name: 'Tết Nguyên Đán' },
  { date: '2026-02-18', name: 'Tết Nguyên Đán' },
  { date: '2026-02-19', name: 'Tết Nguyên Đán' },
  { date: '2026-02-20', name: 'Tết Nguyên Đán' },
  { date: '2026-04-27', name: 'Giỗ Tổ Hùng Vương (nghỉ bù)' },
  { date: '2026-04-30', name: 'Ngày Thống nhất' },
  { date: '2026-05-01', name: 'Quốc tế Lao động' },
  { date: '2026-09-01', name: 'Quốc khánh' },
  { date: '2026-09-02', name: 'Quốc khánh' },
];

export const TEAMS = ['Product', 'Engineering', 'Design', 'People & Culture'];

export interface Persona {
  email: string;
  fullName: string;
  team: string;
  character: string;
  role?: 'ADMIN' | 'EMPLOYEE';
  attend: number; // xác suất có mặt mỗi ngày theo lịch
  late: number; // xác suất đi muộn
  weekdays?: number[];
  start?: string;
  end?: string;
  thanksWeight?: number;
}

export const PERSONAS: Persona[] = [
  { email: 'an@happy.local', fullName: 'Nguyễn Minh An', team: 'Engineering', character: 'sunny', attend: 0.96, late: 0.08, thanksWeight: 2 },
  { email: 'ha@happy.local', fullName: 'Trần Thu Hà', team: 'People & Culture', character: 'berry', role: 'ADMIN', attend: 0.95, late: 0.05, thanksWeight: 3 },
  { email: 'binh@happy.local', fullName: 'Lê Văn Bình', team: 'Engineering', character: 'cloud', attend: 1, late: 0.02 },
  { email: 'chi@happy.local', fullName: 'Phạm Bảo Chi', team: 'Design', character: 'mochi', attend: 0.9, late: 0.15, thanksWeight: 2 },
  { email: 'dung@happy.local', fullName: 'Hoàng Tiến Dũng', team: 'Engineering', character: 'leaf', attend: 0.93, late: 0.1 },
  { email: 'giang@happy.local', fullName: 'Vũ Hương Giang', team: 'Design', character: 'berry', attend: 1, late: 0.05, weekdays: [1, 3, 5], start: '09:00', end: '15:00' },
  { email: 'hoa@happy.local', fullName: 'Đặng Thanh Hoa', team: 'Product', character: 'sunny', attend: 0.88, late: 0.3 },
  { email: 'khoa@happy.local', fullName: 'Bùi Đăng Khoa', team: 'Engineering', character: 'cloud', attend: 0.97, late: 0.05 },
  { email: 'linh@happy.local', fullName: 'Ngô Khánh Linh', team: 'Product', character: 'mochi', attend: 0.93, late: 0.08, thanksWeight: 4 },
  { email: 'minh@happy.local', fullName: 'Đỗ Quang Minh', team: 'Engineering', character: 'leaf', attend: 0.87, late: 0.12 },
  { email: 'phuong@happy.local', fullName: 'Trịnh Mai Phương', team: 'People & Culture', character: 'berry', attend: 0.95, late: 0.05, weekdays: [2, 3, 4, 5, 6], start: '09:00', end: '18:00' },
  { email: 'quang@happy.local', fullName: 'Lý Nhật Quang', team: 'Product', character: 'sunny', attend: 0.9, late: 0.1 },
];

export const THANK_YOU_MESSAGES = [
  'Cảm ơn bạn đã luôn hỗ trợ mình.',
  'Bạn luôn mang đến năng lượng tích cực!',
  'Cảm ơn vì đã giúp team hoàn thành công việc.',
  'Cảm ơn bạn đã review code cực kỳ tận tâm 🙏',
  'Buổi brainstorm hôm nay tuyệt vời nhờ có bạn.',
  'Cảm ơn bạn đã ở lại cùng mình xử lý sự cố.',
  'Ly cà phê bạn mua làm mình tỉnh cả buổi chiều ☕',
  'Bản thiết kế mới đẹp quá, cảm ơn bạn!',
  'Cảm ơn vì đã kiên nhẫn giải thích cho mình.',
  'Bạn là người đồng đội đáng tin cậy nhất!',
  'Cảm ơn bạn đã chia sẻ tài liệu rất hữu ích.',
  'Nụ cười của bạn làm cả phòng vui lây 😄',
];

export const EMOJIS = ['💚', '🙏', '🌻', '✨', '☕', '🎉', '💪', '🌈'];

/** Vị trí công ty (Google Maps: CÔNG TY CỔ PHẦN FADO GLOBAL) */
export const OFFICE = {
  name: 'CÔNG TY CỔ PHẦN FADO GLOBAL',
  latitude: 10.8013241,
  longitude: 106.6486898,
  maxDistanceMeters: 200,
};
