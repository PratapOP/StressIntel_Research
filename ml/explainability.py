from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import shap

from config.settings import Config
from ml.feature_engineering import build_feature_dataframe
from ml.model_loader import get_model


def _clean_number(value: Any) -> float:
    try:
        value = float(value)

        if not np.isfinite(value):
            return 0.0

        return value
    except (TypeError, ValueError):
        return 0.0


def _extract_feature_names(
    dataframe: pd.DataFrame,
    model: Any,
) -> list[str]:
    if hasattr(model, "get_booster"):
        booster = model.get_booster()

        names = booster.feature_names

        if names:
            return list(names)

    return list(dataframe.columns)


def _extract_shap_values(
    explainer: shap.TreeExplainer,
    dataframe: pd.DataFrame,
) -> tuple[np.ndarray, Any]:
    explanation = explainer(dataframe)

    values = explanation.values
    base_values = explanation.base_values

    values = np.asarray(values)

    if values.ndim == 3:
        class_index = int(
            np.argmax(
                np.abs(values[0]).sum(axis=0)
            )
        )

        selected_values = values[0, :, class_index]

        if np.asarray(base_values).ndim >= 2:
            selected_base_value = np.asarray(
                base_values
            )[0, class_index]
        else:
            selected_base_value = base_values

        return (
            np.asarray(selected_values).reshape(-1),
            selected_base_value,
        )

    if values.ndim == 2:
        selected_values = values[0]

        if np.asarray(base_values).ndim >= 2:
            selected_base_value = np.asarray(
                base_values
            )[0, 0]
        else:
            selected_base_value = base_values

        return (
            np.asarray(selected_values).reshape(-1),
            selected_base_value,
        )

    return (
        values.reshape(-1),
        base_values,
    )


def explain_prediction(
    features: dict[str, Any],
    prediction: Any,
) -> dict[str, Any]:
    if not isinstance(features, dict):
        raise ValueError(
            "Features must be provided as a dictionary."
        )

    model = get_model()

    dataframe = build_feature_dataframe(features)

    model_feature_names = _extract_feature_names(
        dataframe,
        model,
    )

    if hasattr(model, "n_features_in_"):
        expected_features = int(
            model.n_features_in_
        )

        if dataframe.shape[1] != expected_features:
            raise ValueError(
                "Input feature count does not match the trained model."
            )

    explainer = shap.TreeExplainer(model)

    shap_values, base_value = _extract_shap_values(
        explainer,
        dataframe,
    )

    feature_names = list(dataframe.columns)

    if len(shap_values) != len(feature_names):
        if len(shap_values) == len(model_feature_names):
            feature_names = model_feature_names
        else:
            raise ValueError(
                "SHAP output does not match the model feature schema."
            )

    feature_values = dataframe.iloc[0].tolist()

    contributions = []

    for index, feature_name in enumerate(feature_names):
        contribution = _clean_number(
            shap_values[index]
        )

        value = feature_values[index]

        try:
            serialized_value = value.item()
        except AttributeError:
            serialized_value = value

        contributions.append({
            "feature": feature_name,
            "value": serialized_value,
            "shap_value": round(
                contribution,
                6,
            ),
            "absolute_impact": round(
                abs(contribution),
                6,
            ),
            "direction": (
                "increases_risk"
                if contribution > 0
                else "decreases_risk"
                if contribution < 0
                else "neutral"
            ),
        })

    contributions.sort(
        key=lambda item: item["absolute_impact"],
        reverse=True,
    )

    positive = [
        item
        for item in contributions
        if item["shap_value"] > 0
    ]

    negative = [
        item
        for item in contributions
        if item["shap_value"] < 0
    ]

    return {
        "method": "SHAP TreeExplainer",
        "model_type": "XGBoost",
        "model_version": Config.MODEL_VERSION,
        "prediction": prediction,
        "base_value": _clean_number(base_value),
        "feature_contributions": contributions,
        "top_risk_drivers": positive[:5],
        "top_protective_factors": negative[:5],
        "explanation_note": (
            "SHAP values describe how features contributed to this "
            "model prediction relative to the model baseline."
        ),
        "causality_warning": (
            "These feature contributions describe model behavior and "
            "must not be interpreted as causal effects."
        ),
    }


def get_global_feature_importance() -> list[dict[str, Any]]:
    model = get_model()

    if not hasattr(model, "feature_importances_"):
        raise ValueError(
            "The configured model does not expose feature importance."
        )

    dataframe = pd.DataFrame(
        {
            "feature": getattr(
                model,
                "feature_names_in_",
                [],
            ),
            "importance": model.feature_importances_,
        }
    )

    if dataframe.empty:
        booster = model.get_booster()

        importance = booster.get_score(
            importance_type="gain"
        )

        dataframe = pd.DataFrame(
            [
                {
                    "feature": feature,
                    "importance": value,
                }
                for feature, value in importance.items()
            ]
        )

    dataframe["importance"] = pd.to_numeric(
        dataframe["importance"],
        errors="coerce",
    ).fillna(0.0)

    dataframe = dataframe.sort_values(
        "importance",
        ascending=False,
    )

    return [
        {
            "feature": row["feature"],
            "importance": round(
                float(row["importance"]),
                6,
            ),
        }
        for _, row in dataframe.iterrows()
    ]