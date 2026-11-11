"""DLsite 游戏简介：保留图文结构，只翻译文字。

Python 不再下载/压缩/上传图片，只返回：
    description_md: 带 [[IMG_001]] 占位符的中文 Markdown
    images:         [{ token, url }]

图片下载、AVIF 压缩、user/image/{uid} 上传由 Next 主站负责。
"""

import logging
import re
from typing import Awaitable, Callable, List, Tuple

logger = logging.getLogger("dlsite_description")

MAX_IMAGES = 40

Block = Tuple[str, str]  # ("heading"|"image"|"text", value)


def _clean_text(value: str) -> str:
    value = value.replace("\u00a0", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def _normalize_url(url: str) -> str:
    url = (url or "").strip()
    if not url or url.startswith("data:"):
        return ""
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("/"):
        return f"https://www.dlsite.com{url}"
    return url


def _image_url(img) -> str:
    for attr in ("src", "data-src", "data-original"):
        value = img.get(attr)
        if value:
            normalized = _normalize_url(value)
            if normalized:
                return normalized
    return ""


def _render_inline(element) -> str:
    """把 <p> 里的文本、<br>、<a> 转成带链接的 Markdown 文本。"""
    parts: List[str] = []

    if element.text:
        parts.append(element.text)

    for child in element:
        if child.tag == "br":
            parts.append("\n")
        elif child.tag == "a":
            href = _normalize_url(child.get("href", ""))
            label = _clean_text("".join(child.itertext()))
            if href and label:
                parts.append(f"[{label}]({href})")
            elif label:
                parts.append(label)
        else:
            parts.append(_render_inline(child))

        if child.tail:
            parts.append(child.tail)

    return "".join(parts)


def _paragraph_text(p) -> str:
    text = _render_inline(p)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_blocks(tree) -> List[Block]:
    """按 DOM 顺序提取 heading/image/text，保留图文配对。"""
    blocks: List[Block] = []
    seen_images: set[str] = set()

    def add_image(img) -> None:
        if sum(1 for b in blocks if b[0] == "image") >= MAX_IMAGES:
            return
        url = _image_url(img)
        if not url or url in seen_images:
            return
        seen_images.add(url)
        blocks.append(("image", url))

    for container in tree.xpath('//div[contains(@class,"work_parts_container")]'):
        for block in container.xpath('./div[contains(@class,"work_parts")]'):
            classes = block.get("class", "")

            if "type_chobit" in classes:
                # Chobit 是外部 iframe，不适合塞进 Markdown
                continue

            heading_els = block.xpath(
                './/h3[contains(@class,"work_parts_heading")]'
            )
            if heading_els:
                heading = _clean_text("".join(heading_els[0].itertext()))
                if heading:
                    blocks.append(("heading", heading))

            if "type_multiimages" in classes:
                for item in block.xpath(
                    './/li[contains(@class,"work_parts_multiimage_item")]'
                ):
                    for img in item.xpath('.//div[contains(@class,"image")]//img'):
                        add_image(img)
                    for p in item.xpath('.//div[contains(@class,"text")]//p'):
                        text = _paragraph_text(p)
                        if text:
                            blocks.append(("text", text))
                continue

            if "type_image_only" in classes:
                for img in block.xpath('.//img'):
                    add_image(img)
                continue

            if "type_image" in classes:
                for img in block.xpath(
                    './/div[contains(@class,"type_visual")]//img'
                ):
                    add_image(img)
                for p in block.xpath(
                    './/div[contains(@class,"type_text")]//p'
                ):
                    text = _paragraph_text(p)
                    if text:
                        blocks.append(("text", text))
                continue

            # 兜底：非上述类型时，图片和段落都保留
            for img in block.xpath('.//img'):
                add_image(img)
            for p in block.xpath('.//p'):
                text = _paragraph_text(p)
                if text:
                    blocks.append(("text", text))

    return blocks


def build_placeholder_markdown(
    blocks: List[Block],
) -> Tuple[str, List[Tuple[str, str]]]:
    """把图片替换成 [[IMG_n]]，返回占位 Markdown 和图片列表。"""
    lines: List[str] = []
    images: List[Tuple[str, str]] = []

    for kind, value in blocks:
        if kind == "heading":
            lines.append(f"## {value}")
        elif kind == "image":
            token = f"[[IMG_{len(images) + 1:03d}]]"
            images.append((token, value))
            lines.append(token)
        else:
            lines.append(value)

    return "\n\n".join(lines).strip(), images


async def build_description_payload(
    tree,
    translate: Callable[[str], Awaitable[str]],
) -> Tuple[str, List[dict]]:
    """解析简介并翻译文字，返回占位 Markdown 和图片 URL 列表。"""
    blocks = extract_blocks(tree)
    if not blocks:
        return "", []

    placeholder_md, images = build_placeholder_markdown(blocks)
    if not placeholder_md:
        return "", []

    logger.info(
        "✅ 简介结构: %s 个块，%s 张图片（图片交给主站上传）",
        len(blocks),
        len(images),
    )

    translated = await translate(placeholder_md)
    if not translated.strip():
        translated = placeholder_md

    return translated.strip(), [
        {"token": token, "url": url} for token, url in images
    ]
