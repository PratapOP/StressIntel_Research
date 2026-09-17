from __future__ import annotations

from typing import Any

import numpy as np

from config.settings import Config
from ml.calibration import (
    calibrate_probabilities,
    calculate_entropy,
    get_prediction_confidence,
)
from ml.model_loader import get_model, get_model_metadata
from ml.preprocessing import preprocess


def _to_serializable(value: Any) -> Any:
    if isinstance(value, np.generic):
        return value.item()

    if isinstance(value, np.ndarray):
        return value.tolist()

    return value


def _get_class_names(model: Any) -> list[str]:
    classes = getattr(model, "classes_", None)

    if classes is None:
        return Config.STRESS_CLASSES.copy()

    result = []

    for value in classes:
        try:
            index = int(value)

            if 0 <= index < len(Config.STRESS_CLASSES):
                result.append(Config.STRESS_CLASSES[index])
            else:
                result.append(str(value))

        except (TypeError, ValueError):
            result.append(str(value))

    return result


def _get_prediction_index(
    prediction: Any,
    class_names: list[str],
) -> int:
    try:
        prediction_int = int(prediction)

        if 0 <= prediction_int < len(class_names):
            return prediction_int
    except (TypeError, ValueError):
        pass

    prediction_string = str(prediction).strip().lower()

    for index, class_name in enumerate(class_names):
        if prediction_string == class_name.lower():
            return index

    return 0


def _build_probability_map(
    probabilities: np.ndarray,
    class_names: list[str],
) -> dict[str, float]:
    values = probabilities[0]

    return {
        class_names[index]: round(float(value), 6)
        for index, value in enumerate(values)
        if index < len(class_names)
    }


def predict_stress(
    data: dict[str, Any],
) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise ValueError("Prediction input must be a dictionary.")

    model = get_model()

    transformed_data = preprocess(data)

    raw_prediction = model.predict(transformed_data)

    if len(raw_prediction) == 0:
        raise ValueError("Model returned an empty prediction.")

    prediction_value = _to_serializable(
        raw_prediction[0]
    )

    class_names = _get_class_names(model)

    class_index = _get_prediction_index(
        prediction_value,
        class_names,
    )

    predicted_label = class_names[class_index]

    if not hasattr(model, "predict_proba"):
        raise ValueError(
            "The configured model does not support probability estimates."
        )

    raw_probabilities = np.asarray(
        model.predict_proba(transformed_data),
        dtype=np.float64,
    )

    calibrated_probabilities = calibrate_probabilities(
        raw_probabilities
    )

    if class_index >= calibrated_probabilities.shape[1]:
        class_index = int(
            np.argmax(calibrated_probabilities[0])
        )
        predicted_label = class_names[class_index]

    confidence = get_prediction_confidence(
        calibrated_probabilities
    )

    entropy = calculate_entropy(
        calibrated_probabilities
    )

    probabilities = _build_probability_map(
        calibrated_probabilities,
        class_names,
    )

    risk_level = predicted_label.lower()

    return {
        "risk_level": risk_level,
        "predicted_class": predicted_label,
        "class_index": class_index,
        "confidence": confidence,
        "confidence_percentage": round(
            confidence * 100,
            2,
        ),
        "probabilities": probabilities,
        "prediction_entropy": entropy,
        "model": get_model_metadata(),
        "interpretation": (
            "This is a model-estimated stress-risk category "
            "for research purposes. It is not a clinical diagnosis."
        ),
        "causality_note": (
            "Feature influence describes associations learned by "
            "the model and does not establish causality."
        ),
    }