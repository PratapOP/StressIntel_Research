# StressIntel PRO — Model Artifacts

This directory contains the trained machine-learning artifacts used by StressIntel PRO.

## Required Artifacts

Place the following files in this directory:

- `stressintel_xgboost.json`
- `stressintel_preprocessor.joblib`
- `stressintel_calibrator.joblib`

The application loads these files through:

`config/settings.py`

## Model

The predictive engine uses an XGBoost classifier for three stress-risk categories:

- Low
- Medium
- High

## Preprocessor

`stressintel_preprocessor.joblib` contains the preprocessing pipeline used during model training.

The exact preprocessing procedure must be documented in the research paper and reproduced during evaluation.

## Calibration

`stressintel_calibrator.joblib` is optional.

When present, it is used to calibrate the model's class probabilities.

When absent, the application uses the raw model probabilities and reports them accordingly.

## Reproducibility

Model artifacts should be versioned alongside:

- Training dataset documentation
- Feature schema
- Random seed
- Python version
- Package versions
- Training configuration
- Evaluation metrics
- Calibration method
- Model version

Do not commit private datasets, participant records, raw journal text, webcam images, API keys, or other sensitive research data.

## Current Status

Model artifacts will be generated after the training and evaluation pipeline is implemented.