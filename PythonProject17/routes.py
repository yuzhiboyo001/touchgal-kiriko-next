# routes.py
import time
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models import ChatRequest, ChatResponse, MemoryRequest, MemoryResponse
from services import (
    AIBudgetExhausted,
    ensure_ai_tier_available,
    get_character_response,
    brain_extract_memories,
    is_ai_tier_exhausted,
)
from prompts import CHARACTER_CONFIGS

# ✅ 5 个独立爬虫入口
from crawler import (
    crawl_daily,
    crawl_weekly,
    crawl_monthly,
    crawl_yearly,
    crawl_total,
    RANKING_URLS,
    is_crawl_due,
    write_crawl_audit,
)

logger = logging.getLogger("gal_llm_api")
router = APIRouter()

# ✅ 线程池：把同步爬虫扔后台线程，避免阻塞事件循环
_executor = ThreadPoolExecutor(max_workers=2)
_crawl_locks: dict[str, asyncio.Lock] = {}


# ==================== 看板娘对话 ====================

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    logger.info("=" * 50)
    logger.info(f"📨 收到对话请求: character={request.character}")
    logger.info(f"📨 用户: {request.user_name or request.user_id}")
    logger.info(f"📨 消息长度: {len(request.message)}")
    logger.info(f"📨 对话条数: {len(request.conversations or [])}")
    logger.info(f"📨 记忆条数: {len(request.memories or [])}")
    logger.info(f"📍 用户地点: {request.user_location or '未指定'}")
    logger.info(f"📱 对话模式: {request.chat_mode or 'online (默认)'}")

    start = time.time()
    try:
        # 在进入模型调用前做一次路由级防线；即使业务层被绕过也不会发请求
        ensure_ai_tier_available(request.ai_tier)
        reply = await get_character_response(
            character=request.character,
            message=request.message,
            user_id=request.user_id,
            user_name=request.user_name,
            conversations=request.conversations,
            memories=request.memories,
            user_location=request.user_location,
            chat_mode=request.chat_mode,
            purchase_history=request.purchase_history,
            ai_tier=request.ai_tier,
        )
        elapsed = time.time() - start
        logger.info(f"✅ 对话请求完成 (总耗时: {elapsed:.2f}s)")
        logger.info("=" * 50)
        return ChatResponse(
            reply=reply,
            character=request.character,
            success=True,
            elapsed_time=elapsed
        )
    except AIBudgetExhausted as e:
        logger.error("❌ AI 余额已耗尽，拒绝继续请求: tier=%s", e.tier)
        return JSONResponse(
            status_code=402,
            content={
                "success": False,
                "code": "AI_BUDGET_EXHAUSTED",
                "tier": e.tier,
                "character": request.character,
                "error": (
                    "本站本月的 AI 免费额度已全部耗尽"
                    if e.tier == "free"
                    else "AI 服务额度已耗尽"
                ),
                "elapsed_time": time.time() - start,
            },
        )
    except Exception as e:
        logger.error(f"❌ 对话异常: {e}")
        # 不要把真实异常伪装成角色开场白，否则前端会以为聊上了。
        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "character": request.character,
                "error": "聊天模型暂时不可用",
                "elapsed_time": time.time() - start,
            },
        )


# ==================== 大脑记忆 ====================

@router.post("/brain/memory", response_model=MemoryResponse)
async def brain_memory(request: MemoryRequest):
    logger.info("=" * 50)
    logger.info(f"🧠 [大脑] 收到记忆提炼请求: character={request.character}")
    logger.info(f"🧠 [大脑] 对话条数: {len(request.recent_dialogue)}")
    logger.info(f"🧠 [大脑] 已有记忆条数: {len(request.existing_memories or [])}")

    start = time.time()
    try:
        ensure_ai_tier_available(request.ai_tier)
        memories = await brain_extract_memories(
            character=request.character,
            recent_dialogue=request.recent_dialogue,
            user_name=request.user_name,
            existing_memories=request.existing_memories,
            total_memories=request.total_memories,
            max_memories=request.max_memories,
            user_location=request.user_location,
            ai_tier=request.ai_tier,
        )
        elapsed = time.time() - start
        logger.info(f"✅ [大脑] 提炼完成 (耗时: {elapsed:.2f}s)")
        logger.info("=" * 50)
        return MemoryResponse(
            memories=memories,
            success=True
        )
    except AIBudgetExhausted as e:
        logger.error("❌ [大脑] AI 余额已耗尽: tier=%s", e.tier)
        return JSONResponse(
            status_code=402,
            content={
                "success": False,
                "code": "AI_BUDGET_EXHAUSTED",
                "tier": e.tier,
                "error": (
                    "本站本月的 AI 免费额度已全部耗尽"
                    if e.tier == "free"
                    else "AI 服务额度已耗尽"
                ),
            },
        )
    except Exception as e:
        logger.error(f"❌ [大脑] 提炼失败: {e}")
        return MemoryResponse(
            memories={},
            success=False
        )


# ==================== 基础接口 ====================

@router.get("/ai/status")
@router.post("/ai/status")
async def ai_status(tier: str = "free"):
    safe_tier = tier if tier in ("free", "ops") else "free"
    return {
        "tier": safe_tier,
        "locked": is_ai_tier_exhausted(safe_tier),
    }


@router.get("/health")
async def health():
    logger.info("📊 [健康检查] 收到请求")
    return {
        "status": "ok",
        "characters": list(CHARACTER_CONFIGS.keys()),
    }


@router.get("/characters")
async def get_characters():
    logger.info("📋 [角色列表] 收到请求")
    return {
        "characters": [
            {"id": key, "name": value["name"], "greeting": value["greeting"]}
            for key, value in CHARACTER_CONFIGS.items()
        ]
    }


# ==================== DLsite 爬虫（5 个独立入口） ====================

async def _run_crawl(fn, ranking_type: str, force: bool = False) -> dict:
    """把同步爬虫扔到线程池执行；同一榜单禁止并发。"""
    lock = _crawl_locks.setdefault(ranking_type, asyncio.Lock())
    started = time.time()

    if not await asyncio.to_thread(is_crawl_due, ranking_type, force):
        await asyncio.to_thread(
            write_crawl_audit,
            ranking_type,
            "skipped",
            0,
            "未到 next_crawl_at",
            started,
            time.time(),
        )
        return {
            "success": True,
            "ranking_type": ranking_type,
            "skipped": True,
            "message": "未到下一次爬取时间",
        }

    if lock.locked():
        await asyncio.to_thread(
            write_crawl_audit,
            ranking_type,
            "busy",
            0,
            "该榜单正在爬取中",
            started,
            time.time(),
        )
        return {
            "success": False,
            "ranking_type": ranking_type,
            "error": "该榜单正在爬取中",
        }

    loop = asyncio.get_event_loop()
    try:
        async with lock:
            # 拿到锁后再次检查，避免前一个任务刚结束时重复执行
            if not await asyncio.to_thread(is_crawl_due, ranking_type, force):
                await asyncio.to_thread(
                    write_crawl_audit,
                    ranking_type,
                    "skipped",
                    0,
                    "锁内复查未到 next_crawl_at",
                    started,
                    time.time(),
                )
                return {
                    "success": True,
                    "ranking_type": ranking_type,
                    "skipped": True,
                    "message": "未到下一次爬取时间",
                }
            count = await loop.run_in_executor(_executor, fn)
        if count <= 0:
            error = "写入 0 条"
            await asyncio.to_thread(
                write_crawl_audit,
                ranking_type,
                "failed",
                0,
                error,
                started,
                time.time(),
            )
            return {
                "success": False,
                "ranking_type": ranking_type,
                "count": 0,
                "error": error,
            }
        await asyncio.to_thread(
            write_crawl_audit,
            ranking_type,
            "success",
            count,
            None,
            started,
            time.time(),
        )
        return {
            "success": True,
            "ranking_type": ranking_type,
            "count": count,
            "message": f"爬取 {count} 条 {ranking_type} 数据",
        }
    except Exception as e:
        logger.error(f"❌ [爬虫] {ranking_type} 失败: {e}")
        await asyncio.to_thread(
            write_crawl_audit,
            ranking_type,
            "failed",
            0,
            str(e),
            started,
            time.time(),
        )
        return {
            "success": False,
            "ranking_type": ranking_type,
            "error": str(e),
        }


@router.post("/crawl/daily")
async def api_crawl_daily(force: bool = False):
    """爬日榜（建议 1 小时一次）"""
    logger.info("🕷️ [爬虫] 收到日榜请求")
    return await _run_crawl(crawl_daily, "daily", force)


@router.post("/crawl/weekly")
async def api_crawl_weekly(force: bool = False):
    """爬周榜（建议 3 小时一次）"""
    logger.info("🕷️ [爬虫] 收到周榜请求")
    return await _run_crawl(crawl_weekly, "weekly", force)


@router.post("/crawl/monthly")
async def api_crawl_monthly(force: bool = False):
    """爬月榜（建议 1 天一次）"""
    logger.info("🕷️ [爬虫] 收到月榜请求")
    return await _run_crawl(crawl_monthly, "monthly", force)


@router.post("/crawl/yearly")
async def api_crawl_yearly(force: bool = False):
    """爬年榜（建议保留 7 天）"""
    logger.info("🕷️ [爬虫] 收到年榜请求")
    return await _run_crawl(crawl_yearly, "yearly", force)


@router.post("/crawl/total")
async def api_crawl_total(force: bool = False):
    """爬总榜（建议保留 7 天）"""
    logger.info("🕷️ [爬虫] 收到总榜请求")
    return await _run_crawl(crawl_total, "total", force)


@router.get("/crawl/health")
async def crawl_health():
    """爬虫健康检查"""
    return {
        "status": "ok",
        "supported_rankings": list(RANKING_URLS.keys()),
    }