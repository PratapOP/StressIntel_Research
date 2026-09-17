# StressIntel PRO — System Architecture

## 1. Overview

StressIntel PRO is a Flask-based research platform for explainable student
stress-risk analysis.

The system combines:

- Structured assessment data
- XGBoost-based prediction
- Probability calibration
- SHAP explainability
- Journal-text analysis through GROQ
- Scenario simulation
- Research-oriented reporting
- Optional visual analysis

The platform is designed as a research and decision-support system and is not
a clinical diagnostic system.

---

## 2. High-Level Architecture

```text
                         ┌──────────────────────────┐
                         │       Web Frontend       │
                         │      HTML / CSS / JS     │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │       Flask Server       │
                         │       Application API    │
                         └────────────┬─────────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 │                    │                    │
                 ▼                    ▼                    ▼
        ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
        │   Assessment   │   │    Analysis    │   │   Simulation   │
        │     Routes     │   │     Routes     │   │     Routes     │
        └───────┬────────┘   └───────┬────────┘   └───────┬────────┘
                │                    │                    │
                └────────────────────┼────────────────────┘
                                     ▼
                         ┌──────────────────────────┐
                         │    Validation Layer     │
                         │   Input / Range Checks  │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │   Feature Engineering   │
                         │ Derived Research Features│
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │     Preprocessing       │
                         │ Trained Transformation  │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │    XGBoost Predictor     │
                         │   Low / Medium / High   │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────┴─────────────┐
                         ▼                          ▼
              ┌────────────────────┐     ┌────────────────────┐
              │ Probability        │     │   SHAP             │
              │ Calibration        │     │ Explainability     │
              └────────────────────┘     └────────────────────┘

                         ┌──────────────────────────┐
                         │      GROQ Analysis       │
                         │   Journal Text Signals   │
                         └──────────────────────────┘

                         ┌──────────────────────────┐
                         │    Research Reporting    │
                         │ Metrics / Explanation /  │
                         │ Experiment Documentation │
                         └──────────────────────────┘
3. Application Layer

The Flask application provides the primary HTTP interface.

Core routes
/api/assessment
/api/analysis
/api/simulation
/api/reports
/api/health

The application layer is responsible for:

Request handling
Input validation
Response formatting
Error handling
Security headers
Research workflow coordination
4. Machine Learning Layer

The machine-learning pipeline consists of the following components:

Raw Assessment
      ↓
Validation
      ↓
Feature Engineering
      ↓
Preprocessing
      ↓
XGBoost
      ↓
Probability Calibration
      ↓
Prediction
      ↓
SHAP Explanation
Predictive Model

XGBoost is used as the primary classifier.

The model predicts three research categories:

Low
Medium
High

The model artifact is stored outside the source-code implementation and
loaded dynamically at runtime.

5. Feature Engineering

The system derives documented features from the raw assessment.

Current derived features include:

Sleep-to-Study Ratio
Study Hours / Sleep Hours

This feature provides a normalized relationship between reported study time
and sleep duration.

Academic Load Index

The Academic Load Index combines selected academic and behavioral indicators
into a bounded research feature.

The exact calculation is implemented in:

ml/feature_engineering.py

The formula and weighting must be documented in the research methodology.

6. Explainability Layer

StressIntel PRO uses SHAP with tree-based explanations.

The explainability layer provides:

Feature contribution values
Direction of model contribution
Absolute feature impact
Top risk-associated model features
Top protective model features
Global feature importance

SHAP explanations describe the behavior of the trained model.

They must not be interpreted as:

Feature → Cause → Stress

Instead, they represent:

Feature → Contribution to Model Output

Therefore, SHAP results do not establish causality.

7. Qualitative Analysis Layer

Journal text is processed independently from the structured prediction
pipeline.

Journal Text
     ↓
Input Sanitization
     ↓
GROQ API
     ↓
Structured JSON Response
     ↓
Qualitative Research Signals

The qualitative component can identify:

Sentiment
Stress-related signals
Possible contextual stressors
Protective signals
Themes
Summary
Uncertainty

The output is supplementary evidence and does not constitute a diagnosis.

The exact GROQ model and configuration are controlled through environment
variables.

8. Simulation Layer

The simulation component allows hypothetical changes to assessment inputs.

Example:

Original Scenario
        ↓
Modify Sleep Hours
        ↓
Modify Study Hours
        ↓
Run Prediction
        ↓
Compare Result

Simulation results represent hypothetical model outputs.

They must not be interpreted as guaranteed real-world effects of changing a
specific behavior.

9. Research Reporting

Research reports combine:

Model prediction
Class probabilities
Confidence
Model version
SHAP explanation
Journal analysis when available
Research interpretation
Causality limitations

Each report should retain enough metadata to support reproducibility without
unnecessarily retaining raw sensitive information.

10. Data Flow
User Input
   │
   ▼
Consent Validation
   │
   ▼
Schema Validation
   │
   ▼
Feature Engineering
   │
   ▼
Preprocessing
   │
   ▼
XGBoost
   │
   ├──────────────► Class Probabilities
   │
   └──────────────► SHAP Explanation
   │
   ▼
Calibrated Risk Estimate
   │
   ▼
Research Dashboard

Journal analysis follows a separate path:

Journal Entry
      ↓
Sanitization
      ↓
GROQ
      ↓
Qualitative Signals
      ↓
Research Dashboard
11. Security Architecture

The application includes:

Environment-based secret configuration
HTTP security headers
Input validation
Input-size limits
Journal-text length limits
Restricted CORS configuration
HTTP-only session configuration
Secure cookie configuration for production

Sensitive values must not be written to application logs.

API keys must never be hard-coded into source files.

12. Deployment Architecture

The intended deployment target is Vercel.

                     ┌─────────────────┐
                     │     Browser     │
                     └────────┬────────┘
                              │ HTTPS
                              ▼
                     ┌─────────────────┐
                     │     Vercel      │
                     │ Flask Application│
                     └────────┬────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        ┌─────────────────┐       ┌─────────────────┐
        │ Model Artifacts │       │    GROQ API     │
        │ XGBoost / SHAP  │       │ Journal Analysis│
        └─────────────────┘       └─────────────────┘

Production deployment must supply secrets through environment variables.

The application must not expose:

GROQ_API_KEY
SECRET_KEY
Private datasets
Raw participant data
13. Reproducibility

A research experiment should record:

Dataset version
Feature schema
Random seed
Train/test split
Model configuration
Preprocessing configuration
Calibration method
Software versions
Model artifact version
Evaluation metrics

The experiment log is maintained in:

research/experiments/experiment_log.csv
14. Future Research Extensions

The architecture allows future integration of:

Longitudinal analysis
Wearable-derived signals
Validated visual features
Cohort-level analytics
Fairness evaluation
Drift monitoring
Model cards
Dataset cards
Threat modeling
Institutional authentication

These components should only be enabled after appropriate validation,
consent, governance, and research review.