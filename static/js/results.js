/* ============================================================
   StressIntel PRO
   Results, Explainability & Report Workflow
   ============================================================ */

(function () {
    "use strict";

    const result =
        window.StressIntelSession?.getResult?.() || null;

    const assessment =
        window.StressIntelSession?.getAssessment?.() || null;

    /* ---------------------------------------------------------
       DOM Helpers
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

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatNumber(value, decimals = 1) {
        if (
            window.StressIntelUtils &&
            typeof window.StressIntelUtils.formatNumber === "function"
        ) {
            return window.StressIntelUtils.formatNumber(
                value,
                decimals
            );
        }

        const numeric = Number(value);

        if (!Number.isFinite(numeric)) {
            return "—";
        }

        return numeric.toFixed(decimals);
    }

    function formatPercentage(value, decimals = 1) {
        if (
            window.StressIntelUtils &&
            typeof window.StressIntelUtils.formatPercentage === "function"
        ) {
            return window.StressIntelUtils.formatPercentage(
                value,
                decimals
            );
        }

        let numeric = Number(value);

        if (!Number.isFinite(numeric)) {
            return "—";
        }

        if (numeric >= 0 && numeric <= 1) {
            numeric *= 100;
        }

        return `${numeric.toFixed(decimals)}%`;
    }

    function normalizeRisk(value) {
        if (
            window.StressIntelRisk &&
            typeof window.StressIntelRisk.normalizeRiskLevel === "function"
        ) {
            return window.StressIntelRisk.normalizeRiskLevel(value);
        }

        const normalized = String(value || "")
            .trim()
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

    /* ---------------------------------------------------------
       Result Normalization
       --------------------------------------------------------- */

    function normalizeResult(payload) {
        if (!payload || typeof payload !== "object") {
            return null;
        }

        /*
         * The API normally returns:
         *
         * {
         *   prediction: {...},
         *   explanation: {...},
         *   ...
         * }
         *
         * This normalizer also supports direct prediction objects
         * to make the frontend resilient to API evolution.
         */

        if (payload.prediction) {
            return payload;
        }

        if (
            payload.risk_level ||
            payload.predicted_class ||
            payload.probabilities
        ) {
            return {
                prediction: payload
            };
        }

        if (payload.result?.prediction) {
            return payload.result;
        }

        return payload;
    }

    const normalizedResult =
        normalizeResult(result);

    /* ---------------------------------------------------------
       Prediction Accessors
       --------------------------------------------------------- */

    function getPrediction() {
        if (!normalizedResult) {
            return null;
        }

        return (
            normalizedResult.prediction ||
            normalizedResult.result?.prediction ||
            normalizedResult
        );
    }

    function getProbabilities() {
        const prediction = getPrediction();

        if (!prediction) {
            return {};
        }

        const probabilities =
            prediction.probabilities ||
            prediction.class_probabilities ||
            {};

        const normalized = {};

        Object.entries(probabilities).forEach(
            ([key, value]) => {
                const numeric = Number(value);

                if (Number.isFinite(numeric)) {
                    normalized[key] = numeric;
                }
            }
        );

        return normalized;
    }

    function getExplanation() {
        if (!normalizedResult) {
            return {};
        }

        return (
            normalizedResult.explanation ||
            normalizedResult.explainability ||
            normalizedResult.result?.explanation ||
            {}
        );
    }

    function getJournalAnalysis() {
        if (!normalizedResult) {
            return null;
        }

        return (
            normalizedResult.journal_analysis ||
            normalizedResult.journal ||
            null
        );
    }

    /* ---------------------------------------------------------
       Risk Header
       --------------------------------------------------------- */

    function renderRiskSummary() {
        const prediction = getPrediction();

        if (!prediction) {
            return;
        }

        const riskLevel =
            prediction.predicted_class ||
            prediction.risk_level ||
            "Unknown";

        const normalizedRisk =
            normalizeRisk(riskLevel);

        const confidence =
            Number(prediction.confidence);

        const riskElement =
            document.querySelector(
                "[data-risk-level]"
            ) ||
            document.getElementById(
                "risk-level"
            );

        const descriptionElement =
            document.querySelector(
                "[data-risk-description]"
            ) ||
            document.getElementById(
                "risk-description"
            );

        const confidenceElement =
            document.querySelector(
                "[data-confidence]"
            ) ||
            document.getElementById(
                "confidence-value"
            );

        const riskContainer =
            document.querySelector(
                "[data-risk-container]"
            ) ||
            document.querySelector(
                ".risk-summary"
            );

        if (riskElement) {
            riskElement.textContent =
                window.StressIntelRisk?.getRiskLabel?.(
                    riskLevel
                ) ||
                String(riskLevel);

            riskElement.classList.remove(
                "risk-low",
                "risk-medium",
                "risk-high",
                "risk-unknown"
            );

            riskElement.classList.add(
                `risk-${normalizedRisk}`
            );
        }

        if (descriptionElement) {
            descriptionElement.textContent =
                window.StressIntelRisk?.getRiskDescription?.(
                    riskLevel
                ) ||
                "Research-oriented stress-risk estimate.";
        }

        if (confidenceElement) {
            confidenceElement.textContent =
                formatPercentage(
                    confidence
                );
        }

        if (riskContainer) {
            riskContainer.classList.remove(
                "risk-low",
                "risk-medium",
                "risk-high",
                "risk-unknown"
            );

            riskContainer.classList.add(
                `risk-${normalizedRisk}`
            );
        }

        $$(".risk-level-badge").forEach(
            (element) => {
                element.textContent =
                    window.StressIntelRisk?.getRiskLabel?.(
                        riskLevel
                    ) ||
                    String(riskLevel);

                element.className =
                    `risk-level-badge risk-${normalizedRisk}`;
            }
        );
    }

    /* ---------------------------------------------------------
       Probability Profile
       --------------------------------------------------------- */

    function renderProbabilities() {
        const probabilities =
            getProbabilities();

        const classMap = {
            low: "Low",
            medium: "Medium",
            high: "High"
        };

        Object.entries(classMap).forEach(
            ([key, label]) => {
                const value =
                    findProbability(
                        probabilities,
                        key
                    );

                const percentage =
                    value * 100;

                const bars = $$(
                    `[data-probability="${key}"], [data-probability="${label}"]`
                );

                bars.forEach((bar) => {
                    const fill =
                        bar.querySelector(
                            ".probability-fill, .bar-fill"
                        );

                    const valueElement =
                        bar.querySelector(
                            ".probability-value, [data-probability-value]"
                        );

                    if (fill) {
                        fill.style.width =
                            `${clampPercentage(
                                percentage
                            )}%`;
                    }

                    if (valueElement) {
                        valueElement.textContent =
                            `${percentage.toFixed(1)}%`;
                    }
                });

                const directValue =
                    document.querySelector(
                        `[data-probability-value="${key}"]`
                    );

                if (directValue) {
                    directValue.textContent =
                        `${percentage.toFixed(1)}%`;
                }

                const directFill =
                    document.querySelector(
                        `[data-probability-fill="${key}"]`
                    );

                if (directFill) {
                    directFill.style.width =
                        `${clampPercentage(
                            percentage
                        )}%`;
                }
            }
        );
    }

    function findProbability(
        probabilities,
        target
    ) {
        const targetLower =
            String(target).toLowerCase();

        for (
            const [key, value]
            of Object.entries(probabilities)
        ) {
            const normalized =
                String(key)
                    .toLowerCase();

            if (
                normalized === targetLower ||
                normalized.includes(targetLower)
            ) {
                const numeric =
                    Number(value);

                if (
                    Number.isFinite(numeric)
                ) {
                    return numeric > 1
                        ? numeric / 100
                        : numeric;
                }
            }
        }

        return 0;
    }

    function clampPercentage(value) {
        return Math.min(
            100,
            Math.max(
                0,
                Number(value) || 0
            )
        );
    }

    /* ---------------------------------------------------------
       Uncertainty
       --------------------------------------------------------- */

    function renderUncertainty() {
        const prediction =
            getPrediction();

        if (!prediction) {
            return;
        }

        const confidence =
            Number(
                prediction.confidence
            );

        const entropy =
            Number(
                prediction.prediction_entropy ??
                prediction.entropy
            );

        const confidenceElements = $$(
            "[data-confidence-value]"
        );

        confidenceElements.forEach(
            (element) => {
                element.textContent =
                    formatPercentage(
                        confidence
                    );
            }
        );

        const entropyElements = $$(
            "[data-entropy-value]"
        );

        entropyElements.forEach(
            (element) => {
                element.textContent =
                    formatNumber(
                        entropy,
                        3
                    );
            }
        );

        const uncertaintyElements = $$(
            "[data-uncertainty]"
        );

        uncertaintyElements.forEach(
            (element) => {
                if (!Number.isFinite(entropy)) {
                    element.textContent =
                        "Not available";
                    return;
                }

                if (entropy < 0.45) {
                    element.textContent =
                        "Lower predictive uncertainty";
                } else if (entropy < 0.85) {
                    element.textContent =
                        "Intermediate predictive uncertainty";
                } else {
                    element.textContent =
                        "Higher predictive uncertainty";
                }
            }
        );
    }

    /* ---------------------------------------------------------
       SHAP Explainability
       --------------------------------------------------------- */

    function getDrivers() {
        const explanation =
            getExplanation();

        return (
            explanation.top_risk_drivers ||
            explanation.risk_drivers ||
            explanation.top_positive ||
            []
        );
    }

    function getProtectiveFactors() {
        const explanation =
            getExplanation();

        return (
            explanation.protective_factors ||
            explanation.top_protective_factors ||
            explanation.top_negative ||
            []
        );
    }

    function getAllContributions() {
        const explanation =
            getExplanation();

        return (
            explanation.feature_contributions ||
            explanation.contributions ||
            explanation.features ||
            []
        );
    }

    function contributionName(item) {
        if (!item || typeof item !== "object") {
            return "Unknown feature";
        }

        return (
            item.feature ||
            item.feature_name ||
            item.name ||
            "Unknown feature"
        );
    }

    function contributionValue(item) {
        if (!item || typeof item !== "object") {
            return 0;
        }

        return Number(
            item.shap_value ??
            item.contribution ??
            item.value ??
            0
        );
    }

    function contributionDisplayValue(item) {
        const value =
            contributionValue(item);

        if (!Number.isFinite(value)) {
            return "—";
        }

        return value >= 0
            ? `+${value.toFixed(4)}`
            : value.toFixed(4);
    }

    function renderContributionList(
        selector,
        items,
        type
    ) {
        const container =
            document.querySelector(selector);

        if (!container) {
            return;
        }

        if (!Array.isArray(items) || !items.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-title">
                        Explanation unavailable
                    </div>
                    <div class="empty-state-text">
                        SHAP contributions are not available for this result.
                    </div>
                </div>
            `;

            return;
        }

        const limited =
            items.slice(0, 8);

        container.innerHTML =
            limited
                .map((item) => {
                    const name =
                        contributionName(item);

                    const value =
                        contributionValue(item);

                    const magnitude =
                        Math.min(
                            Math.abs(value) * 100,
                            100
                        );

                    const positive =
                        value >= 0;

                    const barType =
                        type === "protective"
                            ? "protective"
                            : "driver";

                    return `
                        <div class="contribution-item ${barType}">
                            <div class="contribution-header">
                                <span class="contribution-name">
                                    ${escapeHTML(name)}
                                </span>
                                <strong class="contribution-value">
                                    ${escapeHTML(
                                        contributionDisplayValue(
                                            item
                                        )
                                    )}
                                </strong>
                            </div>

                            <div class="contribution-bar">
                                <span
                                    class="contribution-bar-fill"
                                    style="width:${magnitude}%"
                                ></span>
                            </div>

                            <div class="contribution-direction">
                                ${
                                    positive
                                        ? "Positive model contribution"
                                        : "Negative model contribution"
                                }
                            </div>
                        </div>
                    `;
                })
                .join("");
    }

    function renderExplainability() {
        renderContributionList(
            "[data-risk-drivers]",
            getDrivers(),
            "driver"
        );

        renderContributionList(
            "[data-protective-factors]",
            getProtectiveFactors(),
            "protective"
        );

        renderContributionTable();
    }

    function renderContributionTable() {
        const container =
            document.querySelector(
                "[data-contribution-table]"
            );

        if (!container) {
            return;
        }

        const contributions =
            getAllContributions();

        if (
            !Array.isArray(contributions) ||
            !contributions.length
        ) {
            container.innerHTML = `
                <tr>
                    <td colspan="4">
                        No feature-level explanation is available.
                    </td>
                </tr>
            `;

            return;
        }

        const sorted =
            [...contributions].sort(
                (a, b) =>
                    Math.abs(
                        contributionValue(b)
                    ) -
                    Math.abs(
                        contributionValue(a)
                    )
            );

        container.innerHTML =
            sorted
                .map((item) => {
                    const name =
                        contributionName(item);

                    const value =
                        contributionValue(item);

                    const direction =
                        value >= 0
                            ? "Positive"
                            : "Negative";

                    const className =
                        value >= 0
                            ? "positive"
                            : "negative";

                    const featureValue =
                        item.feature_value ??
                        item.input_value ??
                        item.observed_value ??
                        "—";

                    return `
                        <tr>
                            <td>
                                ${escapeHTML(name)}
                            </td>
                            <td>
                                ${escapeHTML(
                                    String(
                                        featureValue
                                    )
                                )}
                            </td>
                            <td class="${className}">
                                ${escapeHTML(
                                    contributionDisplayValue(
                                        item
                                    )
                                )}
                            </td>
                            <td>
                                <span class="contribution-direction-pill ${className}">
                                    ${direction}
                                </span>
                            </td>
                        </tr>
                    `;
                })
                .join("");
    }

    /* ---------------------------------------------------------
       Journal Analysis
       --------------------------------------------------------- */

    function renderJournalAnalysis() {
        const analysis =
            getJournalAnalysis();

        const container =
            document.querySelector(
                "[data-journal-analysis]"
            );

        if (!container) {
            return;
        }

        if (
            !analysis ||
            typeof analysis !== "object"
        ) {
            container.innerHTML = `
                <div class="journal-empty">
                    <div class="journal-empty-title">
                        No journal analysis submitted
                    </div>
                    <p>
                        Qualitative analysis is optional and was not included
                        in this assessment.
                    </p>
                </div>
            `;

            return;
        }

        const sentiment =
            analysis.sentiment ||
            "Not available";

        const confidence =
            analysis.confidence;

        const themes =
            Array.isArray(analysis.themes)
                ? analysis.themes
                : [];

        const summary =
            analysis.summary ||
            analysis.interpretation ||
            "No qualitative summary was returned.";

        const model =
            analysis.model ||
            analysis.provider_model ||
            "Configured external model";

        const provider =
            analysis.provider ||
            "GROQ";

        container.innerHTML = `
            <div class="journal-analysis-card">
                <div class="journal-analysis-header">
                    <div>
                        <span class="eyebrow">
                            Qualitative signal
                        </span>
                        <h3>
                            ${escapeHTML(
                                String(
                                    sentiment
                                )
                            )}
                        </h3>
                    </div>

                    ${
                        confidence !== undefined
                            ? `
                                <div class="journal-confidence">
                                    <span>Confidence</span>
                                    <strong>
                                        ${escapeHTML(
                                            formatPercentage(
                                                confidence
                                            )
                                        )}
                                    </strong>
                                </div>
                            `
                            : ""
                    }
                </div>

                <div class="journal-summary">
                    ${escapeHTML(
                        String(summary)
                    )}
                </div>

                ${
                    themes.length
                        ? `
                            <div class="journal-themes">
                                ${themes
                                    .slice(0, 8)
                                    .map(
                                        (theme) => `
                                            <span class="theme-tag">
                                                ${escapeHTML(
                                                    typeof theme === "object"
                                                        ? theme.name ||
                                                          theme.theme ||
                                                          "Theme"
                                                        : theme
                                                )}
                                            </span>
                                        `
                                    )
                                    .join("")}
                            </div>
                        `
                        : ""
                }

                <div class="journal-provenance">
                    <span>
                        Provider: ${escapeHTML(
                            String(provider)
                        )}
                    </span>
                    <span>
                        Model: ${escapeHTML(
                            String(model)
                        )}
                    </span>
                </div>
            </div>
        `;
    }

    /* ---------------------------------------------------------
       Metadata
       --------------------------------------------------------- */

    function renderMetadata() {
        const prediction =
            getPrediction();

        if (!prediction) {
            return;
        }

        const model =
            prediction.model ||
            normalizedResult?.model ||
            {};

        const metadata = {
            "Model version":
                model.model_version ||
                prediction.model_version ||
                "Not available",

            "Model type":
                model.model_type ||
                prediction.model_type ||
                "XGBoost",

            "Prediction class":
                prediction.predicted_class ||
                "Not available",

            "Class index":
                prediction.class_index ??
                "Not available",

            "Calibration":
                model.calibration?.method ||
                prediction.calibration_method ||
                "Not available"
        };

        Object.entries(metadata).forEach(
            ([key, value]) => {
                const selector =
                    `[data-metadata="${key}"]`;

                const element =
                    document.querySelector(
                        selector
                    );

                if (element) {
                    element.textContent =
                        String(value);
                }
            }
        );

        const modelVersionElements = $$(
            "[data-model-version]"
        );

        modelVersionElements.forEach(
            (element) => {
                element.textContent =
                    model.model_version ||
                    prediction.model_version ||
                    "Not available";
            }
        );
    }

    /* ---------------------------------------------------------
       Input Snapshot
       --------------------------------------------------------- */

    function renderInputSnapshot() {
        const container =
            document.querySelector(
                "[data-input-snapshot]"
            );

        if (!container) {
            return;
        }

        if (
            !assessment ||
            typeof assessment !== "object"
        ) {
            container.innerHTML = `
                <div class="empty-state">
                    Assessment inputs are unavailable.
                </div>
            `;

            return;
        }

        const ignoredKeys = new Set([
            "consent",
            "session_id",
            "participant_id",
            "journal",
            "saved_at"
        ]);

        const entries =
            Object.entries(assessment)
                .filter(
                    ([key, value]) =>
                        !ignoredKeys.has(key) &&
                        value !== "" &&
                        value !== null &&
                        value !== undefined
                );

        container.innerHTML =
            entries
                .map(([key, value]) => {
                    const label =
                        key
                            .replace(
                                /_/g,
                                " "
                            )
                            .replace(
                                /\b\w/g,
                                (letter) =>
                                    letter.toUpperCase()
                            );

                    return `
                        <div class="snapshot-item">
                            <span>
                                ${escapeHTML(label)}
                            </span>
                            <strong>
                                ${escapeHTML(
                                    String(value)
                                )}
                            </strong>
                        </div>
                    `;
                })
                .join("");
    }

    /* ---------------------------------------------------------
       Research Interpretation
       --------------------------------------------------------- */

    function renderResearchInterpretation() {
        const container =
            document.querySelector(
                "[data-research-interpretation]"
            );

        if (!container) {
            return;
        }

        const prediction =
            getPrediction();

        if (!prediction) {
            return;
        }

        const risk =
            prediction.predicted_class ||
            prediction.risk_level ||
            "Unknown";

        const confidence =
            Number(
                prediction.confidence
            );

        const explanation =
            getExplanation();

        const note =
            explanation.research_note ||
            normalizedResult?.research_interpretation ||
            prediction.interpretation ||
            "The result is an association produced by the trained model and should not be interpreted as causal evidence.";

        container.innerHTML = `
            <div class="interpretation-card">
                <div class="interpretation-risk">
                    <span>Estimated class</span>
                    <strong>
                        ${escapeHTML(
                            String(risk)
                        )}
                    </strong>
                </div>

                <div class="interpretation-confidence">
                    <span>Model confidence</span>
                    <strong>
                        ${escapeHTML(
                            formatPercentage(
                                confidence
                            )
                        )}
                    </strong>
                </div>

                <p>
                    ${escapeHTML(
                        String(note)
                    )}
                </p>

                <div class="interpretation-boundary">
                    Model associations are not evidence of causation,
                    diagnosis, or individual clinical status.
                </div>
            </div>
        `;
    }

    /* ---------------------------------------------------------
       Report Generation
       --------------------------------------------------------- */

    async function generateReport() {
        const prediction =
            getPrediction();

        if (!prediction) {
            window.StressIntel?.showToast?.(
                "No prediction is available for report generation.",
                "warning"
            );

            return null;
        }

        const payload = {
            prediction,
            features:
                assessment || {},
            journal_analysis:
                getJournalAnalysis()
        };

        try {
            window.StressIntel?.showLoading?.(
                "Generating research report…"
            );

            const report =
                await window.StressIntel.API.post(
                    "/reports/",
                    payload
                );

            window.StressIntelSession?.saveResult?.(
                {
                    ...normalizedResult,
                    report
                }
            );

            window.StressIntel?.hideLoading?.();

            return report;
        } catch (error) {
            window.StressIntel?.hideLoading?.();

            console.error(
                "Report generation failed:",
                error
            );

            window.StressIntel?.showToast?.(
                error?.message ||
                    "Unable to generate the report.",
                "error"
            );

            return null;
        }
    }

    /* ---------------------------------------------------------
       Report Navigation
       --------------------------------------------------------- */

    function initializeReportActions() {
        const reportButtons = $$(
            "[data-generate-report], #generate-report"
        );

        reportButtons.forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        const report =
                            await generateReport();

                        if (!report) {
                            return;
                        }

                        window.location.href =
                            "/report";
                    }
                );
            }
        );

        const printButtons = $$(
            "[data-print-report], #print-report"
        );

        printButtons.forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        window.print();
                    }
                );
            }
        );

        const downloadButtons = $$(
            "[data-download-report], #download-report"
        );

        downloadButtons.forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        const current =
                            window.StressIntelSession
                                ?.getResult?.();

                        if (!current) {
                            window.StressIntel?.showToast?.(
                                "No report data is available.",
                                "warning"
                            );

                            return;
                        }

                        if (
                            window.StressIntelExport
                                ?.downloadJSON
                        ) {
                            window.StressIntelExport.downloadJSON(
                                current,
                                "stressintel-pro-report.json"
                            );
                        }
                    }
                );
            }
        );
    }

    /* ---------------------------------------------------------
       Missing Result Handling
       --------------------------------------------------------- */

    function handleMissingResult() {
        if (normalizedResult) {
            return false;
        }

        const resultsPage =
            document.querySelector(
                "[data-results-page]"
            ) ||
            document.body.classList.contains(
                "results-page"
            );

        if (!resultsPage) {
            return false;
        }

        const content =
            document.querySelector(
                "[data-results-content]"
            ) ||
            document.querySelector(
                ".results-content"
            );

        if (content) {
            content.innerHTML = `
                <div class="empty-state results-empty-state">
                    <div class="empty-state-icon">
                        ?
                    </div>

                    <h2>
                        No assessment result found
                    </h2>

                    <p>
                        Complete an assessment before opening the
                        results dashboard.
                    </p>

                    <a
                        href="/assessment"
                        class="btn btn-primary"
                    >
                        Start Assessment
                    </a>
                </div>
            `;
        }

        return true;
    }

    /* ---------------------------------------------------------
       Result Cleanup
       --------------------------------------------------------- */

    function initializeResultCleanup() {
        const clearButtons = $$(
            "[data-clear-result], #clear-result"
        );

        clearButtons.forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        const confirmed =
                            window.confirm(
                                "Clear the current assessment result from this browser?"
                            );

                        if (!confirmed) {
                            return;
                        }

                        window.StressIntelSession?.clear?.();

                        window.location.href =
                            "/";
                    }
                );
            }
        );
    }

    /* ---------------------------------------------------------
       Animation
       --------------------------------------------------------- */

    function animateProbabilityBars() {
        const bars = $$(
            ".probability-fill, .bar-fill, .contribution-bar-fill"
        );

        if (!bars.length) {
            return;
        }

        bars.forEach((bar) => {
            const target =
                bar.style.width ||
                "0%";

            bar.style.width = "0%";

            requestAnimationFrame(() => {
                setTimeout(() => {
                    bar.style.width =
                        target;
                }, 80);
            });
        });
    }

    /* ---------------------------------------------------------
       Initialization
       --------------------------------------------------------- */

    function initializeResults() {
        if (handleMissingResult()) {
            return;
        }

        renderRiskSummary();
        renderProbabilities();
        renderUncertainty();
        renderExplainability();
        renderJournalAnalysis();
        renderMetadata();
        renderInputSnapshot();
        renderResearchInterpretation();

        initializeReportActions();
        initializeResultCleanup();

        setTimeout(
            animateProbabilityBars,
            100
        );
    }

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeResults,
            {
                once: true
            }
        );
    } else {
        initializeResults();
    }

    /* ---------------------------------------------------------
       Public API
       --------------------------------------------------------- */

    window.StressIntelResults = {
        getResult: () => normalizedResult,
        getPrediction,
        getProbabilities,
        getExplanation,
        getJournalAnalysis,
        renderRiskSummary,
        renderProbabilities,
        renderUncertainty,
        renderExplainability,
        renderJournalAnalysis,
        renderMetadata,
        renderInputSnapshot,
        renderResearchInterpretation,
        generateReport
    };
})();