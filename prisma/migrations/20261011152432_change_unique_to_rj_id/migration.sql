/*
  Warnings:

  - A unique constraint covering the columns `[ranking_type,rj_id]` on the table `dlsite_ranking` will be added. If there are existing duplicate values, this will fail.
  - Made the column `rj_id` on table `dlsite_ranking` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "dlsite_ranking_ranking_type_rank_key";

-- DropIndex
DROP INDEX "patch_released_idx";

-- AlterTable
ALTER TABLE "dlsite_ranking" ALTER COLUMN "rj_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "dlsite_ranking_ranking_type_rj_id_key" ON "dlsite_ranking"("ranking_type", "rj_id");

-- CreateIndex
CREATE INDEX "patch_released_idx" ON "patch"("released" text_pattern_ops);
