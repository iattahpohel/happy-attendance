/**
 * Seed dữ liệu demo: danh mục thành tựu/vật phẩm/khu vực, nhân viên, và mô phỏng
 * ~3,5 tháng chấm công bằng chính các service của ứng dụng (để XP, thành tựu,
 * sự kiện cộng đồng, danh hiệu… được tính đúng như khi chạy thật).
 *
 * Chạy: pnpm --filter api seed   (XOÁ toàn bộ dữ liệu hiện có!)
 */
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { AttendanceService } from './attendance/attendance.service';
import { CommunityEventsService } from './community-events/community-events.service';
import { MonthlySummaryService } from './monthly-summary/monthly-summary.service';
import { RecognitionService } from './recognition/recognition.service';
import { ScheduleService } from './schedule/schedule.service';
import { LeavesService } from './schedule/leaves.service';
import { themeForMonth } from './community-events/event-themes';
import { dateOnly, eachDayOfMonth, localParts, pad, prevMonth, timeToMinutes, ymd, zonedToUtc } from './common/time';
import { ACHIEVEMENTS, EMOJIS, HOLIDAYS_2026, ITEMS, OFFICE, PERSONAS, TEAMS, THANK_YOU_MESSAGES, ZONES } from './seed-data';
import { distanceMeters } from './common/geo';
import { LocationStatus } from '@prisma/client';

// PRNG cố định để dữ liệu demo lặp lại được
let seed = 20261120;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// PRNG riêng cho vị trí: không làm lệch chuỗi random của dữ liệu chấm công/cảm ơn đã có
let locSeed = 1121;
function locRand() {
  locSeed = (Math.imul(locSeed, 1664525) + 1013904223) | 0;
  return (locSeed >>> 0) / 4294967296;
}

/** Vị trí chấm công mô phỏng: đa số quanh công ty, thỉnh thoảng ngoài phạm vi hoặc không có vị trí */
function fakeLocation(anomalyRate: number) {
  const r = locRand();
  if (r < anomalyRate * 0.4) {
    return { lat: null, lng: null, accuracy: null, distance: null, status: LocationStatus.NO_LOCATION };
  }
  const meters = r < anomalyRate ? 300 + locRand() * 2700 : 5 + locRand() * 120;
  const angle = locRand() * 2 * Math.PI;
  const lat = OFFICE.latitude + (meters * Math.cos(angle)) / 111320;
  const lng = OFFICE.longitude + (meters * Math.sin(angle)) / (111320 * Math.cos((OFFICE.latitude * Math.PI) / 180));
  const distance = distanceMeters(lat, lng, OFFICE.latitude, OFFICE.longitude);
  return {
    lat,
    lng,
    accuracy: Math.round(5 + locRand() * 25),
    distance,
    status: distance > OFFICE.maxDistanceMeters ? LocationStatus.OUT_OF_RANGE : LocationStatus.OK,
  };
}
const randInt = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const minutesToHHMM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const attendance = app.get(AttendanceService);
  const events = app.get(CommunityEventsService);
  const summary = app.get(MonthlySummaryService);
  const recognition = app.get(RecognitionService);
  const schedule = app.get(ScheduleService);
  const leaves = app.get(LeavesService);

  console.log('Xoá dữ liệu cũ…');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "Notification","DeviceToken","QuestProgress","EventQuest","EventContribution","CommunityEvent","WorldZone",
    "UserItem","Item","UserAchievement","Achievement","MonthlyTitle","MonthlySummary","AppreciationMessage",
    "AttendanceRecord","LeaveRecord","WorkSchedule","Holiday","User","Team","OfficeSetting" CASCADE`);
  await prisma.officeSetting.create({ data: { id: 'default', ...OFFICE } });

  console.log('Danh mục…');
  await prisma.achievement.createMany({ data: ACHIEVEMENTS });
  await prisma.item.createMany({ data: ITEMS });
  await prisma.worldZone.createMany({ data: ZONES });
  await prisma.worldZone.update({ where: { code: 'zone_home' }, data: { unlockedAt: new Date('2026-07-01T00:00:00Z') } });
  await prisma.holiday.createMany({ data: HOLIDAYS_2026.map((h) => ({ date: dateOnly(h.date), name: h.name })) });
  const teams = new Map<string, string>();
  for (const name of TEAMS) teams.set(name, (await prisma.team.create({ data: { name } })).id);

  console.log('Nhân viên…');
  const passwordHash = await bcrypt.hash('happy123', 10);
  const users: { id: string; p: (typeof PERSONAS)[number] }[] = [];
  for (const p of PERSONAS) {
    const u = await prisma.user.create({
      data: {
        email: p.email,
        fullName: p.fullName,
        passwordHash,
        role: p.role ?? 'EMPLOYEE',
        teamId: teams.get(p.team),
        character: p.character,
        workWeekdays: p.weekdays ?? [1, 2, 3, 4, 5],
        defaultStartTime: p.start ?? '08:30',
        defaultEndTime: p.end ?? '17:30',
        createdAt: new Date('2026-07-25T00:00:00Z'),
      },
    });
    users.push({ id: u.id, p });
  }
  const byEmail = (e: string) => users.find((u) => u.p.email === e)!.id;

  const now = localParts();
  const months: { year: number; month: number }[] = [];
  let ym = { year: now.year, month: now.month };
  for (let i = 0; i < 4; i++) {
    months.unshift(ym);
    ym = prevMonth(ym.year, ym.month);
  }
  for (const m of months) for (const u of users) await schedule.ensureMonth(u.id, m.year, m.month);

  console.log('Nghỉ phép…');
  const [m0, m1, m2, m3] = months;
  const approve = async (email: string, start: string, end: string, type: 'ANNUAL' | 'SICK' | 'PERSONAL') => {
    const l = await leaves.request(byEmail(email), { startDate: start, endDate: end, type, reason: 'Demo' });
    await leaves.review(byEmail('ha@happy.local'), l.id, 'APPROVED');
  };
  // Dũng ốm dài ngày ở tháng thứ 2 -> tháng sau trở lại (Comeback Star)
  await approve('dung@happy.local', ymd(m1.year, m1.month, 8), ymd(m1.year, m1.month, 19), 'SICK');
  await approve('an@happy.local', ymd(m2.year, m2.month, 9), ymd(m2.year, m2.month, 10), 'ANNUAL');
  await approve('chi@happy.local', ymd(m3.year, m3.month, 3), ymd(m3.year, m3.month, 3), 'PERSONAL');
  await approve('minh@happy.local', ymd(m0.year, m0.month, 20), ymd(m0.year, m0.month, 21), 'ANNUAL');
  await leaves.request(byEmail('khoa@happy.local'), {
    startDate: ymd(m3.year, m3.month, 27),
    endDate: ymd(m3.year, m3.month, 28),
    type: 'ANNUAL',
    reason: 'Về quê thăm gia đình',
  });

  console.log('Sự kiện cộng đồng…');
  for (const m of months) {
    const isCurrent = m.year === now.year && m.month === now.month;
    // Tháng hiện tại khó hơn một chút để demo còn đang "đánh boss"
    await events.setTheme(m.year, m.month, themeForMonth(m.year, m.month).code, isCurrent ? 0.95 : 0.85);
  }

  console.log('Mô phỏng chấm công (mất khoảng 1–2 phút)…');
  for (const [mi, m] of months.entries()) {
    const days = eachDayOfMonth(m.year, m.month).filter((d) => d <= now.dateStr);
    for (const date of days) {
      const isToday = date === now.dateStr;
      for (const { id, p } of users) {
        if (isToday && p.email === 'an@happy.local') continue; // để bạn tự check-in khi demo
        const plan = await schedule.dayPlan(id, date);
        if (!plan.scheduled) continue;
        let attendP = p.attend;
        let lateP = p.late;
        if (p.email === 'dung@happy.local' && mi === 1) attendP = 0.55;
        if (p.email === 'hoa@happy.local') lateP = Math.max(0.03, p.late - mi * 0.09); // tiến bộ dần
        if (rand() > attendP) continue;

        const startMin = timeToMinutes(plan.startTime);
        const late = rand() < lateP;
        const inMin = late ? startMin + randInt(11, 40) : startMin - randInt(0, 25);
        const checkInAt = zonedToUtc(date, minutesToHHMM(inMin));
        if (isToday && checkInAt.getTime() > Date.now()) continue;
        const inLoc = fakeLocation(0.08);
        const rec = await prisma.attendanceRecord.create({
          data: {
            checkInLat: inLoc.lat,
            checkInLng: inLoc.lng,
            checkInAccuracy: inLoc.accuracy,
            checkInDistance: inLoc.distance,
            checkInLocStatus: inLoc.status,
            userId: id,
            workDate: dateOnly(date),
            checkInAt,
            isScheduledDay: true,
            isLate: late,
            lateMinutes: late ? inMin - startMin : 0,
          },
        });
        if (isToday) continue; // hôm nay mọi người vẫn đang làm việc
        const outMin = timeToMinutes(plan.endTime) + randInt(0, 20);
        const checkOutAt = zonedToUtc(date, minutesToHHMM(outMin));
        const outLoc = fakeLocation(0.04);
        await prisma.attendanceRecord.update({
          where: { id: rec.id },
          data: {
            checkOutLat: outLoc.lat,
            checkOutLng: outLoc.lng,
            checkOutAccuracy: outLoc.accuracy,
            checkOutDistance: outLoc.distance,
            checkOutLocStatus: outLoc.status,
            checkOutAt,
            workedMinutes: Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000),
            completed: true,
          },
        });
        await attendance.completeDay(id, date, checkOutAt);
      }

      // Lời cảm ơn trong ngày
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      if (weekday !== 0) {
        const count = randInt(0, 3);
        for (let i = 0; i < count; i++) {
          const pool = users.flatMap((u) => Array(u.p.thanksWeight ?? 1).fill(u));
          const sender = pick(pool);
          let receiver = pick(users);
          if (receiver.id === sender.id) receiver = users[(users.indexOf(receiver) + 1) % users.length];
          const at = zonedToUtc(date, minutesToHHMM(randInt(10 * 60, 17 * 60)));
          if (at.getTime() > Date.now()) continue;
          await recognition.send(sender.id, { receiverId: receiver.id, message: pick(THANK_YOU_MESSAGES), emoji: pick(EMOJIS) }, at);
        }
      }
    }

    const isCurrent = m.year === now.year && m.month === now.month;
    if (!isCurrent) {
      const next = m.month === 12 ? { year: m.year + 1, month: 1 } : { year: m.year, month: m.month + 1 };
      await events.closeMonth(m.year, m.month);
      await summary.finalizeMonth(m.year, m.month, zonedToUtc(ymd(next.year, next.month, 1), '00:10'));
      console.log(`  ✓ ${m.month}/${m.year}`);
    }
  }

  // Trang bị sẵn vài vật phẩm cho nhân vật để giao diện sinh động
  for (const { id } of users) {
    const owned = await prisma.userItem.findMany({ where: { userId: id }, include: { item: true } });
    const firstOf = (t: string) => owned.find((o) => o.item.type === t);
    for (const o of [firstOf('OUTFIT'), firstOf('DECORATION'), firstOf('BACKGROUND')]) {
      if (o) await prisma.userItem.update({ where: { id: o.id }, data: { equipped: true } });
    }
  }

  // Thông báo sinh ra trong quá trình mô phỏng đều mang thời gian hiện tại -> dọn và tạo lại vài thông báo chào mừng
  await prisma.notification.deleteMany({});
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: 'SYSTEM' as const,
      title: 'Chào mừng tới Happy Attendance 🌱',
      body: 'Mỗi ngày đi làm, một niềm vui nhỏ. Show up. Grow up. Feel good.',
    })),
  });

  const ev = await events.current();
  console.log(`Sự kiện tháng này: ${ev.icon} ${ev.title} — ${ev.currentPoints}/${ev.targetPoints}`);
  console.log('Hoàn tất! Đăng nhập: an@happy.local / happy123 (nhân viên), ha@happy.local / happy123 (admin)');
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
