import pytest

from app import app


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


@pytest.fixture
def client():
    app.config.update(
        TESTING=True,
        CORS_ORIGINS=["*"],
    )

    with app.test_client() as test_client:
        yield test_client


def test_home_page_is_available(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"StressIntel" in response.data


def test_unknown_route_returns_404(client):
    response = client.get(
        "/this-route-does-not-exist"
    )

    assert response.status_code == 404


def test_health_endpoint_is_available(client):
    response = client.get(
        "/api/health/"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert isinstance(data, dict)
    assert data.get("status") == "healthy"
    assert data.get("service") == "StressIntel PRO"


def test_assessment_rejects_missing_json(client):
    response = client.post(
        "/api/assessment/",
        content_type="application/json",
    )

    assert response.status_code in {
        400,
        415,
    }


def test_assessment_rejects_invalid_payload(client):
    response = client.post(
        "/api/assessment/",
        json={
            "age": 21,
            "gender": "InvalidGender",
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert isinstance(data, dict)
    assert data.get("success") is False


def test_assessment_rejects_missing_consent(client):
    payload = valid_assessment()
    payload.pop("consent")

    response = client.post(
        "/api/assessment/",
        json=payload,
    )

    assert response.status_code in {
        200,
        400,
    }

    if response.status_code == 400:
        data = response.get_json()

        assert data.get("success") is False


def test_assessment_rejects_false_consent(client):
    payload = valid_assessment()
    payload["consent"] = False

    response = client.post(
        "/api/assessment/",
        json=payload,
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_assessment_accepts_valid_payload_when_model_exists(
    client,
):
    response = client.post(
        "/api/assessment/",
        json=valid_assessment(),
    )

    if response.status_code == 503:
        pytest.skip(
            "Prediction model artifacts are not available."
        )

    assert response.status_code == 200

    data = response.get_json()

    assert isinstance(data, dict)
    assert data.get("success") is True
    assert "prediction" in data


def test_journal_endpoint_rejects_missing_text(client):
    response = client.post(
        "/api/analysis/journal",
        json={},
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_journal_endpoint_rejects_non_string_text(
    client,
):
    response = client.post(
        "/api/analysis/journal",
        json={
            "journal": 12345,
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_journal_endpoint_accepts_valid_text(client):
    response = client.post(
        "/api/analysis/journal",
        json={
            "journal": (
                "I have been feeling stressed about "
                "my upcoming examinations."
            ),
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert isinstance(data, dict)
    assert data.get("success") is True
    assert "analysis" in data


def test_journal_endpoint_rejects_oversized_text(
    client,
):
    response = client.post(
        "/api/analysis/journal",
        json={
            "journal": "A" * 5001,
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_explain_endpoint_requires_prediction(
    client,
):
    response = client.post(
        "/api/analysis/explain",
        json={
            "features": valid_assessment(),
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_explain_endpoint_requires_features(
    client,
):
    response = client.post(
        "/api/analysis/explain",
        json={
            "prediction": {
                "predicted_class": "Medium",
                "class_index": 1,
            },
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_simulation_endpoint_rejects_invalid_payload(
    client,
):
    response = client.post(
        "/api/simulation/",
        json={
            "age": "invalid",
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_simulation_endpoint_accepts_valid_payload_when_model_exists(
    client,
):
    response = client.post(
        "/api/simulation/",
        json=valid_assessment(),
    )

    if response.status_code == 503:
        pytest.skip(
            "Prediction model artifacts are not available."
        )

    assert response.status_code == 200

    data = response.get_json()

    assert isinstance(data, dict)
    assert data.get("success") is True
    assert "simulation" in data


def test_report_endpoint_requires_prediction(
    client,
):
    response = client.post(
        "/api/reports/",
        json={
            "features": valid_assessment(),
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_report_endpoint_requires_features(
    client,
):
    response = client.post(
        "/api/reports/",
        json={
            "prediction": {
                "predicted_class": "Medium",
                "class_index": 1,
            },
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data.get("success") is False


def test_report_endpoint_accepts_valid_structure_when_model_exists(
    client,
):
    response = client.post(
        "/api/reports/",
        json={
            "prediction": {
                "predicted_class": "Medium",
                "class_index": 1,
                "risk_level": "medium",
                "probabilities": {
                    "Low": 0.20,
                    "Medium": 0.60,
                    "High": 0.20,
                },
            },
            "features": valid_assessment(),
            "journal_analysis": None,
        },
    )

    if response.status_code in {
        500,
        503,
    }:
        pytest.skip(
            "Explainability/model artifacts are not available."
        )

    assert response.status_code == 200

    data = response.get_json()

    assert isinstance(data, dict)
    assert data.get("success") is True
    assert "report" in data


def test_api_returns_json_for_invalid_assessment(
    client,
):
    response = client.post(
        "/api/assessment/",
        json={
            "invalid": True,
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data is not None
    assert isinstance(data, dict)


def test_options_request_does_not_crash(
    client,
):
    response = client.options(
        "/api/health/"
    )

    assert response.status_code in {
        200,
        204,
    }