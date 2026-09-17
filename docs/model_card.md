# StressIntel PRO — Model Card

## Model Details

**Model name:** StressIntel XGBoost Classifier  
**Platform:** StressIntel PRO  
**Model type:** Multiclass Gradient-Boosted Decision Trees  
**Framework:** XGBoost  
**Task:** Student stress-risk classification  
**Output classes:** Low, Medium, High  
**Model version:** `stressintel-xgb-v1.0.0`

---

## Intended Use

The model is intended for:

- Research experimentation
- Educational demonstration
- Explainability research
- Model-behavior analysis
- Scenario simulation
- Development of reproducible stress-risk pipelines

The model is not intended for:

- Medical diagnosis
- Psychiatric diagnosis
- Clinical decision-making
- Academic punishment
- Student ranking
- Admission decisions
- Scholarship decisions
- Employment decisions
- Automated high-impact decisions

---

## Training Data

The current development model is designed around the sample dataset:

`data/sample/sample_assessments.csv`

The dataset is synthetic and is intended only for software development and
pipeline validation.

It does not represent a real student population.

Any performance obtained from this dataset must therefore be described as a
development experiment rather than real-world validation.

---

## Input Features

The model currently uses 21 structured features:

```text
age
gender
academic_performance
study_hours
sleep_hours
sleep_quality
physical_activity_hours
screen_time_hours
social_interaction_hours
academic_pressure
financial_stress
family_pressure
peer_pressure
time_management
attendance_percentage
assignment_completion
exam_anxiety
mood_score
self_reported_stress
study_sleep_ratio
academic_load_index
```

The feature definitions and engineering procedures are documented in:

`docs/methodology.md`

---

## Output

The classifier produces a three-class stress-risk estimate:

- Low
- Medium
- High

The application also exposes class probabilities when supported by the model.

The probability values should not be interpreted as probabilities of a
clinical condition.

They represent the model's estimated class probabilities for the supplied
input under the evaluated model.

---

## Model Architecture

```text
Structured Assessment
        ↓
Input Validation
        ↓
Feature Engineering
        ↓
Preprocessing
        ↓
XGBoost Classifier
        ↓
Class Probabilities
        ↓
Calibration
        ↓
Stress-Risk Estimate
```

SHAP is applied separately to explain the model output.

---

## Explainability

StressIntel PRO uses SHAP's tree-based explanation mechanism.

The system provides:

- Local feature contributions
- Absolute feature impact
- Contribution direction
- Top model-associated risk drivers
- Top model-associated protective factors
- Global feature importance

SHAP explanations describe model behavior.

They do not establish:

- Causation
- Clinical significance
- Psychological diagnosis
- Intervention effectiveness
- Calibration

The platform supports a separately stored calibration artifact:

`models/stressintel_calibrator.joblib`

If the artifact is available, calibrated probabilities are returned.

If calibration has not been fitted, the system uses the model's raw probability
estimates.

Final research experiments must report the calibration procedure and its
evaluation separately from classification performance.

---

## Performance

No production performance claim is made at this stage.

The following metrics must be generated from a held-out evaluation dataset:

- Accuracy
- Macro F1
- Per-class precision
- Per-class recall
- Confusion matrix
- Calibration metrics
- Confidence intervals where appropriate

Development results must not be represented as validated real-world
performance.

---

## Evaluation Protocol

The final evaluation should use a reproducible train/validation/test protocol.

The following must be recorded:

- Dataset version
- Random seed
- Split strategy
- Feature configuration
- Preprocessing version
- Model hyperparameters
- Calibration method
- Software versions
- Model artifact version

Participant-level grouping should be used where repeated observations from the
same participant exist.

Temporal splitting should be considered for longitudinal data.

---

## Class Imbalance

The distribution of:

- Low
- Medium
- High

must be reported for every final dataset.

Accuracy alone should not be used to characterize model performance when class
distribution is imbalanced.

Macro F1 and per-class metrics should be reported alongside accuracy.

---

## Limitations

The current development model has significant limitations:

- Training data is synthetic.
- Sample size is not sufficient for population-level inference.
- Synthetic target labels do not represent clinically established stress categories.
- No clinical validation has been performed.
- External validity has not been established.
- Demographic fairness has not been established.
- Probability calibration requires empirical validation.
- Model outputs can be affected by input quality and dataset bias.
- SHAP explanations are not causal explanations.
- Results from synthetic data cannot be generalized to real students.

---

## Fairness Considerations

Before real-world research use, performance should be evaluated across
appropriate subgroups where sufficient data exists.

Potential analyses include:

- Per-group accuracy
- Per-group macro F1
- Per-class recall
- False-positive rates
- False-negative rates
- Calibration
- Confidence intervals

Very small subgroup samples should be reported as a limitation rather than
treated as reliable evidence.

---

## Data Leakage

The following information must not be derived from the final test set before
evaluation:

- Feature-selection decisions
- Hyperparameters
- Calibration parameters
- Classification thresholds
- Model-selection decisions

Any preprocessing requiring fitting must be fitted only on the appropriate
training data.

---

## Security and Privacy

The model should not receive unnecessary personally identifiable information.

The application should never require the model input to contain:

- Names
- Phone numbers
- Email addresses
- Residential addresses
- Student identification numbers

API credentials must be supplied through environment variables.

---

## Human Oversight

Model outputs should be reviewed within the appropriate research or
institutional context.

A model prediction should never independently determine a high-impact decision
about a student.

The system should communicate uncertainty and limitations alongside the
prediction.

---

## Ethical Considerations

StressIntel PRO is a research platform.

It should not be presented as a system that can determine whether a student is
clinically stressed.

Appropriate terminology includes:

- Estimated stress-risk category
- Model prediction
- Model-associated feature contribution
- Research signal

Inappropriate terminology includes:

- Diagnosis
- Confirmed stress
- Clinical stress detection
- The model diagnosed the student

---

## External Language Model

The journal-analysis component may use GROQ.

The predictive XGBoost model and SHAP explanation system are separate from the
external language-model component.

For publication, the exact GROQ model/version and configuration must be
reported.

Raw journal text should not be included in model logs or research artifacts
unless specifically required by the approved research protocol.

---

## Versioning

Current model version:

`stressintel-xgb-v1.0.0`

Future model versions should document:

- Dataset version
- Feature changes
- Training changes
- Hyperparameter changes
- Evaluation results
- Calibration changes
- Explainability changes
- Breaking API changes

---

## Change Log

### v1.0.0

Initial StressIntel PRO model specification.

---

## Status

Development / Research Prototype

No production or clinical validation claim is made.