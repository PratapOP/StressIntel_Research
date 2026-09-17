from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": current_app.config["APP_NAME"],
        "version": current_app.config["APP_VERSION"],
        "environment": current_app.config["ENVIRONMENT"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200