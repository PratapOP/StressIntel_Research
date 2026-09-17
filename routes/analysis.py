from flask import Blueprint, jsonify, request

from ml.sentiment import analyze_journal
from ml.explainability import explain_prediction

analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/journal", methods=["POST"])
def journal_analysis():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    journal_text = data.get("journal_text", "")

    if not isinstance(journal_text, str):
        return jsonify({
            "success": False,
            "error": "journal_text must be a string."
        }), 400

    journal_text = journal_text.strip()

    if not journal_text:
        return jsonify({
            "success": False,
            "error": "Journal text cannot be empty."
        }), 400

    if len(journal_text) > 5000:
        return jsonify({
            "success": False,
            "error": "Journal text exceeds the 5000-character limit."
        }), 413

    try:
        result = analyze_journal(journal_text)

        return jsonify({
            "success": True,
            "result": result
        }), 200

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to analyze journal text.",
            "code": "JOURNAL_ANALYSIS_ERROR"
        }), 500


@analysis_bp.route("/explain", methods=["POST"])
def explain():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    prediction = data.get("prediction")
    features = data.get("features")

    if prediction is None or not isinstance(features, dict):
        return jsonify({
            "success": False,
            "error": "Both prediction and features are required."
        }), 400

    try:
        result = explain_prediction(
            features=features,
            prediction=prediction
        )

        return jsonify({
            "success": True,
            "result": result
        }), 200

    except FileNotFoundError:
        return jsonify({
            "success": False,
            "error": "Model required for SHAP explanation is unavailable.",
            "code": "EXPLAINABILITY_MODEL_NOT_FOUND"
        }), 503

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to generate SHAP explanation.",
            "code": "EXPLANATION_ERROR"
        }), 500