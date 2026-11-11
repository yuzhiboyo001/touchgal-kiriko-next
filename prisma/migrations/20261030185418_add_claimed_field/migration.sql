-- DropIndex
DROP INDEX "patch_released_idx";

-- AlterTable
ALTER TABLE "kiriko_user_task" ADD COLUMN     "claimed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "patch_released_idx" ON "patch"("released" text_pattern_ops);
