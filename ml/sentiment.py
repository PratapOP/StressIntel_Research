from __future__ import annotations

import json
import re
from typing import Any

from groq import Groq

from config.settings import Config


SYSTEM_PROMPT = """
You are the qualitative text-analysis component of StressIntel PRO,
a research platform studying student stress indicators.

Analyze journal text only as supplementary qualitative research data.

Rules:
1. Do not diagnose any medical or mental-health condition.
2. Do not claim that identified factors caused stress.
3. Distinguish observations from interpretations.
4. Return valid JSON only.
5. Do not include markdown.
6. Keep the analysis concise.
7. Identify possible contextual stressors only when supported by the text.
8. Do not infer protected or sensitive personal characteristics.
9. If the text is ambiguous, explicitly reflect that uncertainty.

Return exactly this JSON structure:

{
    "sentiment": "positive|neutral|negative|mixed",
    "sentiment_score": 0.0,
    "stress_signal": "low|moderate|high|unclear",
    "stress_signal_score": 0.0,
    "possible_stressors": [],
    "protective_signals": [],
    "themes": [],
    "summary": "",
    "uncertainty": "",
    "support_recommendation": ""
}

sentiment_score must be between -1 and 1.
stress_signal_score must be between 0 and 1.

support_recommendation must contain general, non-diagnostic guidance only.
"""


def _clean_text(text: str) -> str:
    text = text.strip()

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text[:Config.MAX_JOURNAL_LENGTH]


def _clamp(
    value: Any,
    minimum: float,
    maximum: float,
    default: float = 0.0,
) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default

    return max(
        minimum,
        min(number, maximum),
    )


def _safe_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    cleaned = []

    for item in value[:10]:
        if isinstance(item, str):
            item = item.strip()

            if item:
                cleaned.append(item[:200])

    return cleaned


def _fallback_analysis(
    reason: str,
) -> dict[str, Any]:
    return {
        "sentiment": "unclear",
        "sentiment_score": 0.0,
        "stress_signal": "unclear",
        "stress_signal_score": 0.0,
        "possible_stressors": [],
        "protective_signals": [],
        "themes": [],
        "summary": (
            "Automated qualitative analysis was unavailable."
        ),
        "uncertainty": reason,
        "support_recommendation": (
            "Consider reviewing the journal entry manually within "
            "the research protocol."
        ),
        "analysis_source": "fallback",
        "model": None,
    }


def _parse_response(
    content: str,
) -> dict[str, Any]:
    content = content.strip()

    if content.startswith("```"):
        content = re.sub(
            r"^```(?:json)?",
            "",
            content,
            flags=re.IGNORECASE,
        )

        content = re.sub(
            r"```$",
            "",
            content,
        )

        content = content.strip()

    result = json.loads(content)

    if not isinstance(result, dict):
        raise ValueError(
            "GROQ response must be a JSON object."
        )

    valid_sentiments = {
        "positive",
        "neutral",
        "negative",
        "mixed",
    }

    valid_stress_signals = {
        "low",
        "moderate",
        "high",
        "unclear",
    }

    sentiment = str(
        result.get("sentiment", "neutral")
    ).lower()

    stress_signal = str(
        result.get("stress_signal", "unclear")
    ).lower()

    if sentiment not in valid_sentiments:
        sentiment = "neutral"

    if stress_signal not in valid_stress_signals:
        stress_signal = "unclear"

    return {
        "sentiment": sentiment,
        "sentiment_score": round(
            _clamp(
                result.get("sentiment_score"),
                -1.0,
                1.0,
            ),
            4,
        ),
        "stress_signal": stress_signal,
        "stress_signal_score": round(
            _clamp(
                result.get("stress_signal_score"),
                0.0,
                1.0,
            ),
            4,
        ),
        "possible_stressors": _safe_list(
            result.get("possible_stressors")
        ),
        "protective_signals": _safe_list(
            result.get("protective_signals")
        ),
        "themes": _safe_list(
            result.get("themes")
        ),
        "summary": str(
            result.get("summary", "")
        )[:800],
        "uncertainty": str(
            result.get("uncertainty", "")
        )[:500],
        "support_recommendation": str(
            result.get(
                "support_recommendation",
                "",
            )
        )[:800],
    }


def analyze_journal(
    journal_text: str,
) -> dict[str, Any]:
    if not isinstance(journal_text, str):
        raise ValueError(
            "Journal text must be a string."
        )

    text = _clean_text(journal_text)

    if not text:
        raise ValueError(
            "Journal text cannot be empty."
        )

    if not Config.ENABLE_GROQ_ANALYSIS:
        return _fallback_analysis(
            "GROQ analysis is disabled."
        )

    if not Config.GROQ_API_KEY:
        return _fallback_analysis(
            "GROQ API key is not configured."
        )

    try:
        client = Groq(
            api_key=Config.GROQ_API_KEY
        )

        response = client.chat.completions.create(
            model=Config.GROQ_MODEL,
            temperature=0.1,
            max_tokens=900,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": (
                        "Analyze the following student journal entry "
                        "according to the research protocol:\n\n"
                        + text
                    ),
                },
            ],
        )

        content = response.choices[0].message.content

        if not content:
            return _fallback_analysis(
                "The language model returned an empty response."
            )

        result = _parse_response(content)

        result["analysis_source"] = "groq"
        result["model"] = Config.GROQ_MODEL

        result["research_note"] = (
            "Journal analysis is supplementary qualitative evidence "
            "and must not be interpreted as a clinical diagnosis."
        )

        return result

    except (
        json.JSONDecodeError,
        ValueError,
        IndexError,
        AttributeError,
    ) as error:
        return _fallback_analysis(
            f"Unable to parse qualitative analysis: "
            f"{type(error).__name__}"
        )

    except Exception as error:
        return _fallback_analysis(
            f"Qualitative analysis service unavailable: "
            f"{type(error).__name__}"
        )