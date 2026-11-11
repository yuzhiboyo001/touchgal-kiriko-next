"""Cloudflare R2 upload helpers for ranking cover images.

R2 是 S3 兼容的，排行榜封面统一放在：
    https://img.kiriko.ink/ranking/<filename>

Next.js 的 RankingList 通过 NEXT_PUBLIC_KUN_RANKING_IMAGE_BED_URL
读取同一个地址；数据库里的 cover_local 仍然只保存文件名。
"""

import logging
import mimetypes
import os
from pathlib import Path
from typing import Optional

try:
    from config import load_env_files

    load_env_files()
except Exception:
    pass

try:
    import boto3
    from botocore.config import Config
except ImportError:  # pragma: no cover - boto3 未安装时保持爬虫可运行
    boto3 = None
    Config = None

logger = logging.getLogger(__name__)

DEFAULT_BUCKET = "kiriko-images"
DEFAULT_PUBLIC_BASE = "https://img.kiriko.ink"
DEFAULT_PREFIX = "ranking/"

_client = None


def _env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def _ranking_prefix() -> str:
    prefix = _env("R2_RANKING_PREFIX", DEFAULT_PREFIX).strip("/")
    return f"{prefix}/" if prefix else ""


def get_r2_client():
    """懒加载 boto3 client，避免没有配置 R2 时影响爬虫启动。"""
    global _client

    if _client is not None:
        return _client

    if boto3 is None:
        logger.warning("⚠️ boto3 未安装，跳过 R2 上传；请先 pip install boto3")
        return None

    endpoint = _env("R2_ENDPOINT")
    access_key = _env("R2_ACCESS_KEY_ID")
    secret_key = _env("R2_SECRET_ACCESS_KEY")
    if not endpoint or not access_key or not secret_key:
        logger.warning("⚠️ R2 配置不完整，跳过上传（R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY）")
        return None

    _client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=_env("R2_REGION", "auto"),
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "virtual"},
        ),
    )
    return _client


def public_url(key: str) -> str:
    public_base = _env("R2_PUBLIC_BASE", DEFAULT_PUBLIC_BASE).rstrip("/")
    return f"{public_base}/{key.lstrip('/')}"


def upload_bytes_to_r2(
    data: bytes,
    key: str,
    content_type: str = "image/webp",
    cache_control: str = "public, max-age=86400",
) -> Optional[str]:
    """上传任意图片字节到 R2，返回公开 URL；失败返回 None。"""
    client = get_r2_client()
    if client is None:
        return None

    try:
        client.put_object(
            Bucket=_env("R2_BUCKET", DEFAULT_BUCKET),
            Key=key,
            Body=data,
            ContentType=content_type,
            CacheControl=cache_control,
            ContentDisposition="inline",
        )
        url = public_url(key)
        logger.info("☁️ 已上传 R2: %s", url)
        return url
    except Exception as exc:
        logger.warning("⚠️ R2 上传失败 %s: %s", key, exc)
        return None


def ranking_cover_key(filename: str) -> str:
    return f"{_ranking_prefix()}{Path(filename).name}"


def ranking_cover_public_url(filename: str) -> str:
    return public_url(ranking_cover_key(filename))


def ranking_cover_exists(filename: str) -> bool:
    client = get_r2_client()
    if client is None:
        return False

    try:
        client.head_object(
            Bucket=_env("R2_BUCKET", DEFAULT_BUCKET),
            Key=ranking_cover_key(filename),
        )
        return True
    except Exception:
        return False


def upload_ranking_cover(
    filepath: str | Path,
    filename: Optional[str] = None,
    content_type: Optional[str] = None,
) -> Optional[str]:
    """上传单张排行榜封面；失败只记录日志，不阻断爬虫。"""
    path = Path(filepath)
    if not path.is_file():
        logger.warning("⚠️ 封面文件不存在，跳过上传: %s", path)
        return None

    client = get_r2_client()
    if client is None:
        return None

    name = filename or path.name
    key = ranking_cover_key(name)
    bucket = _env("R2_BUCKET", DEFAULT_BUCKET)
    if content_type is None:
        content_type = mimetypes.guess_type(name)[0] or "image/webp"

    try:
        client.upload_file(
            str(path),
            bucket,
            key,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": "public, max-age=86400",
                "ContentDisposition": "inline",
            },
        )
        url = ranking_cover_public_url(name)
        logger.info("☁️ 已上传 R2: %s", url)
        return url
    except Exception as exc:
        logger.warning("⚠️ R2 上传失败 %s: %s", path.name, exc)
        return None
