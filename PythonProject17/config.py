# config.py
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict

def load_env_files():
    """按 APP_ENV 加载 Python 自己的环境文件。

    development 默认：
      PythonProject17/.env.development
      PythonProject17/.env
      .env.development
      .env
    production：
      PythonProject17/.env.production
      PythonProject17/.env
      .env.production
      .env
    """
    try:
        from pathlib import Path
        from dotenv import load_dotenv
    except Exception:
        return

    here = Path(__file__).resolve().parent
    root = here.parent
    app_env = os.getenv("APP_ENV", "development").strip() or "development"
    candidates = [
        here / f".env.{app_env}",
        here / ".env",
        root / f".env.{app_env}",
        root / ".env",
    ]
    for path in candidates:
        if path.is_file():
            # 环境文件优先于启动终端里遗留的旧环境变量。
            # 避免修改 .env 后，旧 DEEPSEEK_API_KEY 仍然覆盖新 Key。
            load_dotenv(path, override=True)


def setup_environment():
    load_env_files()
    os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
    os.environ.setdefault("NO_PROXY", "localhost,127.0.0.1")
    if not get_deepseek_api_keys("free") and not get_deepseek_api_keys("ops"):
        raise RuntimeError(
            "DEEPSEEK_API_KEY / DEEPSEEK_API_KEYS 未配置，请写入环境变量或 .env"
        )
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    os.environ.setdefault("HF_HUB_OFFLINE", "1")

CST = timezone(timedelta(hours=8))

_KIRIKO_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "kiriko.json"
try:
    KIRIKO_CONFIG = json.loads(_KIRIKO_CONFIG_PATH.read_text(encoding="utf-8"))
except Exception:
    KIRIKO_CONFIG = {}

KIRIKO_MAX_BRAIN_MEMORIES = int(
    KIRIKO_CONFIG.get("memory", {}).get("maxTotal", 12)
)
KIRIKO_MAX_CORE_MEMORIES = int(
    KIRIKO_CONFIG.get("memory", {}).get("maxCore", 5)
)
KIRIKO_MAX_PROMISE_MEMORIES = int(
    KIRIKO_CONFIG.get("memory", {}).get("maxPromise", 2)
)
KIRIKO_MAX_EPISODE_MEMORIES = int(
    KIRIKO_CONFIG.get("memory", {}).get("maxEpisode", 4)
)
KIRIKO_BRAIN_EXTRACT_INTERVAL = int(
    KIRIKO_CONFIG.get("memory", {}).get("extractIntervalTurns", 10)
)
KIRIKO_CHAT_HISTORY_CONTEXT_MESSAGES = int(
    KIRIKO_CONFIG.get("chat", {}).get("historyContextMessages", 20)
)
KIRIKO_CRAWLER_CONFIG = KIRIKO_CONFIG.get("crawler", {})


def get_deepseek_api_keys(tier: str = "free") -> list[str]:
    """按用途返回 DeepSeek Key。

    free: 普通用户看板娘聊天
    ops:  管理员、超管、支持者、DLsite 翻译

    兼容旧配置：没有分池变量时，回退到 DEEPSEEK_API_KEYS / DEEPSEEK_API_KEY。
    """
    if tier == "ops":
        raw = os.getenv("DEEPSEEK_API_KEYS_OPS", "").strip()
        # ops 兼容旧变量，避免升级瞬间管理员/翻译不可用
        if not raw:
            raw = os.getenv("DEEPSEEK_API_KEYS", "").strip()
        if not raw:
            raw = os.getenv("DEEPSEEK_API_KEY", "").strip()
    else:
        # free 必须显式配置，禁止回退到 ops，否则会绕过 20 元隔离
        raw = os.getenv("DEEPSEEK_API_KEYS_FREE", "").strip()

    if not raw:
        return []

    # 逗号、分号、换行都当作分隔符
    normalized = raw.replace(";", ",").replace("\n", ",")
    return [key.strip() for key in normalized.split(",") if key.strip()]

def get_beijing_time() -> Dict[str, str]:
    now = datetime.now(CST)
    return {
        "date": now.strftime('%Y年%m月%d日'),
        "time": now.strftime('%H:%M:%S'),
        "weekday": ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"][now.weekday()],
        "timestamp": now.strftime('%Y-%m-%d %H:%M:%S')
    }