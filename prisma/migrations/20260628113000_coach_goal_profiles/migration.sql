ALTER TABLE "CoachMemory" ADD COLUMN IF NOT EXISTS "goalKey" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "CoachMemory" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "CoachMemory_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "CoachMemory_userId_goalKey_key" ON "CoachMemory"("userId", "goalKey");
CREATE INDEX IF NOT EXISTS "CoachMemory_userId_isActive_idx" ON "CoachMemory"("userId", "isActive");
