"""Compare brain extraction with thinking enabled/disabled on one fixed dialogue."""

import asyncio
import json
import sys
import time
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'PythonProject17'))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from services import brain_extract_memories  # noqa: E402

DIALOGUE = [
    ("user", "你好，我叫李明。今天第一次来这家便利店。", 1),
    ("assistant", "你好，第一次来啊。", 1),
    ("user", "我养了一只叫小黑的猫，它总趴在我键盘上。", 2),
    ("assistant", "小黑这名字挺可爱的。", 2),
    ("user", "我做游戏汉化，经常为一句译文改到凌晨。", 3),
    ("assistant", "那挺费神的。", 3),
    ("user", "我小时候和奶奶一起住，她去年走了。", 4),
    ("assistant", "抱歉听到这个。", 4),
    ("user", "我平时喜欢喝柠檬茶，也喜欢味噌拉面。", 5),
    ("assistant", "记住了。", 5),
    ("user", "我想约你下周末一起去附近的书店。", 6),
    ("assistant", "好啊，下周末一起去书店，具体时间等我排班。", 6),
    ("user", "除了书店，我还想找一天一起去看晚上的东京。", 7),
    ("assistant", "可以，等我排班出来再定日子。", 7),
    ("user", "我今天有点累，翻译卡住了。", 8),
    ("assistant", "那就先休息一下吧。", 8),
    ("user", "我有时候会想，人是不是都会忘记以前的事。", 9),
    ("assistant", "可能会吧，但有些事不会那么容易忘。", 9),
    ("user", "你还记得我叫什么，养了什么猫吗？", 10),
    ("assistant", "李明，还有小黑。", 10),
]


async def run_once(thinking: bool):
    recent = [
        {"role": role, "content": content, "turn_number": turn}
        for role, content, turn in DIALOGUE
    ]
    started = time.time()
    try:
        result = await brain_extract_memories(
            character="rin",
            recent_dialogue=recent,
            user_name="李明",
            existing_memories=[],
            total_memories=0,
            max_memories=12,
            user_location="便利店",
            thinking=thinking,
        )
        return {
            "thinking": thinking,
            "ok": True,
            "elapsed": round(time.time() - started, 2),
            "core_slots": [item.get("slot") for item in result.get("core", [])],
            "core": [item.get("content") for item in result.get("core", [])],
            "promise_slots": [
                item.get("slot") for item in result.get("promises", [])
            ],
            "promises": [
                item.get("content") for item in result.get("promises", [])
            ],
            "episode_count": len(result.get("episodes", [])),
            "relationship": result.get("relationship", {}).get("content", "")
            if isinstance(result.get("relationship"), dict)
            else "",
        }
    except Exception as exc:
        return {
            "thinking": thinking,
            "ok": False,
            "elapsed": round(time.time() - started, 2),
            "error": str(exc),
        }


async def main():
    results = []
    for thinking in (False, True):
        for trial in range(1, 4):
            result = await run_once(thinking)
            result["trial"] = trial
            results.append(result)
            print(json.dumps(result, ensure_ascii=False), flush=True)

    output = Path(__file__).with_name("brain_thinking_compare.json")
    output.write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"written: {output}")


if __name__ == "__main__":
    asyncio.run(main())
