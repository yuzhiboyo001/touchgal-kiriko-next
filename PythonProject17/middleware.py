# middleware.py
import time
from typing import Dict, List, Tuple

_user_request_records: Dict[str, List[float]] = {}
RATE_WINDOW = 60
RATE_MAX_PER_USER = 30


def _cleanup_idle_records(now: float) -> None:
    if len(_user_request_records) < 1000:
        return
    expired = [
        user_id
        for user_id, timestamps in _user_request_records.items()
        if not timestamps or now - timestamps[-1] >= RATE_WINDOW
    ]
    for user_id in expired:
        _user_request_records.pop(user_id, None)


def check_user_rate_limit(user_id: str) -> Tuple[bool, str]:
    now = time.time()
    _cleanup_idle_records(now)
    if user_id not in _user_request_records:
        _user_request_records[user_id] = []
    _user_request_records[user_id] = [
        t for t in _user_request_records[user_id] if now - t < RATE_WINDOW
    ]
    if len(_user_request_records[user_id]) >= RATE_MAX_PER_USER:
        remaining = int(RATE_WINDOW - (now - _user_request_records[user_id][0]))
        return False, f"对话太频繁了，请稍等 {remaining} 秒再聊哦～"
    _user_request_records[user_id].append(now)
    return True, ""