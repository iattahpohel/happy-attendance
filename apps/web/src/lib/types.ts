export type Role = 'EMPLOYEE' | 'ADMIN';
export type CharacterKey = 'sunny' | 'mochi' | 'leaf' | 'cloud' | 'berry';
export type ItemType = 'STICKER' | 'DECORATION' | 'OUTFIT' | 'BACKGROUND';
export type EventType = 'BOSS' | 'GARDEN' | 'EXPEDITION';
export type EventStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ENDED';
export type DayKind = 'WORK' | 'OFF' | 'HOLIDAY' | 'LEAVE';
export type DayStatus = 'COMPLETED' | 'IN_PROGRESS' | 'MISSED' | 'UPCOMING' | 'TODAY' | 'OFF' | 'HOLIDAY' | 'LEAVE' | 'EXTRA';
export type LeaveType = 'ANNUAL' | 'SICK' | 'PERSONAL' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type TitleCode = 'STEADY_STAR' | 'GROWTH_MINDSET' | 'POSITIVE_ENERGY' | 'RELIABLE_PARTNER' | 'COMEBACK_STAR' | 'PERFECT_MONTH';

export interface Me {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  character: CharacterKey;
  xp: number;
  soundEnabled: boolean;
  reminderEnabled: boolean;
  workWeekdays: number[];
  defaultStartTime: string;
  defaultEndTime: string;
  isActive: boolean;
  team: { id: string; name: string } | null;
}

export interface UserLite {
  id: string;
  fullName: string;
  character: CharacterKey;
  team?: { name: string } | null;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  type: ItemType;
  icon: string;
  description: string;
  rarity: string;
}

export interface CatalogItem extends Item {
  owned: boolean;
  equipped: boolean;
  source: string | null;
  acquiredAt: string | null;
}

export interface AttendanceRecord {
  id: string;
  workDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  isScheduledDay: boolean;
  isLate: boolean;
  lateMinutes: number;
  workedMinutes: number | null;
  autoCheckedOut: boolean;
  completed: boolean;
  greeting: string | null;
  checkInLat: number | null;
  checkInLng: number | null;
  checkInDistance: number | null;
  checkInLocStatus: LocationStatus;
  checkOutLat: number | null;
  checkOutLng: number | null;
  checkOutDistance: number | null;
  checkOutLocStatus: LocationStatus | null;
}

export type LocationStatus = 'OK' | 'OUT_OF_RANGE' | 'NO_LOCATION';

export interface OfficeConfig {
  name: string;
  latitude: number | null;
  longitude: number | null;
  maxDistanceMeters: number;
  configured: boolean;
}

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface DayPlan {
  date: string;
  kind: DayKind;
  scheduled: boolean;
  startTime: string;
  endTime: string;
  holidayName?: string;
  leave?: { id: string; type: LeaveType; status: LeaveStatus };
  note?: string | null;
}

export type Phase = 'BEFORE_CHECK_IN' | 'WORKING' | 'DONE';

export interface MonthProgress {
  year: number;
  month: number;
  scheduledDays: number;
  completedDays: number;
  remainingDays: number;
  pct: number;
}

export interface Profile {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  nextAt: number;
  completedDaysTotal: number;
  garden: { stage: number; name: string; icon: string; minDays: number; next: { stage: number; name: string; icon: string; daysLeft: number } | null };
}

export interface HomeData {
  me: Me;
  today: { date: string; minutesOfDay: number; plan: DayPlan; record: AttendanceRecord | null; phase: Phase };
  monthProgress: MonthProgress;
  profile: Profile;
  streak: number;
  equipped: Item[];
  unreadNotifications: number;
  event: {
    id: string;
    title: string;
    icon: string;
    type: EventType;
    villainName: string | null;
    status: EventStatus;
    currentPoints: number;
    targetPoints: number;
    progressPct: number;
  };
}

export interface UnlockedAchievement {
  code: string;
  name: string;
  icon: string;
  description: string;
  xpReward: number;
}

export interface Contribution {
  eventId: string;
  points: number;
  icon: string;
  title: string;
}

export interface QuestDone {
  title: string;
  icon: string;
  points: number;
}

export interface CheckInResult {
  record: AttendanceRecord;
  greeting: string;
  isScheduledDay: boolean;
  xpGained: number;
  leveledUp: boolean;
  newAchievements: UnlockedAchievement[];
  effortDays: number;
}

export interface CheckOutResult {
  record: AttendanceRecord;
  greeting: string;
  xpGained: number;
  leveledUp: boolean;
  newAchievements: UnlockedAchievement[];
  contribution: Contribution | null;
  questsCompleted: QuestDone[];
  monthProgress: MonthProgress;
}

export interface CalendarDay extends DayPlan {
  status: DayStatus;
  attendance: {
    checkInAt: string;
    checkOutAt: string | null;
    isLate: boolean;
    lateMinutes: number;
    workedMinutes: number | null;
    autoCheckedOut: boolean;
  } | null;
}

export interface MonthCalendar {
  year: number;
  month: number;
  days: CalendarDay[];
  stats: {
    scheduledDays: number;
    completedDays: number;
    remainingDays: number;
    onTimeDays: number;
    lateDays: number;
    leaveDays: number;
    holidays: number;
    workedMinutes: number;
  };
}

export interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  status: LeaveStatus;
  reason: string | null;
  createdAt: string;
  user?: { id: string; fullName: string; email: string };
}

export interface AchievementView extends UnlockedAchievement {
  category: string;
  threshold: number | null;
  rewardItemCode: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number | null;
}

export interface TitleView {
  id: string;
  year: number;
  month: number;
  code: TitleCode;
  reason: string;
  name: string;
  icon: string;
  meaning: string;
}

export interface Wrapped {
  year: number;
  month: number;
  finalized: boolean;
  isCurrentMonth: boolean;
  daysLeftInMonth: number;
  user: { fullName: string; firstName: string; character: CharacterKey };
  stats: {
    scheduledDays: number;
    completedDays: number;
    attendanceDays: number;
    onTimeDays: number;
    lateDays: number;
    leaveDays: number;
    workedMinutes: number;
    achievementsUnlocked: number;
    appreciationsReceived: number;
    appreciationsSent: number;
    eventPoints: number;
    longestStreak: number;
    completionRate: number;
  };
  message: string;
  titles: { code: TitleCode; reason: string; name: string; icon: string; meaning: string }[];
  achievements: { code: string; name: string; icon: string; unlockedAt: string }[];
  avgCheckInTime: string | null;
  favoriteWeekday: number | null;
  comparison: {
    year: number;
    month: number;
    completedDays: number;
    scheduledDays: number;
    completionRate: number;
    lateDays: number;
    workedMinutes: number;
    appreciationsReceived: number;
  } | null;
  appreciationCard: { id: string; from: string; character: CharacterKey; message: string; emoji: string }[];
  communityEvent: { title: string; icon: string; status: EventStatus; progressPct: number } | null;
}

export interface SummaryRow {
  id: string;
  year: number;
  month: number;
  completedDays: number;
  scheduledDays: number;
  completionRate: number;
}

export interface Quest {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  targetCount: number;
  points: number;
  count: number;
  completed: boolean;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  unlockedAt: string | null;
}

export interface EventFormula {
  activeUsers: number;
  totalScheduledDays: number;
  avgScheduledDays: number;
  workdayPoints: number;
  socialPoints: number;
  questPoints: number;
  achievementPoints: number;
  expectedPoints: number;
  difficulty: number;
  targetPoints: number;
  computedAt: string;
}

export interface CommunityEventDetail {
  id: string;
  year: number;
  month: number;
  type: EventType;
  themeCode: string;
  title: string;
  description: string;
  villainName: string | null;
  icon: string;
  targetPoints: number;
  currentPoints: number;
  status: EventStatus;
  formula: EventFormula;
  completedAt: string | null;
  progressPct: number;
  remainingPoints: number;
  contributorsCount: number;
  milestones: { pct: number; reached: boolean; line: string }[];
  zone: Zone | null;
  quests: Quest[];
  myContribution: { total: number; bySource: Partial<Record<string, number>> };
  recentActivity: { id: string; name: string; character: CharacterKey; source: string; createdAt: string }[];
}

export interface EventSummary {
  id: string;
  year: number;
  month: number;
  type: EventType;
  title: string;
  icon: string;
  status: EventStatus;
  currentPoints: number;
  targetPoints: number;
  formula: EventFormula;
  _count: { contributions: number };
}

export interface Appreciation {
  id: string;
  message: string;
  emoji: string;
  isPublic: boolean;
  createdAt: string;
  sender: UserLite;
  receiver?: UserLite;
}

export interface Honors {
  year: number | null;
  month: number | null;
  groups: { code: TitleCode; name: string; icon: string; meaning: string; people: (UserLite & { reason: string })[] }[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}
