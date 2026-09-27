"""
StressIntel PRO — Model Training Script
========================================
Trains an XGBoost classifier on the Kaggle StressLevelDataset.csv,
then saves the model + preprocessor artifacts to models/.

Usage:
    python train_model.py

Outputs:
    models/stressintel_xgboost.json
    models/stressintel_preprocessor.joblib
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler, OrdinalEncoder
import xgboost as xgb

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
DATASET_PATH = BASE_DIR / "New Folder" / "StressLevelDataset.csv"
MODELS_DIR = BASE_DIR / "models"

MODEL_OUTPUT = MODELS_DIR / "stressintel_xgboost.json"
PREPROCESSOR_OUTPUT = MODELS_DIR / "stressintel_preprocessor.joblib"

MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Final feature list that matches the app's FEATURE_NAMES in feature_engineering.py
APP_FEATURE_NAMES = [
    "age",
    "gender",
    "academic_performance",
    "study_hours",
    "sleep_hours",
    "sleep_quality",
    "physical_activity_hours",
    "screen_time_hours",
    "social_interaction_hours",
    "academic_pressure",
    "financial_stress",
    "family_pressure",
    "peer_pressure",
    "time_management",
    "attendance_percentage",
    "assignment_completion",
    "exam_anxiety",
    "mood_score",
    "self_reported_stress",
    "study_sleep_ratio",          # engineered
    "academic_load_index",        # engineered
]

NUMERIC_FEATURES = [f for f in APP_FEATURE_NAMES if f != "gender"]
CATEGORICAL_FEATURES = ["gender"]


def load_dataset(path: Path) -> pd.DataFrame:
    print(f"[info] Loading dataset from: {path}")
    df = pd.read_csv(path)
    print(f"[info] Dataset shape: {df.shape}")
    print(f"[info] Columns: {list(df.columns)}")
    return df


def build_app_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Map the Kaggle columns to the app's 21-feature schema.
    For columns that don't exist in Kaggle data we synthesize plausible values
    using available columns as proxies.
    """
    n = len(df)
    rng = np.random.default_rng(42)

    out = pd.DataFrame(index=df.index)

    # age: not in dataset -> plausible student range 17-25
    out["age"] = rng.integers(17, 26, size=n).astype(float)

    # gender: not in dataset -> balanced 50/50
    out["gender"] = rng.choice(["Male", "Female"], size=n)

    # academic_performance: direct (0-10 in dataset -> scale to 0-100)
    ap = pd.to_numeric(df["academic_performance"], errors="coerce").fillna(5)
    out["academic_performance"] = (ap / ap.max() * 100).clip(0, 100)

    # study_hours: study_load proxy (0-5 -> 0-12h)
    sl = pd.to_numeric(df["study_load"], errors="coerce").fillna(2)
    out["study_hours"] = (sl / 5.0 * 12.0).clip(0, 24)

    # sleep_hours: sleep_quality proxy (0-5 -> 4-9h)
    sq = pd.to_numeric(df["sleep_quality"], errors="coerce").fillna(2)
    out["sleep_hours"] = (4 + sq / 5.0 * 5.0).clip(0, 24)

    # sleep_quality: direct (scale 0-5 -> 0-10)
    out["sleep_quality"] = (sq / 5.0 * 10.0).clip(0, 10)

    # physical_activity_hours: extracurricular proxy
    ec = pd.to_numeric(df["extracurricular_activities"], errors="coerce").fillna(2)
    out["physical_activity_hours"] = (ec / 5.0 * 3.0 + rng.uniform(0, 1, size=n)).clip(0, 24)

    # screen_time_hours: noise_level proxy
    nl = pd.to_numeric(df.get("noise_level", pd.Series([2] * n)), errors="coerce").fillna(2)
    out["screen_time_hours"] = (nl / 5.0 * 6 + 2 + rng.uniform(0, 2, size=n)).clip(0, 24)

    # social_interaction_hours: social_support proxy
    ss = pd.to_numeric(df["social_support"], errors="coerce").fillna(2)
    out["social_interaction_hours"] = (ss / 5.0 * 4.0).clip(0, 24)

    # academic_pressure: anxiety_level + future_career_concerns
    al = pd.to_numeric(df["anxiety_level"], errors="coerce").fillna(5)
    fc = pd.to_numeric(df["future_career_concerns"], errors="coerce").fillna(2)
    out["academic_pressure"] = ((al / al.max() * 6 + fc / 5.0 * 4) / 2).clip(0, 10)

    # financial_stress: basic_needs (inverted) proxy
    bn = pd.to_numeric(df["basic_needs"], errors="coerce").fillna(2)
    out["financial_stress"] = ((5 - bn) / 5.0 * 10.0).clip(0, 10)

    # family_pressure: depression + living_conditions proxy
    dep = pd.to_numeric(df["depression"], errors="coerce").fillna(5)
    lc = pd.to_numeric(df["living_conditions"], errors="coerce").fillna(2)
    out["family_pressure"] = ((dep / dep.max() * 5 + (5 - lc) / 5.0 * 5) / 2).clip(0, 10)

    # peer_pressure: direct (scale 0-5 -> 0-10)
    pp = pd.to_numeric(df["peer_pressure"], errors="coerce").fillna(2)
    out["peer_pressure"] = (pp / 5.0 * 10.0).clip(0, 10)

    # time_management: self_esteem + teacher_student_relationship proxy
    se = pd.to_numeric(df["self_esteem"], errors="coerce").fillna(15)
    ts = pd.to_numeric(df["teacher_student_relationship"], errors="coerce").fillna(2)
    out["time_management"] = (se / 30.0 * 7 + ts / 5.0 * 3) / 2 * 2
    out["time_management"] = out["time_management"].clip(0, 10)

    # attendance_percentage: study_load + academic performance proxy
    out["attendance_percentage"] = (
        out["academic_performance"] * 0.5 + out["study_hours"] / 12 * 50
    ).clip(0, 100)

    # assignment_completion: academic_performance proxy + small noise
    out["assignment_completion"] = (
        out["academic_performance"] * 0.8 + rng.uniform(0, 20, size=n)
    ).clip(0, 100)

    # exam_anxiety: anxiety_level direct scale
    out["exam_anxiety"] = (al / al.max() * 10.0).clip(0, 10)

    # mood_score: self_esteem + safety proxy
    sf = pd.to_numeric(df["safety"], errors="coerce").fillna(2)
    out["mood_score"] = (se / 30.0 * 6 + sf / 5.0 * 4) / 2 * 2
    out["mood_score"] = out["mood_score"].clip(0, 10)

    # self_reported_stress: use stress_level scaled (0-2 -> 0-10)
    sl_col = pd.to_numeric(df["stress_level"], errors="coerce").fillna(1)
    out["self_reported_stress"] = (sl_col / 2.0 * 10.0).clip(0, 10)

    # Engineered features
    study = out["study_hours"]
    sleep = out["sleep_hours"]
    out["study_sleep_ratio"] = (study / sleep.replace(0, 0.001)).clip(0, 24).round(4)

    study_comp = (study / 24.0) * 100.0
    pressure_comp = out["academic_pressure"] * 10.0
    anxiety_comp = out["exam_anxiety"] * 10.0
    attendance_gap = 100.0 - out["attendance_percentage"]
    completion_gap = 100.0 - out["assignment_completion"]
    out["academic_load_index"] = (
        study_comp * 0.25
        + pressure_comp * 0.30
        + anxiety_comp * 0.20
        + attendance_gap * 0.10
        + completion_gap * 0.15
    ).clip(0, 100).round(4)

    # Target
    out["stress_level"] = pd.to_numeric(
        df["stress_level"], errors="coerce"
    ).fillna(1).astype(int).clip(0, 2)

    return out


def build_preprocessor() -> ColumnTransformer:
    """Sklearn ColumnTransformer that handles numeric + categorical features."""
    numeric_pipeline = Pipeline([
        ("scaler", StandardScaler()),
    ])

    categorical_pipeline = Pipeline([
        ("encoder", OrdinalEncoder(
            handle_unknown="use_encoded_value",
            unknown_value=-1,
        )),
    ])

    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


def train(df: pd.DataFrame):
    print("\n[info] Building app-compatible feature matrix ...")
    data = build_app_features(df)

    X = data[APP_FEATURE_NAMES]
    y = data["stress_level"]

    print(f"[info] Feature matrix shape: {X.shape}")
    print(f"[info] Class distribution:\n{y.value_counts().sort_index()}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\n[info] Fitting preprocessor ...")
    preprocessor = build_preprocessor()

    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t = preprocessor.transform(X_test)

    # Reconstruct feature names after transformation
    all_feature_names = NUMERIC_FEATURES + CATEGORICAL_FEATURES

    print("\n[info] Training XGBoost classifier ...")
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )

    model.fit(
        X_train_t,
        y_train,
        eval_set=[(X_test_t, y_test)],
        verbose=50,
    )

    y_pred = model.predict(X_test_t)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[result] Test accuracy: {acc:.4f}")
    print("\n[result] Classification report:")
    print(classification_report(
        y_test, y_pred,
        target_names=["Low", "Medium", "High"],
    ))

    # Patch feature names onto the booster so SHAP/model_loader can read them
    booster = model.get_booster()
    booster.feature_names = all_feature_names

    # Save artifacts
    print(f"\n[info] Saving model   -> {MODEL_OUTPUT}")
    model.save_model(str(MODEL_OUTPUT))

    print(f"[info] Saving preprocessor -> {PREPROCESSOR_OUTPUT}")
    preprocessor.feature_names_in_ = np.array(APP_FEATURE_NAMES)
    joblib.dump(preprocessor, str(PREPROCESSOR_OUTPUT))

    print("\nTraining complete. Artifacts saved to models/")
    return model, preprocessor


if __name__ == "__main__":
    if not DATASET_PATH.exists():
        print(f"[error] Dataset not found at: {DATASET_PATH}", file=sys.stderr)
        sys.exit(1)

    df = load_dataset(DATASET_PATH)
    train(df)
