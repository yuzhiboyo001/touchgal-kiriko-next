# crawler.py
"""
DLsite 排行榜爬虫（v7 - 中文标签版）
- 5 个榜单独立入口
- 强制请求中文版 (locale=zh_CN) 获取中文标签
- 每榜爬前 MAX_RANK 名
- 图片：<source srcset> 优先
- 自动去重：标签去重，防止一个作品塞 20 个相同标签
"""
import os
import re
import json
import sys
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

import requests
from scrapling.fetchers import StealthyFetcher

# ✅ psycopg3 优先，psycopg2 兜底
try:
    import psycopg

    DB_DRIVER = "psycopg3"
except ImportError:
    try:
        import psycopg2

        DB_DRIVER = "psycopg2"
    except ImportError:
        DB_DRIVER = None

try:
    from config import KIRIKO_CRAWLER_CONFIG, load_env_files

    load_env_files()
except Exception:
    KIRIKO_CRAWLER_CONFIG = {}

try:
    from r2_storage import (
        ranking_cover_exists,
        ranking_cover_key,
        upload_bytes_to_r2,
    )
except Exception:
    ranking_cover_exists = None
    ranking_cover_key = None
    upload_bytes_to_r2 = None

logger = logging.getLogger("crawler")
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# ==================== 全局配置 ====================

DATABASE_URL = os.environ.get("KUN_DATABASE_URL", "").replace("?schema=public", "")
CRAWLER_PROXY = os.environ.get("CRAWLER_PROXY", "").strip()

MAX_RANK = int(KIRIKO_CRAWLER_CONFIG.get("maxRank", 100))
IMAGE_DOWNLOAD_INTERVAL = 0.5
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 5
MAX_CRAWL_ROUNDS = int(KIRIKO_CRAWLER_CONFIG.get("maxRounds", 2))
MAX_IMAGE_BYTES = int(KIRIKO_CRAWLER_CONFIG.get("imageMaxBytes", 5 * 1024 * 1024))

# ✅ 关键修改：加上 ?locale=zh_CN 强制 DLsite 返回中文界面（中文标签）
# 注意：有的榜单后缀可能是 ?category=game，参数拼接需要用 &
RANKING_URLS = {
    "daily": "https://www.dlsite.com/maniax/ranking/day?category=game&locale=zh_CN",
    "weekly": "https://www.dlsite.com/maniax/ranking/week?category=game&locale=zh_CN",
    "monthly": "https://www.dlsite.com/maniax/ranking/month?category=game&locale=zh_CN",
    "yearly": "https://www.dlsite.com/maniax/ranking/year?category=game&locale=zh_CN",
    "total": "https://www.dlsite.com/maniax/ranking/total?category=game&locale=zh_CN",
}

# ✅ 各榜爬取间隔（秒），来自 config/kiriko.json
CRAWL_INTERVALS_SEC = {
    key: int(value)
    for key, value in KIRIKO_CRAWLER_CONFIG.get(
        "intervals",
        {
            "daily": 3600,
            "weekly": 10800,
            "monthly": 86400,
            "yearly": 604800,
            "total": 604800,
        },
    ).items()
}


# ==================== 字符串清洗 ====================

def _safe_str(s) -> Optional[str]:
    if s is None:
        return None
    if isinstance(s, bytes):
        try:
            return s.decode("utf-8")
        except UnicodeDecodeError:
            return s.decode("utf-8", errors="ignore")
    if not isinstance(s, str):
        s = str(s)
    return s.encode("utf-8", errors="ignore").decode("utf-8")


# ==================== 图片下载 ====================

def download_image(url: str, rj_id: Optional[str] = None) -> Optional[str]:
    if not url:
        return None

    try:
        if url.startswith("//"):
            url = "https:" + url
        elif url.startswith("/"):
            url = "https://www.dlsite.com" + url

        url = url.strip().replace("\n", "").replace("\r", "").replace("\t", "")

        if not rj_id:
            rj_match = re.search(r"(RJ\d+)", url)
            if not rj_match:
                logger.warning(f"⚠️ 无法提取 RJ 号: {url[:100]}")
                return None
            rj_id = rj_match.group(1)

        filename = f"{rj_id}.webp"

        # R2 已有该 RJ 封面：不再下载、不再上传
        if ranking_cover_exists is not None and ranking_cover_exists(filename):
            logger.info(f"♻️ 跳过（R2 已存在）: {filename}")
            return filename

        proxies = (
            {"http": CRAWLER_PROXY, "https": CRAWLER_PROXY}
            if CRAWLER_PROXY
            else None
        )
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Referer": "https://www.dlsite.com/",
        }

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                r = requests.get(url, proxies=proxies, headers=headers, timeout=30)

                if r.status_code in (403, 429):
                    wait = RETRY_BACKOFF_BASE * (2 ** (attempt - 1))
                    logger.warning(f"⚠️ 图片 {rj_id} 被限 {r.status_code}，{wait}s 后重试 ({attempt}/{MAX_RETRIES})")
                    time.sleep(wait)
                    continue

                r.raise_for_status()
                content = r.content
                if len(content) > MAX_IMAGE_BYTES:
                    logger.warning(f"⚠️ 图片过大，跳过: {filename} ({len(content)} bytes)")
                    return None

                if upload_bytes_to_r2 is None or ranking_cover_key is None:
                    logger.warning("⚠️ R2 未配置，跳过封面上传")
                    return None
                uploaded = upload_bytes_to_r2(
                    content,
                    ranking_cover_key(filename),
                    content_type=r.headers.get("Content-Type", "image/webp"),
                )
                if not uploaded:
                    logger.warning(f"⚠️ R2 上传失败，跳过封面: {filename}")
                    return None

                logger.info(f"✅ 下载并上传 R2: {filename} ({len(content)} bytes)")
                return filename

            except Exception as e:
                wait = RETRY_BACKOFF_BASE * (2 ** (attempt - 1))
                logger.warning(f"⚠️ 图片 {rj_id} 第 {attempt} 次失败: {e}，{wait}s 后重试")
                time.sleep(wait)

        logger.error(f"❌ 图片下载最终失败: {url[:100]}")
        return None

    except Exception as e:
        logger.error(f"❌ download_image 异常: {e} | url={url[:100] if url else 'None'}")
        return None


# ==================== 单行解析 ====================

def _extract_cover_url(row) -> str:
    cover_url = ""
    source_el = row.css(".work_thumb source")
    if source_el:
        srcset = source_el[0].attrib.get("srcset", "").strip()
        if srcset:
            first = srcset.split(",")[0].strip().split(" ")[0].strip()
            if first and not first.startswith("data:"):
                cover_url = first

    if not cover_url:
        cover_img = row.css(".work_thumb img")
        if cover_img:
            candidate = (
                    cover_img[0].attrib.get("data-src")
                    or cover_img[0].attrib.get("src")
                    or ""
            )
            if candidate and not candidate.startswith("data:"):
                cover_url = candidate

    if cover_url.startswith("//"):
        cover_url = "https:" + cover_url

    return cover_url


def parse_row(row, idx: int) -> Optional[Dict]:
    work_link = row.css(".work_name a")
    if not work_link:
        return None

    # 注意：在中文版下，这里的 title 抓出来的大概率就是“中文标题”了！
    title = work_link[0].css("::text").get("").strip()
    work_url = work_link[0].attrib.get("href", "")
    if not title or not work_url:
        return None

    rj_match = re.search(r"(RJ\d+)", work_url)
    rj_id = rj_match.group(1) if rj_match else None
    if not rj_id:
        logger.warning(f"⚠️ 第 {idx} 行无法提取 RJ 号: {work_url}")
        return None

    maker_link = row.css(".maker_name a")
    company = maker_link[0].css("::text").get("").strip() if maker_link else ""

    cover_url = _extract_cover_url(row)

    rank_text = row.css(".rank_no::text").get("").strip()
    rank = int(rank_text) if rank_text.isdigit() else idx

    sales_date_raw = row.css(".sales_date::text").get("").strip()
    release_date = re.sub(r"发售日[:：\s]*", "", sales_date_raw).strip()

    dl_count = ""
    work_dl = row.css("li.work_dl")
    if work_dl:
        full_text = "".join(work_dl[0].css("::text").getall())
        m = re.search(r"([\d,]+)", full_text)
        if m:
            dl_count = m.group(1).replace(",", "")

    rating = ""
    review = row.css("li.work_review a")
    if review:
        review_text = review[0].css("::text").get("").strip()
        rating = review_text.strip("()")

    # ✅ 关键优化：提取标签并去重
    tags = []
    for tag_a in row.css(".search_tag a"):
        t = tag_a.css("::text").get("").strip()
        if t:
            tags.append(t)

    # 使用 dict.fromkeys 去重并保持原有顺序
    tags = list(dict.fromkeys(tags))

    local_cover = ""
    if cover_url:
        local_cover = download_image(cover_url, rj_id=rj_id) or ""
        time.sleep(IMAGE_DOWNLOAD_INTERVAL)

    return {
        "ranking_type": None,
        "rank": rank,
        "rj_id": _safe_str(rj_id),
        "title": _safe_str(title),  # 这里现在大概率是中文标题了
        "company": _safe_str(company),
        "release_date": _safe_str(release_date),
        "cover_url": _safe_str(cover_url),
        "cover_local": _safe_str(local_cover),
        "rating": _safe_str(rating),
        "dl_count": _safe_str(dl_count),
        "work_url": _safe_str(work_url),
        "tags": _safe_str(",".join(tags)),  # 这里现在大概率是中文标签了
    }


# ==================== 抓取榜单页 ====================

def fetch_ranking_page(url: str, ranking_type: str):
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"🕷️ 抓取 {ranking_type} 中文版 (第 {attempt} 次): {url}")
            page = StealthyFetcher.fetch(
                url=url,
                google_search=False,
                real_chrome=True,
                headless=True,
                network_idle=True,
                proxy={"server": CRAWLER_PROXY} if CRAWLER_PROXY else None,
                wait_selector="tbody tr",
                timeout=60000,
            )

            if page is None:
                raise RuntimeError("page 为空")

            return page

        except Exception as e:
            last_err = e
            wait = RETRY_BACKOFF_BASE * (2 ** (attempt - 1))
            logger.warning(
                f"⚠️ {ranking_type} 第 {attempt} 次抓取失败: {e}，{wait}s 后重试"
            )
            if attempt < MAX_RETRIES:
                time.sleep(wait)

    raise RuntimeError(f"{ranking_type} 抓取最终失败: {last_err}")


def parse_page(page, ranking_type: str) -> List[Dict]:
    rows = page.css("tbody tr")
    logger.info(f"📄 {ranking_type} 找到 {len(rows)} 行，只取前 {MAX_RANK} 行")

    items = []
    for idx, row in enumerate(rows[:MAX_RANK], 1):
        try:
            item = parse_row(row, idx)
            if not item:
                continue
            item["ranking_type"] = ranking_type
            items.append(item)
        except Exception as e:
            logger.error(f"❌ {ranking_type} 第 {idx} 行解析失败: {e}")

    with_cover = sum(1 for it in items if it.get("cover_local"))
    logger.info(f"✅ {ranking_type} 解析 {len(items)} 条（带图 {with_cover} / 缺图 {len(items) - with_cover}）")
    return items


# ==================== 数据库连接与保存 ====================

def _parse_dsn(dsn: str) -> Optional[Dict]:
    m = re.match(
        r"postgresql://(?P<user>[^:]+):(?P<pwd>[^@]+)@(?P<host>[^:]+):(?P<port>\d+)/(?P<db>[^?]+)",
        dsn,
    )
    if not m:
        return None
    cfg = m.groupdict()
    cfg["port"] = int(cfg["port"])
    return cfg


def _connect_db(cfg: Dict):
    common = dict(
        host=cfg["host"],
        port=cfg["port"],
        dbname=cfg["db"],
        user=cfg["user"],
        password=cfg["pwd"],
        client_encoding="UTF8",
    )
    if DB_DRIVER == "psycopg3":
        import psycopg
        logger.info("🔌 使用 psycopg3 连接")
        return psycopg.connect(**common)
    elif DB_DRIVER == "psycopg2":
        import psycopg2
        logger.info("🔌 使用 psycopg2 连接")
        return psycopg2.connect(**common)
    else:
        raise RuntimeError("未安装 psycopg 或 psycopg2")


def write_crawl_audit(
    ranking_type: str,
    status: str,
    count: int,
    error: Optional[str],
    started_at: float,
    finished_at: float,
    trigger_source: str = "internal",
) -> None:
    """写入爬虫任务审计；审计失败不影响业务。"""
    if not DATABASE_URL or DB_DRIVER is None:
        return
    cfg = _parse_dsn(DATABASE_URL)
    if not cfg:
        return
    conn = None
    try:
        conn = _connect_db(cfg)
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO crawl_audit_log
                  (ranking_type, status, count, error, trigger_source,
                   started_at, finished_at, duration_ms)
                VALUES (%s, %s, %s, %s, %s, to_timestamp(%s), to_timestamp(%s), %s)
                """,
                (
                    ranking_type,
                    status,
                    count,
                    (error or "")[:2000] or None,
                    trigger_source,
                    started_at,
                    finished_at,
                    int((finished_at - started_at) * 1000),
                ),
            )
        conn.commit()
    except Exception as exc:
        logger.warning(f"⚠️ 爬虫审计写入失败: {exc}")
        if conn is not None:
            try:
                conn.rollback()
            except Exception:
                pass
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


INSERT_SQL = """
             INSERT INTO dlsite_ranking
             (ranking_type, rank, rj_id, title, company, release_date,
              cover_url, cover_local, rating, dl_count, work_url, tags, crawled_at)
             VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()) ON CONFLICT (ranking_type, rj_id) DO \
             UPDATE SET
                 rank = EXCLUDED.rank, \
                 title = EXCLUDED.title, \
                 company = EXCLUDED.company, \
                 release_date = EXCLUDED.release_date, \
                 cover_url = EXCLUDED.cover_url, \
                 cover_local = EXCLUDED.cover_local, \
                 rating = EXCLUDED.rating, \
                 dl_count = EXCLUDED.dl_count, \
                 work_url = EXCLUDED.work_url, \
                 tags = EXCLUDED.tags, \
                 crawled_at = NOW() \
             """


def save_to_db(items: List[Dict]) -> int:
    if not DATABASE_URL:
        logger.warning("⚠️ DATABASE_URL 未配置，跳过写数据库")
        return 0
    if not items:
        logger.warning("⚠️ 没有数据可写")
        return 0
    if DB_DRIVER is None:
        logger.error("❌ 未安装 psycopg 或 psycopg2，跳过写数据库")
        return 0

    cfg = _parse_dsn(DATABASE_URL)
    if not cfg:
        logger.error(f"❌ DATABASE_URL 格式不对: {DATABASE_URL[:50]}")
        return 0

    try:
        conn = _connect_db(cfg)
    except Exception as e:
        logger.error(f"❌ 数据库连接失败: {type(e).__name__}: {e}")
        return 0

    cur = conn.cursor()
    success = 0
    failed = 0

    # ================= 新增：清理旧数据 =================
    rtype = items[0]["ranking_type"] if items else "unknown"
    if rtype != "unknown":
        try:
            # 直接删掉这个榜单类型的所有旧记录
            cur.execute("DELETE FROM dlsite_ranking WHERE ranking_type = %s", (rtype,))
            logger.info(f"🧹 已清空数据库中旧的 {rtype} 数据")
        except Exception as e:
            logger.error(f"❌ 清空旧数据失败: {e}")
            conn.rollback()
            cur.close()
            conn.close()
            return 0
    # ====================================================

    for item in items:
        try:
            cur.execute("SAVEPOINT sp1")
        except Exception:
            try:
                conn.rollback()
                cur.execute("SAVEPOINT sp1")
            except Exception as e2:
                logger.error(f"❌ SAVEPOINT 失败: {e2}")
                continue

        try:
            cur.execute(INSERT_SQL, (
                _safe_str(item["ranking_type"]),
                item["rank"],
                _safe_str(item["rj_id"]),
                _safe_str(item["title"]),
                _safe_str(item["company"]),
                _safe_str(item["release_date"]),
                _safe_str(item["cover_url"]),
                _safe_str(item["cover_local"]),
                _safe_str(item["rating"]),
                _safe_str(item["dl_count"]),
                _safe_str(item["work_url"]),
                _safe_str(item["tags"]),
            ))
            cur.execute("RELEASE SAVEPOINT sp1")
            success += 1
        except Exception as e:
            logger.error(f"❌ 写入 rank={item.get('rank')} 失败: {type(e).__name__}: {e}")
            try:
                cur.execute("ROLLBACK TO SAVEPOINT sp1")
            except Exception:
                pass
            failed += 1

    try:
        conn.commit()
    except Exception as e:
        logger.error(f"❌ commit 失败: {type(e).__name__}: {e}")

    cur.close()
    conn.close()

    logger.info(f"✅ 写入 {success} 条 {rtype} 数据（失败 {failed} 条）")
    return success


# ==================== 更新爬虫状态 ====================

def is_crawl_due(ranking_type: str, force: bool = False) -> bool:
    """是否已到下一次爬取时间；force 用于手动强制。"""
    if force:
        return True
    if not DATABASE_URL:
        return True
    cfg = _parse_dsn(DATABASE_URL)
    if not cfg:
        return True

    conn = None
    try:
        conn = _connect_db(cfg)
        with conn.cursor() as cur:
            cur.execute(
                "SELECT next_crawl_at FROM crawl_state WHERE ranking_type = %s",
                (ranking_type,),
            )
            row = cur.fetchone()
        if not row or not row[0]:
            return True
        next_run = row[0]
        if next_run.tzinfo is not None:
            next_run = next_run.astimezone(timezone.utc).replace(tzinfo=None)
        return next_run <= datetime.now(timezone.utc).replace(tzinfo=None)
    except Exception as exc:
        logger.warning(f"⚠️ 读取 crawl_state 失败，默认允许执行: {exc}")
        return True
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


def update_crawl_state(
        ranking_type: str,
        success: bool,
        count: int = 0,
        error: Optional[str] = None,
):
    if not DATABASE_URL:
        return

    cfg = _parse_dsn(DATABASE_URL)
    if not cfg:
        return

    interval_sec = CRAWL_INTERVALS_SEC.get(ranking_type, 3600)

    try:
        conn = _connect_db(cfg)
        cur = conn.cursor()
        cur.execute("""
                    INSERT INTO crawl_state
                    (ranking_type, interval_sec, last_crawl_at, next_crawl_at,
                     last_status, last_count, last_error, updated_at)
                    VALUES (%s, %s,
                            NOW() AT TIME ZONE 'UTC',
                            NOW() AT TIME ZONE 'UTC' + INTERVAL '1 second' * %s,
                            %s, %s, %s,
                            NOW() AT TIME ZONE 'UTC') ON CONFLICT (ranking_type) DO
                    UPDATE SET
                        interval_sec = EXCLUDED.interval_sec,
                        last_crawl_at = NOW() AT TIME ZONE 'UTC',
                        next_crawl_at = NOW() AT TIME ZONE 'UTC'
                        + INTERVAL '1 second' * EXCLUDED.interval_sec,
                        last_status = EXCLUDED.last_status,
                        last_count = EXCLUDED.last_count,
                        last_error = EXCLUDED.last_error,
                        updated_at = NOW() AT TIME ZONE 'UTC'
                    """, (
                        ranking_type,
                        interval_sec,
                        interval_sec,
                        "success" if success else "failed",
                        count,
                        error,
                    ))
        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"📝 crawl_state 已更新: {ranking_type} ({'success' if success else 'failed'}, count={count})")
    except Exception as e:
        logger.warning(f"⚠️ crawl_state 更新失败: {e}")


# ==================== 核心：爬单个榜单 ====================

def _crawl_one(ranking_type: str) -> int:
    if ranking_type not in RANKING_URLS:
        logger.error(f"❌ 未知榜单类型: {ranking_type}")
        return 0

    url = RANKING_URLS[ranking_type]
    logger.info(f"🚀 开始爬 {ranking_type}")

    best_items: List[Dict] = []
    written = 0

    for round_no in range(1, MAX_CRAWL_ROUNDS + 1):
        try:
            logger.info(f"🔄 {ranking_type} 第 {round_no} / {MAX_CRAWL_ROUNDS} 轮")
            page = fetch_ranking_page(url, ranking_type)
            items = parse_page(page, ranking_type)

            if not items:
                logger.warning(f"⚠️ {ranking_type} 第 {round_no} 轮无数据")
                break

            if not best_items:
                best_items = items
            else:
                with_cover_new = sum(1 for it in items if it.get("cover_local"))
                with_cover_old = sum(1 for it in best_items if it.get("cover_local"))
                if with_cover_new > with_cover_old:
                    logger.info(f"🔄 第 {round_no} 轮带图更多（{with_cover_new} > {with_cover_old}），替换")
                    best_items = items
                else:
                    logger.info(f"🔄 第 {round_no} 轮带图 {with_cover_new} 条，不如上一轮 {with_cover_old} 条，保留上一轮")

            written = save_to_db(best_items)

            missing = [it for it in best_items if not it.get("cover_local")]
            if not missing:
                logger.info(f"✅ {ranking_type} 第 {round_no} 轮全部有图，收工")
                break
            elif round_no < MAX_CRAWL_ROUNDS:
                logger.warning(f"⚠️ {ranking_type} 第 {round_no} 轮还有 {len(missing)} 条缺图，继续下一轮")
                time.sleep(3)
            else:
                logger.warning(f"⚠️ {ranking_type} 达到最大轮数 {MAX_CRAWL_ROUNDS}，仍有 {len(missing)} 条缺图")

        except Exception as e:
            logger.error(f"❌ {ranking_type} 第 {round_no} 轮失败: {type(e).__name__}: {e}")

    success = written > 0 and len(best_items) > 0
    error_msg = None if success else "写入 0 条"
    update_crawl_state(ranking_type, success=success, count=written, error=error_msg)

    logger.info(f"✅ {ranking_type} 完成，共 {len(best_items)} 条")
    return written


# ==================== 5 个独立入口 ====================

def crawl_daily() -> int:
    return _crawl_one("daily")


def crawl_weekly() -> int:
    return _crawl_one("weekly")


def crawl_monthly() -> int:
    return _crawl_one("monthly")


def crawl_yearly() -> int:
    return _crawl_one("yearly")


def crawl_total() -> int:
    return _crawl_one("total")


# ==================== 本地测试 ====================

if __name__ == "__main__":
    import sys

    rtype = sys.argv[1] if len(sys.argv) > 1 else "daily"

    print(f"\n🚀 测试爬取: {rtype}")
    print(f"🔧 DB 驱动: {DB_DRIVER}")
    print(f"📊 每榜上限: {MAX_RANK}")
    print(f"🔄 最大轮数: {MAX_CRAWL_ROUNDS}\n")

    count = _crawl_one(rtype)
    print(f"\n✅ 共写入 {count} 条\n")