-- CreateTable
CREATE TABLE "CoachEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "impact" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CoachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerGoal" TEXT,
    "dreamCompany" TEXT,
    "preferredLanguage" TEXT,
    "learningStyle" TEXT,
    "dailyStudyMinutes" INTEGER,
    "strongTopics" TEXT,
    "weakTopics" TEXT,
    "currentPhase" TEXT,
    "lastMissionGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachEvent_userId_createdAt_idx" ON "CoachEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachEvent_userId_module_idx" ON "CoachEvent"("userId", "module");

-- CreateIndex
CREATE INDEX "CoachEvent_userId_type_idx" ON "CoachEvent"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CoachMemory_userId_key" ON "CoachMemory"("userId");

-- AddForeignKey
ALTER TABLE "CoachEvent" ADD CONSTRAINT "CoachEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachMemory" ADD CONSTRAINT "CoachMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
