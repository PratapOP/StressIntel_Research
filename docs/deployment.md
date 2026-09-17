# StressIntel PRO — Deployment Guide

## 1. Purpose

This document defines the deployment architecture, environment configuration,
security requirements, model artifact requirements, operational checks, and
rollback procedures for StressIntel PRO.

StressIntel PRO is designed as a Flask-based research application with:

- Flask API
- HTML/CSS/JavaScript frontend
- XGBoost predictive engine
- SHAP explainability
- GROQ-powered qualitative journal analysis
- Research-oriented simulations and reporting
- Vercel-compatible deployment

The deployment configuration must preserve the research limitations described
in the methodology, ethics, model card, and dataset card.

---

## 2. Deployment Architecture

The production deployment follows this logical structure:

```text
                         ┌─────────────────────────┐
                         │        User Browser      │
                         │                         │
                         │ HTML / CSS / JavaScript  │
                         └────────────┬────────────┘
                                      │ HTTPS
                                      ▼
                         ┌─────────────────────────┐
                         │        Vercel           │
                         │                         │
                         │ Flask Application       │
                         │ Serverless Runtime      │
                         └────────────┬────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
             ┌────────────┐   ┌──────────────┐  ┌──────────────┐
             │ XGBoost    │   │ SHAP         │  │ GROQ API     │
             │ Model      │   │ Explainability│  │ Qualitative  │
             │            │   │              │  │ Analysis     │
             └────────────┘   └──────────────┘  └──────────────┘
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │ Research Outputs        │
                         │                         │
                         │ Predictions             │
                         │ Explanations            │
                         │ Simulations              │
                         │ Reports                 │
                         └─────────────────────────┘
```

---

## 3. Deployment Target

The primary deployment target is:

Vercel

The application must remain compatible with Vercel's Python serverless
execution environment.

The deployment should not depend on:

- Persistent local processes
- Persistent local filesystem writes
- Background workers
- Local databases
- Long-running training jobs
- Local development-only services

Model training and research experiments should be performed separately from the
production inference environment.

---

## 4. Production Principles

Production deployment should follow these principles:

- Production code must use version-controlled artifacts.
- Secrets must never be committed to Git.
- Research datasets must not be exposed through the public application.
- Production inference must use a fixed model version.
- Model changes must be evaluated before deployment.
- SHAP explanations must correspond to the deployed model.
- Preprocessing must correspond exactly to the deployed model.
- GROQ configuration must be externally configurable.
- Production logs must avoid sensitive user content.
- Temporary files must not be treated as persistent storage.
- HTTPS must be enforced.
- Deployment versions must be identifiable.
- Failed deployments must be reversible.
- Research results must remain distinguishable from clinical claims.

---

## 5. Environment Configuration

Production configuration should be supplied through the deployment platform's
environment-variable system.

Required or recommended variables include:

- SECRET_KEY
- GROQ_API_KEY
- GROQ_MODEL
- MODEL_PATH
- PREPROCESSOR_PATH
- CALIBRATOR_PATH
- MODEL_VERSION
- CORS_ORIGINS
- FLASK_DEBUG
- FLASK_ENV
- SESSION_COOKIE_SECURE
- ENABLE_WEBCAM
- ENABLE_RESEARCH_ANALYTICS
- ENABLE_GROQ_ANALYSIS
- LOG_LEVEL

Example development configuration:

```env
FLASK_DEBUG=false
FLASK_ENV=development

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

MODEL_PATH=models/stressintel_xgboost.json
PREPROCESSOR_PATH=models/stressintel_preprocessor.joblib
CALIBRATOR_PATH=models/stressintel_calibrator.joblib

MODEL_VERSION=stressintel-xgb-v1.0.0

CORS_ORIGINS=*

SESSION_COOKIE_SECURE=false

ENABLE_WEBCAM=false
ENABLE_RESEARCH_ANALYTICS=true
ENABLE_GROQ_ANALYSIS=true

LOG_LEVEL=INFO
```

The actual production values must be configured through the deployment
platform and must not be committed to the repository.

---

## 6. Secret Management

The following values are considered secrets:

- SECRET_KEY
- GROQ_API_KEY
- Any future authentication credentials
- Any future external-service credentials

Secrets must:

- Exist only in environment configuration.
- Never be hard-coded into source files.
- Never appear in frontend JavaScript.
- Never appear in Git history.
- Never appear in screenshots used for publication.
- Never be included in research reports.
- Never be returned by API endpoints.

The GROQ API key must only be accessed by server-side Python code.

The browser must never receive the GROQ API key.

---

## 7. Model Artifact Deployment

The production model consists of multiple coordinated artifacts:

```text
models/
├── stressintel_xgboost.json
├── stressintel_preprocessor.joblib
├── stressintel_calibrator.joblib
└── README.md
```

The artifacts must be treated as one model release.

A valid release requires:

```text
Model
+
Preprocessor
+
Calibration configuration
+
Feature schema
+
Model version
+
Experiment record
```

These components must not be independently changed in production.

---

## 8. Model Versioning

Every production model must have a unique version identifier.

Example:

```text
stressintel-xgb-v1.0.0
```

A model version should be associated with:

- Dataset version
- Training date
- Random seed
- Feature schema
- Preprocessing version
- Calibration method
- Evaluation metrics
- Software environment
- Training configuration
- Experiment ID

Example experiment mapping:

```text
Model:
stressintel-xgb-v1.0.0

Experiment:
EXP-001

Dataset:
sample-v1

Seed:
42
```

The sample dataset is synthetic and must not be treated as evidence of
real-world predictive performance.

---

## 9. Model Training

Model training must not occur during a normal production request.

The production application should perform:

```text
Input
  ↓
Validation
  ↓
Feature Engineering
  ↓
Preprocessing
  ↓
Model Inference
  ↓
Calibration
  ↓
SHAP Explanation
```

Training should be performed separately.

The training environment should produce:

- XGBoost model
- Preprocessor
- Calibrator
- Evaluation metrics
- Confusion matrix
- Calibration results
- Experiment log
- Model metadata

---

## 10. Dataset Separation

Development and production data must be separated.

The repository may contain:

```text
data/sample/sample_assessments.csv
```

for application development.

Production must not expose:

```text
data/
```

as a public static directory.

Private research datasets must remain outside the public deployment artifact
unless their governance and access controls explicitly permit deployment.

---

## 11. Synthetic Dataset Warning

The current sample dataset is synthetic.

It is intended to:

- Validate application functionality.
- Validate the ML pipeline.
- Demonstrate the user interface.
- Test prediction APIs.
- Demonstrate SHAP.
- Demonstrate research dashboards.

It must not be used to claim:

- Clinical validity.
- Population-level validity.
- Generalizable predictive performance.
- Real-world student stress prevalence.
- Fairness across real populations.
- Clinical diagnostic capability.

Real research claims require an appropriately governed dataset and formal
evaluation.

---

## 12. Vercel Configuration

The repository should expose the Flask application through the Vercel
configuration.

The expected deployment relationship is:

```text
Vercel
  ↓
Python runtime
  ↓
app.py
  ↓
create_app()
```

The Flask object:

```python
app = create_app()
```

must remain available at module scope so the deployment platform can import
the application.

---

## 13. Static Assets

Static assets are served from:

```text
static/
```

The frontend should use relative application paths.

Examples:

- /static/css/style.css
- /static/css/dashboard.css
- /static/js/app.js
- /static/js/assessment.js
- /static/js/results.js

No frontend file should contain private server credentials.

---

## 14. Frontend API Communication

The frontend communicates with Flask through relative API endpoints.

Examples:

- POST /api/assessment/
- POST /api/analysis/journal
- POST /api/analysis/explain
- POST /api/simulation/
- POST /api/reports/
- GET /api/health/

Using relative paths allows the same frontend to operate in:

- Local development
- Preview deployment
- Production deployment

without hard-coding a production domain.

---

## 15. CORS

CORS should be restricted in production.

Development may use:

```text
CORS_ORIGINS=*
```

Production should use the deployed application origin.

Example concept:

```text
CORS_ORIGINS=https://<production-domain>
```

Wildcard CORS should not be used unnecessarily in production.

---

## 16. HTTPS

Production deployment must use HTTPS.

HTTPS protects:

- Assessment submissions
- Journal text
- Model responses
- SHAP explanations
- Session information
- API requests

Users should never be instructed to submit sensitive research information over
plain HTTP.

---

## 17. Security Headers

The application should provide security headers including:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy
- Content-Security-Policy

The security configuration must be reviewed whenever external frontend
libraries or APIs are introduced.

---

## 18. Content Security Policy

The current security policy permits selected resources required by the
application.

If additional external resources are introduced, the CSP must be explicitly
updated.

Do not replace a restrictive CSP with:

```text
default-src *
```

or equivalent unrestricted policies.

External scripts should be minimized.

---

## 19. Logging

Production logging should prioritize operational information rather than
research content.

Acceptable log information includes:

- Request status
- Endpoint
- Timestamp
- Application version
- Model version
- Error category
- Processing duration

Logs should not contain:

- Raw journal entries
- Names
- Email addresses
- Student IDs
- API keys
- Authentication secrets
- Webcam images
- Sensitive assessment content

Production environments should prefer platform-provided log collection over
persistent local file storage.

---

## 20. Vercel Filesystem Constraint

The deployed serverless environment must not be treated as permanent storage.

The application should not assume that files written during a request will
remain available to future requests.

Therefore:

- Do not store user data locally.
- Do not store uploaded images permanently.
- Do not use local files as a database.
- Do not depend on persistent runtime-generated reports.

Static model artifacts committed with the deployment may be read by the
application, but runtime-generated persistent state requires an appropriate
external storage architecture if introduced in the future.

---

## 21. Runtime Resource Considerations

The ML stack includes:

- NumPy
- Pandas
- Scikit-learn
- XGBoost
- SHAP
- Pillow
- OpenCV

These dependencies can increase serverless package size and cold-start time.

Deployment testing should therefore verify:

- Build success
- Import success
- Function startup time
- Memory consumption
- Model loading time
- SHAP execution time
- GROQ request latency
- Maximum practical request size

If the deployment platform imposes package or execution constraints, the
dependency set should be reduced without removing required research
capabilities.

---

## 22. Cold Starts

Model loading may occur during a cold serverless invocation.

The application uses module-level model loading helpers to allow model objects
to be reused when the serverless runtime remains warm.

This behavior must not be interpreted as guaranteed persistent process state.

A cold start may require:

```text
Import application
Load model
Load preprocessor
Load calibrator
Initialize SHAP
Process request
```

Performance measurements should therefore distinguish cold-start and warm
execution where relevant.

---

## 23. GROQ Deployment

GROQ is used only for qualitative journal analysis.

The deployment must ensure:

```text
Browser
  ↓
Flask
  ↓
GROQ API
```

and never:

```text
Browser
  ↓
GROQ API key
```

The configured model must be recorded for reproducibility.

Research documentation should include:

- Provider
- Model identifier
- API usage date/period
- System prompt version
- Temperature
- Maximum output tokens
- Parsing strategy
- Fallback behavior

If the provider or model changes, the qualitative analysis configuration should
receive a new documented version.

---

## 24. GROQ Failure Handling

The application includes a fallback response when qualitative analysis cannot
be completed.

Possible causes include:

- Missing API key
- Disabled GROQ integration
- Provider failure
- Network failure
- Invalid response
- Invalid JSON
- Unexpected response structure

The fallback must not fabricate a sentiment or stress interpretation.

It should indicate that automated analysis was unavailable.

---

## 25. Webcam Deployment

Webcam analysis is optional.

The default configuration is:

```text
ENABLE_WEBCAM=false
```

If webcam functionality is enabled, deployment must additionally address:

- Explicit user consent
- Browser camera permission
- Secure HTTPS
- Data minimization
- No unnecessary image retention
- No hidden recording
- Clear research-purpose disclosure
- Failure handling
- Privacy review

Webcam functionality must not be enabled by default solely for demonstration.

---

## 26. Consent

Assessment processing should require explicit research consent.

Consent should be:

- Clear
- Specific
- Voluntary
- Documented according to the research protocol
- Revocable where applicable

The application must not present consent as proof of clinical validity.

Consent does not remove the requirement for appropriate research governance.

---

## 27. Health and Clinical Boundary

StressIntel PRO is a research platform.

Production deployment must clearly communicate:

This system provides research-oriented stress-risk estimates.
It is not a medical diagnostic device.

Model output must not be represented as:

- A diagnosis
- A clinical assessment
- A psychiatric evaluation
- A medical recommendation
- Proof of causality

---

## 28. Deployment Checklist

Before production deployment:

### Application

- Flask application starts successfully.
- app = create_app() is importable.
- All routes register successfully.
- Frontend pages render.
- Error pages render.
- Health endpoint responds.

### Machine Learning

- Model artifact exists.
- Preprocessor artifact exists.
- Calibration artifact is present or intentionally disabled.
- Feature schema matches training.
- Model version is recorded.
- Inference works.
- Probability output works.
- SHAP explanation works.
- SHAP feature names are validated.

### GROQ

- API key configured as a secret.
- API key is not exposed to frontend code.
- Model identifier is documented.
- Prompt version is documented.
- Fallback behavior works.
- Provider errors do not crash the application.

### Security

- HTTPS enabled.
- Production CORS restricted.
- Security headers enabled.
- Debug mode disabled.
- Secrets excluded from Git.
- Sensitive data excluded from logs.
- Request-size limits enabled.
- Input validation enabled.

### Research

- Dataset version documented.
- Experiment ID documented.
- Random seed documented.
- Evaluation metrics recorded.
- Class distribution recorded.
- Limitations documented.
- Synthetic-data warning displayed where appropriate.
- Clinical claims excluded.

### Deployment

- Production build succeeds.
- Health endpoint verified.
- Assessment endpoint verified.
- Journal endpoint verified.
- SHAP endpoint verified.
- Simulation endpoint verified.
- Report endpoint verified.
- Production UI tested.
- Error handling tested.
- Rollback version identified.

---

## 29. Post-Deployment Smoke Test

After deployment, perform the following sequence.

### Test 1 — Health

Request:

```text
GET /api/health/
```

Expected:

```json
{
  "status": "healthy"
}
```

### Test 2 — Landing Page

Request:

```text
GET /
```

Expected:

- HTTP 200
- The StressIntel PRO interface should render.

### Test 3 — Assessment

Submit a valid synthetic assessment.

Expected:

- HTTP 200
- risk_level
- predicted_class
- confidence
- probabilities
- model

### Test 4 — SHAP

Submit the returned features and prediction to:

```text
POST /api/analysis/explain
```

Expected:

- feature_contributions
- top_risk_drivers
- top_protective_factors

### Test 5 — Journal

Submit a non-sensitive test journal entry.

Expected:

- sentiment
- stress_signal
- themes
- summary
- uncertainty

or an explicit fallback state if GROQ is unavailable.

### Test 6 — Simulation

Submit a modified synthetic assessment.

Expected:

- HTTP 200
- A model prediction

### Test 7 — Report

Submit the prediction and features.

Expected:

- report_metadata
- prediction
- feature_explanation
- research_interpretation

---

## 30. Failure Classification

Deployment failures should be classified into categories.

### Configuration Failure

Examples:

- Missing environment variable
- Invalid model path
- Invalid CORS configuration

### Artifact Failure

Examples:

- Missing model
- Corrupt model
- Preprocessor mismatch
- Calibration artifact mismatch

### Application Failure

Examples:

- Unhandled exception
- Invalid route registration
- Template error
- JavaScript failure

### Dependency Failure

Examples:

- Package incompatibility
- Runtime import failure
- Unsupported Python dependency

### External Service Failure

Examples:

- GROQ unavailable
- GROQ timeout
- Invalid provider response

### Research Integrity Failure

Examples:

- Incorrect dataset version
- Incorrect model version
- Feature leakage
- Incorrect experiment record
- Unreported preprocessing change

---

## 31. Rollback Procedure

If a production deployment introduces a critical defect:

1. Identify the failing deployment.
2. Identify the previous validated deployment.
3. Verify that the previous model artifacts are intact.
4. Restore the previous deployment.
5. Confirm the health endpoint.
6. Run the production smoke tests.
7. Record the incident.
8. Identify the root cause.
9. Correct the defect in development.
10. Repeat evaluation before redeployment.

Model rollback and application rollback should remain traceable to specific
versions.

---

## 32. Model Rollback

A model rollback must restore the complete compatible artifact set.

Do not replace only:

```text
stressintel_xgboost.json
```

while keeping an incompatible:

```text
stressintel_preprocessor.joblib
```

or:

```text
stressintel_calibrator.joblib
```

The rollback unit should be:

```text
Model
+
Preprocessor
+
Calibrator
+
Feature schema
+
Metadata
```

---

## 33. Monitoring

The research prototype should monitor operational indicators where supported:

- Request count
- Error rate
- Response latency
- Model loading failures
- SHAP failures
- GROQ failures
- HTTP status distribution
- Deployment health
- Model version

Operational monitoring must avoid collecting unnecessary personal data.

---

## 34. Model Monitoring

When real research data is eventually used, model monitoring should consider:

- Input distribution shift
- Missing-value rates
- Class distribution
- Prediction distribution
- Confidence distribution
- Calibration drift
- Feature distribution drift
- Error rates
- Subgroup performance
- Temporal drift

Model performance should not be inferred solely from prediction confidence.

---

## 35. Research Monitoring

Research evaluation should remain separate from operational monitoring.

Operational metrics answer:

> Is the application functioning?

Research metrics answer:

> Does the model perform reliably under the defined evaluation protocol?

The two should not be conflated.

---

## 36. Dependency Management

Production dependencies must be pinned or otherwise reproducibly controlled.

Changes to:

```text
requirements.txt
```

should trigger:

- Application tests
- ML tests
- SHAP tests
- Deployment tests
- Dependency compatibility review

Security-sensitive dependency updates should be evaluated before production
deployment.

---

## 37. Reproducible Environment

The following should be recorded for every research model release:

- Python version
- Operating system
- Package versions
- XGBoost version
- Scikit-learn version
- SHAP version
- NumPy version
- Pandas version
- Random seed
- Dataset version
- Model version
- Training configuration
- Calibration method

The exact environment should be recoverable sufficiently to reproduce the
reported experiment.

---

## 38. CI/CD Recommendation

A future CI/CD pipeline should execute:

```text
Install dependencies
        ↓
Lint / syntax checks
        ↓
Unit tests
        ↓
API tests
        ↓
ML tests
        ↓
SHAP tests
        ↓
Build verification
        ↓
Deployment
        ↓
Smoke test
```

Deployment should be blocked when critical tests fail.

---

## 39. Pre-Publication Deployment Freeze

Before using the application for a research study or publication:

- Freeze the model version.
- Freeze the preprocessing configuration.
- Freeze the feature schema.
- Freeze the evaluation protocol.
- Freeze the qualitative analysis configuration.
- Record software versions.
- Record dataset version.
- Record experiment configuration.
- Perform final security review.
- Perform final ethics review where required.

Subsequent changes should receive a new version identifier.

---

## 40. Data Retention

The application should minimize retention.

If user-submitted data is temporarily processed:

```text
Process
  ↓
Generate output
  ↓
Return output
  ↓
Discard unnecessary input
```

Persistent storage should only be introduced when there is a defined research
purpose, governance process, retention period, access policy, and deletion
procedure.

---

## 41. De-identification

Research records should use de-identified identifiers where appropriate.

Do not use direct identifiers as model features.

Examples of information that should generally remain outside the predictive
feature payload include:

- Name
- Email
- Phone number
- University roll number
- Address
- Authentication credentials

A participant identifier, where scientifically necessary, should be handled
according to the research data-management protocol.

---

## 42. Security Incident Response

For a suspected security incident:

```text
Detect
  ↓
Contain
  ↓
Assess
  ↓
Preserve relevant technical evidence
  ↓
Rotate compromised credentials
  ↓
Patch vulnerability
  ↓
Validate deployment
  ↓
Document incident
```

If research data may have been exposed, the applicable institutional and legal
incident-response procedures must be followed.

---

## 43. API Abuse Protection

The production deployment should eventually implement appropriate controls
for:

- Request size
- Request frequency
- Journal length
- Invalid request bursts
- Expensive SHAP requests
- External API usage

Rate limiting may be added through the deployment architecture if required.

A public research demonstration should not expose unrestricted expensive
inference endpoints unnecessarily.

---

## 44. Authentication and Authorization

The current prototype does not require a database-backed authentication
system.

If the platform is later used with real participant data, access control
should be introduced.

Potential roles include:

- Research Administrator
- Researcher
- Reviewer
- Participant

Authorization must follow least privilege.

Authentication should not be added merely for demonstration if it introduces
unnecessary complexity or insecure credential storage.

---

## 45. Production Domain

The final deployment should use a stable HTTPS domain.

The production domain should be configured consistently across:

- CORS_ORIGINS
- Application metadata
- Research documentation
- Consent information
- Deployment documentation
- Publication artifact documentation

Preview deployments should not be treated as the canonical research
endpoint.

---

## 46. Deployment Documentation

Every production release should record:

- Release ID
- Deployment date
- Application version
- Model version
- Dataset version
- Experiment ID
- Environment
- Major changes
- Known limitations
- Validation status
- Rollback target

Example:

```text
Release: release-1.0.0
Application: 1.0.0
Model: stressintel-xgb-v1.0.0
Dataset: sample-v1
Experiment: EXP-001
Environment: production
Status: validated for demonstration
```

---

## 47. Research Artifact Availability

Where permitted by research governance, the following artifacts should be made
available for reproducibility:

- Source code
- Environment specification
- Feature schema
- Synthetic sample data
- Experiment logs
- Methodology
- Model card
- Dataset card
- Evaluation scripts
- Model metadata

Sensitive participant data must not be released merely for reproducibility.

---

## 48. Deployment Limitations

The initial deployment is a research prototype.

Known limitations include:

- Synthetic development dataset
- Small sample size
- No evidence of external validity
- No clinical validation
- No production authentication layer
- No persistent research database
- Optional external LLM dependency
- Serverless resource constraints
- Potential cold-start latency
- Limited operational monitoring
- No demonstrated prospective validation

These limitations must remain visible in research documentation.

---

## 49. Final Production Gate

StressIntel PRO should be considered ready for public demonstration only when:

```text
Application starts
        AND
Routes work
        AND
Frontend works
        AND
Model artifacts load
        AND
Preprocessing matches model
        AND
Calibration is validated
        AND
SHAP works
        AND
GROQ fallback works
        AND
Security headers work
        AND
Debug mode is disabled
        AND
Secrets are protected
        AND
Health check passes
        AND
Smoke tests pass
```

Readiness for a real research study additionally requires appropriate:

- Dataset governance
- Ethics review
- Consent procedure
- Privacy controls
- Research protocol
- Model evaluation
- Fairness analysis
- Data-management plan

---

## 50. Deployment Status

Current project status:

| Area | Status |
|---|---|
| Application architecture | Defined |
| Flask backend | Implemented |
| ML architecture | Implemented |
| SHAP architecture | Implemented |
| GROQ architecture | Implemented |
| Research documentation | Implemented |
| Synthetic sample data | Available |
| Production model artifacts | Pending |
| Training pipeline | Pending |
| Evaluation pipeline | Pending |
| Frontend | Pending |
| Testing | Pending |
| Vercel configuration | Pending |
| Production deployment | Pending |

The project must not be represented as a validated clinical or production
stress-diagnosis system.

The intended deployment status is:

Research prototype / demonstration system.

---

### Checklist

- [x] 01. Project structure
- [x] 02. `app.py`
- [x] 03. `config/settings.py`
- [x] 04. `config/__init__.py`
- [x] 05. API routes
- [ ] 06. ML pipeline
- [ ] 07. Frontend
- [x] 08. SHAP architecture
- [x] 09. GROQ architecture
- [x] 10. Research documentation
- [ ] 11. Testing
- [x] 12. Deployment documentation
- [ ] 13. Model artifacts
- [ ] 14. Vercel configuration
- [ ] 15. Final integration
