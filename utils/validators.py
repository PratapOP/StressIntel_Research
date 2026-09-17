from __future__ import annotations

from typing import Any


# The 21-input research schema.
# Range limits are intentionally explicit so that the model never receives
# physically or semantically impossible values.

FEATURE_RULES = {
    "age": {
        "type": "number",
        "min": 13,
        "max": 100,
    },
    "gender": {
        "type": "string",
        "allowed": [
            "Male",
            "Female",
            "Non-binary",
            "Other",
            "Prefer not to say",
        ],
    },
    "academic_performance": {
        "type": "number",
        "min": 0,
        "max": 100,
    },
    "study_hours": {
        "type": "number",
        "min": 0,
        "max": 24,
    },
    "sleep_hours": {
        "type": "number",
        "min": 0,
        "max": 24,
    },
    "sleep_quality": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "physical_activity_hours": {
        "type": "number",
        "min": 0,
        "max": 24,
    },
    "screen_time_hours": {
        "type": "number",
        "min": 0,
        "max": 24,
    },
    "social_interaction_hours": {
        "type": "number",
        "min": 0,
        "max": 24,
    },
    "academic_pressure": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "financial_stress": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "family_pressure": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "peer_pressure": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "time_management": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "attendance_percentage": {
        "type": "number",
        "min": 0,
        "max": 100,
    },
    "assignment_completion": {
        "type": "number",
        "min": 0,
        "max": 100,
    },
    "exam_anxiety": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "mood_score": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "self_reported_stress": {
        "type": "number",
        "min": 0,
        "max": 10,
    },
    "study_sleep_ratio": {
        "type": "number",
        "min": 0,
        "max": 24,
    },
    "academic_load_index": {
        "type": "number",
        "min": 0,
        "max": 100,
    },
}


REQUIRED_FEATURES = {
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
}


def _is_number(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
    )


def _validate_number(
    feature: str,
    value: Any,
    rule: dict[str, Any],
) -> str | None:
    if not _is_number(value):
        return f"{feature} must be a number."

    minimum = rule.get("min")
    maximum = rule.get("max")

    if minimum is not None and value < minimum:
        return f"{feature} must be at least {minimum}."

    if maximum is not None and value > maximum:
        return f"{feature} must be at most {maximum}."

    return None


def _validate_string(
    feature: str,
    value: Any,
    rule: dict[str, Any],
) -> str | None:
    if not isinstance(value, str):
        return f"{feature} must be a string."

    if not value.strip():
        return f"{feature} cannot be empty."

    allowed = rule.get("allowed")

    if allowed and value not in allowed:
        return (
            f"{feature} must be one of: "
            + ", ".join(allowed)
            + "."
        )

    return None


def validate_assessment(
    data: dict[str, Any],
) -> dict[str, Any]:
    errors: dict[str, str] = {}
    cleaned: dict[str, Any] = {}

    if not isinstance(data, dict):
        return {
            "valid": False,
            "errors": {
                "request": "Assessment data must be a JSON object."
            },
            "data": {},
        }

    missing = REQUIRED_FEATURES - set(data.keys())

    for feature in sorted(missing):
        errors[feature] = "This feature is required."

    for feature, rule in FEATURE_RULES.items():
        if feature not in data:
            continue

        value = data[feature]

        if rule["type"] == "number":
            error = _validate_number(
                feature,
                value,
                rule,
            )

            if error:
                errors[feature] = error
            else:
                cleaned[feature] = float(value)

        elif rule["type"] == "string":
            error = _validate_string(
                feature,
                value,
                rule,
            )

            if error:
                errors[feature] = error
            else:
                cleaned[feature] = value.strip()

    # Derived features are calculated by the feature-engineering layer.
    # Accepting client-supplied values would create a potential schema
    # inconsistency, so they are intentionally excluded here.

    unexpected = set(data.keys()) - set(FEATURE_RULES.keys())

    # Allow metadata without passing it to the model.
    allowed_metadata = {
        "consent",
        "participant_id",
        "session_id",
    }

    unexpected -= allowed_metadata

    if unexpected:
        errors["_request"] = (
            "Unexpected fields: "
            + ", ".join(sorted(unexpected))
        )

    if "consent" in data:
        if data["consent"] is not True:
            errors["consent"] = (
                "Explicit consent is required for assessment processing."
            )
        else:
            cleaned["consent"] = True

    for field in allowed_metadata - {"consent"}:
        if field in data and isinstance(data[field], str):
            cleaned[field] = data[field].strip()[:100]

    return {
        "valid": not errors,
        "errors": errors,
        "data": cleaned,
    }