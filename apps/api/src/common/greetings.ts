const MORNING = [
  'Chào buổi sáng! Một ngày mới, một cơ hội mới ☀️',
  'Mặt trời đã thức dậy cùng bạn rồi! Hôm nay sẽ tuyệt lắm đây 🌤️',
  'Chào bạn! Nhớ uống đủ nước và mỉm cười nhé 💧',
  'Ngày mới đã đến, khu vườn của bạn đang chờ được chăm sóc 🌱',
  'Có bạn ở đây, văn phòng sáng hẳn lên ✨',
  'Bắt đầu nhẹ nhàng thôi, từng bước nhỏ cũng là tiến bộ 🐾',
  'Hít một hơi thật sâu — bạn đã sẵn sàng cho hôm nay 🌈',
];
const LATE_MORNING = [
  'Chào bạn! Đến rồi là tốt rồi, cùng bắt đầu nhé 🌼',
  'Không sao đâu, quan trọng là bạn đã ở đây 💛',
  'Một khởi đầu muộn vẫn là một khởi đầu đẹp 🌻',
];
const AFTERNOON = [
  'Chào buổi chiều! Cùng nhau làm nên điều tốt đẹp nhé 🌤️',
  'Rất vui được gặp bạn chiều nay 🍵',
];
const CHECKOUT = [
  'Bạn đã hoàn thành một ngày thật tốt. Nghỉ ngơi nhé! 🌙',
  'Hôm nay bạn đã làm rất tốt rồi. Về nhà thư giãn thôi 🛋️',
  'Cảm ơn vì một ngày đầy nỗ lực. Ngủ ngon nhé ✨',
  'Khu vườn của bạn vừa lớn thêm một chút 🌿 Hẹn gặp lại!',
  'Tắt máy, hít thở, và tận hưởng buổi tối của bạn 🌆',
];
const DAY_OFF = [
  'Hôm nay là ngày nghỉ của bạn — đừng quên nghỉ ngơi nhé 🌴',
  'Ngày nghỉ cũng là một phần của hành trình. Chăm sóc bản thân nhé 💚',
];

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export function checkInGreeting(opts: { minutesOfDay: number; isLate: boolean; isScheduledDay: boolean }) {
  if (!opts.isScheduledDay) return pick(DAY_OFF);
  if (opts.minutesOfDay >= 12 * 60) return pick(AFTERNOON);
  if (opts.isLate) return pick(LATE_MORNING);
  return pick(MORNING);
}

export function checkOutGreeting() {
  return pick(CHECKOUT);
}
