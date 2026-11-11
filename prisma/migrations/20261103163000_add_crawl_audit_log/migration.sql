CREATE TABLE "crawl_audit_log" (
  "id" SERIAL NOT NULL,
  "ranking_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "trigger_source" TEXT NOT NULL DEFAULT 'internal',
  "started_at" TIMESTAMP(3) NOT NULL,
  "finished_at" TIMESTAMP(3),
  "duration_ms" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crawl_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "crawl_audit_log_ranking_type_created_at_idx"
  ON "crawl_audit_log"("ranking_type", "created_at");
