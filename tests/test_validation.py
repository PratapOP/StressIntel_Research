import pytest

from utils.validators import (
    REQUIRED_FEATURES,
    validate_assessment,
    validate_journal,
)


def valid_assessment():
    return {
        "age": 21,
        "gender": "Male",
        "academic_performance": 75,
        "study_hours": 6,
        "sleep_hours": 7,
        "sleep_quality": 7,
        "physical_activity_hours": 1,
        "screen_time_hours": 6,
        "social_interaction_hours": 3,
        "academic_pressure": 6,
        "financial_stress": 3,
        "family_pressure": 4,
        "peer_pressure": 3,
        "time_management": 7,
        "attendance_percentage": 85,
        "assignment_completion": 80,
        "exam_anxiety": 5,
        "mood_score": 7,
        "self_reported_stress": 5,
        "consent": True,
    }


def test_valid_assessment_passes():
    payload = valid_assessment()

    result = validate_assessment(payload)

    assert result["valid"] is True
    assert result["errors"] == []


def test_missing_required_feature_fails():
    payload = valid_assessment()
    payload.pop("sleep_hours")

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any(
        "sleep_hours" in error
        for error in result["errors"]
    )


def test_multiple_required_features_are_present():
    payload = valid_assessment()

    missing = [
        feature
        for feature in REQUIRED_FEATURES
        if feature not in payload
    ]

    assert missing == []


def test_age_range_is_validated():
    payload = valid_assessment()
    payload["age"] = 5

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any("age" in error for error in result["errors"])


def test_academic_performance_range_is_validated():
    payload = valid_assessment()
    payload["academic_performance"] = 150

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any(
        "academic_performance" in error
        for error in result["errors"]
    )


def test_sleep_hours_range_is_validated():
    payload = valid_assessment()
    payload["sleep_hours"] = 30

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any(
        "sleep_hours" in error
        for error in result["errors"]
    )


def test_gender_values_are_restricted():
    payload = valid_assessment()
    payload["gender"] = "InvalidGender"

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any(
        "gender" in error
        for error in result["errors"]
    )


def test_unexpected_fields_are_rejected():
    payload = valid_assessment()
    payload["unexpected_field"] = "malicious-input"

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any(
        "unexpected_field" in error
        for error in result["errors"]
    )


def test_non_object_assessment_is_rejected():
    result = validate_assessment([])

    assert result["valid"] is False
    assert len(result["errors"]) > 0


def test_consent_false_is_rejected_when_provided():
    payload = valid_assessment()
    payload["consent"] = False

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any(
        "consent" in error.lower()
        for error in result["errors"]
    )


def test_consent_true_is_accepted():
    payload = valid_assessment()
    payload["consent"] = True

    result = validate_assessment(payload)

    assert result["valid"] is True


def test_journal_accepts_valid_text():
    result = validate_journal(
        "I have been feeling somewhat stressed about my upcoming exams."
    )

    assert result["valid"] is True
    assert result["errors"] == []


def test_journal_accepts_empty_text():
    result = validate_journal("")

    assert result["valid"] is True


def test_journal_rejects_non_string():
    result = validate_journal(12345)

    assert result["valid"] is False
    assert len(result["errors"]) > 0


def test_journal_rejects_excessively_long_text():
    journal = "A" * 5001

    result = validate_journal(journal)

    assert result["valid"] is False
    assert len(result["errors"]) > 0


def test_journal_accepts_maximum_length():
    journal = "A" * 5000

    result = validate_journal(journal)

    assert result["valid"] is True


@pytest.mark.parametrize(
    "field,value",
    [
        ("study_hours", -1),
        ("sleep_hours", -1),
        ("sleep_quality", -1),
        ("physical_activity_hours", -1),
        ("screen_time_hours", -1),
        ("social_interaction_hours", -1),
        ("academic_pressure", -1),
        ("financial_stress", -1),
        ("family_pressure", -1),
        ("peer_pressure", -1),
        ("time_management", -1),
        ("attendance_percentage", -1),
        ("assignment_completion", -1),
        ("exam_anxiety", -1),
        ("mood_score", -1),
        ("self_reported_stress", -1),
    ],
)
def test_negative_values_are_rejected(field, value):
    payload = valid_assessment()
    payload[field] = value

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any(
        field in error
        for error in result["errors"]
    )


@pytest.mark.parametrize(
    "field,value",
    [
        ("sleep_quality", 11),
        ("academic_pressure", 11),
        ("financial_stress", 11),
        ("family_pressure", 11),
        ("peer_pressure", 11),
        ("time_management", 11),
        ("exam_anxiety", 11),
        ("mood_score", 11),
        ("self_reported_stress", 11),
    ],
)
def test_ten_point_scale_fields_reject_values_above_ten(
    field,
    value,
):
    payload = valid_assessment()
    payload[field] = value

    result = validate_assessment(payload)

    assert result["valid"] is False
    assert any(
        field in error
        for error in result["errors"]
    )