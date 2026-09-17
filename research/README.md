# StressIntel PRO — Research Workspace

This directory contains the reproducibility and evaluation artifacts for
StressIntel PRO.

## Research Objective

Evaluate whether structured student behavioral, academic, lifestyle, and
self-reported indicators can be combined into an interpretable stress-risk
classification pipeline.

The primary predictive model is XGBoost.

The explainability layer uses SHAP.

## Experimental Pipeline

```text
Dataset
   ↓
Data Validation
   ↓
Preprocessing
   ↓
Feature Engineering
   ↓
Train / Validation / Test Split
   ↓
Baseline Models
   ↓
XGBoost
   ↓
Probability Calibration
   ↓
Evaluation
   ↓
SHAP Explainability
   ↓
Ablation Analysis
   ↓
Research Report
```

### Dataset

Development currently uses the project sample dataset:

`data/sample/sample_assessments.csv`

The sample dataset is intended for application development and pipeline
validation. Its results must not be presented as evidence of real-world
student stress prevalence or model performance.

### Target

The prediction target contains three classes:

- Low
- Medium
- High

The target definition must remain fixed throughout an experiment.

### Required Evaluation Metrics

Each final experiment should report:

- Accuracy
- Macro F1
- Per-class precision
- Per-class recall
- Confusion matrix
- Class distribution
- Calibration performance
- Prediction confidence
- Error analysis

Where appropriate, confidence intervals should also be reported.

### Experimental Controls

Experiments should document:

- Dataset version
- Random seed
- Train/validation/test strategy
- Feature set
- Preprocessing procedure
- Model configuration
- Python version
- Dependency versions
- Calibration method
- Model artifact version

### Leakage Prevention

No information from the test set should be used during:

- Feature selection
- Hyperparameter tuning
- Calibration
- Threshold selection
- Model selection

If participant identifiers or repeated observations are introduced in a future
dataset, grouped splitting should be used where appropriate.

For longitudinal data, temporal leakage must also be prevented.

### Ablation Studies

The research pipeline should support comparison between:

- Academic features
- Lifestyle features
- Psychological/self-reported features
- Combined structured features
- Structured features + qualitative journal analysis
- Full multimodal configuration where validated visual data is available

The purpose is to determine how different input modalities affect predictive
performance and model behavior.

### SHAP Analysis

SHAP is a core component of StressIntel PRO.

The research analysis should include:

- Global feature importance
- Local feature contributions
- Positive risk-associated contributions
- Negative/protective model contributions
- Feature interaction analysis where appropriate

SHAP values explain model behavior. They do not establish causality.

### Qualitative Analysis

Journal analysis is supplementary.

The external language model configuration must be documented in each final
experiment, including:

- Provider
- Exact model/version
- Prompt configuration
- Temperature
- Token limit
- Hosting arrangement
- Fallback behavior

Raw journal text should not be unnecessarily retained in experiment logs.

### Ethical Scope

StressIntel PRO is a research and decision-support platform.

It is not:

- A medical diagnostic device
- A psychiatric assessment
- A replacement for professional support
- A system for making high-impact decisions about students

Predictions should be communicated as model-estimated risk categories.

Any institutional deployment requires appropriate governance, consent,
privacy controls, security review, and ethics/IRB review where applicable.

### Current Status

The current experiment log contains a placeholder baseline experiment.

Actual metrics will be generated only after the training and evaluation
pipeline has been implemented and executed.