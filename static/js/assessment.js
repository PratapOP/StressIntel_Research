/* ============================================================
   StressIntel PRO
   Assessment Workflow
   ============================================================ */

(function () {
    "use strict";

    const form = document.getElementById("assessment-form");

    if (!form) {
        return;
    }

    const steps = Array.from(
        form.querySelectorAll("[data-step]")
    );

    const progressItems = Array.from(
        document.querySelectorAll("[data-step-indicator]")
    );

    const nextButton = document.getElementById("next-step");
    const previousButton = document.getElementById("previous-step");
    const submitButton = document.getElementById("submit-assessment");
    const progressBar = document.getElementById("assessment-progress");

    const alertBox =
        document.getElementById("assessment-alert") ||
        document.querySelector("[data-assessment-alert]");

    let currentStep = 0;

    const REQUIRED_FIELDS = [
        "age",
        "gender",
        "academic_performance",
        "study_hours",
        "sleep_hours",
        "sleep_quality",
        "physical_activity_hours",
        "screen_time_hours",
        "social_interaction_hours",
        "academic_pressure",
        "financial_stress",
        "family_pressure",
        "peer_pressure",
        "time_management",
        "attendance_percentage",
        "assignment_completion",
        "exam_anxiety",
        "mood_score",
        "self_reported_stress"
    ];

    const FIELD_LABELS = {
        age: "Age",
        gender: "Gender",
        academic_performance: "Academic performance",
        study_hours: "Study hours",
        sleep_hours: "Sleep hours",
        sleep_quality: "Sleep quality",
        physical_activity_hours: "Physical activity",
        screen_time_hours: "Screen time",
        social_interaction_hours: "Social interaction",
        academic_pressure: "Academic pressure",
        financial_stress: "Financial stress",
        family_pressure: "Family pressure",
        peer_pressure: "Peer pressure",
        time_management: "Time management",
        attendance_percentage: "Attendance",
        assignment_completion: "Assignment completion",
        exam_anxiety: "Exam anxiety",
        mood_score: "Mood score",
        self_reported_stress: "Self-reported stress"
    };

    /* ---------------------------------------------------------
       Utility Functions
       --------------------------------------------------------- */

    function getField(name) {
        return form.elements[name] || form.querySelector(`[name="${name}"]`);
    }

    function numericValue(name, fallback = 0) {
        const field = getField(name);

        if (!field) {
            return fallback;
        }

        const value = Number(field.value);

        return Number.isFinite(value)
            ? value
            : fallback;
    }

    function showAlert(message, type = "warning") {
        if (!alertBox) {
            if (window.StressIntel?.showToast) {
                window.StressIntel.showToast(message, type);
            }

            return;
        }

        alertBox.textContent = message;
        alertBox.className =
            `form-alert alert-${type} is-visible`;

        alertBox.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    function hideAlert() {
        if (!alertBox) {
            return;
        }

        alertBox.classList.remove("is-visible");
    }

    function markInvalid(field) {
        if (!field) {
            return;
        }

        field.classList.add("field-invalid");
        field.setAttribute("aria-invalid", "true");
    }

    function clearInvalid(field) {
        if (!field) {
            return;
        }

        field.classList.remove("field-invalid");
        field.removeAttribute("aria-invalid");
    }

    function clearStepErrors(step) {
        if (!step) {
            return;
        }

        step.querySelectorAll(
            ".field-invalid"
        ).forEach(clearInvalid);
    }

    /* ---------------------------------------------------------
       Step Navigation
       --------------------------------------------------------- */

    function showStep(index) {
        if (!steps.length) {
            return;
        }

        currentStep = Math.min(
            Math.max(index, 0),
            steps.length - 1
        );

        steps.forEach((step, stepIndex) => {
            const active = stepIndex === currentStep;

            step.classList.toggle("active", active);
            step.classList.toggle("is-active", active);
            step.hidden = !active;

            step.setAttribute(
                "aria-hidden",
                String(!active)
            );
        });

        progressItems.forEach((item, itemIndex) => {
            const active = itemIndex === currentStep;
            const completed = itemIndex < currentStep;

            item.classList.toggle("active", active);
            item.classList.toggle("completed", completed);

            if (active) {
                item.setAttribute(
                    "aria-current",
                    "step"
                );
            } else {
                item.removeAttribute("aria-current");
            }
        });

        updateProgress();
        updateNavigationButtons();
        updateReview();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function updateProgress() {
        if (!progressBar) {
            return;
        }

        const total = Math.max(steps.length - 1, 1);
        const percentage =
            (currentStep / total) * 100;

        progressBar.style.width =
            `${Math.min(100, Math.max(0, percentage))}%`;

        progressBar.setAttribute(
            "aria-valuenow",
            String(Math.round(percentage))
        );
    }

    function updateNavigationButtons() {
        if (previousButton) {
            previousButton.disabled =
                currentStep === 0;
        }

        const isLastStep =
            currentStep === steps.length - 1;

        if (nextButton) {
            nextButton.hidden = isLastStep;
            nextButton.disabled = isLastStep;
        }

        if (submitButton) {
            submitButton.hidden = !isLastStep;
        }
    }

    function validateCurrentStep() {
        const step = steps[currentStep];

        if (!step) {
            return true;
        }

        clearStepErrors(step);
        hideAlert();

        let valid = true;
        let firstInvalid = null;

        const fields = Array.from(
            step.querySelectorAll(
                "input, select, textarea"
            )
        );

        fields.forEach((field) => {
            if (
                field.disabled ||
                field.type === "hidden" ||
                field.dataset.optional === "true"
            ) {
                return;
            }

            if (
                field.type === "checkbox" &&
                !field.required
            ) {
                return;
            }

            if (!field.checkValidity()) {
                valid = false;
                markInvalid(field);

                if (!firstInvalid) {
                    firstInvalid = field;
                }
            }
        });

        if (!valid) {
            const label =
                firstInvalid?.closest(".form-group")
                    ?.querySelector("label");

            const labelText =
                label?.textContent?.trim() ||
                "the highlighted field";

            showAlert(
                `Please provide a valid value for ${labelText}.`,
                "warning"
            );

            firstInvalid?.focus();

            return false;
        }

        return true;
    }

    /* ---------------------------------------------------------
       Derived Research Features
       --------------------------------------------------------- */

    function calculateStudySleepRatio() {
        const studyHours = numericValue(
            "study_hours"
        );

        const sleepHours = numericValue(
            "sleep_hours"
        );

        if (sleepHours <= 0) {
            return 0;
        }

        return studyHours / sleepHours;
    }

    function calculateAcademicLoadIndex() {
        const academicPerformance =
            numericValue(
                "academic_performance"
            );

        const studyHours =
            numericValue("study_hours");

        const academicPressure =
            numericValue("academic_pressure");

        const examAnxiety =
            numericValue("exam_anxiety");

        const assignmentCompletion =
            numericValue(
                "assignment_completion"
            );

        const attendance =
            numericValue(
                "attendance_percentage"
            );

        const normalizedStudy =
            Math.min(studyHours / 12, 1);

        const normalizedPerformance =
            Math.min(
                Math.max(academicPerformance / 100, 0),
                1
            );

        const normalizedPressure =
            Math.min(
                Math.max(academicPressure / 10, 0),
                1
            );

        const normalizedAnxiety =
            Math.min(
                Math.max(examAnxiety / 10, 0),
                1
            );

        const normalizedCompletion =
            Math.min(
                Math.max(assignmentCompletion / 100, 0),
                1
            );

        const normalizedAttendance =
            Math.min(
                Math.max(attendance / 100, 0),
                1
            );

        /*
         * This is an engineered research feature.
         * It is descriptive and does not imply causal influence.
         */
        const load =
            (
                normalizedStudy * 0.25 +
                normalizedPressure * 0.25 +
                normalizedAnxiety * 0.20 +
                normalizedPerformance * 0.10 +
                (1 - normalizedCompletion) * 0.10 +
                (1 - normalizedAttendance) * 0.10
            ) * 100;

        return Math.min(
            Math.max(load, 0),
            100
        );
    }

    function updateDerivedFeatures() {
        const ratio = calculateStudySleepRatio();
        const academicLoad = calculateAcademicLoadIndex();

        const ratioField =
            getField("study_sleep_ratio");

        const loadField =
            getField("academic_load_index");

        if (ratioField) {
            ratioField.value =
                ratio.toFixed(2);

            ratioField.textContent =
                ratio.toFixed(2);

            ratioField.dataset.value =
                ratio.toFixed(2);
        }

        if (loadField) {
            loadField.value =
                academicLoad.toFixed(2);

            loadField.textContent =
                academicLoad.toFixed(2);

            loadField.dataset.value =
                academicLoad.toFixed(2);
        }

        const ratioDisplays = document.querySelectorAll(
            "[data-derived='study_sleep_ratio']"
        );

        ratioDisplays.forEach((element) => {
            element.textContent =
                ratio.toFixed(2);
        });

        const loadDisplays = document.querySelectorAll(
            "[data-derived='academic_load_index']"
        );

        loadDisplays.forEach((element) => {
            element.textContent =
                academicLoad.toFixed(1);
        });
    }

    /* ---------------------------------------------------------
       Review Summary
       --------------------------------------------------------- */

    function getFormData() {
        const data = {};

        Array.from(
            form.querySelectorAll(
                "input, select, textarea"
            )
        ).forEach((field) => {
            if (
                !field.name ||
                field.disabled
            ) {
                return;
            }

            if (field.type === "checkbox") {
                data[field.name] =
                    field.checked;

                return;
            }

            if (field.type === "radio") {
                if (field.checked) {
                    data[field.name] =
                        field.value;
                }

                return;
            }

            if (
                field.type === "number"
            ) {
                const value =
                    Number(field.value);

                data[field.name] =
                    Number.isFinite(value)
                        ? value
                        : field.value;

                return;
            }

            data[field.name] =
                field.value;
        });

        updateDerivedFeatures();

        data.study_sleep_ratio =
            Number(
                calculateStudySleepRatio()
                    .toFixed(4)
            );

        data.academic_load_index =
            Number(
                calculateAcademicLoadIndex()
                    .toFixed(4)
            );

        return data;
    }

    function updateReview() {
        const reviewContainer =
            document.getElementById(
                "assessment-review"
            ) ||
            document.querySelector(
                "[data-assessment-review]"
            );

        if (!reviewContainer) {
            return;
        }

        const data = getFormData();

        const rows = [];

        REQUIRED_FIELDS.forEach((fieldName) => {
            const value = data[fieldName];

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                return;
            }

            let displayValue = value;

            if (
                fieldName.includes("hours")
            ) {
                displayValue =
                    `${Number(value).toFixed(1)} h`;
            }

            if (
                fieldName ===
                "attendance_percentage"
            ) {
                displayValue =
                    `${Number(value).toFixed(1)}%`;
            }

            if (
                fieldName ===
                "assignment_completion"
            ) {
                displayValue =
                    `${Number(value).toFixed(1)}%`;
            }

            if (
                fieldName ===
                "academic_performance"
            ) {
                displayValue =
                    `${Number(value).toFixed(1)}%`;
            }

            if (
                [
                    "sleep_quality",
                    "academic_pressure",
                    "financial_stress",
                    "family_pressure",
                    "peer_pressure",
                    "time_management",
                    "exam_anxiety",
                    "mood_score",
                    "self_reported_stress"
                ].includes(fieldName)
            ) {
                displayValue =
                    `${Number(value).toFixed(1)} / 10`;
            }

            rows.push(`
                <div class="review-row">
                    <span>${window.StressIntelUtils
                        ? window.StressIntelUtils.escapeHTML(
                              FIELD_LABELS[fieldName]
                          )
                        : fieldName}</span>
                    <strong>${window.StressIntelUtils
                        ? window.StressIntelUtils.escapeHTML(
                              displayValue
                          )
                        : displayValue}</strong>
                </div>
            `);
        });

        rows.push(`
            <div class="review-row review-derived">
                <span>Study / sleep ratio</span>
                <strong>${calculateStudySleepRatio().toFixed(2)}</strong>
            </div>
        `);

        rows.push(`
            <div class="review-row review-derived">
                <span>Academic load index</span>
                <strong>${calculateAcademicLoadIndex().toFixed(1)}</strong>
            </div>
        `);

        reviewContainer.innerHTML = rows.join("");
    }

    /* ---------------------------------------------------------
       Input Enhancement
       --------------------------------------------------------- */

    function initializeInputListeners() {
        const fields = Array.from(
            form.querySelectorAll(
                "input, select, textarea"
            )
        );

        fields.forEach((field) => {
            field.addEventListener(
                "input",
                () => {
                    clearInvalid(field);
                    updateDerivedFeatures();
                }
            );

            field.addEventListener(
                "change",
                () => {
                    clearInvalid(field);
                    updateDerivedFeatures();
                }
            );
        });

        updateDerivedFeatures();
    }

    /* ---------------------------------------------------------
       Consent
       --------------------------------------------------------- */

    function validateConsent() {
        const consent =
            getField("consent") ||
            document.getElementById("consent");

        if (!consent) {
            return true;
        }

        if (!consent.checked) {
            markInvalid(consent);

            showAlert(
                "Please provide explicit research consent before submitting the assessment.",
                "warning"
            );

            consent.focus();

            return false;
        }

        clearInvalid(consent);

        return true;
    }

    /* ---------------------------------------------------------
       Assessment Submission
       --------------------------------------------------------- */

    async function submitAssessment() {
        if (!validateCurrentStep()) {
            return;
        }

        if (!validateConsent()) {
            return;
        }

        updateDerivedFeatures();

        const data = getFormData();

        data.session_id =
            window.StressIntelSession
                ?.getSessionID?.() ||
            undefined;

        data.consent = true;

        if (
            window.StressIntelSession
                ?.saveAssessment
        ) {
            window.StressIntelSession.saveAssessment(
                data
            );
        }

        if (
            window.StressIntel
                ?.showLoading
        ) {
            window.StressIntel.showLoading(
                "Validating assessment signals…"
            );
        }

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const response =
                await window.StressIntel.API.post(
                    "/assessment/",
                    data
                );

            if (
                window.StressIntelSession
                    ?.saveResult
            ) {
                window.StressIntelSession.saveResult(
                    response
                );
            }

            if (
                window.StressIntel
                    ?.hideLoading
            ) {
                window.StressIntel.hideLoading();
            }

            if (
                window.StressIntel
                    ?.showToast
            ) {
                window.StressIntel.showToast(
                    "Assessment processed successfully.",
                    "success"
                );
            }

            window.location.href =
                "/results";
        } catch (error) {
            console.error(
                "Assessment submission failed:",
                error
            );

            if (
                window.StressIntel
                    ?.hideLoading
            ) {
                window.StressIntel.hideLoading();
            }

            if (submitButton) {
                submitButton.disabled = false;
            }

            showAlert(
                error?.message ||
                    "The assessment could not be processed. Please try again.",
                "error"
            );
        }
    }

    /* ---------------------------------------------------------
       Button Events
       --------------------------------------------------------- */

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            () => {
                if (
                    validateCurrentStep()
                ) {
                    showStep(
                        currentStep + 1
                    );
                }
            }
        );
    }

    if (previousButton) {
        previousButton.addEventListener(
            "click",
            () => {
                showStep(
                    currentStep - 1
                );
            }
        );
    }

    if (submitButton) {
        submitButton.addEventListener(
            "click",
            submitAssessment
        );
    }

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();
            submitAssessment();
        }
    );

    /* ---------------------------------------------------------
       Keyboard Navigation
       --------------------------------------------------------- */

    form.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key !== "Enter" ||
                event.target.tagName === "TEXTAREA"
            ) {
                return;
            }

            event.preventDefault();

            if (
                currentStep <
                steps.length - 1
            ) {
                if (
                    validateCurrentStep()
                ) {
                    showStep(
                        currentStep + 1
                    );
                }
            } else {
                submitAssessment();
            }
        }
    );

    /* ---------------------------------------------------------
       Restore Draft
       --------------------------------------------------------- */

    function restoreDraft() {
        const saved =
            window.StressIntelSession
                ?.getAssessment?.();

        if (
            !saved ||
            typeof saved !== "object"
        ) {
            return;
        }

        const draftTime =
            saved.saved_at
                ? new Date(
                      saved.saved_at
                  )
                : null;

        const age =
            draftTime &&
            !Number.isNaN(
                draftTime.getTime()
            )
                ? Date.now() -
                  draftTime.getTime()
                : Infinity;

        /*
         * Drafts older than 24 hours are ignored.
         * This limits accidental persistence of participant data.
         */
        if (
            age >
            24 * 60 * 60 * 1000
        ) {
            return;
        }

        let restored = false;

        Object.entries(saved).forEach(
            ([name, value]) => {
                if (
                    [
                        "saved_at",
                        "session_id"
                    ].includes(name)
                ) {
                    return;
                }

                const field = getField(name);

                if (!field) {
                    return;
                }

                if (
                    field.type ===
                    "checkbox"
                ) {
                    field.checked =
                        Boolean(value);

                    restored = true;

                    return;
                }

                if (
                    field.type === "radio"
                ) {
                    const radio =
                        form.querySelector(
                            `input[name="${CSS.escape(
                                name
                            )}"][value="${CSS.escape(
                                String(value)
                            )}"]`
                        );

                    if (radio) {
                        radio.checked =
                            true;

                        restored = true;
                    }

                    return;
                }

                field.value =
                    value === null ||
                    value === undefined
                        ? ""
                        : value;

                restored = true;
            }
        );

        updateDerivedFeatures();

        if (restored) {
            window.StressIntel?.showToast?.(
                "Your recent assessment draft was restored.",
                "info",
                4500
            );
        }
    }

    /* ---------------------------------------------------------
       Progress Indicator Clicks
       --------------------------------------------------------- */

    progressItems.forEach(
        (indicator, index) => {
            indicator.addEventListener(
                "click",
                () => {
                    if (index > currentStep) {
                        return;
                    }

                    showStep(index);
                }
            );

            indicator.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key !== "Enter" &&
                        event.key !== " "
                    ) {
                        return;
                    }

                    event.preventDefault();

                    if (
                        index <= currentStep
                    ) {
                        showStep(index);
                    }
                }
            );
        }
    );

    /* ---------------------------------------------------------
       Initialization
       --------------------------------------------------------- */

    initializeInputListeners();
    restoreDraft();
    showStep(0);

    window.StressIntelAssessment = {
        getFormData,
        validateCurrentStep,
        calculateStudySleepRatio,
        calculateAcademicLoadIndex,
        updateDerivedFeatures,
        updateReview,
        submitAssessment,
        showStep,
        getCurrentStep: () => currentStep
    };
})();