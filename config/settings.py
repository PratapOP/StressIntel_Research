import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")

    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv(
        "GROQ_MODEL",
        "llama-3.3-70b-versatile"
    )

    MODEL_PATH = os.getenv(
        "MODEL_PATH",
        "models/stressintel_xgboost.json"
    )

    PREPROCESSOR_PATH = os.getenv(
        "PREPROCESSOR_PATH",
        "models/stressintel_preprocessor.joblib"
    )

    CALIBRATOR_PATH = os.getenv(
        "CALIBRATOR_PATH",
        "models/stressintel_calibrator.joblib"
    )

    MODEL_VERSION = os.getenv(
        "MODEL_VERSION",
        "stressintel-xgb-v1.0.0"
    )

    MAX_CONTENT_LENGTH = 2 * 1024 * 1024

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "*"
        ).split(",")
        if origin.strip()
    ]

    JSON_SORT_KEYS = False

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv(
        "SESSION_COOKIE_SECURE",
        "false"
    ).lower() == "true"

    SEND_FILE_MAX_AGE_DEFAULT = 31536000

    STRESS_CLASSES = [
        "Low",
        "Medium",
        "High"
    ]

    FEATURE_COUNT = 21

    MAX_JOURNAL_LENGTH = 5000

    ENABLE_WEBCAM = os.getenv(
        "ENABLE_WEBCAM",
        "false"
    ).lower() == "true"

    ENABLE_RESEARCH_ANALYTICS = os.getenv(
        "ENABLE_RESEARCH_ANALYTICS",
        "true"
    ).lower() == "true"

    ENABLE_GROQ_ANALYSIS = os.getenv(
        "ENABLE_GROQ_ANALYSIS",
        "true"
    ).lower() == "true"

    ENVIRONMENT = os.getenv(
        "FLASK_ENV",
        "development"
    )

    APP_NAME = "StressIntel PRO"

    APP_VERSION = "1.0.0"

    RESEARCH_DISCLAIMER = (
        "StressIntel PRO provides research-oriented stress-risk estimates "
        "and is not a medical diagnostic device. Model explanations describe "
        "associations in the trained model and do not establish causality."
    )