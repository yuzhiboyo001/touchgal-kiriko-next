"""看板娘购买历史：Python 直连 PostgreSQL + 连接池 + 可选短缓存。

购买历史写入仍然由 Next 的 purchaseItems() 负责。
Python 只读，不在这里扣款或改数据。
"""

import os
import time
import logging
import threading
from typing import Any

logger = logging.getLogger("gal_llm_api")

# 默认不缓存：看板娘每次回复前都读取最新购买历史。
# 如需降低 DB 压力，可显式设置 PURCHASE_HISTORY_CACHE_SECONDS=1~5。
CACHE_TTL_SECONDS = int(os.getenv("PURCHASE_HISTORY_CACHE_SECONDS", "0"))
POOL_MIN_CONN = int(os.getenv("PURCHASE_HISTORY_POOL_MIN", "1"))
POOL_MAX_CONN = int(os.getenv("PURCHASE_HISTORY_POOL_MAX", "5"))

_cache: dict[int, tuple[float, list[dict[str, Any]]]] = {}
_pool = None
_pool_url = ""
_pool_lock = threading.Lock()


def _database_url() -> str:
    return os.getenv("KUN_DATABASE_URL", "").replace("?schema=public", "")


def _get_pool():
    """延迟创建 psycopg2 线程安全连接池。"""
    global _pool, _pool_url

    url = _database_url()
    if not url:
        return None

    with _pool_lock:
        if _pool is None or _pool_url != url:
            from psycopg2.pool import ThreadedConnectionPool

            if _pool is not None:
                _pool.closeall()
            _pool = ThreadedConnectionPool(POOL_MIN_CONN, POOL_MAX_CONN, url)
            _pool_url = url
        return _pool


def _load_from_db(user_id: int) -> list[dict[str, Any]] | None:
    pool = _get_pool()
    if pool is None:
        return None

    conn = None
    failed = False
    try:
        conn = pool.getconn()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT purchase_history
                FROM kiriko_profile
                WHERE user_id = %s
                """,
                (user_id,),
            )
            row = cur.fetchone()
        conn.commit()

        if not row or not row[0]:
            return []

        raw = row[0]
        purchases = raw.get("purchases", []) if isinstance(raw, dict) else []
        return purchases if isinstance(purchases, list) else []
    except Exception as exc:
        failed = True
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
        logger.warning("purchase_history: 读取数据库失败: %s", exc)
        return None
    finally:
        if conn is not None:
            try:
                pool.putconn(conn, close=failed or conn.closed != 0)
            except Exception:
                pass


def get_purchase_history(user_id: str | int) -> list[dict[str, Any]] | None:
    """返回 None 表示读取失败，调用方按空历史降级。"""
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        return None

    now = time.monotonic()
    cached = _cache.get(uid)
    if cached and cached[0] > now:
        return cached[1]

    purchases = _load_from_db(uid)
    if purchases is not None and CACHE_TTL_SECONDS > 0:
        _cache[uid] = (now + CACHE_TTL_SECONDS, purchases)
    return purchases


def invalidate_purchase_history(user_id: str | int) -> None:
    try:
        _cache.pop(int(user_id), None)
    except (TypeError, ValueError):
        pass
