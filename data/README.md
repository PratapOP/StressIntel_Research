# StressIntel PRO — Data

This directory contains only research-safe, de-identified datasets and dataset documentation required by the project.

## Dataset Requirements

The training/evaluation dataset should contain the documented assessment features and a defined stress-risk target.

The dataset must be:

- De-identified
- Legally usable for the research purpose
- Documented with provenance
- Versioned
- Reproducible
- Free of unnecessary personally identifiable information

## Recommended Dataset Structure

The final dataset should contain the 21 model features plus the target:

- `age`
- `gender`
- `academic_performance`
- `study_hours`
- `sleep_hours`
- `sleep_quality`
- `physical_activity_hours`
- `screen_time_hours`
- `social_interaction_hours`
- `academic_pressure`
- `financial_stress`
- `family_pressure`
- `peer_pressure`
- `time_management`
- `attendance_percentage`
- `assignment_completion`
- `exam_anxiety`
- `mood_score`
- `self_reported_stress`
- `study_sleep_ratio`
- `academic_load_index`
- `stress_level`

## Target Definition

`stress_level` represents the research target used by the classifier:

- `Low`
- `Medium`
- `High`

The target definition must be explicitly specified in the research methodology. It must not be changed after seeing test-set performance.

## Data Splitting

The evaluation pipeline should use a reproducible split strategy.

Where participant identifiers or repeated measurements exist, participant-level or grouped splitting must be used to prevent data leakage.

For longitudinal data, temporal ordering must be preserved where appropriate.

## Missing Data

Missing values must be:

1. Identified during preprocessing.
2. Handled using a documented procedure.
3. Reported in the research paper.
4. Applied consistently to training and evaluation data.

## Privacy

Do not store the following in this directory:

- Names
- Email addresses
- Phone numbers
- Student IDs
- Raw journal entries
- Webcam images
- Facial embeddings
- Authentication credentials
- API keys
- Unnecessary health information

Raw sensitive research data should remain in an appropriately governed research environment rather than inside the application repository.

## Data Provenance

For every dataset version, document:

- Dataset name
- Source
- Collection method
- Collection period
- Population
- Sample size
- Inclusion/exclusion criteria
- Feature definitions
- Target definition
- Licensing/permission
- Preprocessing
- Version identifier

## Current Status

The project currently contains no production dataset.

A synthetic/sample dataset will be used during application development until a properly governed research dataset is available.