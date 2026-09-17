from flask import Flask, render_template
from flask_cors import CORS

from config.settings import Config
from utils.security import add_security_headers


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ---------------------------------------------------------
    # CORS
    # ---------------------------------------------------------
    cors_origins = app.config.get("CORS_ORIGINS", ["*"])

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": cors_origins
            }
        }
    )

    # ---------------------------------------------------------
    # Security Headers
    # ---------------------------------------------------------
    @app.after_request
    def apply_security_headers(response):
        return add_security_headers(response)

    # ---------------------------------------------------------
    # API Blueprints
    # ---------------------------------------------------------
    from routes.assessment import assessment_bp
    from routes.analysis import analysis_bp
    from routes.simulation import simulation_bp
    from routes.reports import reports_bp
    from routes.health import health_bp

    app.register_blueprint(
        assessment_bp,
        url_prefix="/api/assessment"
    )

    app.register_blueprint(
        analysis_bp,
        url_prefix="/api/analysis"
    )

    app.register_blueprint(
        simulation_bp,
        url_prefix="/api/simulation"
    )

    app.register_blueprint(
        reports_bp,
        url_prefix="/api/reports"
    )

    app.register_blueprint(
        health_bp,
        url_prefix="/api/health"
    )

    # ---------------------------------------------------------
    # Frontend Pages
    # ---------------------------------------------------------
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/assessment")
    def assessment():
        return render_template("assessment.html")

    @app.route("/results")
    def results():
        return render_template("results.html")

    @app.route("/simulation")
    def simulation():
        return render_template("simulation.html")

    @app.route("/research")
    def research():
        return render_template("research.html")

    @app.route("/report")
    def report():
        return render_template("report.html")

    # ---------------------------------------------------------
    # Error Handlers
    # ---------------------------------------------------------
    @app.errorhandler(404)
    def not_found(error):
        return render_template(
            "error.html",
            error_code=404
        ), 404

    @app.errorhandler(500)
    def internal_error(error):
        return render_template(
            "error.html",
            error_code=500
        ), 500

    @app.errorhandler(413)
    def request_too_large(error):
        return render_template(
            "error.html",
            error_code=413
        ), 413

    return app


# -------------------------------------------------------------
# Application Instance
# -------------------------------------------------------------
app = create_app()


# -------------------------------------------------------------
# Local Development
# -------------------------------------------------------------
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", False)
    )