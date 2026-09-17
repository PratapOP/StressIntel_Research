import numpy as np
import pytest

from ml.feature_engineering import FEATURE_NAMES
from ml.predictor import predict_stress


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
    }


def assert_probability_distribution(probabilities):
    assert isinstance(probabilities, dict)
    assert set(probabilities.keys()) == {
        "Low",
        "Medium",
        "High",
    }

    values = list(probabilities.values())

    assert all(
        isinstance(value, (int, float))
        for value in values
    )

    assert all(
        0.0 <= float(value) <= 1.0
        for value in values
    )

    assert np.isclose(
        sum(float(value) for value in values),
        1.0,
        atol=1e-5,
    )


def test_valid_assessment_contains_expected_features():
    payload = valid_assessment()

    assert len(payload) == len(FEATURE_NAMES) - 2

    for feature in FEATURE_NAMES:
        if feature not in {
            "study_sleep_ratio",
            "academic_load_index",
        }:
            assert feature in payload


def test_predict_stress_rejects_non_dictionary():
    with pytest.raises((TypeError, ValueError)):
        predict_stress([])


def test_predict_stress_rejects_none():
    with pytest.raises((TypeError, ValueError)):
        predict_stress(None)


def test_predict_stress_rejects_empty_dictionary():
    with pytest.raises((TypeError, ValueError)):
        predict_stress({})


def test_predict_stress_returns_expected_structure():
    payload = valid_assessment()

    try:
        result = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    assert isinstance(result, dict)

    expected_keys = {
        "risk_level",
        "predicted_class",
        "class_index",
        "confidence",
        "confidence_percentage",
        "probabilities",
        "prediction_entropy",
        "model",
        "interpretation",
        "causality_note",
    }

    assert expected_keys.issubset(result.keys())


def test_prediction_risk_level_is_valid():
    payload = valid_assessment()

    try:
        result = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    assert result["risk_level"] in {
        "low",
        "medium",
        "high",
    }

    assert result["predicted_class"] in {
        "Low",
        "Medium",
        "High",
    }


def test_prediction_class_index_is_valid():
    payload = valid_assessment()

    try:
        result = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    assert result["class_index"] in {
        0,
        1,
        2,
    }


def test_prediction_probabilities_are_calibrated_distribution():
    payload = valid_assessment()

    try:
        result = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    assert_probability_distribution(
        result["probabilities"]
    )


def test_prediction_confidence_matches_probability_scale():
    payload = valid_assessment()

    try:
        result = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    confidence = float(result["confidence"])
    confidence_percentage = float(
        result["confidence_percentage"]
    )

    assert 0.0 <= confidence <= 1.0

    assert 0.0 <= confidence_percentage <= 100.0

    assert np.isclose(
        confidence_percentage,
        confidence * 100.0,
        atol=0.2,
    )


def test_prediction_entropy_is_non_negative():
    payload = valid_assessment()

    try:
        result = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    entropy = float(
        result["prediction_entropy"]
    )

    assert entropy >= 0.0


def test_prediction_model_metadata_is_present():
    payload = valid_assessment()

    try:
        result = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    metadata = result["model"]

    assert isinstance(metadata, dict)

    assert "model_version" in metadata
    assert "model_type" in metadata


def test_prediction_contains_non_causal_interpretation():
    payload = valid_assessment()

    try:
        result = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    assert isinstance(
        result["interpretation"],
        str,
    )
    assert len(result["interpretation"]) > 0

    assert isinstance(
        result["causality_note"],
        str,
    )
    assert len(result["causality_note"]) > 0


def test_prediction_is_deterministic_for_same_input():
    payload = valid_assessment()

    try:
        first = predict_stress(payload)
        second = predict_stress(payload)
    except (FileNotFoundError, OSError):
        pytest.skip(
            "Model artifacts are not available in the test environment."
        )

    assert first["predicted_class"] == second["predicted_class"]
    assert first["class_index"] == second["class_index"]

    for class_name in (
        "Low",
        "Medium",
        "High",
    ):
        assert np.isclose(
            float(first["probabilities"][class_name]),
            float(second["probabilities"][class_name]),
            atol=1e-8,
        )


@pytest.mark.parametrize(
    "field,value",
    [
        ("age", "twenty"),
        ("study_hours", "six"),
        ("sleep_hours", "seven"),
        ("academic_performance", "75%"),
        ("mood_score", None),
    ],
)
def test_prediction_rejects_invalid_feature_types(
    field,
    value,
):
    payload = valid_assessment()
    payload[field] = value

    with pytest.raises((TypeError, ValueError)):
        predict_stress(payload)