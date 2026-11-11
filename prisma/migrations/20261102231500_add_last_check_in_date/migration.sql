-- 签到改为按北京日期判断，不再只依赖 cron 重置 daily_check_in。
ALTER TABLE "user"
ADD COLUMN "last_check_in_date" TIMESTAMP(3);

-- 迁移时把今天已经签到的用户标记为今天，避免修复后当天重复签到。
UPDATE "user"
SET "last_check_in_date" = NOW()
WHERE "daily_check_in" = 1;
