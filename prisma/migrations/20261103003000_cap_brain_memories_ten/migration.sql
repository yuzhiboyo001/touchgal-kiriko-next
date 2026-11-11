-- 每个用户/角色的活跃大脑记忆最多保留最新 10 条。
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, character
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM "brain_memory"
  WHERE is_active = TRUE
)
DELETE FROM "brain_memory" AS memory
USING ranked
WHERE memory.id = ranked.id
  AND ranked.rn > 10;
