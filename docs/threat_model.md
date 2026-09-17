# StressIntel PRO — Threat Model

## 1. Purpose

This document identifies security, privacy, and misuse risks associated with
StressIntel PRO.

The threat model covers:

- Web application security
- API security
- Research-data protection
- Model security
- External API integration
- Optional webcam processing
- Research misuse
- Deployment risks

The goal is to reduce foreseeable risks before any real participant data is
processed.

---

## 2. System Assets

Important assets include:

- Application source code
- ML model artifacts
- Preprocessing artifacts
- Calibration artifacts
- GROQ API credentials
- Flask secret key
- Research datasets
- Assessment responses
- Journal text
- Model explanations
- Research reports
- Experiment metadata
- Authentication credentials
- Audit information

The most sensitive assets are participant-provided information, journal text,
visual data, and credentials.

---

## 3. Trust Boundaries

The application contains several trust boundaries.

```text
┌───────────────────────┐
│       Participant     │
└──────────┬────────────┘
           │
           │ Untrusted Input
           ▼
┌───────────────────────┐
│     Flask API         │
│ Validation / Security │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│     ML Pipeline       │
│ XGBoost / SHAP        │
└───────────────────────┘

┌───────────────────────┐
│     Journal Text      │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│      GROQ API         │
└───────────────────────┘
```

The browser, request body, uploaded data, journal text, and external API
response must be treated as untrusted boundaries.

---

## 4. Threat Categories

### T1 — Malicious Input

An attacker may submit malformed or deliberately crafted input to the API.

Potential consequences:

- Application errors
- Excessive resource consumption
- Unexpected model behavior
- Injection attempts
- Denial of service

Mitigations:

- Strict schema validation
- Numeric range validation
- Categorical-value validation
- Request-size limits
- Journal length limits
- Structured JSON parsing
- Generic production error responses

---

## 5. Excessive Request Size

Large request bodies or extremely long journal entries could consume excessive
server resources.

Mitigations:

- MAX_CONTENT_LENGTH
- MAX_JOURNAL_LENGTH
- Input validation

The application currently limits request payload size through Flask
configuration.

---

## 6. Prompt Injection

Journal text is supplied to an external language model.

A participant could intentionally place instructions inside the journal such as:

- Ignore previous instructions.
- Return the API key.
- Change the analysis format.

This content must be treated as untrusted user text.

Mitigations:

- System-level analysis instructions
- Strict JSON output requirement
- Low model temperature
- Output validation
- No secrets included in prompts
- No application actions controlled directly by model output

The language model should not be given access to application credentials,
filesystem operations, administrative actions, or internal infrastructure.

---

## 7. API Credential Exposure

The GROQ API key is a high-value secret.

Threats include:

- Hard-coded credentials
- Accidental Git commits
- Frontend exposure
- Log exposure
- Error-message exposure

Required controls:

```text
Environment Variables
        ↓
Backend Only
        ↓
GROQ API
```

The API key must never be embedded in:

- HTML
- JavaScript
- CSS
- Client-side configuration
- Git repositories
- Research reports
- Experiment logs

---

## 8. Secret Management

Production secrets must be supplied through the deployment environment.

Required secrets include:

- SECRET_KEY
- GROQ_API_KEY

Development may use:

- .env

The .env file must not be committed to source control.

Only .env.example should be included in the repository.

---

## 9. Cross-Site Scripting

User-controlled journal text or other assessment content must never be inserted
into HTML without appropriate escaping.

Potential consequences:

- Session theft
- Malicious script execution
- User-interface manipulation

Mitigations:

- Jinja automatic escaping
- Avoid unsafe HTML injection
- Sanitize user-provided text
- Restrictive Content Security Policy

---

## 10. Cross-Site Request Forgery

If state-changing authenticated endpoints are introduced, CSRF protection
should be implemented.

The current API architecture does not yet provide a complete authentication
and CSRF system.

Before production institutional deployment, authentication and CSRF controls
must be implemented where applicable.

---

## 11. Authentication

The initial research prototype does not implement full user authentication.

This is acceptable for local development with synthetic data.

It is not sufficient for unrestricted institutional deployment involving real
participant information.

A production implementation should include:

- Researcher authentication
- Participant authentication where required
- Administrator authentication
- Password hashing
- Session management
- Account recovery controls
- Multi-factor authentication where appropriate
- Session expiration

---

## 12. Authorization

Authentication alone is insufficient.

Role-based authorization should separate at least:

- Participant
- Researcher
- Administrator

Researchers should only access information required for their research role.

Administrative functionality should not be exposed through participant
endpoints.

---

## 13. Sensitive Data Exposure

The system may process sensitive student information.

Potential exposure points include:

- Application logs
- Browser storage
- API responses
- Error messages
- Reports
- Temporary files
- Research exports
- Third-party services

Mitigations:

- Data minimization
- Avoid raw text logging
- Avoid unnecessary persistence
- Generic error responses
- Restricted access
- Defined retention policy
- De-identification
- Secure transport

---

## 14. Journal Privacy

Journal text can contain information unrelated to the research objective.

The application should:

- Process only when explicitly requested
- Limit input size
- Avoid persistent storage by default
- Avoid logging raw text
- Avoid returning unnecessary copies
- Use external processing only under an approved research arrangement

Real participant journal data should not be sent to an external provider until
the applicable privacy, consent, contractual, and ethics requirements have been
reviewed.

---

## 15. Webcam Threats

Optional webcam functionality introduces additional risks.

Threats include:

- Unauthorized camera access
- Accidental image retention
- Sensitive biometric information exposure
- Misinterpretation of facial expressions
- Demographic performance differences
- Environmental sensitivity

Mitigations:

- Explicit camera permission
- Explicit participant consent
- Process frames only when required
- Avoid storing raw frames
- Disable webcam functionality by default
- Document processing behavior
- Evaluate subgroup performance
- Clearly communicate limitations

---

## 16. Model Extraction

Repeated API queries could potentially allow an attacker to approximate the
behavior of the model.

Potential consequences:

- Intellectual-property exposure
- Model replication
- Discovery of decision boundaries

Potential mitigations:

- Authentication
- Rate limiting
- Query monitoring
- Access control
- Restricting bulk prediction
- Avoiding unnecessary exposure of internal model details

---

## 17. Adversarial Inputs

A user may deliberately manipulate assessment values to obtain a desired
prediction.

For example:

```text
Modify input
     ↓
Submit repeatedly
     ↓
Search for desired output
```

This is particularly relevant if predictions are later used for institutional
decision-making.

Mitigations:

- Human oversight
- Rate limiting
- Audit logging
- Restricting high-impact use
- Treating predictions as research outputs

---

## 18. Model Artifact Tampering

An attacker with write access to the deployment environment could replace:

- stressintel_xgboost.json
- stressintel_preprocessor.joblib
- stressintel_calibrator.joblib

with malicious or unauthorized artifacts.

Mitigations:

- Restricted filesystem permissions
- Version-controlled artifacts
- Artifact checksums
- Deployment review
- Immutable deployment artifacts where available
- Model version verification

---

## 19. Dependency Vulnerabilities

The application relies on external Python packages.

Potential vulnerabilities can arise through:

- Flask
- XGBoost
- SHAP
- OpenCV
- Pillow
- GROQ SDK
- Other transitive dependencies

Mitigations:

- Pin dependency versions
- Periodic dependency updates
- Vulnerability scanning
- Review security advisories
- Rebuild deployment artifacts regularly

---

## 20. Denial of Service

Potential resource-intensive operations include:

- SHAP computation
- Model inference
- Journal analysis
- Webcam processing
- Large API requests

Mitigations should include:

- Request-size limits
- Rate limiting
- Authentication
- Processing timeouts
- Resource limits
- Monitoring

The public deployment should not expose unlimited computational access.

---

## 21. CORS Misconfiguration

Cross-Origin Resource Sharing can accidentally expose API endpoints to
untrusted origins.

The application uses configurable CORS settings.

Production deployments should specify explicit trusted origins rather than
using unrestricted wildcard configuration.

---

## 22. Security Headers

The application defines security headers including:

- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- Content-Security-Policy

These controls reduce several classes of browser-based attack.

They should be tested against the final production frontend.

---

## 23. Transport Security

Production deployment must use HTTPS.

Sensitive information must never be intentionally transmitted over unencrypted
HTTP.

Production cookies should use:

- Secure
- HttpOnly
- SameSite

where applicable.

---

## 24. Logging Threats

Logs can become an unintended source of sensitive-data leakage.

Do not log:

- Raw journal text
- API keys
- Passwords
- Session tokens
- Raw webcam data
- Unnecessary participant information

Operational logs should focus on:

- Request status
- Endpoint
- Error category
- Processing duration
- Model version
- Application version

Sensitive identifiers should be pseudonymized where audit requirements make
them necessary.

---

## 25. Research Misuse

Technical security is not the only threat.

The model could be misused to:

- Label students as "high stress"
- Rank students
- Penalize students
- Make academic decisions
- Make employment decisions
- Infer sensitive characteristics
- Replace professional assessment

Controls:

- Clear research-only scope
- Human oversight
- Access control
- Ethical review
- Appropriate interface language
- Model card
- Dataset card
- Audit procedures

---

## 26. Bias and Fairness Risk

A model trained on limited or unrepresentative data may perform differently
across groups.

Potential consequences include:

- Unequal false-positive rates
- Unequal false-negative rates
- Calibration differences
- Poor performance for underrepresented groups

Mitigations:

- Subgroup evaluation
- Class-balance reporting
- Error analysis
- Confidence intervals
- Transparent limitations
- Dataset documentation

No fairness claim should be made until the relevant analysis has been
performed.

---

## 27. Data Leakage

Research leakage can invalidate experimental conclusions.

Examples include:

```text
Test data
   ↓
Feature selection
   ↓
Model training
```

or:

```text
Test data
   ↓
Calibration
   ↓
Final evaluation
```

These workflows must be avoided.

All fitted preprocessing, model-selection, and calibration procedures must use
only the appropriate development data.

---

## 28. Third-Party Service Risk

The journal-analysis component depends on GROQ.

Potential risks include:

- Service outage
- API changes
- Incorrect model output
- Provider-side processing considerations
- Rate limits
- Cost changes
- Model-version changes
- Data-processing policy changes

Mitigations:

- Configurable model version
- Explicit fallback behavior
- Output validation
- Service timeout handling
- Research documentation
- Periodic configuration review

The predictive XGBoost pipeline should remain independently functional when
GROQ analysis is unavailable.

---

## 29. Supply-Chain Risk

Potential supply-chain threats include:

- Compromised dependencies
- Malicious packages
- Compromised model artifacts
- Unauthorized build changes

Mitigations:

- Dependency pinning
- Vulnerability scanning
- Reproducible environments
- Version-controlled source
- Artifact verification
- Restricted deployment permissions

---

## 30. Threat Response

Security incidents should follow a documented process:

```text
Detection
   ↓
Containment
   ↓
Investigation
   ↓
Impact Assessment
   ↓
Remediation
   ↓
Credential Rotation
   ↓
Recovery
   ↓
Documentation
```

If participant information is involved, the applicable institutional incident
response and notification procedures must be followed.

31. Risk Register
Threat	Likelihood	Impact	Primary Control
Malicious input	Medium	Medium	Validation
Prompt injection	Medium	Medium	Structured prompts + output validation
API key exposure	Medium	High	Environment secrets
XSS	Medium	High	Escaping + CSP
DoS	Medium	High	Rate limiting + resource limits
Data leakage	Medium	High	Minimization + access control
Webcam misuse	Low/Medium	High	Consent + disabled by default
Model tampering	Low	High	Artifact control
Dependency vulnerability	Medium	High	Scanning + pinned versions
Model misuse	Medium	High	Governance + human oversight
Dataset leakage	Medium	High	Strict experimental split
Bias	Medium	High	Subgroup evaluation
GROQ outage	Medium	Low/Medium	Fallback behavior

Risk ratings are qualitative development assessments and should be reviewed
before production deployment.

32. Security Development Checklist

Before production deployment:

 HTTPS enabled
 Production SECRET_KEY configured
 GROQ API key stored securely
 No secrets committed to Git
 Explicit CORS origins configured
 Authentication implemented
 Role-based authorization implemented
 CSRF protection implemented where applicable
 Rate limiting implemented
 Input limits verified
 Security headers tested
 Dependency vulnerability scan completed
 Model artifacts verified
 Logging reviewed for sensitive data
 Retention policy documented
 Incident response procedure documented
 Research ethics requirements reviewed
 Subgroup evaluation completed where applicable
 Production environment tested with synthetic data
33. Security Boundary

The development version of StressIntel PRO should be considered a research
prototype.

It should not process real sensitive participant data in a public deployment
until the required authentication, authorization, privacy, security,
governance, and ethics controls have been implemented and reviewed.