-- 拉黑时清理双向关注关系，同时修复历史遗留数据。
DELETE FROM "user_follow_relation" AS follow
USING "user_block_relation" AS block
WHERE (
    follow.follower_id = block.blocker_id
    AND follow.following_id = block.blocked_id
  )
  OR (
    follow.follower_id = block.blocked_id
    AND follow.following_id = block.blocker_id
  );
