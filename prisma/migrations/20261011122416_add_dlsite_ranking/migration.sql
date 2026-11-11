-- DropIndex
DROP INDEX "patch_released_idx";

-- CreateTable
CREATE TABLE "dlsite_ranking" (
    "id" SERIAL NOT NULL,
    "ranking_type" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "rj_id" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "release_date" TEXT,
    "cover_url" TEXT,
    "cover_local" TEXT,
    "rating" TEXT,
    "dl_count" TEXT,
    "work_url" TEXT,
    "tags" TEXT,
    "crawled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dlsite_ranking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dlsite_ranking_ranking_type_rank_idx" ON "dlsite_ranking"("ranking_type", "rank");

-- CreateIndex
CREATE INDEX "dlsite_ranking_rj_id_idx" ON "dlsite_ranking"("rj_id");

-- CreateIndex
CREATE UNIQUE INDEX "dlsite_ranking_ranking_type_rank_key" ON "dlsite_ranking"("ranking_type", "rank");

-- CreateIndex
CREATE INDEX "patch_released_idx" ON "patch"("released" text_pattern_ops);
