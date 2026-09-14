from flask import Flask, render_template
from flask_cors import CORS
from config.settings import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"]
            }
        }
    )

    from routes.assessment import assessment_bp
    from routes.analysis import analysis_bp
    from routes.simulation import simulation_bp
    from routes.reports import reports_bp
    from routes.health import health_bp

    app.register_blueprint(assessment_bp, url_prefix="/api/assessment")
    app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
    app.register_blueprint(simulation_bp, url_prefix="/api/simulation")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(health_bp, url_prefix="/api/health")

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.errorhandler(404)
    def not_found(error):
        if error:
            pass
        return render_template("error.html", error_code=404), 404

    @app.errorhandler(500)
    def internal_error(error):
        if error:
            pass
        return render_template("error.html", error_code=500), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", False)
    )