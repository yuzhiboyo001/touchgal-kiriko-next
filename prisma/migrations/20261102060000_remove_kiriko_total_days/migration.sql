-- 认识天数由 first_chat_at 实时计算，删除冗余的 total_days。
ALTER TABLE "kiriko_profile"
DROP COLUMN "total_days";
