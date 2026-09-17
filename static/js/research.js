/* ============================================================
   StressIntel PRO
   Research Intelligence Dashboard
   ============================================================ */

(function () {
    "use strict";

    const API_BASE = "/api";

    const state = {
        researchData: null,
        loaded: false,
        error: null
    };

    /* ---------------------------------------------------------
       DOM Utilities
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

    function percentage(value, decimals = 1) {
        let parsed = number(value, 0);

        if (
            parsed >= 0 &&
            parsed <= 1
        ) {
            parsed *= 100;
        }

        return `${parsed.toFixed(decimals)}%`;
    }

    function clamp(value, min = 0, max = 100) {
        return Math.min(
            max,
            Math.max(
                min,
                number(value, min)
            )
        );
    }

    /* ---------------------------------------------------------
       Loading / Notifications
       --------------------------------------------------------- */

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
       API
       --------------------------------------------------------- */

    async function request(
        endpoint,
        options = {}
    ) {
        const config = {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            ...options
        };

        if (
            config.body &&
            typeof config.body === "object"
        ) {
            config.headers["Content-Type"] =
                "application/json";

            config.body =
                JSON.stringify(
                    config.body
                );
        }

        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => controller.abort(),
                30000
            );

        config.signal =
            controller.signal;

        try {
            const response =
                await fetch(
                    `${API_BASE}${endpoint}`,
                    config
                );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let payload;

            if (
                contentType.includes(
                    "application/json"
                )
            ) {
                payload =
                    await response.json();
            } else {
                payload =
                    await response.text();
            }

            if (!response.ok) {
                throw new Error(
                    typeof payload === "object"
                        ? payload.error ||
                          payload.message ||
                          "Research API request failed."
                        : "Research API request failed."
                );
            }

            return payload;
        } finally {
            clearTimeout(timeout);
        }
    }

    /* ---------------------------------------------------------
       Research Data Loading
       --------------------------------------------------------- */

    async function loadResearchData() {
        /*
         * The research dashboard is designed to consume
         * persisted evaluation metadata when available.
         *
         * The API endpoint may expose either:
         *
         *   /api/analysis/research
         *
         * or a compatible research payload through
         * /api/analysis/.
         *
         * A local fallback keeps the dashboard functional
         * when evaluation artifacts have not yet been produced.
         */

        try {
            const response =
                await request(
                    "/analysis/research"
                );

            state.researchData =
                normalizeResearchData(
                    response
                );

            state.loaded = true;

            return state.researchData;
        } catch (primaryError) {
            try {
                const response =
                    await request(
                        "/analysis/"
                    );

                state.researchData =
                    normalizeResearchData(
                        response
                    );

                state.loaded = true;

                return state.researchData;
            } catch (secondaryError) {
                state.error =
                    secondaryError;

                state.researchData =
                    buildUnavailableResearchData();

                state.loaded = false;

                return state.researchData;
            }
        }
    }

    function normalizeResearchData(
        payload
    ) {
        const source =
            payload?.research ||
            payload?.data ||
            payload ||
            {};

        return {
            overview:
                source.overview ||
                source.metrics ||
                {},

            metrics:
                source.metrics ||
                source.overview ||
                {},

            class_metrics:
                source.class_metrics ||
                source.per_class_metrics ||
                source.classification_report ||
                [],

            confusion_matrix:
                source.confusion_matrix ||
                source.confusion ||
                [],

            feature_importance:
                source.feature_importance ||
                source.global_shap ||
                source.shap_importance ||
                [],

            calibration:
                source.calibration ||
                {},

            ablations:
                source.ablations ||
                source.ablation_results ||
                [],

            provenance:
                source.provenance ||
                source.experiment ||
                {},

            reproducibility:
                source.reproducibility ||
                {},

            journal:
                source.journal ||
                source.journal_analysis ||
                {},

            claims:
                source.claims ||
                source.claim_boundaries ||
                {},

            raw: source
        };
    }

    function buildUnavailableResearchData() {
        return {
            overview: {
                accuracy: null,
                macro_f1: null,
                feature_count: 21,
                risk_classes: 3
            },

            metrics: {},

            class_metrics: [],

            confusion_matrix: [],

            feature_importance: [],

            calibration: {
                method: "Not evaluated",
                brier_score: null,
                log_loss: null
            },

            ablations: [],

            provenance: {
                status: "Evaluation artifacts pending"
            },

            reproducibility: {
                status: "Pending"
            },

            journal: {
                status: "Configured"
            },

            claims: {
                status: "Bounded research interpretation"
            },

            raw: {}
        };
    }

    /* ---------------------------------------------------------
       Overview Metrics
       --------------------------------------------------------- */

    function renderOverview() {
        const data =
            state.researchData;

        if (!data) {
            return;
        }

        const metrics = {
            accuracy:
                data.metrics.accuracy ??
                data.overview.accuracy,

            macro_f1:
                data.metrics.macro_f1 ??
                data.overview.macro_f1,

            feature_count:
                data.metrics.feature_count ??
                data.overview.feature_count ??
                21,

            risk_classes:
                data.metrics.risk_classes ??
                data.overview.risk_classes ??
                3
        };

        setText(
            "[data-research-accuracy]",
            formatMetric(
                metrics.accuracy,
                "0.0%"
            )
        );

        setText(
            "[data-research-f1]",
            formatMetric(
                metrics.macro_f1,
                "0.000"
            )
        );

        setText(
            "[data-research-features]",
            String(
                metrics.feature_count
            )
        );

        setText(
            "[data-research-classes]",
            String(
                metrics.risk_classes
            )
        );

        setText(
            "[data-metric-accuracy]",
            formatMetric(
                metrics.accuracy,
                "Not evaluated"
            )
        );

        setText(
            "[data-metric-macro-f1]",
            formatMetric(
                metrics.macro_f1,
                "Not evaluated"
            )
        );
    }

    function formatMetric(
        value,
        fallback
    ) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return fallback;
        }

        const numeric =
            number(
                value,
                NaN
            );

        if (
            !Number.isFinite(numeric)
        ) {
            return escapeHTML(
                String(value)
            );
        }

        if (
            fallback.includes("%")
        ) {
            return percentage(
                numeric
            );
        }

        return numeric.toFixed(
            3
        );
    }

    /* ---------------------------------------------------------
       Per-Class Metrics
       --------------------------------------------------------- */

    function renderClassMetrics() {
        const table =
            document.querySelector(
                "[data-class-metrics]"
            );

        if (!table) {
            return;
        }

        const rows =
            normalizeClassMetrics(
                state.researchData?.class_metrics
            );

        if (!rows.length) {
            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        Evaluation metrics are not available yet.
                    </td>
                </tr>
            `;

            return;
        }

        table.innerHTML =
            rows.map(
                (row) => `
                    <tr>
                        <td>
                            <span class="class-pill class-${escapeHTML(
                                row.name.toLowerCase()
                            )}">
                                ${escapeHTML(
                                    row.name
                                )}
                            </span>
                        </td>
                        <td>
                            ${formatMetricCell(
                                row.precision
                            )}
                        </td>
                        <td>
                            ${formatMetricCell(
                                row.recall
                            )}
                        </td>
                        <td>
                            ${formatMetricCell(
                                row.f1
                            )}
                        </td>
                        <td>
                            ${formatMetricCell(
                                row.support,
                                false
                            )}
                        </td>
                    </tr>
                `
            ).join("");
    }

    function normalizeClassMetrics(
        input
    ) {
        if (
            Array.isArray(input)
        ) {
            return input.map(
                (row) => ({
                    name:
                        row.name ||
                        row.class ||
                        row.label ||
                        "Unknown",

                    precision:
                        row.precision,

                    recall:
                        row.recall,

                    f1:
                        row.f1 ??
                        row.f1_score,

                    support:
                        row.support
                })
            );
        }

        if (
            input &&
            typeof input === "object"
        ) {
            return Object.entries(
                input
            )
                .filter(
                    ([name]) =>
                        ![
                            "accuracy",
                            "macro avg",
                            "weighted avg"
                        ].includes(name)
                )
                .map(
                    ([name, row]) => ({
                        name,
                        precision:
                            row.precision,
                        recall:
                            row.recall,
                        f1:
                            row.f1 ??
                            row["f1-score"],
                        support:
                            row.support
                    })
                );
        }

        return [];
    }

    function formatMetricCell(
        value,
        asPercentage = true
    ) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "—";
        }

        return asPercentage
            ? percentage(
                  value,
                  1
              )
            : formatInteger(
                  value
              );
    }

    function formatInteger(value) {
        const numeric =
            number(
                value,
                NaN
            );

        return Number.isFinite(numeric)
            ? Math.round(
                  numeric
              ).toLocaleString(
                  "en-IN"
              )
            : "—";
    }

    /* ---------------------------------------------------------
       Confusion Matrix
       --------------------------------------------------------- */

    function renderConfusionMatrix() {
        const container =
            document.querySelector(
                "[data-confusion-matrix]"
            );

        if (!container) {
            return;
        }

        const matrix =
            normalizeConfusionMatrix(
                state.researchData?.confusion_matrix
            );

        if (!matrix.length) {
            container.innerHTML = `
                <div class="matrix-unavailable">
                    Confusion matrix will appear after a completed
                    evaluation run.
                </div>
            `;

            return;
        }

        const labels = [
            "Low",
            "Medium",
            "High"
        ];

        const max =
            Math.max(
                ...matrix.flat()
                    .map(
                        (value) =>
                            number(
                                value,
                                0
                            )
                    ),
                1
            );

        container.innerHTML = `
            <div class="confusion-matrix-grid">
                <div class="matrix-corner">
                    <span>Actual ↓</span>
                    <span>Predicted →</span>
                </div>

                ${labels
                    .map(
                        (label) => `
                            <div class="matrix-header">
                                ${escapeHTML(
                                    label
                                )}
                            </div>
                        `
                    )
                    .join("")}

                ${matrix
                    .map(
                        (row, rowIndex) => `
                            <div class="matrix-header">
                                ${escapeHTML(
                                    labels[rowIndex] ||
                                    `Class ${rowIndex}`
                                )}
                            </div>

                            ${row
                                .slice(0, 3)
                                .map(
                                    (value) => {
                                        const numeric =
                                            number(
                                                value,
                                                0
                                            );

                                        const intensity =
                                            clamp(
                                                (
                                                    numeric /
                                                    max
                                                ) * 100
                                            );

                                        return `
                                            <div
                                                class="matrix-cell"
                                                style="--matrix-intensity:${intensity}%"
                                            >
                                                ${escapeHTML(
                                                    String(
                                                        numeric
                                                    )
                                                )}
                                            </div>
                                        `;
                                    }
                                )
                                .join("")}
                        `
                    )
                    .join("")}
            </div>
        `;
    }

    function normalizeConfusionMatrix(
        input
    ) {
        if (
            !Array.isArray(input)
        ) {
            return [];
        }

        return input
            .filter(
                (row) =>
                    Array.isArray(row)
            )
            .map(
                (row) =>
                    row.map(
                        (value) =>
                            number(
                                value,
                                0
                            )
                    )
            )
            .filter(
                (row) =>
                    row.length > 0
            );
    }

    /* ---------------------------------------------------------
       Global SHAP Importance
       --------------------------------------------------------- */

    function renderFeatureImportance() {
        const container =
            document.querySelector(
                "[data-global-feature-importance]"
            ) ||
            document.querySelector(
                "[data-feature-importance]"
            );

        if (!container) {
            return;
        }

        const importance =
            normalizeFeatureImportance(
                state.researchData?.feature_importance
            );

        if (!importance.length) {
            container.innerHTML = `
                <div class="importance-unavailable">
                    Global SHAP importance is unavailable until a
                    completed model evaluation is loaded.
                </div>
            `;

            return;
        }

        const top =
            importance
                .slice()
                .sort(
                    (a, b) =>
                        b.importance -
                        a.importance
                )
                .slice(0, 15);

        const max =
            Math.max(
                ...top.map(
                    (item) =>
                        item.importance
                ),
                1
            );

        container.innerHTML =
            top.map(
                (item, index) => {
                    const width =
                        (
                            item.importance /
                            max
                        ) * 100;

                    return `
                        <div class="importance-row">
                            <div class="importance-rank">
                                ${index + 1}
                            </div>

                            <div class="importance-main">
                                <div class="importance-label">
                                    ${escapeHTML(
                                        item.feature
                                    )}
                                </div>

                                <div class="importance-bar">
                                    <span
                                        class="importance-bar-fill"
                                        style="width:${clamp(
                                            width
                                        )}%"
                                    ></span>
                                </div>
                            </div>

                            <div class="importance-value">
                                ${item.importance.toFixed(
                                    4
                                )}
                            </div>
                        </div>
                    `;
                }
            ).join("");
    }

    function normalizeFeatureImportance(
        input
    ) {
        if (
            !Array.isArray(input)
        ) {
            if (
                input &&
                typeof input === "object"
            ) {
                return Object.entries(
                    input
                ).map(
                    ([feature, importance]) => ({
                        feature,
                        importance:
                            number(
                                importance,
                                0
                            )
                    })
                );
            }

            return [];
        }

        return input
            .map(
                (item) => ({
                    feature:
                        item.feature ||
                        item.feature_name ||
                        item.name ||
                        "Unknown",

                    importance:
                        number(
                            item.importance ??
                            item.mean_abs_shap ??
                            item.value,
                            0
                        )
                })
            )
            .filter(
                (item) =>
                    item.feature !== "Unknown"
            );
    }

    /* ---------------------------------------------------------
       Calibration
       --------------------------------------------------------- */

    function renderCalibration() {
        const calibration =
            state.researchData?.calibration ||
            {};

        setText(
            "[data-calibration-method]",
            calibration.method ||
                calibration.calibration_method ||
                "Not evaluated"
        );

        setText(
            "[data-brier-score]",
            formatResearchNumber(
                calibration.brier_score
            )
        );

        setText(
            "[data-log-loss]",
            formatResearchNumber(
                calibration.log_loss
            )
        );

        setText(
            "[data-calibration-entropy]",
            formatResearchNumber(
                calibration.mean_entropy
            )
        );

        const plot =
            document.querySelector(
                "[data-calibration-plot]"
            );

        if (!plot) {
            return;
        }

        const values =
            calibration.curve ||
            calibration.calibration_curve ||
            calibration.points ||
            [];

        if (!Array.isArray(values) || !values.length) {
            plot.innerHTML = `
                <div class="calibration-unavailable">
                    Calibration curve unavailable.
                </div>
            `;

            return;
        }

        renderCalibrationPlot(
            plot,
            values
        );
    }

    function formatResearchNumber(
        value
    ) {
        const numeric =
            number(
                value,
                NaN
            );

        return Number.isFinite(numeric)
            ? numeric.toFixed(4)
            : "—";
    }

    function renderCalibrationPlot(
        container,
        values
    ) {
        const points =
            values
                .map(
                    (point) => {
                        const predicted =
                            number(
                                point.predicted ??
                                point.mean_predicted ??
                                point.x,
                                NaN
                            );

                        const actual =
                            number(
                                point.actual ??
                                point.fraction_positive ??
                                point.y,
                                NaN
                            );

                        if (
                            !Number.isFinite(
                                predicted
                            ) ||
                            !Number.isFinite(
                                actual
                            )
                        ) {
                            return null;
                        }

                        return {
                            x:
                                clamp(
                                    predicted * 100
                                ),
                            y:
                                clamp(
                                    actual * 100
                                )
                        };
                    }
                )
                .filter(Boolean);

        if (!points.length) {
            container.innerHTML = `
                <div class="calibration-unavailable">
                    Calibration curve data is unavailable.
                </div>
            `;

            return;
        }

        const width = 600;
        const height = 300;
        const padding = 42;

        const mapX = (value) =>
            padding +
            (
                value /
                100
            ) *
            (
                width -
                padding * 2
            );

        const mapY = (value) =>
            height -
            padding -
            (
                value /
                100
            ) *
            (
                height -
                padding * 2
            );

        const linePoints =
            points
                .map(
                    (point) =>
                        `${mapX(point.x)},${mapY(
                            point.y
                        )}`
                )
                .join(" ");

        const diagonalStart =
            `${mapX(0)},${mapY(0)}`;

        const diagonalEnd =
            `${mapX(100)},${mapY(100)}`;

        container.innerHTML = `
            <div class="calibration-chart-wrap">
                <svg
                    viewBox="0 0 ${width} ${height}"
                    class="calibration-chart"
                    role="img"
                    aria-label="Model calibration curve"
                >
                    <line
                        x1="${mapX(0)}"
                        y1="${mapY(0)}"
                        x2="${mapX(100)}"
                        y2="${mapY(100)}"
                        class="calibration-reference"
                    />

                    <polyline
                        points="${linePoints}"
                        class="calibration-line"
                        fill="none"
                    />

                    ${points
                        .map(
                            (point) => `
                                <circle
                                    cx="${mapX(
                                        point.x
                                    )}"
                                    cy="${mapY(
                                        point.y
                                    )}"
                                    r="4"
                                    class="calibration-point"
                                />
                            `
                        )
                        .join("")}

                    <text
                        x="${width / 2}"
                        y="${height - 8}"
                        text-anchor="middle"
                        class="calibration-axis-label"
                    >
                        Mean predicted probability
                    </text>

                    <text
                        x="14"
                        y="${height / 2}"
                        text-anchor="middle"
                        transform="rotate(-90 14 ${height / 2})"
                        class="calibration-axis-label"
                    >
                        Observed frequency
                    </text>
                </svg>
            </div>
        `;
    }

    /* ---------------------------------------------------------
       Ablation Study
       --------------------------------------------------------- */

    function renderAblations() {
        const table =
            document.querySelector(
                "[data-ablation-results]"
            );

        if (!table) {
            return;
        }

        const ablations =
            Array.isArray(
                state.researchData?.ablations
            )
                ? state.researchData.ablations
                : [];

        if (!ablations.length) {
            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        Ablation results are pending.
                    </td>
                </tr>
            `;

            return;
        }

        table.innerHTML =
            ablations.map(
                (row) => `
                    <tr>
                        <td>
                            ${escapeHTML(
                                row.name ||
                                row.group ||
                                row.feature_group ||
                                "Experiment"
                            )}
                        </td>

                        <td>
                            ${formatMetricCell(
                                row.accuracy
                            )}
                        </td>

                        <td>
                            ${formatMetricCell(
                                row.macro_f1 ??
                                row.f1
                            )}
                        </td>

                        <td>
                            ${formatMetricCell(
                                row.brier_score,
                                false
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                String(
                                    row.notes ||
                                    "—"
                                )
                            )}
                        </td>
                    </tr>
                `
            ).join("");
    }

    /* ---------------------------------------------------------
       Provenance
       --------------------------------------------------------- */

    function renderProvenance() {
        const provenance =
            state.researchData?.provenance ||
            {};

        const values = {
            dataset_version:
                provenance.dataset_version ||
                provenance.dataset ||
                "Not specified",

            model_version:
                provenance.model_version ||
                provenance.model ||
                "Not specified",

            random_seed:
                provenance.random_seed ??
                provenance.seed ??
                "Not specified",

            test_size:
                provenance.test_size !== undefined
                    ? percentage(
                          provenance.test_size
                      )
                    : "Not specified",

            evaluation_date:
                provenance.evaluation_date ||
                provenance.date ||
                "Not specified"
        };

        Object.entries(
            values
        ).forEach(
            ([key, value]) => {
                setText(
                    `[data-provenance="${key}"]`,
                    value
                );
            }
        );
    }

    /* ---------------------------------------------------------
       Reproducibility
       --------------------------------------------------------- */

    function renderReproducibility() {
        const container =
            document.querySelector(
                "[data-reproducibility]"
            );

        const reproducibility =
            state.researchData?.reproducibility ||
            {};

        if (container) {
            const checks = [
                [
                    "Dataset version",
                    reproducibility.dataset_version ||
                        reproducibility.dataset ||
                        false
                ],
                [
                    "Random seed",
                    reproducibility.random_seed ??
                        reproducibility.seed ??
                        false
                ],
                [
                    "Environment recorded",
                    reproducibility.environment ||
                        reproducibility.environment_recorded ||
                        false
                ],
                [
                    "Model artifact versioned",
                    reproducibility.model_version ||
                        reproducibility.model_artifact ||
                        false
                ],
                [
                    "Evaluation protocol recorded",
                    reproducibility.protocol ||
                        reproducibility.evaluation_protocol ||
                        false
                ]
            ];

            container.innerHTML =
                checks
                    .map(
                        ([label, value]) => {
                            const complete =
                                Boolean(
                                    value
                                );

                            return `
                                <div class="reproducibility-check ${
                                    complete
                                        ? "complete"
                                        : "pending"
                                }">
                                    <span class="check-icon">
                                        ${
                                            complete
                                                ? "✓"
                                                : "—"
                                        }
                                    </span>

                                    <span>
                                        ${escapeHTML(
                                            label
                                        )}
                                    </span>

                                    <strong>
                                        ${
                                            complete
                                                ? "Recorded"
                                                : "Pending"
                                        }
                                    </strong>
                                </div>
                            `;
                        }
                    )
                    .join("");
        }
    }

    /* ---------------------------------------------------------
       Journal Protocol
       --------------------------------------------------------- */

    function renderJournalProtocol() {
        const journal =
            state.researchData?.journal ||
            {};

        const values = {
            provider:
                journal.provider ||
                "GROQ",

            model:
                journal.model ||
                journal.model_version ||
                "Configured model",

            prompt_version:
                journal.prompt_version ||
                "Documented in methodology",

            fallback:
                journal.fallback ||
                "Deterministic fallback",

            causality:
                journal.causality ||
                "Not permitted"
        };

        Object.entries(
            values
        ).forEach(
            ([key, value]) => {
                setText(
                    `[data-journal-protocol="${key}"]`,
                    value
                );
            }
        );
    }

    /* ---------------------------------------------------------
       Claim Boundaries
       --------------------------------------------------------- */

    function renderClaimBoundaries() {
        const container =
            document.querySelector(
                "[data-claim-boundaries]"
            );

        if (!container) {
            return;
        }

        const claims =
            state.researchData?.claims ||
            {};

        const allowed =
            claims.supported ||
            claims.allowed ||
            [
                "Association-based model analysis",
                "Predictive performance evaluation",
                "Feature-level SHAP explanations",
                "Scenario simulation",
                "Qualitative journal analysis"
            ];

        const notSupported =
            claims.not_supported ||
            claims.unsupported ||
            [
                "Clinical diagnosis",
                "Causal inference",
                "Individual medical decisions",
                "Population-level causal conclusions"
            ];

        container.innerHTML = `
            <div class="claim-column">
                <h4>
                    Supported research claims
                </h4>

                <ul>
                    ${
                        Array.isArray(
                            allowed
                        )
                            ? allowed
                                  .map(
                                      (item) =>
                                          `<li>${escapeHTML(
                                              String(
                                                  item
                                              )
                                          )}</li>`
                                  )
                                  .join("")
                            : `<li>${escapeHTML(
                                  String(
                                      allowed
                                  )
                              )}</li>`
                    }
                </ul>
            </div>

            <div class="claim-column restricted">
                <h4>
                    Claims outside scope
                </h4>

                <ul>
                    ${
                        Array.isArray(
                            notSupported
                        )
                            ? notSupported
                                  .map(
                                      (item) =>
                                          `<li>${escapeHTML(
                                              String(
                                                  item
                                              )
                                          )}</li>`
                                  )
                                  .join("")
                            : `<li>${escapeHTML(
                                  String(
                                      notSupported
                                  )
                              )}</li>`
                    }
                </ul>
            </div>
        `;
    }

    /* ---------------------------------------------------------
       Helpers
       --------------------------------------------------------- */

    function setText(
        selector,
        value
    ) {
        $$(selector).forEach(
            (element) => {
                element.textContent =
                    String(
                        value ??
                        "—"
                    );
            }
        );
    }

    /* ---------------------------------------------------------
       Refresh / Navigation
       --------------------------------------------------------- */

    function initializeRefresh() {
        const buttons = $$(
            "[data-refresh-research], #refresh-research"
        );

        buttons.forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        await initializeResearch(
                            true
                        );
                    }
                );
            }
        );
    }

    function initializeSimulationLinks() {
        $$(
            "[data-open-simulation]"
        ).forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        window.location.href =
                            "/simulation";
                    }
                );
            }
        );
    }

    /* ---------------------------------------------------------
       Dashboard Status
       --------------------------------------------------------- */

    function renderDashboardStatus() {
        const statusElements = $$(
            "[data-research-status]"
        );

        if (!statusElements.length) {
            return;
        }

        statusElements.forEach(
            (element) => {
                element.classList.remove(
                    "status-success",
                    "status-warning",
                    "status-error"
                );

                if (state.loaded) {
                    element.textContent =
                        "Evaluation data loaded";

                    element.classList.add(
                        "status-success"
                    );
                } else {
                    element.textContent =
                        "Evaluation artifacts pending";

                    element.classList.add(
                        "status-warning"
                    );
                }
            }
        );
    }

    /* ---------------------------------------------------------
       Initialization
       --------------------------------------------------------- */

    async function initializeResearch(
        refresh = false
    ) {
        if (
            state.loaded &&
            !refresh
        ) {
            return;
        }

        showLoading(
            "Loading research evaluation data…"
        );

        try {
            await loadResearchData();

            renderOverview();
            renderClassMetrics();
            renderConfusionMatrix();
            renderFeatureImportance();
            renderCalibration();
            renderAblations();
            renderProvenance();
            renderReproducibility();
            renderJournalProtocol();
            renderClaimBoundaries();
            renderDashboardStatus();

            if (state.loaded) {
                showToast(
                    "Research dashboard updated.",
                    "success"
                );
            } else {
                showToast(
                    "Evaluation artifacts are not available yet. Showing research placeholders.",
                    "warning"
                );
            }
        } catch (error) {
            console.error(
                "Research dashboard initialization failed:",
                error
            );

            showToast(
                "Unable to load research data.",
                "error"
            );
        } finally {
            hideLoading();
        }
    }

    function initialize() {
        initializeRefresh();
        initializeSimulationLinks();
        initializeResearch();
    }

    if (
        document.readyState ===
        "loading"
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

    window.StressIntelResearch = {
        state,
        loadResearchData,
        initializeResearch,
        renderOverview,
        renderClassMetrics,
        renderConfusionMatrix,
        renderFeatureImportance,
        renderCalibration,
        renderAblations,
        renderProvenance,
        renderReproducibility,
        renderJournalProtocol,
        renderClaimBoundaries
    };
})();