/*
  Warnings:

  - You are about to drop the column `achievements` on the `kiriko_profile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "patch_released_idx";

-- AlterTable
ALTER TABLE "kiriko_profile" DROP COLUMN "achievements",
ADD COLUMN     "chat_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_chat_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "kiriko_achievement" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kiriko_achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kiriko_achievement_user_id_idx" ON "kiriko_achievement"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "kiriko_achievement_user_id_achievement_id_key" ON "kiriko_achievement"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "patch_released_idx" ON "patch"("released" text_pattern_ops);

-- AddForeignKey
ALTER TABLE "kiriko_achievement" ADD CONSTRAINT "kiriko_achievement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
