# dlsite_service.py
"""
DLsite 单作品抓取（日 + 英 + 简介日译中）
- 内存 TTL 缓存（同一 RJ 1 小时内不重复调用 LLM）
- 全局并发锁（防止 2GB 内存服务器多开 Chromium OOM）
- 简介保留图文结构：图片压缩上传 R2，只把文字送 DeepSeek
"""
import os
import re
import time
import asyncio
import logging
import tempfile
from pathlib import Path
from typing import Any, Optional, Dict, Tuple

try:
    from config import load_env_files

    load_env_files()
except Exception:
    pass

from playwright.async_api import async_playwright
from lxml import html as lxml_html
from langchain_core.prompts import ChatPromptTemplate
from langchain_deepseek import ChatDeepSeek

from dlsite_description import build_description_payload
from services import get_next_deepseek_key

logger = logging.getLogger("dlsite_service")
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

CRAWLER_PROXY = os.environ.get("CRAWLER_PROXY", None)

# Windows 本地启动 uvicorn 时，系统 TEMP 可能不可写，Playwright 会在
# BrowserType.launch 阶段报 mkdtemp EPERM。统一使用项目内的 .tmp。
_TMP_DIR = Path(__file__).resolve().parent.parent / ".tmp"
try:
    _TMP_DIR.mkdir(parents=True, exist_ok=True)
    os.environ["TEMP"] = str(_TMP_DIR)
    os.environ["TMP"] = str(_TMP_DIR)
    tempfile.tempdir = str(_TMP_DIR)
except Exception as exc:
    logger.warning(f"⚠️ 无法切换 Playwright 临时目录: {exc}")

MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 3
BASE_URL = "https://www.dlsite.com/maniax/work/=/product_id/{rj}.html"
ANNOUNCE_URL = (
    "https://www.dlsite.com/maniax/announce/=/product_id/{rj}.html"
)

BLOCK_RESOURCE_TYPES = {"image", "font", "media", "stylesheet"}

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

DESC_LLM_MODEL = os.getenv("DLSITE_LLM_MODEL", "deepseek-flash").strip() or "deepseek-chat"
DESC_MAX_TOKENS = 8192

# ==================== 全局并发锁 ====================
# 限制同时进行的 DLsite 抓取任务为 1 个，防止 2GB 内存 OOM
_fetch_semaphore = asyncio.Semaphore(1)

# ==================== 内存 TTL 缓存 ====================
_desc_cache: Dict[str, Tuple[Dict, float]] = {}
CACHE_TTL = 3600
CACHE_MAX_SIZE = 200


def _get_cache(rj: str) -> Optional[Dict]:
    item = _desc_cache.get(rj)
    if not item:
        return None
    result, expire_ts = item
    if time.time() > expire_ts:
        _desc_cache.pop(rj, None)
        return None
    return result


def _set_cache(rj: str, result: Dict):
    _desc_cache[rj] = (result, time.time() + CACHE_TTL)
    if len(_desc_cache) > CACHE_MAX_SIZE:
        oldest = min(_desc_cache.items(), key=lambda x: x[1][1])[0]
        _desc_cache.pop(oldest, None)


# ==================== 工具 ====================
def _clean_text(s: Optional[str]) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def _format_release_date(raw: str) -> str:
    if not raw:
        return ""
    m = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日", raw)
    if m:
        y, mo, d = m.groups()
        return f"{y}-{int(mo):02d}-{int(d):02d}"
    return raw.strip()


# ==================== Playwright ====================
async def _fetch_html(
    url: str,
    locale: str = "ja-JP",
    announce_url: Optional[str] = None,
) -> Tuple[str, bool]:
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"🕷️ 抓取 (第 {attempt} 次): {url} [locale={locale}]")
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    proxy={"server": CRAWLER_PROXY} if CRAWLER_PROXY else None,
                )
                context = await browser.new_context(
                    user_agent=USER_AGENT,
                    locale=locale,
                    viewport={"width": 1920, "height": 1080},
                )
                page = await context.new_page()

                async def route_handler(route):
                    if route.request.resource_type in BLOCK_RESOURCE_TYPES:
                        await route.abort()
                    else:
                        await route.continue_()

                await page.route("**/*", route_handler)
                response = await page.goto(
                    url, wait_until="domcontentloaded", timeout=30000
                )
                is_announce = False

                # 已发售作品在 work 页；预告作品只有 announce 页。
                # 404 时直接切到 announce，不要白白重试三次 work。
                if (
                    response is not None
                    and response.status == 404
                    and announce_url
                ):
                    logger.info(f"📢 work 页 404，改抓预告页: {announce_url}")
                    await page.goto(
                        announce_url,
                        wait_until="domcontentloaded",
                        timeout=30000,
                    )
                    is_announce = True

                await page.wait_for_selector("#work_name", timeout=15000)
                html = await page.content()
                await browser.close()
                return html, is_announce
        except Exception as e:
            last_err = e
            wait = RETRY_BACKOFF_BASE * (2 ** (attempt - 1))
            logger.warning(f"⚠️ 第 {attempt} 次失败: {e}，{wait}s 后重试")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(wait)
    raise RuntimeError(f"抓取最终失败: {last_err}")


# ==================== 解析 ====================
def _extract_title(tree) -> str:
    els = tree.xpath('//h1[@id="work_name"]/text()')
    return _clean_text(els[0]) if els else ""


def _extract_release_date(tree) -> str:
    els = tree.xpath('//table[@id="work_outline"]//tr[1]/td/a/text()')
    if els:
        return _format_release_date(_clean_text(els[0]))
    els = tree.xpath('//table[@id="work_outline"]//tr[1]/td//text()')
    if els:
        return _format_release_date(_clean_text(" ".join(els)))
    return ""


def _extract_circle(tree) -> tuple[str, str]:
    name_els = tree.xpath('//span[@itemprop="brand"]/a/text()')
    link_els = tree.xpath('//span[@itemprop="brand"]/a/@href')
    if not name_els:
        # 预告页没有 itemprop=brand，社团在 maker 链接里
        maker_links = tree.xpath('//a[contains(@href,"maker")]')
        for link_el in maker_links:
            text = _clean_text("".join(link_el.itertext()))
            href = link_el.get("href", "").strip()
            if text:
                return text, href
    name = _clean_text(name_els[0]) if name_els else ""
    link = link_els[0].strip() if link_els else ""
    return name, link


def _extract_tags(tree) -> str:
    els = tree.xpath('//div[contains(@class, "main_genre")]/a/text()')
    tags = [_clean_text(t) for t in els if _clean_text(t)]
    return ",".join(tags)


def _extract_cover_url(tree) -> str:
    """从作品页的主封面轮播中取第一张真实图片。

    DLsite 会在懒加载/缺失时放 not_found_img_main.png，
    所以不能简单取第一个 src，必须过滤占位图。
    """
    xpaths = [
        '//*[contains(@class,"slider_item") and contains(@class,"active")]//img/@src',
        '//*[contains(@class,"slider_item") and contains(@class,"active")]//source/@srcset',
        '//*[contains(@class,"slider_item")]//img/@src',
        '//*[contains(@class,"slider_item")]//source/@srcset',
        '//meta[@property="og:image"]/@content',
    ]

    candidates: list[str] = []
    for xpath in xpaths:
        for raw in tree.xpath(xpath):
            value = str(raw).strip()
            # srcset 可能带逗号和尺寸描述，取第一项
            value = value.split(",")[0].strip().split(" ")[0].strip()
            if value.startswith("//"):
                value = "https:" + value
            elif value.startswith("/"):
                value = "https://www.dlsite.com" + value
            if not value.startswith("http"):
                continue
            lower = value.lower()
            if "not_found" in lower or "now_printing" in lower:
                continue
            if value not in candidates:
                candidates.append(value)

    if not candidates:
        return ""

    # 优先真正的 _img_main，而不是轮播里的其他素材
    for value in candidates:
        if "_img_main" in value.lower():
            return value
    return candidates[0]


def _extract_description_full(tree) -> str:
    blocks = tree.xpath(
        '//div[contains(@class,"work_parts_container")]'
        '/div[contains(@class,"work_parts") and contains(@class,"type_image")]'
    )
    sections = []
    for block in blocks:
        heading_els = block.xpath('.//h3[contains(@class,"work_parts_heading")]/text()')
        heading = _clean_text(heading_els[0]) if heading_els else ""

        paragraphs = []
        for p in block.xpath('.//div[contains(@class,"type_text")]//p'):
            tokens = []
            if p.text:
                tokens.append(('text', p.text))
            for node in p.iter():
                if node is p:
                    continue
                if node.tag == 'br':
                    tokens.append(('br',))
                if node.tail:
                    tokens.append(('text', node.tail))

            buf = []
            br_count = 0
            for tok in tokens:
                if tok[0] == 'br':
                    br_count += 1
                else:
                    if br_count > 0:
                        buf.append('\n\n' if br_count >= 2 else '\n')
                        br_count = 0
                    buf.append(tok[1])
            if br_count > 0:
                buf.append('\n\n' if br_count >= 2 else '\n')

            text = ''.join(buf)
            text = re.sub(r'[ \t]+', ' ', text)
            text = re.sub(r'\n{3,}', '\n\n', text).strip()
            if text:
                paragraphs.append(text)

        body = '\n\n'.join(paragraphs)
        if heading or body:
            section = f"【{heading}】\n\n{body}" if heading else body
            sections.append(section)

    return "\n\n".join(sections)


# ==================== 翻译 ====================
DESCRIPTION_TRANSLATE_PROMPT = """你是一名熟悉日本 ACG 文化和 Galgame 圈子的中文游戏介绍编辑。你的任务是把 DLsite 上的日文游戏介绍整理成中文玩家读起来自然、又不丢失信息的版本。

【原文结构说明】
- 以 ## 开头的行是章节标题，必须保留。
- [[IMG_001]]、[[IMG_002]] 等是图片占位符，不是文字，必须原样保留。
- 空行表示段落分隔；单换行表示同一段内换行。
- [文字](URL) 是 Markdown 链接，URL 必须原样保留，只翻译方括号里的文字。
- 以 ★、・、※ 开头的行，是小标题、列表项或注记。

【格式规则（必须遵守）】
1. ## 章节标题行必须保留，单独成行；只把标题文字翻译成中文，不要删掉 ##。
2. 图片占位符必须原样保留，单独成行；不得新增、删除、合并或移动顺序。
3. 以 ★、・、※ 开头的行，必须单独成行，保留原符号，符号后的文字翻译成中文。
4. 以 ・ 开头的列表项，逐项对应，一项一行，不要合并，不要增删项。
5. 段落之间保留空行，不要把所有段落压成一大段。
6. Markdown 链接的 URL 不得改写、不得删除；只翻译链接文字。
7. 不要输出"以下是翻译""译文："这类前言后语，不要加译注。
8. 可以适度使用 ⭐、◆、▸ 等文本符号强调章节或重点，让排版更清楚；但不要使用 emoji 表情，不要添加原文没有的章节，也不要改变原文的段落顺序、列表层级和图片顺序。

【翻译风格】
8. 这是成人向 Galgame 的介绍，允许并鼓励使用中文 Galgame 圈的自然说法（如「搾精」「H场景」「TRUE END」「二周目」「死库水」「丝袜控」等），不要生硬直译成书面语。
9. 角色名（人名）音译成中文常见角色名，如「リリア」→「莉莉亚」。只对人名做音译；社团名、作品名、品牌名保留日文原文不译；道具名、地名按原意译成中文。
10. 涉及日本文化或 Galgame 惯例的词（如「巫女服」「スク水」「オフィスルック」），优先用中文圈通用译法；没有通用译法的，意译成中文玩家能懂的表达。
11. 日式客套可以精简成中文自然语气，但不要删掉玩法信息、难度数值、注意事项。

【信息完整性】
12. 玩法、系统、难度、天数、结局数量、注意事项，一个都不能漏。
13. 图片占位符的数量必须与原文完全一致。

日文原文：
{jp_text}
"""


TITLE_TRANSLATE_PROMPT = """把下面的日文 Galgame 标题翻译成自然、简洁的中文标题。
只输出中文标题，不要引号、不要解释、不要保留日文原名。
如果标题本身是英文或无法翻译，就保留原文。

日文标题：
{title}
"""


async def _translate_title(title: str) -> str:
    if not title.strip():
        return ""
    try:
        llm = ChatDeepSeek(
            model=DESC_LLM_MODEL,
            api_key=get_next_deepseek_key("ops"),
            temperature=0.2,
            max_tokens=200,
            max_retries=1,
            extra_body={"thinking": {"type": "disabled"}},
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", TITLE_TRANSLATE_PROMPT),
        ])
        msg = prompt.format_messages(title=title)
        resp = await asyncio.get_event_loop().run_in_executor(
            None, lambda: llm.invoke(msg)
        )
        translated = _clean_text(resp.content or "")
        return translated.strip('"“”「」') if translated else ""
    except Exception as e:
        logger.warning(f"⚠️ 标题翻译失败，保留空中文标题: {e}")
        return ""


async def _translate_description(full_text: str) -> str:
    if not full_text.strip():
        return ""
    llm = ChatDeepSeek(
        model=DESC_LLM_MODEL,
        api_key=get_next_deepseek_key("ops"),
        temperature=0.3,
        max_tokens=DESC_MAX_TOKENS,
        max_retries=2,
        extra_body={"thinking": {"type": "disabled"}},
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", DESCRIPTION_TRANSLATE_PROMPT),
    ])
    try:
        msg = prompt.format_messages(jp_text=full_text)
        resp = await asyncio.get_event_loop().run_in_executor(
            None, lambda: llm.invoke(msg)
        )
        translated = (resp.content or "").strip()
        if not translated:
            logger.warning("⚠️ 简介翻译结果为空，保留日文")
            return full_text
        logger.info(f"✅ 简介翻译完成: {len(translated)} 字")
        return translated
    except Exception as e:
        logger.warning(f"⚠️ 简介翻译失败，保留日文: {e}")
        return full_text


# ==================== 主函数 ====================
async def fetch_dlsite_game(rj_code: str) -> Dict[str, Any]:
    normalized = rj_code.strip().upper()
    if not re.match(r"^(RJ|VJ)\d+$", normalized):
        raise ValueError("DLSite Code 格式不正确")

    # 1. 命中缓存直接返回
    cached = _get_cache(normalized)
    if cached:
        logger.info(f"♻️ 缓存命中: {normalized}")
        return cached

    # 2. 加锁：同一时刻只处理 1 个 RJ 的爬取，避免 2GB 内存 OOM
    async with _fetch_semaphore:
        # 双重检查：如果等待锁期间别人已经抓好了，直接拿缓存
        cached = _get_cache(normalized)
        if cached:
            logger.info(f"♻️ 锁内缓存命中: {normalized}")
            return cached

        t0 = asyncio.get_event_loop().time()
        base = BASE_URL.format(rj=normalized)
        announce = ANNOUNCE_URL.format(rj=normalized)

        # 3. 顺序抓取默认/中文/英文页面，避免 3 个 Chromium 同时吃内存
        page_started = time.perf_counter()
        html_default, is_announce = await _fetch_html(
            base,
            locale="ja-JP",
            announce_url=announce,
        )
        logger.info(
            f"⏱️ 默认页抓取完成: {time.perf_counter() - page_started:.2f}s"
        )

        zh_started = time.perf_counter()
        try:
            html_zh, _ = await _fetch_html(
                base + "/?locale=zh_CN",
                locale="zh-CN",
                announce_url=announce + "?locale=zh_CN",
            )
        except Exception as exc:
            logger.warning(f"⚠️ 中文页抓取失败: {exc}")
            html_zh = exc
        logger.info(
            f"⏱️ 中文页抓取完成: {time.perf_counter() - zh_started:.2f}s"
        )

        en_started = time.perf_counter()
        try:
            html_en, _ = await _fetch_html(
                base + "/?locale=en_US",
                locale="en-US",
                announce_url=announce + "?locale=en_US",
            )
        except Exception as exc:
            logger.warning(f"⚠️ 英文页抓取失败: {exc}")
            html_en = exc
        logger.info(
            f"⏱️ 英文页抓取完成: {time.perf_counter() - en_started:.2f}s"
        )

        # 4. 处理默认页（必须有）
        tree_default = lxml_html.fromstring(html_default)
        title_default = _extract_title(tree_default)
        release_date = _extract_release_date(tree_default)
        circle_name, circle_link = _extract_circle(tree_default)
        tags = _extract_tags(tree_default)
        cover_url = _extract_cover_url(tree_default)

        # 5. 处理中文页（拿 tags）
        if not isinstance(html_zh, Exception):
            try:
                tags_zh = _extract_tags(lxml_html.fromstring(html_zh))
                if tags_zh:
                    tags = tags_zh
            except Exception as e:
                logger.warning(f"⚠️ 中文页解析失败: {e}")

        # 6. 处理英文页（拿 title_en）
        title_en = ""
        if not isinstance(html_en, Exception):
            try:
                title_en = _extract_title(lxml_html.fromstring(html_en))
            except Exception as e:
                logger.warning(f"⚠️ 英文页解析失败: {e}")

        # 标题中文翻译只给上传页参考，不覆盖原日文标题
        title_cn = await _translate_title(title_default)

        # 7. 简介：保留图文结构；图片只返回 URL，交给 Next 主站上传
        description_md = ""
        description_images = []
        description_started = time.perf_counter()
        try:
            description_md, description_images = await build_description_payload(
                tree_default,
                _translate_description,
            )
            logger.info(
                f"✅ 简介 Markdown: {len(description_md)} 字，"
                f"待主站上传图片: {len(description_images)} 张，"
                f"耗时 {time.perf_counter() - description_started:.2f}s"
            )
        except Exception as e:
            logger.warning(f"⚠️ 简介提取/翻译失败: {e}")

        result = {
            "rj_code": normalized,
            "title_default": title_default,
            "title_jp": title_default,
            "title_en": title_en,
            "title_cn": title_cn,
            "cover_url": cover_url,
            "release_date": release_date,
            "tags": tags,
            "circle_name": circle_name,
            "circle_link": circle_link,
            "description_md": description_md,
            "images": description_images,
            "is_announce": is_announce,
        }

        # 8. 存入缓存并返回
        _set_cache(normalized, result)
        logger.info(f"🎉 总耗时 {asyncio.get_event_loop().time() - t0:.2f}s")
        return result


# ==================== 本地测试 ====================
if __name__ == "__main__":
    import sys, json
    from config import setup_environment
    setup_environment()
    code = sys.argv[1] if len(sys.argv) > 1 else "RJ01724797"
    data = asyncio.run(fetch_dlsite_game(code))
    print(json.dumps(data, ensure_ascii=False, indent=2))

    if data.get("description_md"):
        out = f"{data['rj_code']}.description.md"
        with open(out, "w", encoding="utf-8") as f:
            f.write(data["description_md"])
        print(f"\n📝 简介 md 已写入: {out}")
