from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from typing import Any


def get_utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def sanitize_text(
    text: Any,
    max_length: int = 5000,
) -> str:
    if not isinstance(text, str):
        return ""

    text = text.replace("\x00", "")

    text = re.sub(
        r"<[^>]*>",
        "",
        text,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    ).strip()

    return text[:max_length]


def hash_identifier(
    identifier: Any,
) -> str:
    if identifier is None:
        return ""

    value = str(identifier).strip()

    if not value:
        return ""

    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()


def safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        number = float(value)

        if number != number:
            return default

        if number in (float("inf"), float("-inf")):
            return default

        return number

    except (TypeError, ValueError):
        return default


def safe_int(
    value: Any,
    default: int = 0,
) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(value, maximum),
    )