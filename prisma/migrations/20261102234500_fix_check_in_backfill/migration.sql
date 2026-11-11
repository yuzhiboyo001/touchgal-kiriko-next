-- 修正上一迁移用 NOW() 写入 last_check_in_date 造成的时区偏移。
-- Prisma 的 timestamp without time zone 按 UTC 读写，因此这里存北京时间当天 00:00 对应的 UTC 时刻。
UPDATE "user"
SET "last_check_in_date" =
  date_trunc('day', NOW() AT TIME ZONE 'Asia/Shanghai') - INTERVAL '8 hours'
WHERE "daily_check_in" = 1;
