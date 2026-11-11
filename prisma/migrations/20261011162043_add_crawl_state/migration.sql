-- DropIndex
DROP INDEX "patch_released_idx";

-- CreateTable
CREATE TABLE "crawl_state" (
    "ranking_type" TEXT NOT NULL,
    "interval_sec" INTEGER NOT NULL,
    "last_crawl_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_crawl_at" TIMESTAMP(3) NOT NULL,
    "last_status" TEXT NOT NULL DEFAULT 'success',
    "last_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_state_pkey" PRIMARY KEY ("ranking_type")
);

-- CreateIndex
CREATE INDEX "patch_released_idx" ON "patch"("released" text_pattern_ops);
