-- 用 completed_at 作为任务完成状态，删除冗余的 completed boolean。
-- 先把旧数据补齐，避免已完成但 completed_at 为空的任务丢失状态。
UPDATE "kiriko_user_task"
SET "completed_at" = COALESCE("completed_at", NOW())
WHERE "completed" = TRUE
  AND "completed_at" IS NULL;

ALTER TABLE "kiriko_user_task"
DROP COLUMN "completed";
