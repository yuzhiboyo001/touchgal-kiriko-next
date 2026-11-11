-- PostgreSQL 16 / pg_stat_statements
-- 前置条件：postgresql.conf 或 postgresql.auto.conf 已设置
--   shared_preload_libraries = 'pg_stat_statements'
-- 并已重启 PostgreSQL。
--
-- 本地 Windows 重启（管理员 PowerShell）：
--   Restart-Service postgresql-x64-16
--
-- 执行：
--   psql "$KUN_DATABASE_URL" -f scripts/pgStatStatements.sql

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 记录 PL/pgSQL 函数内部语句；需要 reload，不需要重启
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.track_utility = on;
SELECT pg_reload_conf();

-- 检查是否生效
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname = 'pg_stat_statements';

SHOW shared_preload_libraries;
SHOW pg_stat_statements.track;

-- 查看总耗时最高的 SQL
SELECT
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2)
    AS total_pct,
  rows,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- 查看单次平均耗时最高的 SQL（至少执行 10 次）
SELECT
  calls,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(max_exec_time::numeric, 2) AS max_ms,
  rows,
  query
FROM pg_stat_statements
WHERE calls >= 10
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 清空统计（例如压测前）
-- SELECT pg_stat_statements_reset();
