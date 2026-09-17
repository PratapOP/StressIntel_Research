from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from ml.explainability import explain_prediction

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/", methods=["POST"])
def generate_report():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    prediction = data.get("prediction")
    features = data.get("features", {})
    journal_analysis = data.get("journal_analysis")

    if prediction is None:
        return jsonify({
            "success": False,
            "error": "Prediction is required."
        }), 400

    if not isinstance(features, dict):
        return jsonify({
            "success": False,
            "error": "Features must be provided as an object."
        }), 400

    try:
        explanation = explain_prediction(
            features=features,
            prediction=prediction
        )

        report = {
            "report_metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "platform": "StressIntel PRO",
                "report_version": "1.0.0",
                "model_version": prediction.get(
                    "model_version",
                    "unknown"
                ) if isinstance(prediction, dict) else "unknown"
            },
            "prediction": prediction,
            "feature_explanation": explanation,
            "journal_analysis": journal_analysis,
            "research_interpretation": {
                "interpretation": (
                    "The prediction represents a model-estimated stress-risk "
                    "category based on the supplied assessment features."
                ),
                "causality_warning": (
                    "Feature contributions describe associations within the "
                    "trained model and do not establish causal relationships."
                ),
                "clinical_warning": (
                    "This platform is intended for research and decision "
                    "support. It is not a medical diagnostic system."
                )
            }
        }

        return jsonify({
            "success": True,
            "report": report
        }), 200

    except FileNotFoundError:
        return jsonify({
            "success": False,
            "error": "Model required for report generation is unavailable.",
            "code": "REPORT_MODEL_NOT_FOUND"
        }), 503

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to generate research report.",
            "code": "REPORT_GENERATION_ERROR"
        }), 500