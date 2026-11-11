"""安全清理 R2 中不再被排行榜数据库引用的封面。

默认 dry-run，只报告，不删除。

真正删除需要同时满足：
  --delete
  --prune-db

--prune-db 会先删除超过保留期、已经不再被爬虫更新的 dlsite_ranking 行，
再删除没有数据库引用的 ranking/ 对象。

示例：
  python cleanup_ranking_covers.py
  python cleanup_ranking_covers.py --retention-days 30
  python cleanup_ranking_covers.py --delete --prune-db
  python cleanup_ranking_covers.py --delete --prune-db --force
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

import psycopg2

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from config import load_env_files  # noqa: E402
from r2_storage import _env, _ranking_prefix, get_r2_client  # noqa: E402

load_env_files()

DEFAULT_RETENTION_DAYS = 30
DELETE_BATCH_SIZE = 1000


def database_url() -> str:
    url = os.environ.get("KUN_DATABASE_URL", "").replace("?schema=public", "")
    if not url:
        raise RuntimeError("KUN_DATABASE_URL 未配置")
    return url


def referenced_covers(cutoff: datetime) -> set[str]:
    conn = psycopg2.connect(database_url())
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT cover_local
                FROM dlsite_ranking
                WHERE cover_local IS NOT NULL
                  AND cover_local <> ''
                  AND crawled_at >= %s
                """,
                (cutoff,),
            )
            return {
                Path(str(row[0])).name
                for row in cur.fetchall()
                if row and row[0]
            }
    finally:
        conn.close()


def stale_row_count(cutoff: datetime) -> int:
    conn = psycopg2.connect(database_url())
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT count(*) FROM dlsite_ranking WHERE crawled_at < %s",
                (cutoff,),
            )
            row = cur.fetchone()
            return int(row[0]) if row else 0
    finally:
        conn.close()


def prune_stale_rows(cutoff: datetime) -> int:
    conn = psycopg2.connect(database_url())
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM dlsite_ranking WHERE crawled_at < %s",
                (cutoff,),
            )
            count = cur.rowcount
        conn.commit()
        return count
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def r2_objects(client, prefix: str) -> Iterable[dict]:
    token = None
    while True:
        kwargs = {"Bucket": _env("R2_BUCKET", "kiriko-images"), "Prefix": prefix}
        if token:
            kwargs["ContinuationToken"] = token
        page = client.list_objects_v2(**kwargs)
        yield from page.get("Contents", [])
        if not page.get("IsTruncated"):
            return
        token = page.get("NextContinuationToken")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--delete",
        action="store_true",
        help="真正删除；不传则只 dry-run",
    )
    parser.add_argument(
        "--prune-db",
        action="store_true",
        help="删除超过保留期的 dlsite_ranking 旧行（删除 R2 时必须一起使用）",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="忽略保留期，仅用于确认过的紧急清理",
    )
    parser.add_argument(
        "--retention-days",
        type=int,
        default=DEFAULT_RETENTION_DAYS,
        help="对象至少保留多少天，默认 30",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="最多处理多少个孤儿对象，0 表示不限制",
    )
    args = parser.parse_args()

    if args.retention_days < 1:
        raise SystemExit("--retention-days 必须大于 0")
    if args.delete and not args.prune_db:
        raise SystemExit("安全限制：--delete 必须同时传 --prune-db")

    client = get_r2_client()
    if client is None:
        raise SystemExit("R2 未配置，无法执行")

    prefix = _ranking_prefix()
    cutoff = datetime.now(timezone.utc) - timedelta(days=args.retention_days)
    stale_rows = stale_row_count(cutoff)
    referenced = referenced_covers(cutoff)

    orphans: list[dict] = []
    total = 0
    for obj in r2_objects(client, prefix):
        total += 1
        key = str(obj.get("Key", ""))
        if not key.startswith(prefix):
            continue
        filename = key[len(prefix) :]
        if filename in referenced:
            continue
        modified = obj.get("LastModified")
        if not args.force and modified and modified > cutoff:
            continue
        orphans.append(obj)
        if args.limit and len(orphans) >= args.limit:
            break

    print(f"prefix: {prefix}")
    print(f"R2 对象总数: {total}")
    print(f"数据库近期引用数: {len(referenced)}")
    print(f"数据库过期行数: {stale_rows}")
    print(f"待清理 R2 孤儿数: {len(orphans)}")
    print(
        "待清理 R2 大小: "
        f"{sum(int(o.get('Size', 0)) for o in orphans) / 1024 / 1024:.2f} MB"
    )
    for obj in orphans[:20]:
        print(f"  - {obj.get('Key')} ({int(obj.get('Size', 0))} bytes)")

    if not args.delete:
        print("dry-run：没有删除任何对象。确认后加 --delete --prune-db。")
        return

    deleted_rows = prune_stale_rows(cutoff)
    print(f"已删除过期排行榜行: {deleted_rows}")

    if not orphans:
        return

    bucket = _env("R2_BUCKET", "kiriko-images")
    deleted = 0
    for start in range(0, len(orphans), DELETE_BATCH_SIZE):
        batch = orphans[start : start + DELETE_BATCH_SIZE]
        keys = [{"Key": o["Key"]} for o in batch if o.get("Key")]
        if not keys:
            continue
        response = client.delete_objects(
            Bucket=bucket,
            Delete={"Objects": keys, "Quiet": True},
        )
        errors = response.get("Errors", [])
        deleted += len(keys) - len(errors)
        for error in errors:
            print(f"删除失败: {error.get('Key')} {error.get('Message')}")
    print(f"已删除 R2 对象: {deleted}")


if __name__ == "__main__":
    main()
