# StressIntel PRO — Research Methodology

## 1. Research Objective

StressIntel PRO investigates whether structured behavioral, academic,
physiological, and self-reported student indicators can be used to estimate
stress-risk categories through an interpretable machine-learning pipeline.

The primary research objectives are:

1. Develop a reproducible student stress-risk classification pipeline.
2. Evaluate an XGBoost classifier for three stress-risk categories.
3. Compare predictive performance using appropriate evaluation metrics.
4. Analyze model behavior using SHAP explainability.
5. Investigate the contribution of different feature groups through ablation
   experiments.
6. Evaluate supplementary qualitative signals obtained from journal text.
7. Examine uncertainty and probability calibration.
8. Document limitations, ethical considerations, and reproducibility
   requirements.

---

## 2. Research Hypothesis

### Primary Hypothesis

A combination of structured student behavioral, academic, lifestyle, and
self-reported indicators can provide useful information for distinguishing
between predefined stress-risk categories.

### Secondary Hypotheses

- XGBoost can model nonlinear relationships between student indicators and
  stress-risk categories.
- SHAP can provide interpretable feature-attribution information for individual
  predictions.
- Different feature groups contribute differently to predictive performance.
- Probability calibration can improve the interpretability of predicted
  probabilities.
- Journal-text analysis can provide supplementary contextual information that
  is not represented by structured assessment features.

These hypotheses must be evaluated empirically rather than assumed to be true.

---

## 3. Dataset

During application development, StressIntel PRO uses a synthetic sample
dataset located at:

`data/sample/sample_assessments.csv`

The sample dataset exists for:

- Pipeline development
- API testing
- UI development
- Model integration
- SHAP integration
- Demonstration

It must not be treated as a representative population dataset.

Performance obtained from the sample dataset must not be presented as evidence
of general student stress prevalence or real-world model effectiveness.

For publication-quality experiments, a properly governed and documented
research dataset should replace the development dataset.

---

## 4. Feature Schema

The current structured assessment contains the following variables:

| Feature | Type | Description |
|---|---|---|
| `age` | Numeric | Participant age |
| `gender` | Categorical | Self-reported gender category |
| `academic_performance` | Numeric | Academic performance measure |
| `study_hours` | Numeric | Reported daily study hours |
| `sleep_hours` | Numeric | Reported daily sleep duration |
| `sleep_quality` | Numeric | Self-reported sleep quality |
| `physical_activity_hours` | Numeric | Reported physical activity |
| `screen_time_hours` | Numeric | Daily screen exposure |
| `social_interaction_hours` | Numeric | Daily social interaction |
| `academic_pressure` | Numeric | Academic pressure score |
| `financial_stress` | Numeric | Financial stress score |
| `family_pressure` | Numeric | Family-related pressure score |
| `peer_pressure` | Numeric | Peer-related pressure score |
| `time_management` | Numeric | Time-management score |
| `attendance_percentage` | Numeric | Academic attendance |
| `assignment_completion` | Numeric | Assignment completion percentage |
| `exam_anxiety` | Numeric | Exam-related anxiety score |
| `mood_score` | Numeric | Self-reported mood score |
| `self_reported_stress` | Numeric | Self-reported stress score |
| `study_sleep_ratio` | Derived | Study duration relative to sleep duration |
| `academic_load_index` | Derived | Combined academic-load indicator |

The target variable is:

`stress_level`

with three classes:

- `Low`
- `Medium`
- `High`

---

## 5. Feature Engineering

Two derived variables are currently used.

### 5.1 Study-to-Sleep Ratio

The ratio is calculated as:

```text
study_sleep_ratio = study_hours / sleep_hours
```

When sleep duration is zero or unavailable, the implementation applies a
safe fallback to prevent division-by-zero errors.

The feature is descriptive and does not establish that study duration causes
stress.

### 5.2 Academic Load Index

The Academic Load Index combines:

- Study duration
- Academic pressure
- Exam anxiety
- Attendance gap
- Assignment-completion gap

The resulting value is bounded between 0 and 100.

The implementation is located in:

`ml/feature_engineering.py`

The exact formula and weights should remain version-controlled so that
experiments can be reproduced.

---

## 6. Data Validation

All assessment requests pass through the validation layer before model
inference.

Validation includes:

- Required-field validation
- Data-type validation
- Range validation
- Categorical-value validation
- Consent validation
- Unexpected-field detection
- Input-size restrictions

Validation prevents invalid values from reaching the prediction engine.

---

## 7. Preprocessing

The preprocessing pipeline is separated from the prediction engine.

The expected trained preprocessing artifact is:

`models/stressintel_preprocessor.joblib`

The preprocessing procedure must be identical between training and inference.

The final research implementation should document:

- Missing-value strategy
- Numerical transformations
- Categorical encoding
- Feature ordering
- Scaling, if used
- Outlier handling
- Training-only fitting procedures

No preprocessing step should use information from the held-out test set.

---

## 8. Data Splitting

The final research dataset should be separated into training, validation, and
test partitions.

A recommended initial protocol is:

- Training Set → Model fitting
- Validation Set → Model selection / hyperparameter tuning
- Test Set → Final evaluation

A fixed random seed should be recorded.

If multiple observations belong to the same participant, participant-level
grouped splitting should be used.

For longitudinal observations, temporal leakage must be prevented by preserving
the appropriate chronological structure.

---

## 9. Baseline Models

XGBoost should not be evaluated in isolation.

The research pipeline should include simple baseline models such as:

- Majority-class classifier
- Logistic Regression
- Decision Tree
- Random Forest

The purpose is to determine whether the proposed XGBoost model provides
measurable value beyond simpler approaches.

Model comparisons should use the same evaluation partitions wherever possible.

---

## 10. Primary Model

The primary predictive model is:

XGBoost Classifier

The model performs multiclass classification:

```text
Input Features
      ↓
XGBoost
      ↓
P(Low)
P(Medium)
P(High)
      ↓
Predicted Class
```

The model configuration must be version-controlled.

Important parameters include:

- Number of estimators
- Maximum tree depth
- Learning rate
- Subsample ratio
- Column sampling ratio
- Minimum child weight
- Regularization parameters
- Random seed

Hyperparameters should be selected using the training/validation procedure
without using the final test set.

---

## 11. Probability Calibration

The system supports an optional calibration artifact:

`models/stressintel_calibrator.joblib`

Calibration is used to evaluate whether predicted probabilities correspond
reasonably to observed frequencies.

The final research evaluation should consider metrics such as:

- Brier score
- Expected Calibration Error
- Reliability diagrams

Calibration must be fitted using training/validation data only and evaluated
on held-out data.

---

## 12. Evaluation Metrics

The final evaluation should report:

### Accuracy

The proportion of correctly classified observations.

### Macro F1

The unweighted mean of F1 scores across the three classes.

Macro F1 is particularly useful when class sizes are unequal.

### Per-Class Precision

Reported independently for:

- Low
- Medium
- High

### Per-Class Recall

Reported independently for:

- Low
- Medium
- High

### Confusion Matrix

The confusion matrix should identify which classes are most frequently
confused.

### Calibration

Probability calibration should be evaluated separately from classification
accuracy.

### Confidence Intervals

Where feasible, confidence intervals should be calculated using an appropriate
resampling or statistical procedure.

---

## 13. Error Analysis

Errors should be examined by:

- Predicted class
- Actual class
- Confidence
- Feature patterns
- Missingness
- Feature-group membership

Particular attention should be given to:

- False negatives for the High class
- False positives for the High class
- Low-confidence predictions
- Underrepresented groups
- Samples containing missing values

The objective is to understand model failure modes rather than merely maximize
a single performance metric.

---

## 14. SHAP Explainability

SHAP is a core research component of StressIntel PRO.

The system uses:

`shap.TreeExplainer`

for the XGBoost model.

### Local Explanation

For an individual prediction, SHAP identifies the contribution of each feature
to the model output.

The system reports:

- Feature
- Feature value
- SHAP value
- Absolute impact
- Contribution direction

### Global Explanation

Global model behavior should be analyzed using aggregated feature importance
and, where appropriate, SHAP-based global summaries.

### Interpretation

SHAP results should be described as:

> Feature contribution to model prediction

and not as:

> Feature causes stress

Model explanations do not establish causal relationships.

---

## 15. Ablation Study

The research pipeline should support feature-group ablations.

Recommended groups:

### Group A — Academic

- academic_performance
- study_hours
- academic_pressure
- time_management
- attendance_percentage
- assignment_completion
- exam_anxiety
- academic_load_index

### Group B — Lifestyle

- sleep_hours
- sleep_quality
- physical_activity_hours
- screen_time_hours
- social_interaction_hours
- study_sleep_ratio

### Group C — Contextual

- financial_stress
- family_pressure
- peer_pressure

### Group D — Psychological / Self-Reported

- mood_score
- self_reported_stress

### Group E — Combined Structured

All structured features.

The same evaluation methodology should be applied to each configuration.

---

## 16. Journal Analysis

Journal analysis is treated as a supplementary qualitative modality.

The workflow is:

```text
Journal Text
     ↓
Input Sanitization
     ↓
GROQ
     ↓
Structured Qualitative Output
```

Potential outputs include:

- Sentiment
- Stress-related signal
- Possible contextual stressors
- Protective signals
- Themes
- Summary
- Uncertainty

The journal component must not be described as a diagnostic system.

The research paper should explicitly document the exact GROQ model/version,
prompt configuration, temperature, token limit, hosting arrangement, and
fallback behavior.

---

## 17. Multimodal Evaluation

A future research experiment may compare:

```text
Structured Only
        vs
Structured + Journal
        vs
Structured + Validated Visual Signals
        vs
Full Multimodal Configuration
```

Each configuration must be evaluated independently.

The research should report whether additional modalities produce measurable
changes in:

- Accuracy
- Macro F1
- Per-class recall
- Calibration
- Error characteristics

Additional modalities should not be claimed to improve performance unless
supported by experimental evidence.

---

## 18. Scenario Simulation

The simulation module allows controlled hypothetical changes to input values.

Example:

```text
Baseline Input
      ↓
Modify One or More Features
      ↓
Run Model
      ↓
Compare Predictions
```

Simulation results represent changes in model output under hypothetical input
conditions.

They must not be interpreted as evidence that changing a particular real-world
behavior will produce the same outcome.

---

## 19. Reproducibility

Every final experiment should record:

- Experiment ID
- Dataset Version
- Feature Configuration
- Random Seed
- Split Strategy
- Model Configuration
- Preprocessing Version
- Calibration Method
- Software Environment
- Model Version
- Evaluation Metrics

Experiment records are stored in:

`research/experiments/experiment_log.csv`

---

## 20. Research Limitations

The initial development version has important limitations:

- The development dataset is synthetic.
- The sample size is not suitable for population-level conclusions.
- The target labels are demonstration labels.
- External validity has not been established.
- No clinical validation has been performed.
- Journal analysis depends on an external language model.
- Visual analysis requires separate validation before research use.
- Model predictions may reflect dataset biases.
- SHAP explanations do not establish causality.
- Probability estimates require empirical calibration evaluation.
- Performance claims cannot be generalized beyond the evaluated population
  and experimental setting.

These limitations must remain visible in the final research documentation.

---

## 21. Ethical Scope

StressIntel PRO is intended for research and decision support.

It must not be used to:

- Diagnose mental-health conditions
- Replace professional assessment
- Automatically make disciplinary decisions
- Automatically determine academic eligibility
- Rank students by psychological status
- Make high-impact decisions without appropriate human review

Participation should be voluntary where applicable, and data collection should
follow the approved research protocol.

Only information necessary for the research objective should be collected.

---

## 22. Final Research Claim Boundary

The appropriate claim structure is:

> The evaluated model achieved [measured result] on [defined dataset]
> under [defined evaluation protocol].

Avoid unsupported statements such as:

> The system accurately detects stress in students.

or:

> The model diagnoses stressed students.

All conclusions must remain bounded by the population, dataset, methodology, and evaluation protocol used in the experiment.