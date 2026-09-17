from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import xgboost as xgb

from config.settings import Config


class ModelLoader:
    def __init__(
        self,
        model_path: str | None = None,
        calibrator_path: str | None = None,
    ):
        self.model_path = Path(
            model_path or Config.MODEL_PATH
        )
        self.calibrator_path = Path(
            calibrator_path or Config.CALIBRATOR_PATH
        )

        self.model: Any = None
        self.calibrator: Any = None

    def load_model(self):
        if self.model is not None:
            return self.model

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model artifact not found: {self.model_path}"
            )

        model = xgb.XGBClassifier()

        model.load_model(str(self.model_path))

        self.model = model

        return self.model

    def load_calibrator(self):
        if self.calibrator is not None:
            return self.calibrator

        if not self.calibrator_path.exists():
            return None

        self.calibrator = joblib.load(
            self.calibrator_path
        )

        return self.calibrator

    def get_model(self):
        return self.load_model()

    def get_calibrator(self):
        return self.load_calibrator()

    def get_artifact_metadata(self) -> dict[str, Any]:
        model = self.get_model()

        metadata = {
            "model_version": Config.MODEL_VERSION,
            "model_type": "XGBoost",
            "classes": list(
                getattr(
                    model,
                    "classes_",
                    Config.STRESS_CLASSES
                )
            ),
        }

        booster = getattr(model, "get_booster", lambda: None)()

        if booster is not None:
            metadata["booster_type"] = booster.attributes().get(
                "booster_type",
                "gradient_boosting"
            )

        return metadata


_loader: ModelLoader | None = None


def get_model_loader() -> ModelLoader:
    global _loader

    if _loader is None:
        _loader = ModelLoader()

    return _loader


def get_model():
    return get_model_loader().get_model()


def get_calibrator():
    return get_model_loader().get_calibrator()


def get_model_metadata():
    return get_model_loader().get_artifact_metadata()