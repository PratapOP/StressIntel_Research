/* ============================================================
   StressIntel PRO
   Scenario Simulation Workflow
   ============================================================ */

(function () {
    "use strict";

    const form =
        document.getElementById("simulation-form") ||
        document.querySelector("[data-simulation-form]");

    const resultPanel =
        document.querySelector("[data-simulation-result]") ||
        document.getElementById("simulation-result");

    const runButton =
        document.querySelector("[data-run-simulation]") ||
        document.getElementById("run-simulation");

    const resetButton =
        document.querySelector("[data-reset-simulation]") ||
        document.getElementById("reset-simulation");

    if (!form && !runButton) {
        return;
    }

    /* ---------------------------------------------------------
       Constants
       --------------------------------------------------------- */

    const FEATURE_NAMES = [
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

    const LABELS = {
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
        self_reported_stress: "Self-reported stress",
        study_sleep_ratio: "Study / sleep ratio",
        academic_load_index: "Academic load index"
    };

    const PRESETS = {
        balanced: {
            age: 21,
            gender: "Prefer not to say",
            academic_performance: 72,
            study_hours: 6,
            sleep_hours: 7,
            sleep_quality: 7,
            physical_activity_hours: 1,
            screen_time_hours: 5,
            social_interaction_hours: 3,
            academic_pressure: 5,
            financial_stress: 3,
            family_pressure: 3,
            peer_pressure: 3,
            time_management: 7,
            attendance_percentage: 82,
            assignment_completion: 85,
            exam_anxiety: 4,
            mood_score: 7,
            self_reported_stress: 4
        },

        academic: {
            age: 21,
            gender: "Prefer not to say",
            academic_performance: 78,
            study_hours: 11,
            sleep_hours: 5,
            sleep_quality: 4,
            physical_activity_hours: 0.5,
            screen_time_hours: 8,
            social_interaction_hours: 1,
            academic_pressure: 9,
            financial_stress: 3,
            family_pressure: 4,
            peer_pressure: 5,
            time_management: 4,
            attendance_percentage: 72,
            assignment_completion: 70,
            exam_anxiety: 9,
            mood_score: 4,
            self_reported_stress: 8
        },

        lifestyle: {
            age: 21,
            gender: "Prefer not to say",
            academic_performance: 68,
            study_hours: 4,
            sleep_hours: 5.5,
            sleep_quality: 4,
            physical_activity_hours: 0.5,
            screen_time_hours: 10,
            social_interaction_hours: 1,
            academic_pressure: 5,
            financial_stress: 5,
            family_pressure: 3,
            peer_pressure: 4,
            time_management: 4,
            attendance_percentage: 68,
            assignment_completion: 65,
            exam_anxiety: 5,
            mood_score: 4,
            self_reported_stress: 7
        },

        context: {
            age: 21,
            gender: "Prefer not to say",
            academic_performance: 70,
            study_hours: 7,
            sleep_hours: 6.5,
            sleep_quality: 6,
            physical_activity_hours: 1,
            screen_time_hours: 6,
            social_interaction_hours: 2,
            academic_pressure: 6,
            financial_stress: 8,
            family_pressure: 8,
            peer_pressure: 7,
            time_management: 6,
            attendance_percentage: 78,
            assignment_completion: 80,
            exam_anxiety: 6,
            mood_score: 5,
            self_reported_stress: 7
        }
    };

    /* ---------------------------------------------------------
       Utilities
       --------------------------------------------------------- */

    function $(selector, scope = document) {
        return scope.querySelector(selector);
    }

    function $$(selector, scope = document) {
        return Array.from(scope.querySelectorAll(selector));
    }

    function escapeHTML(value) {
        if (
            window.StressIntelUtils &&
            typeof window.StressIntelUtils.escapeHTML === "function"
        ) {
            return window.StressIntelUtils.escapeHTML(value);
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function number(value, fallback = 0) {
        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : fallback;
    }

    function percentage(value) {
        let numeric = number(value, 0);

        if (
            numeric >= 0 &&
            numeric <= 1
        ) {
            numeric *= 100;
        }

        return Math.min(
            100,
            Math.max(
                0,
                numeric
            )
        );
    }

    function showToast(
        message,
        type = "info"
    ) {
        if (
            window.StressIntel &&
            typeof window.StressIntel.showToast === "function"
        ) {
            window.StressIntel.showToast(
                message,
                type
            );
        }
    }

    function showLoading(message) {
        if (
            window.StressIntel &&
            typeof window.StressIntel.showLoading === "function"
        ) {
            window.StressIntel.showLoading(
                message
            );
        }
    }

    function hideLoading() {
        if (
            window.StressIntel &&
            typeof window.StressIntel.hideLoading === "function"
        ) {
            window.StressIntel.hideLoading();
        }
    }

    /* ---------------------------------------------------------
       Form Serialization
       --------------------------------------------------------- */

    function getField(name) {
        if (!form) {
            return null;
        }

        return (
            form.elements[name] ||
            form.querySelector(
                `[name="${CSS.escape(name)}"]`
            )
        );
    }

    function collectScenario() {
        const data = {};

        if (!form) {
            return data;
        }

        FEATURE_NAMES.forEach((name) => {
            const field = getField(name);

            if (!field) {
                return;
            }

            if (
                field.type === "radio"
            ) {
                const selected =
                    form.querySelector(
                        `input[name="${CSS.escape(name)}"]:checked`
                    );

                if (selected) {
                    data[name] =
                        selected.value;
                }

                return;
            }

            if (
                field.type === "checkbox"
            ) {
                data[name] =
                    field.checked;

                return;
            }

            const raw =
                String(field.value ?? "")
                    .trim();

            if (raw === "") {
                data[name] = "";
                return;
            }

            if (
                field.type === "number" ||
                field.dataset.type === "number"
            ) {
                data[name] =
                    number(raw);
                return;
            }

            data[name] = raw;
        });

        /*
         * The backend derives these two features.
         * They are calculated here for immediate UI visibility
         * but are not required as user-entered variables.
         */
        data.study_sleep_ratio =
            calculateStudySleepRatio(data);

        data.academic_load_index =
            calculateAcademicLoadIndex(data);

        return data;
    }

    function populateScenario(data) {
        if (
            !form ||
            !data ||
            typeof data !== "object"
        ) {
            return;
        }

        FEATURE_NAMES.forEach((name) => {
            if (!(name in data)) {
                return;
            }

            const field =
                getField(name);

            if (!field) {
                return;
            }

            if (
                field.type === "radio"
            ) {
                const radio =
                    form.querySelector(
                        `input[name="${CSS.escape(name)}"][value="${CSS.escape(
                            String(data[name])
                        )}"]`
                    );

                if (radio) {
                    radio.checked = true;
                }

                return;
            }

            if (
                field.type === "checkbox"
            ) {
                field.checked =
                    Boolean(data[name]);

                return;
            }

            if (
                name === "study_sleep_ratio" ||
                name === "academic_load_index"
            ) {
                return;
            }

            field.value =
                data[name] ?? "";
        });

        updateDerivedDisplays(data);
        updateRangeDisplays();
    }

    /* ---------------------------------------------------------
       Derived Features
       --------------------------------------------------------- */

    function calculateStudySleepRatio(data) {
        const study =
            number(
                data?.study_hours,
                0
            );

        const sleep =
            number(
                data?.sleep_hours,
                0
            );

        if (sleep <= 0) {
            return 0;
        }

        return study / sleep;
    }

    function calculateAcademicLoadIndex(data) {
        const academicPerformance =
            number(
                data?.academic_performance,
                0
            );

        const studyHours =
            number(
                data?.study_hours,
                0
            );

        const academicPressure =
            number(
                data?.academic_pressure,
                0
            );

        const examAnxiety =
            number(
                data?.exam_anxiety,
                0
            );

        const assignmentCompletion =
            number(
                data?.assignment_completion,
                0
            );

        const attendance =
            number(
                data?.attendance_percentage,
                0
            );

        const normalizedStudy =
            Math.min(
                Math.max(
                    studyHours / 12,
                    0
                ),
                1
            );

        const normalizedPerformance =
            Math.min(
                Math.max(
                    academicPerformance / 100,
                    0
                ),
                1
            );

        const normalizedPressure =
            Math.min(
                Math.max(
                    academicPressure / 10,
                    0
                ),
                1
            );

        const normalizedAnxiety =
            Math.min(
                Math.max(
                    examAnxiety / 10,
                    0
                ),
                1
            );

        const normalizedCompletion =
            Math.min(
                Math.max(
                    assignmentCompletion / 100,
                    0
                ),
                1
            );

        const normalizedAttendance =
            Math.min(
                Math.max(
                    attendance / 100,
                    0
                ),
                1
            );

        return Math.min(
            Math.max(
                (
                    normalizedStudy * 0.25 +
                    normalizedPressure * 0.25 +
                    normalizedAnxiety * 0.20 +
                    normalizedPerformance * 0.10 +
                    (1 - normalizedCompletion) * 0.10 +
                    (1 - normalizedAttendance) * 0.10
                ) * 100,
                0
            ),
            100
        );
    }

    function updateDerivedDisplays(data) {
        const scenario =
            data ||
            collectScenario();

        const ratio =
            calculateStudySleepRatio(
                scenario
            );

        const load =
            calculateAcademicLoadIndex(
                scenario
            );

        const ratioElements = $$(
            "[data-derived='study_sleep_ratio'], [data-simulation-ratio]"
        );

        ratioElements.forEach(
            (element) => {
                element.textContent =
                    ratio.toFixed(2);
            }
        );

        const loadElements = $$(
            "[data-derived='academic_load_index'], [data-simulation-load]"
        );

        loadElements.forEach(
            (element) => {
                element.textContent =
                    load.toFixed(1);
            }
        );
    }

    /* ---------------------------------------------------------
       Range / Slider Display
       --------------------------------------------------------- */

    function updateRangeDisplays() {
        if (!form) {
            return;
        }

        $$(
            "input[type='range']",
            form
        ).forEach((input) => {
            const output =
                document.querySelector(
                    `[data-range-output="${CSS.escape(
                        input.name
                    )}"]`
                ) ||
                input.parentElement?.querySelector(
                    ".range-value"
                );

            if (!output) {
                return;
            }

            let value =
                number(
                    input.value,
                    0
                );

            const suffix =
                input.dataset.suffix ||
                (
                    input.name?.includes(
                        "percentage"
                    )
                        ? "%"
                        : ""
                );

            output.textContent =
                `${value}${suffix}`;
        });
    }

    /* ---------------------------------------------------------
       Form Validation
       --------------------------------------------------------- */

    function validateScenario() {
        if (!form) {
            return true;
        }

        let valid = true;
        let firstInvalid = null;

        $(
            "input, select, textarea",
            form
        );

        $$(
            "input, select, textarea",
            form
        ).forEach((field) => {
            field.classList.remove(
                "field-invalid"
            );

            field.removeAttribute(
                "aria-invalid"
            );

            if (
                field.disabled ||
                field.type === "hidden"
            ) {
                return;
            }

            if (!field.checkValidity()) {
                valid = false;

                field.classList.add(
                    "field-invalid"
                );

                field.setAttribute(
                    "aria-invalid",
                    "true"
                );

                if (!firstInvalid) {
                    firstInvalid =
                        field;
                }
            }
        });

        if (!valid) {
            firstInvalid?.focus();

            firstInvalid?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            showToast(
                "Please correct the highlighted simulation inputs.",
                "warning"
            );
        }

        return valid;
    }

    /* ---------------------------------------------------------
       Preset Scenarios
       --------------------------------------------------------- */

    function applyPreset(name) {
        const preset =
            PRESETS[name];

        if (!preset) {
            return;
        }

        populateScenario(
            preset
        );

        updateDerivedDisplays(
            preset
        );

        showToast(
            `${capitalize(name)} scenario loaded.`,
            "success"
        );
    }

    function initializePresets() {
        const presetButtons = $$(
            "[data-preset]"
        );

        presetButtons.forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        const preset =
                            button.dataset.preset;

                        applyPreset(
                            preset
                        );

                        presetButtons.forEach(
                            (item) => {
                                item.classList.toggle(
                                    "active",
                                    item === button
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    function capitalize(value) {
        const string =
            String(value || "");

        return (
            string.charAt(0).toUpperCase() +
            string.slice(1)
        );
    }

    /* ---------------------------------------------------------
       Probability Rendering
       --------------------------------------------------------- */

    function getProbability(
        probabilities,
        className
    ) {
        if (
            !probabilities ||
            typeof probabilities !== "object"
        ) {
            return 0;
        }

        const target =
            String(className)
                .toLowerCase();

        for (
            const [key, value]
            of Object.entries(probabilities)
        ) {
            const normalized =
                String(key)
                    .toLowerCase();

            if (
                normalized === target ||
                normalized.includes(target)
            ) {
                const numeric =
                    number(value, 0);

                return numeric > 1
                    ? numeric / 100
                    : numeric;
            }
        }

        return 0;
    }

    function renderProbabilityBars(
        probabilities
    ) {
        const classes = [
            "low",
            "medium",
            "high"
        ];

        classes.forEach(
            (riskClass) => {
                const value =
                    getProbability(
                        probabilities,
                        riskClass
                    );

                const percent =
                    Math.min(
                        100,
                        Math.max(
                            0,
                            value * 100
                        )
                    );

                const fills = $$(
                    `[data-simulation-probability-fill="${riskClass}"], [data-probability-fill="${riskClass}"]`
                );

                fills.forEach(
                    (fill) => {
                        fill.style.width =
                            `${percent}%`;
                    }
                );

                const values = $$(
                    `[data-simulation-probability-value="${riskClass}"], [data-probability-value="${riskClass}"]`
                );

                values.forEach(
                    (element) => {
                        element.textContent =
                            `${percent.toFixed(1)}%`;
                    }
                );
            }
        );
    }

    /* ---------------------------------------------------------
       Simulation Result Rendering
       --------------------------------------------------------- */

    function renderResult(response) {
        if (!response) {
            return;
        }

        const prediction =
            response.prediction ||
            response.simulation?.prediction ||
            response.result?.prediction ||
            response.simulation ||
            response;

        if (
            !prediction ||
            typeof prediction !== "object"
        ) {
            showToast(
                "The simulation returned an unexpected response.",
                "error"
            );

            return;
        }

        const risk =
            prediction.predicted_class ||
            prediction.risk_level ||
            "Unknown";

        const normalizedRisk =
            normalizeRisk(risk);

        const confidence =
            number(
                prediction.confidence,
                0
            );

        const entropy =
            number(
                prediction.prediction_entropy ??
                prediction.entropy,
                NaN
            );

        const probabilities =
            prediction.probabilities ||
            prediction.class_probabilities ||
            {};

        const riskElements = $$(
            "[data-simulation-risk], [data-risk-level]"
        );

        riskElements.forEach(
            (element) => {
                element.textContent =
                    riskLabel(risk);

                element.classList.remove(
                    "risk-low",
                    "risk-medium",
                    "risk-high",
                    "risk-unknown"
                );

                element.classList.add(
                    `risk-${normalizedRisk}`
                );
            }
        );

        const confidenceElements = $$(
            "[data-simulation-confidence], [data-confidence]"
        );

        confidenceElements.forEach(
            (element) => {
                element.textContent =
                    `${percentage(confidence).toFixed(1)}%`;
            }
        );

        const entropyElements = $$(
            "[data-simulation-entropy], [data-entropy]"
        );

        entropyElements.forEach(
            (element) => {
                element.textContent =
                    Number.isFinite(entropy)
                        ? entropy.toFixed(3)
                        : "—";
            }
        );

        renderProbabilityBars(
            probabilities
        );

        renderEngineeredSignals(
            response,
            prediction
        );

        renderSimulationMetadata(
            response,
            prediction
        );

        renderSimulationInterpretation(
            response,
            prediction
        );

        renderScenarioRecord(
            response,
            prediction
        );

        if (resultPanel) {
            resultPanel.classList.add(
                "has-result",
                "is-visible"
            );

            resultPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    function normalizeRisk(value) {
        if (
            window.StressIntelRisk &&
            typeof window.StressIntelRisk.normalizeRiskLevel === "function"
        ) {
            return window.StressIntelRisk.normalizeRiskLevel(
                value
            );
        }

        const normalized =
            String(value || "")
                .toLowerCase();

        if (normalized.includes("low")) {
            return "low";
        }

        if (normalized.includes("medium")) {
            return "medium";
        }

        if (normalized.includes("high")) {
            return "high";
        }

        return "unknown";
    }

    function riskLabel(value) {
        if (
            window.StressIntelRisk &&
            typeof window.StressIntelRisk.getRiskLabel === "function"
        ) {
            return window.StressIntelRisk.getRiskLabel(
                value
            );
        }

        const normalized =
            normalizeRisk(value);

        return (
            normalized.charAt(0).toUpperCase() +
            normalized.slice(1)
        );
    }

    /* ---------------------------------------------------------
       Engineered Signals
       --------------------------------------------------------- */

    function renderEngineeredSignals(
        response,
        prediction
    ) {
        const container =
            document.querySelector(
                "[data-engineered-signals]"
            );

        if (!container) {
            return;
        }

        const scenario =
            response.features ||
            response.input_features ||
            collectScenario();

        const ratio =
            number(
                scenario.study_sleep_ratio ??
                calculateStudySleepRatio(
                    scenario
                ),
                0
            );

        const load =
            number(
                scenario.academic_load_index ??
                calculateAcademicLoadIndex(
                    scenario
                ),
                0
            );

        const signals = [
            {
                key: "study_sleep_ratio",
                label: LABELS.study_sleep_ratio,
                value: ratio.toFixed(2)
            },
            {
                key: "academic_load_index",
                label: LABELS.academic_load_index,
                value: load.toFixed(1)
            }
        ];

        const extraSignals =
            prediction.engineered_features ||
            response.engineered_features;

        if (
            extraSignals &&
            typeof extraSignals === "object"
        ) {
            Object.entries(
                extraSignals
            ).forEach(
                ([key, value]) => {
                    if (
                        signals.some(
                            (signal) =>
                                signal.key === key
                        )
                    ) {
                        return;
                    }

                    signals.push({
                        key,
                        label:
                            LABELS[key] ||
                            prettify(key),
                        value:
                            typeof value === "number"
                                ? value.toFixed(2)
                                : String(value)
                    });
                }
            );
        }

        container.innerHTML =
            signals
                .map(
                    (signal) => `
                        <div class="engineered-signal">
                            <span>
                                ${escapeHTML(
                                    signal.label
                                )}
                            </span>
                            <strong>
                                ${escapeHTML(
                                    signal.value
                                )}
                            </strong>
                        </div>
                    `
                )
                .join("");
    }

    /* ---------------------------------------------------------
       Simulation Metadata
       --------------------------------------------------------- */

    function renderSimulationMetadata(
        response,
        prediction
    ) {
        const model =
            prediction.model ||
            response.model ||
            {};

        const metadata = {
            model_version:
                model.model_version ||
                prediction.model_version ||
                "Not available",

            model_type:
                model.model_type ||
                prediction.model_type ||
                "XGBoost",

            class_index:
                prediction.class_index ??
                "Not available",

            confidence:
                `${percentage(
                    prediction.confidence
                ).toFixed(1)}%`
        };

        Object.entries(
            metadata
        ).forEach(
            ([key, value]) => {
                const elements = $$(
                    `[data-simulation-meta="${key}"]`
                );

                elements.forEach(
                    (element) => {
                        element.textContent =
                            String(value);
                    }
                );
            }
        );
    }

    /* ---------------------------------------------------------
       Research Interpretation
       --------------------------------------------------------- */

    function renderSimulationInterpretation(
        response,
        prediction
    ) {
        const container =
            document.querySelector(
                "[data-simulation-interpretation]"
            );

        if (!container) {
            return;
        }

        const risk =
            prediction.predicted_class ||
            prediction.risk_level ||
            "Unknown";

        const interpretation =
            response.research_interpretation ||
            response.interpretation ||
            prediction.interpretation ||
            "The simulation shows how the trained model responds to the submitted scenario.";

        container.innerHTML = `
            <div class="simulation-interpretation-card">
                <div class="simulation-interpretation-header">
                    <span class="eyebrow">
                        Model response
                    </span>

                    <strong class="risk-${normalizeRisk(
                        risk
                    )}">
                        ${escapeHTML(
                            riskLabel(risk)
                        )}
                    </strong>
                </div>

                <p>
                    ${escapeHTML(
                        String(
                            interpretation
                        )
                    )}
                </p>

                <div class="simulation-causality-note">
                    Scenario simulation changes model inputs and observes
                    model output. It does not demonstrate that changing
                    an input would causally change real-world stress.
                </div>
            </div>
        `;
    }

    /* ---------------------------------------------------------
       Scenario Record
       --------------------------------------------------------- */

    function renderScenarioRecord(
        response,
        prediction
    ) {
        const container =
            document.querySelector(
                "[data-scenario-record]"
            );

        if (!container) {
            return;
        }

        const scenario =
            response.features ||
            response.input_features ||
            collectScenario();

        const visible =
            Object.entries(
                scenario
            ).filter(
                ([key, value]) =>
                    FEATURE_NAMES.includes(key) &&
                    value !== "" &&
                    value !== null &&
                    value !== undefined
            );

        container.innerHTML =
            visible
                .map(
                    ([key, value]) => `
                        <div class="scenario-record-item">
                            <span>
                                ${escapeHTML(
                                    LABELS[key] ||
                                    prettify(key)
                                )}
                            </span>
                            <strong>
                                ${escapeHTML(
                                    String(value)
                                )}
                            </strong>
                        </div>
                    `
                )
                .join("");
    }

    function prettify(value) {
        return String(value || "")
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            );
    }

    /* ---------------------------------------------------------
       API Simulation
       --------------------------------------------------------- */

    async function runSimulation() {
        if (
            !window.StressIntel ||
            !window.StressIntel.API
        ) {
            showToast(
                "Application API is unavailable.",
                "error"
            );

            return;
        }

        if (
            form &&
            !validateScenario()
        ) {
            return;
        }

        const scenario =
            collectScenario();

        /*
         * Simulation is a model-analysis operation,
         * not a new participant assessment.
         */
        delete scenario.study_sleep_ratio;
        delete scenario.academic_load_index;

        if (
            Object.keys(scenario).length === 0
        ) {
            showToast(
                "Please provide simulation inputs.",
                "warning"
            );

            return;
        }

        if (runButton) {
            runButton.disabled = true;
        }

        showLoading(
            "Running scenario through the predictive engine…"
        );

        try {
            const response =
                await window.StressIntel.API.post(
                    "/simulation/",
                    scenario
                );

            renderResult(
                response
            );

            showToast(
                "Scenario simulation completed.",
                "success"
            );
        } catch (error) {
            console.error(
                "Simulation failed:",
                error
            );

            showToast(
                error?.message ||
                    "The scenario could not be processed.",
                "error"
            );
        } finally {
            hideLoading();

            if (runButton) {
                runButton.disabled = false;
            }
        }
    }

    /* ---------------------------------------------------------
       Reset
       --------------------------------------------------------- */

    function resetSimulation() {
        if (form) {
            form.reset();
        }

        $$(
            ".field-invalid",
            form || document
        ).forEach(
            (field) => {
                field.classList.remove(
                    "field-invalid"
                );

                field.removeAttribute(
                    "aria-invalid"
                );
            }
        );

        $$(
            ".is-visible, .has-result",
            resultPanel || document
        ).forEach(
            (element) => {
                element.classList.remove(
                    "is-visible",
                    "has-result"
                );
            }
        );

        updateRangeDisplays();
        updateDerivedDisplays(
            collectScenario()
        );

        $$(
            "[data-preset]"
        ).forEach(
            (button) => {
                button.classList.remove(
                    "active"
                );
            }
        );

        const defaultPreset =
            PRESETS.balanced;

        if (form && defaultPreset) {
            populateScenario(
                defaultPreset
            );
        }

        showToast(
            "Simulation reset to the balanced scenario.",
            "info"
        );
    }

    /* ---------------------------------------------------------
       Input Events
       --------------------------------------------------------- */

    function initializeInputs() {
        if (!form) {
            return;
        }

        $$(
            "input, select, textarea",
            form
        ).forEach(
            (field) => {
                field.addEventListener(
                    "input",
                    () => {
                        field.classList.remove(
                            "field-invalid"
                        );

                        updateRangeDisplays();

                        updateDerivedDisplays(
                            collectScenario()
                        );
                    }
                );

                field.addEventListener(
                    "change",
                    () => {
                        field.classList.remove(
                            "field-invalid"
                        );

                        updateRangeDisplays();

                        updateDerivedDisplays(
                            collectScenario()
                        );
                    }
                );
            }
        );
    }

    /* ---------------------------------------------------------
       Button Events
       --------------------------------------------------------- */

    if (runButton) {
        runButton.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                runSimulation();
            }
        );
    }

    if (resetButton) {
        resetButton.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                resetSimulation();
            }
        );
    }

    if (form) {
        form.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();
                runSimulation();
            }
        );
    }

    /* ---------------------------------------------------------
       Keyboard Support
       --------------------------------------------------------- */

    if (form) {
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

                runSimulation();
            }
        );
    }

    /* ---------------------------------------------------------
       Initialization
       --------------------------------------------------------- */

    function initialize() {
        initializeInputs();
        initializePresets();
        updateRangeDisplays();

        const balanced =
            PRESETS.balanced;

        if (
            form &&
            balanced &&
            FEATURE_NAMES.some(
                (name) => {
                    const field =
                        getField(name);

                    return (
                        field &&
                        !String(
                            field.value ?? ""
                        ).trim()
                    );
                }
            )
        ) {
            populateScenario(
                balanced
            );
        } else {
            updateDerivedDisplays(
                collectScenario()
            );
        }
    }

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }

    /* ---------------------------------------------------------
       Public API
       --------------------------------------------------------- */

    window.StressIntelSimulation = {
        PRESETS,
        FEATURE_NAMES,
        collectScenario,
        populateScenario,
        calculateStudySleepRatio,
        calculateAcademicLoadIndex,
        updateDerivedDisplays,
        applyPreset,
        runSimulation,
        resetSimulation,
        renderResult
    };
})();