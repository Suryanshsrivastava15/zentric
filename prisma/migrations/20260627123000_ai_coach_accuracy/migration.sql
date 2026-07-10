-- AlterTable
ALTER TABLE "CoachMemory" ADD COLUMN "skillLevel" TEXT;
ALTER TABLE "CoachMemory" ADD COLUMN "targetDeadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CoachRecommendationFeedback" (
    "id" TEXT NOT NULL,
    "recommendationTitle" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CoachRecommendationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachRecommendationFeedback_userId_createdAt_idx" ON "CoachRecommendationFeedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachRecommendationFeedback_userId_rating_idx" ON "CoachRecommendationFeedback"("userId", "rating");

-- AddForeignKey
ALTER TABLE "CoachRecommendationFeedback" ADD CONSTRAINT "CoachRecommendationFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
