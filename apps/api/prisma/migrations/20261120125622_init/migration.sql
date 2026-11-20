-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'PERSONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BOSS', 'GARDEN', 'EXPEDITION');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'ENDED');

-- CreateEnum
CREATE TYPE "ContributionSource" AS ENUM ('WORKDAY_COMPLETED', 'APPRECIATION_SENT', 'QUEST_COMPLETED', 'ACHIEVEMENT_UNLOCKED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('STICKER', 'DECORATION', 'OUTFIT', 'BACKGROUND');

-- CreateEnum
CREATE TYPE "TitleCode" AS ENUM ('STEADY_STAR', 'GROWTH_MINDSET', 'POSITIVE_ENERGY', 'RELIABLE_PARTNER', 'COMEBACK_STAR', 'PERFECT_MONTH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACHIEVEMENT', 'APPRECIATION', 'EVENT', 'TITLE', 'REMINDER', 'ITEM', 'SYSTEM');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teamId" TEXT,
    "character" TEXT NOT NULL DEFAULT 'sunny',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "workWeekdays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "defaultStartTime" TEXT NOT NULL DEFAULT '08:30',
    "defaultEndTime" TEXT NOT NULL DEFAULT '17:30',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "isWorkday" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL DEFAULT '08:30',
    "endTime" TEXT NOT NULL DEFAULT '17:30',
    "note" TEXT,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "type" "LeaveType" NOT NULL DEFAULT 'ANNUAL',
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkOutAt" TIMESTAMP(3),
    "isScheduledDay" BOOLEAN NOT NULL DEFAULT true,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "workedMinutes" INTEGER,
    "autoCheckedOut" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "greeting" TEXT,
    "note" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'journey',
    "threshold" INTEGER,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "rewardItemCode" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlySummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "scheduledDays" INTEGER NOT NULL,
    "completedDays" INTEGER NOT NULL,
    "attendanceDays" INTEGER NOT NULL,
    "onTimeDays" INTEGER NOT NULL,
    "lateDays" INTEGER NOT NULL,
    "leaveDays" INTEGER NOT NULL,
    "workedMinutes" INTEGER NOT NULL,
    "achievementsUnlocked" INTEGER NOT NULL,
    "appreciationsReceived" INTEGER NOT NULL,
    "appreciationsSent" INTEGER NOT NULL,
    "eventPoints" INTEGER NOT NULL,
    "longestStreak" INTEGER NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL,
    "message" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyTitle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "code" "TitleCode" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppreciationMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '💚',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppreciationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityEvent" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "type" "EventType" NOT NULL,
    "themeCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "villainName" TEXT,
    "icon" TEXT NOT NULL,
    "targetPoints" INTEGER NOT NULL,
    "currentPoints" INTEGER NOT NULL DEFAULT 0,
    "milestonesReached" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "formula" JSONB NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'ACTIVE',
    "rewardItemCode" TEXT,
    "zoneCode" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventContribution" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "ContributionSource" NOT NULL,
    "points" INTEGER NOT NULL,
    "refKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventQuest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "EventQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldZone" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3),
    "unlockedByEventId" TEXT,

    CONSTRAINT "WorldZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "WorkSchedule_workDate_idx" ON "WorkSchedule"("workDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_userId_workDate_key" ON "WorkSchedule"("userId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "LeaveRecord_userId_startDate_idx" ON "LeaveRecord"("userId", "startDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_workDate_idx" ON "AttendanceRecord"("workDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_userId_workDate_key" ON "AttendanceRecord"("userId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE INDEX "UserAchievement_unlockedAt_idx" ON "UserAchievement"("unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySummary_userId_year_month_key" ON "MonthlySummary"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "MonthlyTitle_year_month_idx" ON "MonthlyTitle"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyTitle_userId_year_month_code_key" ON "MonthlyTitle"("userId", "year", "month", "code");

-- CreateIndex
CREATE INDEX "AppreciationMessage_receiverId_createdAt_idx" ON "AppreciationMessage"("receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "AppreciationMessage_createdAt_idx" ON "AppreciationMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Item_code_key" ON "Item"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserItem_userId_itemId_key" ON "UserItem"("userId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityEvent_year_month_key" ON "CommunityEvent"("year", "month");

-- CreateIndex
CREATE INDEX "EventContribution_eventId_createdAt_idx" ON "EventContribution"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventContribution_eventId_userId_refKey_key" ON "EventContribution"("eventId", "userId", "refKey");

-- CreateIndex
CREATE UNIQUE INDEX "EventQuest_eventId_code_key" ON "EventQuest"("eventId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "QuestProgress_questId_userId_key" ON "QuestProgress"("questId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorldZone_code_key" ON "WorldZone"("code");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlySummary" ADD CONSTRAINT "MonthlySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyTitle" ADD CONSTRAINT "MonthlyTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppreciationMessage" ADD CONSTRAINT "AppreciationMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppreciationMessage" ADD CONSTRAINT "AppreciationMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItem" ADD CONSTRAINT "UserItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItem" ADD CONSTRAINT "UserItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventContribution" ADD CONSTRAINT "EventContribution_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CommunityEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventContribution" ADD CONSTRAINT "EventContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuest" ADD CONSTRAINT "EventQuest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CommunityEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "EventQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
