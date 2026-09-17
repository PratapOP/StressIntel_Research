from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


FEATURE_NAMES = [
    "age",
    "gender",
    "academic_performance",
    "study_hours",
    "sleep_hours",
    "sleep_quality",
    "physical_activity_hours",
    "screen_time_hours",
    "social_interaction_hours",
    "academic_pressure",
    "financial_stress",
    "family_pressure",
    "peer_pressure",
    "time_management",
    "attendance_percentage",
    "assignment_completion",
    "exam_anxiety",
    "mood_score",
    "self_reported_stress",
    "study_sleep_ratio",
    "academic_load_index",
]


NUMERIC_FEATURES = [
    "age",
    "academic_performance",
    "study_hours",
    "sleep_hours",
    "sleep_quality",
    "physical_activity_hours",
    "screen_time_hours",
    "social_interaction_hours",
    "academic_pressure",
    "financial_stress",
    "family_pressure",
    "peer_pressure",
    "time_management",
    "attendance_percentage",
    "assignment_completion",
    "exam_anxiety",
    "mood_score",
    "self_reported_stress",
    "study_sleep_ratio",
    "academic_load_index",
]


CATEGORICAL_FEATURES = [
    "gender",
]


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        result = float(value)

        if not np.isfinite(result):
            return default

        return result
    except (TypeError, ValueError):
        return default


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def calculate_study_sleep_ratio(
    study_hours: Any,
    sleep_hours: Any,
) -> float:
    study = max(_safe_float(study_hours), 0.0)
    sleep = max(_safe_float(sleep_hours), 0.0)

    if sleep <= 0:
        return study

    return round(study / sleep, 4)


def calculate_academic_load_index(
    study_hours: Any,
    academic_pressure: Any,
    exam_anxiety: Any,
    attendance_percentage: Any,
    assignment_completion: Any,
) -> float:
    study = _clamp(_safe_float(study_hours), 0.0, 24.0)
    pressure = _clamp(_safe_float(academic_pressure), 0.0, 10.0)
    anxiety = _clamp(_safe_float(exam_anxiety), 0.0, 10.0)
    attendance = _clamp(
        _safe_float(attendance_percentage),
        0.0,
        100.0,
    )
    completion = _clamp(
        _safe_float(assignment_completion),
        0.0,
        100.0,
    )

    study_component = (study / 24.0) * 100.0
    pressure_component = pressure * 10.0
    anxiety_component = anxiety * 10.0
    attendance_gap = 100.0 - attendance
    completion_gap = 100.0 - completion

    index = (
        study_component * 0.25
        + pressure_component * 0.30
        + anxiety_component * 0.20
        + attendance_gap * 0.10
        + completion_gap * 0.15
    )

    return round(_clamp(index, 0.0, 100.0), 4)


def engineer_features(data: dict[str, Any]) -> dict[str, Any]:
    features = dict(data)

    features["study_sleep_ratio"] = calculate_study_sleep_ratio(
        features.get("study_hours"),
        features.get("sleep_hours"),
    )

    features["academic_load_index"] = calculate_academic_load_index(
        features.get("study_hours"),
        features.get("academic_pressure"),
        features.get("exam_anxiety"),
        features.get("attendance_percentage"),
        features.get("assignment_completion"),
    )

    return features


def build_feature_dataframe(
    data: dict[str, Any],
) -> pd.DataFrame:
    engineered = engineer_features(data)

    row: dict[str, Any] = {}

    for feature in FEATURE_NAMES:
        value = engineered.get(feature)

        if feature in NUMERIC_FEATURES:
            row[feature] = _safe_float(value)
        else:
            row[feature] = value if value is not None else "Unknown"

    dataframe = pd.DataFrame([row])

    return dataframe


def build_feature_vector(
    data: dict[str, Any],
) -> np.ndarray:
    dataframe = build_feature_dataframe(data)

    numeric_values = []

    for feature in FEATURE_NAMES:
        if feature in CATEGORICAL_FEATURES:
            continue

        numeric_values.append(
            _safe_float(dataframe.iloc[0][feature])
        )

    return np.asarray(
        numeric_values,
        dtype=np.float64,
    ).reshape(1, -1)


def get_engineered_features(
    data: dict[str, Any],
) -> dict[str, float]:
    engineered = engineer_features(data)

    return {
        "study_sleep_ratio": _safe_float(
            engineered.get("study_sleep_ratio")
        ),
        "academic_load_index": _safe_float(
            engineered.get("academic_load_index")
        ),
    }