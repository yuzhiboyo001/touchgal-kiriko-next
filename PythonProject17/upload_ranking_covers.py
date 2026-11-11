r"""把本地排行榜封面批量上传到 Cloudflare R2 的 ranking/ 前缀。

用法（在 PythonProject17 目录下）：
    .\.venv\Scripts\python.exe upload_ranking_covers.py
    .\.venv\Scripts\python.exe upload_ranking_covers.py --dry-run
    .\.venv\Scripts\python.exe upload_ranking_covers.py --force

默认读取 .env 里的 IMAGE_DIR；上传到 R2_BUCKET 的 R2_RANKING_PREFIX。
数据库 cover_local 不需要改，仍然只存文件名。
"""

import argparse
import os
import sys
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv(Path(__file__).with_name(".env"))

from r2_storage import (  # noqa: E402
    ranking_cover_exists,
    ranking_cover_public_url,
    upload_ranking_cover,
)

IMAGE_SUFFIXES = {".webp", ".avif", ".png", ".jpg", ".jpeg", ".gif"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload ranking covers to Cloudflare R2")
    parser.add_argument(
        "--image-dir",
        default=os.environ.get("IMAGE_DIR", "./image"),
        help="本地封面目录，默认读取 IMAGE_DIR",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只打印将要上传的文件，不真正上传",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="即使 R2 已存在也重新上传",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="最多上传多少个文件（0 表示全部）",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    image_dir = Path(args.image_dir)

    if not image_dir.is_dir():
        print(f"目录不存在: {image_dir}")
        return 1

    files = sorted(
        path
        for path in image_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
    )
    if args.limit > 0:
        files = files[: args.limit]

    if not files:
        print(f"没有找到图片: {image_dir}")
        return 0

    print(f"图片目录: {image_dir}")
    print(f"待处理: {len(files)} 个文件")
    if args.dry_run:
        for path in files:
            print(f"[dry-run] {path.name} -> {ranking_cover_public_url(path.name)}")
        return 0

    uploaded = 0
    skipped = 0
    failed = 0

    for index, path in enumerate(files, 1):
        if not args.force and ranking_cover_exists(path.name):
            skipped += 1
            print(f"[{index}/{len(files)}] 跳过（R2 已存在）: {path.name}")
            continue

        url = upload_ranking_cover(path)
        if url:
            uploaded += 1
            print(f"[{index}/{len(files)}] 上传成功: {url}")
        else:
            failed += 1
            print(f"[{index}/{len(files)}] 上传失败: {path.name}")

    print("---")
    print(f"成功: {uploaded}")
    print(f"跳过: {skipped}")
    print(f"失败: {failed}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
