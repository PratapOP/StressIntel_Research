# StressIntel PRO

### Deployable Research Platform for Student Stress Analysis

StressIntel PRO is a research-oriented web platform designed to investigate
whether behavioral, academic, physiological-proxy, and qualitative text
signals can be combined into an interpretable student stress-risk estimate.

The platform combines:

- XGBoost-based stress-risk classification
- Probability calibration
- SHAP explainability
- GROQ-powered journal analysis
- Scenario simulation
- Research-oriented reporting
- Reproducible experiment documentation
- Vercel-compatible Flask deployment

> **Research Disclaimer:** StressIntel PRO is a research and decision-support
> prototype. It is not a medical diagnostic device and must not be used as a
> substitute for professional medical or psychological assessment.

---

## 1. Research Objective

The central research objective is:

> Evaluate whether heterogeneous student-related signals can be combined into
> an interpretable machine-learning estimate of stress risk.

The system is designed to investigate three broad questions:

1. Can structured behavioral and academic variables classify students into
   predefined stress-risk categories?
2. Can model explanations identify the variables that most influence an
   individual prediction?
3. Can qualitative journal analysis provide supplementary contextual signals
   alongside structured assessment data?

The system does not attempt to establish causal relationships between
individual features and stress.

---

## 2. Stress-Risk Categories

The predictive engine produces three categories:

```text
Low
Medium
High
```

These categories represent the target definition established by the research
dataset.

They should not be interpreted as:

- Clinical diagnoses
- Psychiatric classifications
- Medical severity levels
- Professional assessments

The target definition must be fixed before final research evaluation.

---

## 3. Core System Architecture

```text
                         ┌─────────────────────┐
                         │     User Browser     │
                         │                     │
                         │ HTML / CSS / JS      │
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS
                                    ▼
                         ┌─────────────────────┐
                         │   Flask Application │
                         │                     │
                         │ API + Web Interface │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
          ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
          │ Validation  │   │ ML Pipeline │   │ GROQ        │
          │             │   │             │   │ Analysis    │
          └─────────────┘   └──────┬──────┘   └─────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
               Preprocessor     XGBoost        Calibration
                                   │
                                   ▼
                                SHAP
                                   │
                                   ▼
                         Research Interpretation
```

---

## 4. Technology Stack

### Backend

- Python
- Flask
- Flask-CORS
- Gunicorn

### Machine Learning

- NumPy
- Pandas
- Scikit-learn
- XGBoost
- SHAP

### Qualitative Analysis

- GROQ API

### Frontend

- HTML5
- CSS3
- JavaScript

### Deployment

- Vercel

### Configuration

- python-dotenv

---

## 5. Project Structure

```text
StressIntel-PRO/
├── app.py
├── requirements.txt
├── vercel.json
├── .env.example
├── .gitignore
├── README.md
├── config/
│   ├── __init__.py
│   └── settings.py
├── routes/
│   ├── __init__.py
│   ├── assessment.py
│   ├── analysis.py
│   ├── simulation.py
│   ├── reports.py
│   └── health.py
├── ml/
│   ├── __init__.py
│   ├── preprocessing.py
│   ├── feature_engineering.py
│   ├── predictor.py
│   ├── calibration.py
│   ├── explainability.py
│   ├── sentiment.py
│   └── model_loader.py
├── models/
│   ├── .gitkeep
│   └── README.md
├── data/
│   ├── sample/
│   │   └── sample_assessments.csv
│   └── README.md
├── research/
│   ├── experiments/
│   │   └── experiment_log.csv
│   ├── metrics/
│   │   └── .gitkeep
│   ├── reports/
│   │   └── .gitkeep
│   └── README.md
├── utils/
│   ├── __init__.py
│   ├── validators.py
│   ├── security.py
│   ├── logging_config.py
│   └── helpers.py
├── templates/
│   ├── index.html
│   ├── assessment.html
│   ├── results.html
│   ├── simulation.html
│   ├── research.html
│   ├── report.html
│   └── error.html
├── static/
│   ├── css/
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   └── responsive.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── assessment.js
│   │   ├── results.js
│   │   ├── simulation.js
│   │   ├── research.js
│   │   └── charts.js
│   │
│   └── assets/
│       ├── logo.svg
│       └── favicon.svg
├── tests/
│   ├── __init__.py
│   ├── test_api.py
│   ├── test_validation.py
│   ├── test_prediction.py
│   └── test_explainability.py
└── docs/
    ├── architecture.md
    ├── methodology.md
    ├── ethics.md
    ├── model_card.md
    ├── dataset_card.md
    ├── threat_model.md
    └── deployment.md
```

---

## 6. Assessment Feature Schema

The predictive system currently uses 21 model features.

### Demographic

- age
- gender

### Academic

- academic_performance
- study_hours
- academic_pressure
- attendance_percentage
- assignment_completion
- exam_anxiety

### Sleep and Activity

- sleep_hours
- sleep_quality
- physical_activity_hours
- screen_time_hours
- social_interaction_hours

### Psychosocial Context

- financial_stress
- family_pressure
- peer_pressure
- time_management
- mood_score
- self_reported_stress

### Engineered Features

- study_sleep_ratio
- academic_load_index

The engineered features are calculated from existing assessment inputs.

---

## 7. Feature Engineering

### Study-Sleep Ratio

The platform calculates:

```text
study_sleep_ratio = study_hours / sleep_hours
```

A zero or near-zero sleep value is handled safely by the feature-engineering
layer.

### Academic Load Index

The academic load index combines:

- Study duration
- Academic pressure
- Exam anxiety
- Attendance gap
- Assignment-completion gap

The index is normalized to a bounded range.

These engineered features are intended as model inputs and should not be
interpreted as validated clinical or psychological constructs.

---

## 8. Machine-Learning Pipeline

The intended inference pipeline is:

```text
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
Class Probabilities
      ↓
Calibration
      ↓
Prediction
      ↓
SHAP Explanation
```

The production preprocessing artifact must be generated from the same
procedure used during model training.

---

## 9. XGBoost

The predictive engine uses an XGBoost classifier.

The target consists of:

- 0 → Low
- 1 → Medium
- 2 → High

The final model artifact is expected at:

```text
models/stressintel_xgboost.json
```

The model version is configured through:

```text
MODEL_VERSION
```

Example:

```text
stressintel-xgb-v1.0.0
```

---

## 10. Probability Calibration

Raw model probabilities may be calibrated before being returned to the
frontend.

The optional calibration artifact is:

```text
models/stressintel_calibrator.joblib
```

If the calibration artifact is unavailable, the system can fall back to raw
model probabilities.

The research paper must explicitly state whether reported probabilities are:

- Raw
- Calibrated
- Generated using a particular calibration method

---

## 11. SHAP Explainability

StressIntel PRO uses SHAP for model interpretation.

The primary method is:

```text
SHAP TreeExplainer
```

The system provides:

- Feature contributions
- Absolute feature impact
- Direction of contribution
- Top risk drivers
- Top protective factors
- Model baseline contribution

Example conceptual output:

```text
Feature                 SHAP        Direction
------------------------------------------------
Academic Pressure       +0.82       Increases risk
Sleep Hours             -0.51       Decreases risk
Exam Anxiety             +0.43       Increases risk
Mood Score               -0.31       Decreases risk
```

SHAP explanations describe model behavior. They do not establish a causal
relationship such as:

```text
Feature → Cause → Stress
```

They should instead be interpreted as:

```text
Feature → Contribution to Model Prediction
```

---

## 12. Global Explainability

The platform also supports global feature importance.

Global importance can be used to study:

- Which variables are influential across the model
- Relative feature contribution
- Feature groups
- Potential model dependencies

Global feature importance must not be presented as causal importance.

---

## 13. Journal Analysis

StressIntel PRO optionally processes journal text through GROQ.

The journal analysis returns:

- sentiment
- sentiment_score
- stress_signal
- stress_signal_score
- possible_stressors
- protective_signals
- themes
- summary
- uncertainty
- support_recommendation

The journal component is qualitative and supplementary. It should not override
the structured predictive model automatically.

---

## 14. GROQ Research Configuration

The GROQ configuration is controlled by environment variables:

- GROQ_API_KEY
- GROQ_MODEL
- ENABLE_GROQ_ANALYSIS

The API key must never be exposed to browser-side JavaScript.

The exact model identifier and prompt configuration should be recorded for
research reproducibility.

If the GROQ service is unavailable, the application returns a controlled
fallback rather than fabricating an analysis.

---

## 15. Scenario Simulation

The simulation component allows researchers to modify assessment variables and
observe how the model output changes.

Conceptually:

```text
Baseline Assessment
        ↓
Modify Feature
        ↓
Run Inference
        ↓
Compare Prediction
```

Potential research uses include:

- Sensitivity exploration
- Feature perturbation
- Model behavior inspection
- Demonstration of nonlinear responses
- Comparison of hypothetical scenarios

Simulation results are model outputs, not evidence that changing a feature
would causally change a student's stress.

---

## 16. Research Reporting

The report endpoint combines:

- Prediction
- Model metadata
- SHAP explanation
- Journal analysis

Reports should identify:

- Model version
- Generation timestamp
- Prediction
- Feature contributions
- Qualitative analysis
- Research interpretation
- Causality limitations
- Clinical limitations

---

## 17. Research Evaluation

The final research evaluation should include more than accuracy.

Recommended metrics include:

- Accuracy
- Macro F1
- Per-class precision
- Per-class recall
- Confusion matrix
- Calibration
- Threshold analysis

Where appropriate, confidence intervals should be reported.

The research evaluation should also consider:

- Class balance
- Missing data
- Error analysis
- Ablation studies
- Leakage prevention
- Feature distribution
- Subgroup performance

---

## 18. Baselines

The final research evaluation should compare XGBoost against appropriate
baseline models.

Possible baselines include:

- Majority Classifier
- Logistic Regression
- Decision Tree
- Random Forest

The baseline selection should be justified in the research methodology.

---

## 19. Ablation Studies

Potential feature-group ablations include:

- Academic only
- Behavioral only
- Sleep/activity only
- Psychosocial only
- Academic + behavioral
- Structured features without engineered features
- Structured features + qualitative text

The exact experimental design should be finalized before final evaluation.

---

## 20. Data Leakage Prevention

Participant-level splitting should be used where repeated observations from the
same participant exist.

For longitudinal research:

- Temporal ordering should be preserved where relevant.
- Future information must not enter training features.
- Target-derived information must not appear as an input.
- Preprocessing should be fitted only on the training partition.

Data leakage can produce artificially optimistic performance.

---

## 21. Current Development Dataset

The repository contains:

```text
data/sample/sample_assessments.csv
```

This dataset is synthetic and exists for:

- Development
- Testing
- Demonstration
- Pipeline validation
- UI development

It is not a representative population dataset and its results must not be
presented as real-world evidence.

---

## 22. Privacy

The platform follows data-minimization principles.

The application should avoid collecting unnecessary:

- Names
- Email addresses
- Phone numbers
- University IDs
- Addresses
- Raw identifying metadata

Journal entries may contain sensitive information and therefore require
additional protection.

Webcam functionality is disabled by default.

---

## 23. Webcam Analysis

Optional webcam analysis is controlled by:

```text
ENABLE_WEBCAM=false
```

If enabled, the implementation must require:

- Explicit consent
- Browser camera permission
- HTTPS
- Clear disclosure
- Minimal processing
- No unnecessary retention

Facial-expression signals must be treated as research signals with substantial
measurement and interpretation limitations.

---

## 24. Security

Security controls include:

- Environment-based secrets
- Input validation
- Request-size limits
- Security headers
- CSP
- CORS configuration
- Secure session-cookie configuration
- Server-side GROQ communication
- Sensitive-data logging restrictions

Production deployment should additionally consider:

- Rate limiting
- Authentication
- Authorization
- Monitoring
- Incident response

---

## 25. Secret Management

Never commit:

- .env
- GROQ_API_KEY
- SECRET_KEY
- private datasets
- participant data
- credentials

The repository provides:

```text
.env.example
```

as a configuration template.

---

## 26. Local Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd StressIntel-PRO
   ```

2. Create a virtual environment.

   Windows:

   ```powershell
   python -m venv .venv
   .venv\Scripts\activate
   ```

   macOS/Linux:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment.

   Copy `.env.example` to `.env`, then configure the required values.

5. Start Flask:

   ```bash
   python app.py
   ```

   The application should become available locally at:

   ```text
   http://127.0.0.1:5000
   ```

---

## 27. Model Artifacts

The application expects:

```text
models/stressintel_xgboost.json
models/stressintel_preprocessor.joblib
models/stressintel_calibrator.joblib
```

The model artifacts are currently generated as a separate research/training
step.

Until valid artifacts exist, prediction endpoints may return:

```text
MODEL_NOT_FOUND
```

This is intentional rather than silently producing fabricated predictions.

---

## 28. Health Check

The application provides:

```text
GET /api/health/
```

The endpoint reports:

- Service name
- Application version
- Environment
- Timestamp
- Health status

Example:

```json
{
  "status": "healthy",
  "service": "StressIntel PRO",
  "version": "1.0.0"
}
```

---

## 29. API Endpoints

### Assessment

```text
POST /api/assessment/
```

Runs stress-risk prediction.

### Journal Analysis

```text
POST /api/analysis/journal
```

Runs qualitative journal analysis.

### SHAP Explanation

```text
POST /api/analysis/explain
```

Generates local model explanation.

### Simulation

```text
POST /api/simulation/
```

Runs a hypothetical assessment scenario.

### Research Report

```text
POST /api/reports/
```

Generates a research-oriented report payload.

### Health

```text
GET /api/health/
```

Checks application health.

---

## 30. Example Assessment Payload

A valid assessment should contain the required structured features and explicit
research consent.

Example:

```json
{
  "age": 21,
  "gender": "Male",
  "academic_performance": 78,
  "study_hours": 5,
  "sleep_hours": 7,
  "sleep_quality": 7,
  "physical_activity_hours": 1,
  "screen_time_hours": 5,
  "social_interaction_hours": 2,
  "academic_pressure": 5,
  "financial_stress": 2,
  "family_pressure": 3,
  "peer_pressure": 3,
  "time_management": 7,
  "attendance_percentage": 88,
  "assignment_completion": 85,
  "exam_anxiety": 4,
  "mood_score": 7,
  "self_reported_stress": 4,
  "consent": true
}
```

The engineered fields:

- study_sleep_ratio
- academic_load_index

are calculated by the application.

---

## 31. Deployment

The primary deployment target is Vercel.

The repository includes:

```text
vercel.json
```

The Flask application exposes:

```python
app = create_app()
```

at module scope for deployment compatibility.

Before deployment:

- Generate valid model artifacts.
- Verify the preprocessing pipeline.
- Run tests.
- Configure environment variables.
- Disable debug mode.
- Restrict production CORS.
- Configure GROQ if required.
- Verify the health endpoint.
- Perform API smoke tests.
- Verify the production frontend.

See [docs/deployment.md](docs/deployment.md) for the complete deployment
procedure.

---

## 32. Production Configuration

Production should use:

```text
FLASK_DEBUG=false
SESSION_COOKIE_SECURE=true
```

and a restricted:

```text
CORS_ORIGINS
```

Do not use wildcard CORS unnecessarily in production.

---

## 33. Reproducibility

Each research model release should record:

- Model version
- Dataset version
- Experiment ID
- Random seed
- Python version
- Dependency versions
- Feature schema
- Preprocessing configuration
- Calibration method
- Evaluation metrics
- Training configuration

The experiment log is maintained at:

```text
research/experiments/experiment_log.csv
```

---

## 34. Research Documentation

The project includes dedicated research documentation:

```text
docs/
├── architecture.md
├── methodology.md
├── ethics.md
├── model_card.md
├── dataset_card.md
├── threat_model.md
└── deployment.md
```

These documents should be updated whenever the research methodology or
production architecture changes.

---

## 35. Ethics

The platform must be used according to an appropriate research protocol.

Important considerations include:

- Informed consent
- Data minimization
- Privacy
- De-identification
- Human oversight
- Fairness
- Bias assessment
- Secure handling of journal data
- Secure handling of webcam data
- Appropriate ethics review

The application must not be represented as a replacement for professional
support.

See [docs/ethics.md](docs/ethics.md).

---

## 36. Model Limitations

Machine-learning predictions are affected by:

- Dataset quality
- Dataset size
- Sampling strategy
- Label quality
- Class imbalance
- Missing data
- Distribution shift
- Feature measurement
- Model specification
- Preprocessing
- Calibration
- External validity

SHAP provides model explanations but does not solve these limitations.

---

## 37. Current Research Status

| Area | Status |
|---|---|
| Application Architecture | Defined |
| Flask Backend | Implemented |
| API Routes | Implemented |
| Validation | Implemented |
| Feature Engineering | Implemented |
| Model Loading | Implemented |
| Calibration Layer | Implemented |
| SHAP Layer | Implemented |
| GROQ Layer | Implemented |
| Research Documentation | Implemented |
| Synthetic Dataset | Available |
| Training Pipeline | Pending |
| Evaluation Pipeline | Pending |
| Production Model | Pending |
| Frontend | Pending |
| Automated Tests | Pending |
| Final Integration | Pending |
| Production Deployment | Pending |

---

## 38. Research Claim Boundary

The platform can support research questions about:

- Model performance
- Model behavior
- Feature contribution
- Qualitative text signals
- Scenario sensitivity
- Calibration
- Error patterns
- Reproducibility

The platform cannot, by itself, establish:

- Causality
- Clinical validity
- Diagnosis
- Treatment effectiveness
- Universal student stress thresholds
- General population prevalence
- Psychological state from a single prediction

---

## 39. Recommended Research Workflow

```text
Dataset Governance
        ↓
Data Cleaning
        ↓
Participant-Level / Appropriate Split
        ↓
Preprocessing
        ↓
Baseline Models
        ↓
XGBoost Training
        ↓
Calibration
        ↓
Evaluation
        ↓
Error Analysis
        ↓
Ablation Studies
        ↓
SHAP Analysis
        ↓
Qualitative Analysis
        ↓
Simulation
        ↓
Research Report
        ↓
Prospective Validation
```

---

## 40. Future Research Extensions

Potential future work includes:

- Prospective validation
- Longitudinal modeling
- Fairness evaluation
- Temporal validation
- Wearable-derived signals
- Privacy-preserving cohort analytics
- Improved calibration
- External validation
- Model cards
- Dataset cards
- Threat modeling
- Monitored pilot deployment

These extensions require additional research design and validation.

---

## 41. License and Data Governance

The repository should include an appropriate software license before public
release.

Dataset licensing must be evaluated independently from software licensing.

A software license does not automatically grant permission to redistribute
research data.

---

## 42. Contributing

Changes should preserve:

- Research reproducibility
- Feature-schema compatibility
- Security controls
- Model-version traceability
- Documentation
- Testing
- Ethical boundaries

Changes to model behavior should include corresponding experiment
documentation.

---

## 43. Development Checklist

### Core Application

- Flask application
- Configuration
- API route structure
- Error handling
- Frontend implementation
- Final integration

### Machine Learning

- Feature engineering
- Validation
- Model loader
- Predictor
- Calibration layer
- SHAP architecture
- Training pipeline
- Evaluation pipeline
- Model artifacts

### Qualitative Analysis

- GROQ integration
- Structured JSON response
- Fallback behavior
- Research limitations
- Final UI integration

### Research

- Methodology
- Ethics
- Model card
- Dataset card
- Threat model
- Deployment documentation
- Experiment log
- Final evaluation results

### Security

- Input validation
- Security headers
- Environment configuration
- Secret exclusion
- Request-size limit
- Production CORS verification
- Rate limiting
- Final security audit

### Deployment

- Vercel configuration
- Environment template
- Model artifacts
- Deployment smoke test
- Production verification

---

## 44. Final Status

StressIntel PRO is being developed as a deployable research prototype.

The current repository contains the application architecture, research
documentation, synthetic development data, predictive-engine design,
explainability layer, qualitative-analysis layer, and deployment
configuration.

The next development phase is to make the machine-learning pipeline fully
executable by generating the preprocessing and model artifacts from the
synthetic dataset, followed by frontend implementation and automated testing.

Research prototype status: ACTIVE DEVELOPMENT