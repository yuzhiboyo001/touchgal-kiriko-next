-- 一次性修复 patch_tag.count 与真实关系数量不一致的问题。
-- 执行前建议先备份数据库。

UPDATE "patch_tag" AS t
SET "count" = (
  SELECT COUNT(*)::int
  FROM "patch_tag_relation" AS r
  WHERE r."tag_id" = t."id"
);

-- 检查是否还有不一致（应返回 0 行）
SELECT t."id", t."name", t."count", COUNT(r."id") AS real_count
FROM "patch_tag" AS t
LEFT JOIN "patch_tag_relation" AS r ON r."tag_id" = t."id"
GROUP BY t."id", t."name", t."count"
HAVING t."count" <> COUNT(r."id");
