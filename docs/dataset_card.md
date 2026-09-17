# StressIntel PRO — Dataset Card

## Dataset Name

StressIntel PRO Development Sample Dataset

## Dataset Version

`sample-v1.0`

## Dataset Status

**Synthetic / Development Only**

The current dataset is artificially constructed for application development,
machine-learning pipeline testing, API integration, visualization, and
demonstration.

It is not a real participant dataset.

---

## Dataset Location

```text
data/sample/sample_assessments.csv
```

---

## Intended Purpose

The dataset is used to validate the complete StressIntel PRO workflow:

```text
Assessment
    ↓
Validation
    ↓
Feature Engineering
    ↓
Preprocessing
    ↓
XGBoost
    ↓
Calibration
    ↓
SHAP
    ↓
Research Dashboard
```

It is not intended to estimate stress prevalence or validate the system on
real students.

---

## Dataset Structure

The dataset contains:

- 20 development observations
- 21 model features
- 1 target variable

### Structured Features

- age
- gender
- academic_performance
- study_hours
- sleep_hours
- sleep_quality
- physical_activity_hours
- screen_time_hours
- social_interaction_hours
- academic_pressure
- financial_stress
- family_pressure
- peer_pressure
- time_management
- attendance_percentage
- assignment_completion
- exam_anxiety
- mood_score
- self_reported_stress
- study_sleep_ratio
- academic_load_index

### Target

`stress_level`

Target categories:

- Low
- Medium
- High

---

## Data Types

### Numeric Features

Most assessment variables are represented as numeric values.

Examples include:

- study_hours
- sleep_hours
- academic_pressure
- exam_anxiety
- mood_score
- self_reported_stress

### Categorical Feature

`gender`

The current development schema permits:

- Male
- Female
- Non-binary
- Other
- Prefer not to say

---

## Derived Features

Two features are derived by the application:

### Study-to-Sleep Ratio

```text
study_sleep_ratio = study_hours / sleep_hours
```

### Academic Load Index

The application calculates this index using:

- Study duration
- Academic pressure
- Exam anxiety
- Attendance gap
- Assignment-completion gap

The implementation is located in:

`ml/feature_engineering.py`

Derived values supplied by a client are intentionally not trusted by the
validation layer.

---

## Target Construction

The current development target labels are synthetic.

They were created to allow the application to demonstrate multiclass
classification.

They do not represent:

- Clinical stress categories
- Validated psychological thresholds
- Diagnostic criteria
- Population prevalence
- Real participant assessments

Therefore, model performance on this dataset must not be interpreted as
evidence of real-world effectiveness.

---

## Data Provenance

- Source: Synthetic development data generated specifically for StressIntel PRO.
- Original source: None.
- Collection method: Programmatically constructed development observations.
- Participants: None.
- Real human subjects: None.
- Personally identifiable information: None intentionally included.

---

## Privacy

Because the dataset is synthetic, it contains no intended participant
identities.

Nevertheless, the production research workflow should avoid collecting
unnecessary:

- Names
- Email addresses
- Phone numbers
- Student IDs
- Residential addresses
- Exact geolocation
- Raw biometric information

---

## Missing Data

The current sample dataset contains complete demonstration records.

The production research pipeline must explicitly evaluate missing-data behavior.

The final research dataset documentation should report:

- Missing-value percentage per feature
- Missingness patterns
- Missing-data mechanism where assessable
- Imputation strategy
- Whether missingness itself is informative

Any fitted imputation procedure must be trained only on the appropriate
training partition.

---

## Data Quality

The sample dataset is intended to exercise the application's valid-input
pathway.

It should not be considered representative of the statistical distribution
of student populations.

Before publication, the research dataset should undergo:

- Range validation
- Duplicate detection
- Missingness analysis
- Outlier analysis
- Label consistency checks
- Distribution analysis
- Class-balance analysis
- Participant-level leakage checks

---

## Recommended Research Dataset

For a publication-quality experiment, the development dataset should be
replaced with a properly governed dataset with documented provenance.

The replacement dataset should provide:

- Clearly defined population
- Defined inclusion/exclusion criteria
- Documented feature definitions
- Documented target construction
- Legal/ethical basis for use
- Appropriate consent where required
- Dataset versioning
- Reproducible preprocessing

---

## Dataset Splitting

The final research dataset should be partitioned without leakage.

Recommended structure:

```text
Training Set
     ↓
Model Development

Validation Set
     ↓
Model Selection / Calibration

Test Set
     ↓
Final Evaluation
```

If multiple observations originate from the same participant, observations from
that participant should not be split across training and test sets in a way
that permits participant leakage.

For longitudinal data, temporal leakage must also be considered.

---

## Class Distribution

The final research paper should report the number and percentage of examples
in each target class:

- Low
- Medium
- High

Class imbalance should be explicitly discussed when present.

---

## Intended Research Use

A future real dataset may be used to evaluate:

- Structured stress-risk prediction
- XGBoost versus baseline models
- SHAP-based interpretability
- Probability calibration
- Feature-group ablation
- Error characteristics
- Subgroup performance
- Supplementary journal-text analysis
- Multimodal model configurations where validated modalities are available

---

## Out-of-Scope Uses

This dataset and the development system should not be used to:

- Diagnose individuals
- Determine clinical status
- Make disciplinary decisions
- Rank students by psychological status
- Determine academic eligibility
- Determine employment eligibility
- Make other high-impact decisions

---

## Limitations

The development dataset has the following limitations:

- It is synthetic.
- It contains only 20 observations.
- It is not statistically representative.
- Its target labels are demonstration labels.
- It contains no real participant variability.
- It cannot establish external validity.
- It cannot establish clinical validity.
- Model performance on it should not be generalized.

---

## Reproducibility

The dataset version should be recorded with every experiment.

Current version:

`sample-v1.0`

Associated experiment records are stored in:

`research/experiments/experiment_log.csv`

Future dataset versions should use explicit version identifiers.

---

## Dataset Replacement Procedure

When an approved research dataset becomes available:

```text
Approved Dataset
      ↓
Data Dictionary
      ↓
Schema Adapter
      ↓
Validation
      ↓
Leakage Check
      ↓
Preprocessing
      ↓
Training
      ↓
Evaluation
      ↓
Model Artifact Versioning
```

The development sample should remain available for software regression testing
unless there is a documented reason to replace it.

---

## Final Status

- Dataset: Synthetic
- Version: sample-v1.0
- Purpose: Development and demonstration
- Research validity: Not established
- Clinical validity: Not established
- Population validity: Not established