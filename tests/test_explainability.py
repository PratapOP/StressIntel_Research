import numpy as np
import pytest

from ml.explainability import (
    explain_prediction,
    get_global_feature_importance,
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
    }


def test_explain_prediction_rejects_invalid_features():
    with pytest.raises((TypeError, ValueError)):
        explain_prediction(
            {
                "prediction": "invalid",
            }
        )


def test_explain_prediction_rejects_missing_prediction():
    payload = valid_assessment()

    with pytest.raises((TypeError, ValueError)):
        explain_prediction(
            None,
            payload,
        )


def test_explain_prediction_returns_expected_structure():
    payload = valid_assessment()

    prediction = {
        "predicted_class": "Medium",
        "class_index": 1,
        "risk_level": "medium",
        "probabilities": {
            "Low": 0.20,
            "Medium": 0.60,
            "High": 0.20,
        },
    }

    try:
        result = explain_prediction(
            prediction,
            payload,
        )
    except (FileNotFoundError, OSError, ImportError):
        pytest.skip(
            "Model artifacts or SHAP dependencies are unavailable."
        )

    assert isinstance(result, dict)

    expected_keys = {
        "top_risk_drivers",
        "protective_factors",
        "all_contributions",
    }

    assert expected_keys.issubset(result.keys())


def test_explanation_driver_lists_have_valid_structure():
    payload = valid_assessment()

    prediction = {
        "predicted_class": "High",
        "class_index": 2,
        "risk_level": "high",
        "probabilities": {
            "Low": 0.05,
            "Medium": 0.20,
            "High": 0.75,
        },
    }

    try:
        result = explain_prediction(
            prediction,
            payload,
        )
    except (FileNotFoundError, OSError, ImportError):
        pytest.skip(
            "Model artifacts or SHAP dependencies are unavailable."
        )

    for key in (
        "top_risk_drivers",
        "protective_factors",
    ):
        assert isinstance(result[key], list)

        for item in result[key]:
            assert isinstance(item, dict)

            assert (
                "feature" in item
                or "feature_name" in item
            )

            assert (
                "shap_value" in item
                or "value" in item
                or "contribution" in item
            )


def test_all_contributions_are_numeric_when_available():
    payload = valid_assessment()

    prediction = {
        "predicted_class": "Medium",
        "class_index": 1,
        "risk_level": "medium",
        "probabilities": {
            "Low": 0.25,
            "Medium": 0.50,
            "High": 0.25,
        },
    }

    try:
        result = explain_prediction(
            prediction,
            payload,
        )
    except (FileNotFoundError, OSError, ImportError):
        pytest.skip(
            "Model artifacts or SHAP dependencies are unavailable."
        )

    contributions = result.get(
        "all_contributions",
        [],
    )

    assert isinstance(contributions, list)

    for item in contributions:
        if "shap_value" in item:
            assert np.isfinite(
                float(item["shap_value"])
            )

        if "contribution" in item:
            assert np.isfinite(
                float(item["contribution"])
            )


def test_global_feature_importance_returns_list():
    try:
        result = get_global_feature_importance()
    except (FileNotFoundError, OSError, ImportError):
        pytest.skip(
            "Model artifacts or SHAP dependencies are unavailable."
        )

    assert isinstance(result, list)


def test_global_feature_importance_has_feature_names():
    try:
        result = get_global_feature_importance()
    except (FileNotFoundError, OSError, ImportError):
        pytest.skip(
            "Model artifacts or SHAP dependencies are unavailable."
        )

    for item in result:
        assert isinstance(item, dict)

        assert (
            "feature" in item
            or "feature_name" in item
        )

        importance_key = None

        for key in (
            "importance",
            "mean_abs_shap",
            "value",
            "score",
        ):
            if key in item:
                importance_key = key
                break

        if importance_key is not None:
            assert np.isfinite(
                float(item[importance_key])
            )


def test_global_feature_importance_is_non_negative():
    try:
        result = get_global_feature_importance()
    except (FileNotFoundError, OSError, ImportError):
        pytest.skip(
            "Model artifacts or SHAP dependencies are unavailable."
        )

    for item in result:
        for key in (
            "importance",
            "mean_abs_shap",
            "score",
        ):
            if key in item:
                assert float(item[key]) >= 0.0


def test_explanation_does_not_claim_causality():
    payload = valid_assessment()

    prediction = {
        "predicted_class": "High",
        "class_index": 2,
        "risk_level": "high",
        "probabilities": {
            "Low": 0.05,
            "Medium": 0.15,
            "High": 0.80,
        },
    }

    try:
        result = explain_prediction(
            prediction,
            payload,
        )
    except (FileNotFoundError, OSError, ImportError):
        pytest.skip(
            "Model artifacts or SHAP dependencies are unavailable."
        )

    serialized = str(result).lower()

    causal_phrases = (
        "causes",
        "caused by",
        "will cause",
        "directly causes",
    )

    assert not any(
        phrase in serialized
        for phrase in causal_phrases
    )


def test_explanation_is_repeatable_for_same_input():
    payload = valid_assessment()

    prediction = {
        "predicted_class": "Medium",
        "class_index": 1,
        "risk_level": "medium",
        "probabilities": {
            "Low": 0.20,
            "Medium": 0.60,
            "High": 0.20,
        },
    }

    try:
        first = explain_prediction(
            prediction,
            payload,
        )
        second = explain_prediction(
            prediction,
            payload,
        )
    except (FileNotFoundError, OSError, ImportError):
        pytest.skip(
            "Model artifacts or SHAP dependencies are unavailable."
        )

    assert (
        first["top_risk_drivers"]
        == second["top_risk_drivers"]
    )

    assert (
        first["protective_factors"]
        == second["protective_factors"]
    )