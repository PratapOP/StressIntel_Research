from __future__ import annotations

from typing import Any

import numpy as np

from ml.model_loader import get_calibrator


def _normalize_probabilities(
    probabilities: Any,
) -> np.ndarray:
    values = np.asarray(probabilities, dtype=np.float64)

    if values.ndim == 1:
        values = values.reshape(1, -1)

    if values.ndim != 2:
        raise ValueError(
            "Probabilities must be a one- or two-dimensional array."
        )

    values = np.nan_to_num(
        values,
        nan=0.0,
        posinf=0.0,
        neginf=0.0,
    )

    row_sums = values.sum(axis=1, keepdims=True)

    zero_rows = row_sums.squeeze(axis=1) <= 0

    if np.any(zero_rows):
        values[zero_rows] = 1.0 / values.shape[1]
        row_sums = values.sum(axis=1, keepdims=True)

    return values / row_sums


def calibrate_probabilities(
    probabilities: Any,
) -> np.ndarray:
    probabilities = _normalize_probabilities(probabilities)

    calibrator = get_calibrator()

    if calibrator is None:
        return probabilities

    try:
        if hasattr(calibrator, "predict_proba"):
            calibrated = calibrator.predict_proba(
                probabilities
            )
        elif hasattr(calibrator, "transform"):
            calibrated = calibrator.transform(
                probabilities
            )
        elif callable(calibrator):
            calibrated = calibrator(
                probabilities
            )
        else:
            return probabilities

        return _normalize_probabilities(calibrated)

    except Exception:
        return probabilities


def get_prediction_confidence(
    probabilities: Any,
) -> float:
    probabilities = _normalize_probabilities(
        probabilities
    )

    confidence = float(
        np.max(probabilities[0])
    )

    return round(confidence, 6)


def calculate_entropy(
    probabilities: Any,
) -> float:
    probabilities = _normalize_probabilities(
        probabilities
    )

    values = probabilities[0]

    entropy = -np.sum(
        values * np.log(
            np.clip(values, 1e-12, 1.0)
        )
    )

    return round(float(entropy), 6)


def get_calibration_metadata() -> dict[str, Any]:
    calibrator = get_calibrator()

    return {
        "calibration_available": calibrator is not None,
        "method": (
            type(calibrator).__name__
            if calibrator is not None
            else "uncalibrated"
        ),
    }