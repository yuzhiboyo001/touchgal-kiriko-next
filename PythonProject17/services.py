# services.py
import os
os.environ.pop("HTTP_PROXY", None)
os.environ.pop("HTTPS_PROXY", None)
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)
os.environ.pop("ALL_PROXY", None)
os.environ.pop("all_proxy", None)
import re
import json
import time
import asyncio
import logging
import threading
from pathlib import Path
from typing import List, Dict, Optional, Any
from langchain_deepseek import ChatDeepSeek
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage
from config import (
    get_beijing_time,
    get_deepseek_api_keys,
    KIRIKO_BRAIN_EXTRACT_INTERVAL,
    KIRIKO_MAX_BRAIN_MEMORIES,
    KIRIKO_MAX_CORE_MEMORIES,
    KIRIKO_MAX_EPISODE_MEMORIES,
    KIRIKO_MAX_PROMISE_MEMORIES,
)
from prompts import CHARACTER_CONFIGS, BRAIN_PROMPTS, USER_INFO
from middleware import check_user_rate_limit
from purchase_history import get_purchase_history

logger = logging.getLogger("gal_llm_api")
_API_KEY_LOCK = threading.Lock()
_API_KEY_INDEX: dict[str, int] = {}
_KEY_COOLDOWN: dict[str, float] = {}
KEY_COOLDOWN_SECONDS = int(os.getenv("DEEPSEEK_KEY_COOLDOWN_SECONDS", "60"))
_STATE_DIR = Path(__file__).resolve().parent / "state"
_EXHAUSTED_TIERS: set[str] = set()


class AIBudgetExhausted(RuntimeError):
    def __init__(self, tier: str):
        self.tier = tier
        super().__init__(f"AI budget exhausted for tier={tier}")


def _budget_lock_path(tier: str) -> Path:
    # 按自然月分文件：下个月自动换新锁；手动重新充值后删除对应文件即可解锁。
    return _STATE_DIR / f"ai_budget_{tier}_{time.strftime('%Y-%m')}.lock"


def is_ai_tier_exhausted(tier: str) -> bool:
    return tier in _EXHAUSTED_TIERS or _budget_lock_path(tier).exists()


def mark_ai_tier_exhausted(tier: str) -> None:
    # 文件锁跨进程持久化；如果磁盘不可写，至少本进程内继续锁死。
    try:
        _STATE_DIR.mkdir(parents=True, exist_ok=True)
        _budget_lock_path(tier).write_text(
            f"tier={tier}\ntime={time.strftime('%Y-%m-%d %H:%M:%S')}\n",
            encoding="utf-8",
        )
    except Exception as exc:
        _EXHAUSTED_TIERS.add(tier)
        logger.error("写入 AI 余额锁失败，已启用内存锁: %s", exc)


def is_balance_error(error: Exception) -> bool:
    text = str(error).lower()
    return any(
        marker in text
        for marker in (
            "402",
            "payment required",
            "insufficient balance",
            "insufficient_quota",
            "余额不足",
        )
    )


def ensure_ai_tier_available(tier: str) -> None:
    if is_ai_tier_exhausted(tier):
        raise AIBudgetExhausted(tier)


def get_next_deepseek_key(tier: str = "free") -> str:
    keys = get_deepseek_api_keys(tier)
    if not keys:
        raise RuntimeError(
            f"DEEPSEEK_API_KEYS_FREE / DEEPSEEK_API_KEYS_OPS 未配置（tier={tier}）"
        )
    now = time.time()
    available = [key for key in keys if _KEY_COOLDOWN.get(key, 0) <= now]
    pool = available or keys
    with _API_KEY_LOCK:
        index = _API_KEY_INDEX.get(tier, 0)
        key = pool[index % len(pool)]
        _API_KEY_INDEX[tier] = index + 1
    return key


def is_key_error(error: Exception) -> bool:
    text = str(error).lower()
    return any(
        marker in text
        for marker in (
            "401",
            "403",
            "429",
            "authentication",
            "invalid api key",
            "insufficient balance",
            "quota",
            "rate limit",
            "too many requests",
            "503",
            "502",
        )
    )


def mark_key_failure(key: str) -> None:
    _KEY_COOLDOWN[key] = time.time() + KEY_COOLDOWN_SECONDS


def mark_key_success(key: str) -> None:
    _KEY_COOLDOWN.pop(key, None)


MAX_CONCURRENT = int(os.getenv("CHAT_MAX_CONCURRENT", "5"))
MAX_OUTPUT_TOKENS = int(os.getenv("CHAT_MAX_OUTPUT_TOKENS", "800"))
_semaphore = asyncio.Semaphore(MAX_CONCURRENT)
REQUEST_TIMEOUT = 30


def get_llm(
        temperature: float = 1.2,
        json_mode: bool = False,
        max_tokens: int | None = None,
        thinking: bool | None = None,
        api_key: str | None = None,
        tier: str = "free",
):
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    if thinking is not None:
        kwargs["extra_body"] = {
            "thinking": {"type": "enabled" if thinking else "disabled"}
        }
    return ChatDeepSeek(
        model="deepseek-flash",
        api_key=api_key or get_next_deepseek_key(tier),
        temperature=temperature,
        max_tokens=max_tokens or MAX_OUTPUT_TOKENS,
        max_retries=2,
        **kwargs,
    )


def clean_output(text: str) -> str:
    if not text:
        return text
    text = re.sub(r'[（(][^）)]*[）)]', '', text)
    return text.strip()


def format_conversations(conversations: List[Dict[str, str]], user_name: str, bot_name: str) -> str:
    """格式化对话历史"""
    if not conversations:
        return "（还没有对话记录）"

    text = ""
    for msg in conversations[-20:]:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        if role == "user":
            text += f"{user_name or '你'}：{content}\n"
        elif role == "assistant":
            text += f"{bot_name}：{content}\n"
    return text


def format_memories(memories: List[str]) -> str:
    """格式化大脑记忆"""
    if not memories:
        return "暂时还没有关于ta的记忆"

    return (
        "【记忆使用规则】以下是你确定记得的事实，优先于你当下的猜测；"
        "记忆里明确有的事，不要否认自己知道，也不要用“没听你说过”带过。\n"
        + "\n".join([f"- {mem}" for mem in memories[-KIRIKO_MAX_BRAIN_MEMORIES:]])
    )


def format_purchase_history(purchases: List[Dict[str, Any]]) -> str:
    """格式化购买记录"""
    if not purchases:
        return "暂时还没有买过特殊物品"

    lines = []
    for p in purchases[-5:]:  # 只取最近5条
        name = p.get('name', '未知物品')
        price = p.get('price', 0)
        # 移除 purchased_at，因为没用到
        lines.append(f"- {name}（{price}円）")

    return "\n".join(lines) if lines else "暂时还没有买过特殊物品"


async def get_character_response(
        character: str,
        message: str,
        user_id: str,
        user_name: str = None,
        conversations: List[Dict[str, str]] = None,
        memories: List[str] = None,
        user_location: str = None,
        chat_mode: str = None,
        purchase_history: List[Dict[str, Any]] = None,
        ai_tier: str = "free",
) -> str:
    ensure_ai_tier_available(ai_tier)
    config = CHARACTER_CONFIGS.get(character, CHARACTER_CONFIGS["rin"])

    # 频率限制
    allowed, limit_msg = check_user_rate_limit(user_id)
    if not allowed:
        return limit_msg

    # Python 和 Next 在同一个 VPS，购买历史直接查 PostgreSQL。
    # 不依赖聊天请求里的 purchase_history，也不需要额外 API。
    # DB 读取失败时降级为空历史，不影响聊天。
    db_purchase_history = await asyncio.to_thread(
        get_purchase_history, user_id
    )
    purchase_history = db_purchase_history or []

    # 格式化数据
    conversation_text = format_conversations(conversations, user_name, config['name'])
    memory_text = format_memories(memories)
    purchase_text = format_purchase_history(purchase_history)

    # 只记录条数，不把购买记录内容打印到日志
    logger.info(
        "🛒 [%s] 购买记录: %d 条",
        config['name'],
        len(purchase_history or []),
    )

    # 处理对话模式
    if chat_mode == "offline":
        mode_text = "面对面"
        mode_behavior = "你们现实中在一起，你可以看到对方的表情，行为要像线下相遇"
    else:
        mode_text = "手机聊天"
        mode_behavior = "你们通过手机在联系，你只能看文字，行为要像在发消息"

    now = get_beijing_time()

    system_prompt = config["system"].format(
        user_name=user_name or USER_INFO['name'],
        user_gender=USER_INFO['gender'],
        recent_conversations=conversation_text,
        brain_memories=memory_text,
        purchase_history=purchase_text,
        current_time=now['time'],
        current_date=now['date'],
        current_weekday=now['weekday'],
        user_location=user_location or "未知",
        chat_mode=mode_text,
        chat_mode_behavior=mode_behavior,
    )

    messages = [("system", system_prompt), ("human", message)]

    prompt = ChatPromptTemplate.from_messages(messages)
    start = time.time()
    keys = get_deepseek_api_keys(ai_tier)
    response = None
    last_error = None

    async with _semaphore:
        for _ in range(max(1, len(keys))):
            key = get_next_deepseek_key(ai_tier)
            llm = get_llm(temperature=1.3, api_key=key, tier=ai_tier)
            chain = prompt | llm
            try:
                response = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        None, lambda: chain.invoke({})
                    ),
                    timeout=REQUEST_TIMEOUT,
                )
                mark_key_success(key)
                break
            except Exception as exc:
                last_error = exc
                if is_balance_error(exc):
                    mark_ai_tier_exhausted(ai_tier)
                    logger.error("DeepSeek 余额不足，锁定 tier=%s", ai_tier)
                    raise AIBudgetExhausted(ai_tier) from exc
                if not is_key_error(exc):
                    raise
                mark_key_failure(key)
                logger.warning("DeepSeek key 失败，切换下一个 key")

    if response is None:
        raise last_error or RuntimeError("DeepSeek 调用失败")

    reply = clean_output(response.content)

    # 打印响应时间
    print(f"⏱️  [{config['name']}] 响应耗时: {time.time() - start:.2f}s")

    return reply if reply and len(reply) >= 3 else config["greeting"]


async def brain_extract_memories(
        character: str,
        recent_dialogue: List[Dict[str, Any]],
        user_name: str = None,
        existing_memories: List[str] = None,
        total_memories: int = 0,
        max_memories: int = KIRIKO_MAX_BRAIN_MEMORIES,
        user_location: str = "未指定",
        thinking: bool = False,
        ai_tier: str = "free",
) -> Dict[str, Any]:
    ensure_ai_tier_available(ai_tier)
    config = CHARACTER_CONFIGS.get(character, CHARACTER_CONFIGS["rin"])
    brain_prompt = BRAIN_PROMPTS.get(character, BRAIN_PROMPTS["rin"])

    # 格式化对话
    dialogue_text = ""
    for msg in recent_dialogue:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        turn = msg.get("turn_number")
        prefix = f"[turn {turn}] " if isinstance(turn, int) else ""
        if role == "user":
            dialogue_text += f"{prefix}{user_name or '用户'}：{content}\n"
        elif role == "assistant":
            dialogue_text += f"{prefix}{config['name']}：{content}\n"

    # 格式化已有记忆
    existing_text = ""
    if existing_memories:
        for mem in existing_memories:
            existing_text += f"- {mem}\n"
    if not existing_text:
        existing_text = "（还没有任何记忆）"

    now = get_beijing_time()

    replacements = {
        "user_name": user_name or USER_INFO["name"],
        "user_gender": USER_INFO["gender"],
        "existing_memories": existing_text,
        "recent_dialogue": dialogue_text,
        "current_time": now["time"],
        "current_date": now["date"],
        "current_weekday": now["weekday"],
        "total_memories": str(total_memories),
        "max_memories": str(max_memories),
        "max_core": str(KIRIKO_MAX_CORE_MEMORIES),
        "max_promise": str(KIRIKO_MAX_PROMISE_MEMORIES),
        "max_episode": str(KIRIKO_MAX_EPISODE_MEMORIES),
        "user_location": user_location,
    }
    prompt = brain_prompt
    for key, value in replacements.items():
        prompt = prompt.replace("{" + key + "}", value)

    # 这里不能用 ChatPromptTemplate：JSON 示例里的花括号会被当成模板变量。
    messages = [SystemMessage(content=prompt)]
    keys = get_deepseek_api_keys(ai_tier)
    response = None
    last_error = None
    for _ in range(max(1, len(keys))):
        key = get_next_deepseek_key(ai_tier)
        llm = get_llm(
            temperature=0.3,
            json_mode=True,
            max_tokens=6000 if thinking else 1800,
            thinking=thinking,
            api_key=key,
            tier=ai_tier,
        )
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None, lambda: llm.invoke(messages)
            )
            mark_key_success(key)
            break
        except Exception as exc:
            last_error = exc
            if is_balance_error(exc):
                mark_ai_tier_exhausted(ai_tier)
                logger.error("DeepSeek 余额不足，锁定 tier=%s", ai_tier)
                raise AIBudgetExhausted(ai_tier) from exc
            if not is_key_error(exc):
                raise
            mark_key_failure(key)
            logger.warning("大脑提炼 key 失败，切换下一个 key")

    if response is None:
        raise last_error or RuntimeError("DeepSeek 调用失败")

    raw = response.content.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw)
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end <= start:
        print("⚠️ 记忆提炼原始输出:", repr(raw[:2000]), flush=True)
        raise ValueError("记忆提炼没有返回 JSON")

    try:
        data = json.loads(raw[start : end + 1])
    except Exception:
        print("⚠️ 记忆提炼 JSON 解析失败:", repr(raw[start : end + 1][:3000]), flush=True)
        raise
    if not isinstance(data, dict):
        raise ValueError("记忆提炼 JSON 不是对象")

    def normalize_list(key: str) -> List[Dict[str, Any]]:
        value = data.get(key)
        if not isinstance(value, list):
            return []
        return [item for item in value if isinstance(item, dict)]

    normalized = {
        "core": normalize_list("core"),
        "promises": normalize_list("promises"),
        "episodes": normalize_list("episodes"),
        "relationship": data.get("relationship")
        if isinstance(data.get("relationship"), dict)
        else None,
    }

    print("\n" + "=" * 70)
    print(f"🧠 [{config['name']}] 结构化大脑记忆")
    print("=" * 70)
    print(f"📝 对话条数：{len(recent_dialogue)}")
    print(
        "💭 提炼结果："
        f"core={len(normalized['core'])} "
        f"promises={len(normalized['promises'])} "
        f"episodes={len(normalized['episodes'])} "
        f"relationship={'yes' if normalized['relationship'] else 'no'}"
    )
    print("=" * 70 + "\n")

    return normalized