from flask import Blueprint, jsonify, request

from ml.predictor import predict_stress
from utils.validators import validate_assessment

assessment_bp = Blueprint("assessment", __name__)


@assessment_bp.route("/", methods=["POST"])
def assess():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    validation = validate_assessment(data)

    if not validation["valid"]:
        return jsonify({
            "success": False,
            "error": "Assessment validation failed.",
            "details": validation["errors"]
        }), 400

    try:
        result = predict_stress(validation["data"])

        return jsonify({
            "success": True,
            "result": result
        }), 200

    except FileNotFoundError:
        return jsonify({
            "success": False,
            "error": "Stress prediction model is not available.",
            "code": "MODEL_NOT_FOUND"
        }), 503

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to process the assessment.",
            "code": "ASSESSMENT_PROCESSING_ERROR"
        }), 500