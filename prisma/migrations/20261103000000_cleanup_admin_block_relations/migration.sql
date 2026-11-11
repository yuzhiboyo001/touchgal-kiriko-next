-- 普通用户/创作者不能拉黑管理员或超级管理员，清理历史遗留关系。
DELETE FROM "user_block_relation" AS relation
USING "user" AS blocker, "user" AS blocked
WHERE relation.blocker_id = blocker.id
  AND relation.blocked_id = blocked.id
  AND blocker.role <= 2
  AND blocked.role >= 3;
