# StressIntel PRO — Ethics, Privacy & Responsible Use

## 1. Purpose

StressIntel PRO is a research-oriented platform for studying explainable
student stress-risk estimation.

The system is not a medical device and must not be represented as a clinical
diagnostic or psychiatric assessment system.

All research and deployment decisions should prioritize participant autonomy,
privacy, transparency, safety, and scientific validity.

---

## 2. Informed Consent

Before collecting or processing participant data, the research protocol should
clearly communicate:

- Purpose of the study
- Types of information being collected
- How information will be processed
- Whether external services are used
- Potential risks
- Expected benefits
- Data retention period
- Data deletion procedure
- Who may access the information
- Whether participation is voluntary
- How participation can be withdrawn
- Appropriate institutional or professional support options

Consent should be obtained before assessment processing.

The application therefore requires explicit consent for assessment submission.

---

## 3. Data Minimization

StressIntel PRO should collect only information necessary for the defined
research objective.

The application should avoid unnecessary collection of:

- Full names
- Phone numbers
- Personal email addresses
- Residential addresses
- Student identification numbers
- Exact geolocation
- Unnecessary medical information
- Raw biometric information

Participant identifiers should be replaced with pseudonymous identifiers where
possible.

---

## 4. Sensitive Text

Journal entries may contain highly personal information.

Raw journal text should therefore:

- Be transmitted only when required by the research workflow.
- Not be written to ordinary application logs.
- Not be unnecessarily persisted.
- Have a documented retention period.
- Be deleted according to the approved research protocol.

The application limits journal input length to reduce unnecessary data
collection.

---

## 5. External Language Model

Journal analysis uses the GROQ API when enabled.

The research documentation must identify:

- Provider
- Exact model/version
- Prompt configuration
- Temperature
- Token limit
- Hosting arrangement
- Data-processing arrangement
- Fallback behavior

Researchers must verify the provider's applicable privacy and data-processing
terms before using real participant data.

The development application should use synthetic or non-sensitive text until
the external processing arrangement has been reviewed and approved.

---

## 6. Model Interpretation

The XGBoost model produces an estimated stress-risk category.

Possible outputs are:

```text
Low
Medium
High
```

These categories are model outputs, not medical diagnoses.

A prediction should be interpreted as:

> Estimated risk category produced by the evaluated model for the supplied features.

It should not be interpreted as:

> The participant has a particular psychological or medical condition.

---

## 7. SHAP Interpretation

SHAP is used to explain model behavior.

A SHAP value represents a feature's contribution to the model output under the
specified explanation framework.

It does not establish causality.

For example:

```text
Sleep Hours
      ↓
SHAP Contribution
      ↓
Model Prediction
```

must not be interpreted as:

```text
Sleep Hours
      ↓
Causes Stress
```

Research conclusions must distinguish predictive association from causal
inference.

---

## 8. Human Oversight

Model outputs should not independently determine high-impact decisions about
students.

Examples of decisions that should not be automated using StressIntel PRO:

- Academic punishment
- Disciplinary action
- Scholarship eligibility
- Admission decisions
- Employment decisions
- Academic exclusion
- Psychological diagnosis

Where the system is used in an institutional research environment, trained
human researchers should remain responsible for interpretation and appropriate
follow-up.

---

## 9. High-Risk Results

A High model output does not establish that an individual is experiencing a
clinical condition.

Where the approved research protocol provides support or escalation
procedures, the interface should direct participants toward appropriate
institutional or professional resources without presenting the model output as
a diagnosis.

Any escalation workflow should be defined by qualified researchers and the
applicable institutional ethics process.

---

## 10. Webcam / Visual Analysis

Visual analysis is optional and should remain disabled unless explicitly
enabled through configuration.

Before collecting visual data, the research protocol should define:

- Explicit consent
- Purpose of collection
- Camera permissions
- Data retention
- Processing location
- Whether frames are stored
- Whether derived features are stored
- Demographic performance evaluation
- Environmental robustness evaluation
- Deletion procedure

Raw webcam frames should not be retained unless specifically required and
approved by the research protocol.

Visual signals must not be presented as reliable indicators of a person's
internal psychological state without appropriate empirical validation.

---

## 11. Fairness

Model performance should be evaluated across relevant subgroups when the
research dataset contains sufficient representation.

Evaluation may include:

- Accuracy by subgroup
- Macro F1 by subgroup
- Per-class recall
- False-positive rates
- False-negative rates
- Calibration
- Sample-size differences

Small subgroup samples should be reported as a limitation rather than used to
make unsupported conclusions.

Sensitive demographic characteristics should not be collected merely for model
convenience.

---

## 12. Bias

Potential sources of bias include:

- Sampling bias
- Self-report bias
- Measurement bias
- Class imbalance
- Label construction
- Missing-data patterns
- Cultural differences
- Institution-specific behavior
- Dataset collection procedures

A high-performing model on one dataset may perform differently on another
population.

Performance should therefore be reported only for the population and
experimental conditions actually evaluated.

---

## 13. Data Security

Production deployment should use:

- HTTPS
- Environment-managed secrets
- Secure cookies
- Security headers
- Input validation
- Request-size limits
- Rate limiting
- Access control
- Audit logging
- Dependency vulnerability scanning

Secrets such as API keys must never be committed to source control.

---

## 14. Logging

Application logs should contain operational information rather than sensitive
participant content.

Logs should not contain:

- Raw journal entries
- Webcam frames
- API keys
- Passwords
- Authentication tokens
- Unnecessary participant identifiers
- Sensitive assessment values unless explicitly required by the audit design

Research audit records should use pseudonymous references where possible.

---

## 15. Data Retention

The final research protocol must specify:

```text
Collection
    ↓
Active Research Use
    ↓
Retention Period
    ↓
Deletion / Anonymization
```

The application should not retain participant information indefinitely by
default.

The retention period must be determined by the approved research protocol,
institutional requirements, applicable law, and dataset agreements.

---

## 16. Participant Withdrawal

Where the study permits withdrawal, participants should be provided with a
clear procedure for requesting withdrawal.

The research protocol must define whether previously collected data can be
deleted after withdrawal and under what circumstances.

The application should avoid collecting identifying information unless it is
necessary to support the approved withdrawal procedure.

---

## 17. Research Reproducibility

Ethical research also requires transparent reporting.

The final paper should document:

- Dataset provenance
- Dataset version
- Participant characteristics where appropriate
- Inclusion/exclusion criteria
- Feature definitions
- Target definition
- Preprocessing
- Model configuration
- Random seed
- Evaluation strategy
- Metrics
- Calibration
- Error analysis
- Limitations
- Ethics/consent procedure

Development results from the synthetic dataset must be clearly separated from
results obtained from real research data.

---

## 18. Synthetic Development Data

The current application uses:

`data/sample/sample_assessments.csv`

This dataset is synthetic and exists for software development.

It must not be used to make claims about:

- Student population stress levels
- Prevalence of stress
- Real-world model accuracy
- Clinical effectiveness
- Generalization to actual students

The dataset can be replaced by an appropriately governed research dataset
without changing the overall application architecture.

---

## 19. Responsible Communication

The interface should use language such as:

- "Estimated stress-risk category"
- "Model confidence"
- "Model-associated feature contribution"
- "Research signal"
- "Supplementary qualitative analysis"

Avoid language such as:

- "Diagnosis"
- "Confirmed stress"
- "Clinically stressed"
- "The model knows you are stressed"
- "This feature causes stress"

---

## 20. Research Ethics Review

Before prospective collection of real participant data, researchers should
determine whether institutional ethics review, IRB approval, informed consent,
data protection review, or another applicable governance process is required.

The requirements depend on:

- Research jurisdiction
- Institution
- Participant population
- Data types
- Collection methodology
- Intended use
- Data-processing arrangements

StressIntel PRO should not be deployed for prospective participant research
until the applicable governance requirements have been addressed.

---

## 21. Ethical Deployment Principle

The system should follow this principle:

```text
Collect Less
    ↓
Explain Clearly
    ↓
Predict Conservatively
    ↓
Explain Model Behavior
    ↓
Keep Humans in the Loop
    ↓
Protect Participant Data
    ↓
Evaluate Before Deployment
```

The objective of StressIntel PRO is to support reproducible research into
explainable stress-risk modeling while minimizing unnecessary participant
risk.