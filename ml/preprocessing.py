from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from config.settings import Config
from ml.feature_engineering import build_feature_dataframe


class StressPreprocessor:
    def __init__(self, artifact_path: str | None = None):
        self.artifact_path = Path(
            artifact_path or Config.PREPROCESSOR_PATH
        )
        self.transformer = None
        self.feature_names: list[str] = []

    def load(self) -> None:
        if not self.artifact_path.exists():
            raise FileNotFoundError(
                f"Preprocessor artifact not found: {self.artifact_path}"
            )

        self.transformer = joblib.load(self.artifact_path)

        if hasattr(self.transformer, "feature_names_in_"):
            self.feature_names = list(
                self.transformer.feature_names_in_
            )

    def _ensure_loaded(self) -> None:
        if self.transformer is None:
            self.load()

    def transform(
        self,
        data: dict[str, Any],
    ):
        self._ensure_loaded()

        dataframe = build_feature_dataframe(data)

        if self.feature_names:
            missing = [
                feature
                for feature in self.feature_names
                if feature not in dataframe.columns
            ]

            if missing:
                raise ValueError(
                    f"Missing preprocessing features: {missing}"
                )

            dataframe = dataframe[self.feature_names]

        return self.transformer.transform(dataframe)


_preprocessor: StressPreprocessor | None = None


def get_preprocessor() -> StressPreprocessor:
    global _preprocessor

    if _preprocessor is None:
        _preprocessor = StressPreprocessor()

    return _preprocessor


def preprocess(
    data: dict[str, Any],
):
    return get_preprocessor().transform(data)