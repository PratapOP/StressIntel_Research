/* ============================================================
   StressIntel PRO
   Global Application JavaScript
   ============================================================ */

(function () {
    "use strict";

    const APP = {
        name: "StressIntel PRO",
        version: "1.0.0",
        storageKey: "stressintel_session",
        resultKey: "stressintel_result",
        assessmentKey: "stressintel_assessment"
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

    function exists(selector, scope = document) {
        return Boolean($(selector, scope));
    }

    function escapeHTML(value) {
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

    /* ---------------------------------------------------------
       Storage
       --------------------------------------------------------- */

    const Storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn("Storage write failed:", error);
                return false;
            }
        },

        get(key, fallback = null) {
            try {
                const raw = localStorage.getItem(key);

                if (!raw) {
                    return fallback;
                }

                return JSON.parse(raw);
            } catch (error) {
                console.warn("Storage read failed:", error);
                return fallback;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn("Storage removal failed:", error);
            }
        },

        clearSession() {
            this.remove(APP.resultKey);
            this.remove(APP.assessmentKey);
            this.remove(APP.storageKey);
        }
    };

    /* ---------------------------------------------------------
       API Client
       --------------------------------------------------------- */

    const API = {
        baseURL: "/api",

        async request(endpoint, options = {}) {
            const config = {
                method: "GET",
                headers: {
                    Accept: "application/json"
                },
                ...options
            };

            if (config.body && typeof config.body === "object") {
                config.headers["Content-Type"] = "application/json";
                config.body = JSON.stringify(config.body);
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);

            config.signal = controller.signal;

            try {
                const response = await fetch(
                    `${this.baseURL}${endpoint}`,
                    config
                );

                const contentType =
                    response.headers.get("content-type") || "";

                let payload;

                if (contentType.includes("application/json")) {
                    payload = await response.json();
                } else {
                    payload = await response.text();
                }

                if (!response.ok) {
                    const message =
                        typeof payload === "object"
                            ? payload.error ||
                              payload.message ||
                              "Request failed."
                            : "Request failed.";

                    const error = new Error(message);
                    error.status = response.status;
                    error.payload = payload;

                    throw error;
                }

                return payload;
            } catch (error) {
                if (error.name === "AbortError") {
                    throw new Error(
                        "The request timed out. Please try again."
                    );
                }

                throw error;
            } finally {
                clearTimeout(timeout);
            }
        },

        get(endpoint) {
            return this.request(endpoint);
        },

        post(endpoint, body) {
            return this.request(endpoint, {
                method: "POST",
                body
            });
        }
    };

    /* ---------------------------------------------------------
       Toast Notifications
       --------------------------------------------------------- */

    function getToastContainer() {
        let container = $("#toast-container");

        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.className = "toast-container";
            container.setAttribute("aria-live", "polite");
            container.setAttribute("aria-atomic", "true");

            document.body.appendChild(container);
        }

        return container;
    }

    function showToast(message, type = "info", duration = 4000) {
        if (!message) {
            return;
        }

        const container = getToastContainer();
        const toast = document.createElement("div");

        const allowedTypes = [
            "info",
            "success",
            "warning",
            "error"
        ];

        const safeType = allowedTypes.includes(type)
            ? type
            : "info";

        toast.className = `toast toast-${safeType}`;
        toast.setAttribute("role", safeType === "error" ? "alert" : "status");

        toast.innerHTML = `
            <div class="toast-icon" aria-hidden="true">
                ${getToastIcon(safeType)}
            </div>
            <div class="toast-content">
                <div class="toast-message">${escapeHTML(message)}</div>
            </div>
            <button
                type="button"
                class="toast-close"
                aria-label="Close notification"
            >&times;</button>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("is-visible");
        });

        const close = () => {
            toast.classList.remove("is-visible");

            setTimeout(() => {
                toast.remove();
            }, 250);
        };

        const closeButton = $(".toast-close", toast);

        if (closeButton) {
            closeButton.addEventListener("click", close);
        }

        if (duration > 0) {
            setTimeout(close, duration);
        }
    }

    function getToastIcon(type) {
        const icons = {
            success: "✓",
            error: "!",
            warning: "!",
            info: "i"
        };

        return icons[type] || icons.info;
    }

    window.showToast = showToast;

    /* ---------------------------------------------------------
       Loading State
       --------------------------------------------------------- */

    function showLoading(message = "Processing request…") {
        let overlay = $("#global-loading");

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "global-loading";
            overlay.className = "loading-overlay";
            overlay.setAttribute("role", "status");
            overlay.setAttribute("aria-live", "polite");

            overlay.innerHTML = `
                <div class="loading-card">
                    <div class="loading-spinner"></div>
                    <div class="loading-title">
                        StressIntel PRO
                    </div>
                    <div class="loading-message"></div>
                </div>
            `;

            document.body.appendChild(overlay);
        }

        const messageElement = $(".loading-message", overlay);

        if (messageElement) {
            messageElement.textContent = message;
        }

        overlay.classList.add("is-active");
        document.body.classList.add("is-loading");
    }

    function hideLoading() {
        const overlay = $("#global-loading");

        if (overlay) {
            overlay.classList.remove("is-active");
        }

        document.body.classList.remove("is-loading");
    }

    window.showLoading = showLoading;
    window.hideLoading = hideLoading;

    /* ---------------------------------------------------------
       Navigation
       --------------------------------------------------------- */

    function initializeNavigation() {
        const currentPath = window.location.pathname;

        $$(".nav-link, .sidebar-link").forEach((link) => {
            const href = link.getAttribute("href");

            if (!href || href.startsWith("#")) {
                return;
            }

            let linkPath;

            try {
                linkPath = new URL(
                    href,
                    window.location.origin
                ).pathname;
            } catch (error) {
                return;
            }

            if (
                linkPath === currentPath ||
                (
                    currentPath !== "/" &&
                    linkPath !== "/" &&
                    currentPath.startsWith(linkPath)
                )
            ) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            }
        });

        initializeSmoothScrolling();
        initializeMobileNavigation();
    }

    function initializeSmoothScrolling() {
        $$('a[href^="#"]').forEach((link) => {
            link.addEventListener("click", (event) => {
                const targetID = link.getAttribute("href");

                if (!targetID || targetID === "#") {
                    return;
                }

                const target = $(targetID);

                if (!target) {
                    return;
                }

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                history.replaceState(
                    null,
                    "",
                    targetID
                );
            });
        });
    }

    function initializeMobileNavigation() {
        const toggle =
            $(".mobile-nav-toggle") ||
            $("[data-mobile-nav-toggle]");

        const navigation =
            $(".mobile-nav") ||
            $("[data-mobile-nav]");

        if (!toggle || !navigation) {
            return;
        }

        toggle.addEventListener("click", () => {
            const isOpen =
                navigation.classList.toggle("is-open");

            toggle.classList.toggle("is-active", isOpen);
            toggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        $$(".nav-link, .sidebar-link", navigation).forEach(
            (link) => {
                link.addEventListener("click", () => {
                    navigation.classList.remove("is-open");
                    toggle.classList.remove("is-active");
                    toggle.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                });
            }
        );
    }

    /* ---------------------------------------------------------
       Scroll Reveal
       --------------------------------------------------------- */

    function initializeRevealAnimations() {
        const elements = $$(
            "[data-reveal], .reveal, .fade-up"
        );

        if (!elements.length) {
            return;
        }

        if (
            !("IntersectionObserver" in window) ||
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            elements.forEach((element) => {
                element.classList.add("is-visible");
            });

            return;
        }

        const observer = new IntersectionObserver(
            (entries, instance) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("is-visible");
                    instance.unobserve(entry.target);
                });
            },
            {
                threshold: 0.08,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        elements.forEach((element) => {
            observer.observe(element);
        });
    }

    /* ---------------------------------------------------------
       Number Formatting
       --------------------------------------------------------- */

    function formatNumber(value, decimals = 1) {
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue)) {
            return "—";
        }

        return numericValue.toLocaleString("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function formatPercentage(value, decimals = 1) {
        let numericValue = Number(value);

        if (!Number.isFinite(numericValue)) {
            return "—";
        }

        if (numericValue >= 0 && numericValue <= 1) {
            numericValue *= 100;
        }

        return `${formatNumber(numericValue, decimals)}%`;
    }

    function clamp(value, min, max) {
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue)) {
            return min;
        }

        return Math.min(
            Math.max(numericValue, min),
            max
        );
    }

    window.StressIntelUtils = {
        $,
        $$,
        exists,
        escapeHTML,
        formatNumber,
        formatPercentage,
        clamp
    };

    /* ---------------------------------------------------------
       Risk Utilities
       --------------------------------------------------------- */

    function normalizeRiskLevel(value) {
        if (!value) {
            return "unknown";
        }

        const normalized = String(value)
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

    function getRiskLabel(value) {
        const level = normalizeRiskLevel(value);

        const labels = {
            low: "Low",
            medium: "Medium",
            high: "High",
            unknown: "Unknown"
        };

        return labels[level];
    }

    function getRiskClass(value) {
        const level = normalizeRiskLevel(value);

        return `risk-${level}`;
    }

    function getRiskDescription(value) {
        const level = normalizeRiskLevel(value);

        const descriptions = {
            low:
                "The model estimates a lower relative stress-risk pattern across the submitted signals.",
            medium:
                "The model estimates an intermediate stress-risk pattern across the submitted signals.",
            high:
                "The model estimates a higher relative stress-risk pattern across the submitted signals.",
            unknown:
                "A stress-risk interpretation is not currently available."
        };

        return descriptions[level];
    }

    window.StressIntelRisk = {
        normalizeRiskLevel,
        getRiskLabel,
        getRiskClass,
        getRiskDescription
    };

    /* ---------------------------------------------------------
       Form Utilities
       --------------------------------------------------------- */

    function serializeForm(form) {
        const data = {};

        if (!form) {
            return data;
        }

        const fields = $$(
            "input, select, textarea",
            form
        );

        fields.forEach((field) => {
            if (!field.name || field.disabled) {
                return;
            }

            if (
                field.type === "checkbox"
            ) {
                data[field.name] = field.checked;
                return;
            }

            if (
                field.type === "radio"
            ) {
                if (field.checked) {
                    data[field.name] = field.value;
                }

                return;
            }

            const value = field.value;

            if (value === "") {
                data[field.name] = "";
                return;
            }

            if (
                field.type === "number" ||
                field.dataset.type === "number"
            ) {
                const numericValue = Number(value);

                data[field.name] =
                    Number.isFinite(numericValue)
                        ? numericValue
                        : value;

                return;
            }

            data[field.name] = value;
        });

        return data;
    }

    function populateForm(form, data) {
        if (!form || !data || typeof data !== "object") {
            return;
        }

        $$(
            "input, select, textarea",
            form
        ).forEach((field) => {
            if (!field.name || !(field.name in data)) {
                return;
            }

            const value = data[field.name];

            if (field.type === "checkbox") {
                field.checked = Boolean(value);
                return;
            }

            if (field.type === "radio") {
                field.checked =
                    String(field.value) === String(value);
                return;
            }

            field.value =
                value === null || value === undefined
                    ? ""
                    : value;
        });
    }

    function validateForm(form) {
        if (!form) {
            return false;
        }

        let valid = true;

        const fields = $$(
            "input, select, textarea",
            form
        );

        fields.forEach((field) => {
            if (
                field.disabled ||
                field.type === "hidden"
            ) {
                return;
            }

            field.classList.remove("field-invalid");

            if (
                !field.checkValidity()
            ) {
                valid = false;
                field.classList.add("field-invalid");
            }
        });

        if (!valid) {
            const firstInvalid = $(
                ".field-invalid",
                form
            );

            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

            showToast(
                "Please review the highlighted fields.",
                "warning"
            );
        }

        return valid;
    }

    window.StressIntelForms = {
        serializeForm,
        populateForm,
        validateForm
    };

    /* ---------------------------------------------------------
       Session Management
       --------------------------------------------------------- */

    function createSessionID() {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }

        return `session-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;
    }

    function getSession() {
        let session = Storage.get(APP.storageKey);

        if (!session || typeof session !== "object") {
            session = {
                session_id: createSessionID(),
                created_at: new Date().toISOString()
            };

            Storage.set(APP.storageKey, session);
        }

        return session;
    }

    function getSessionID() {
        return getSession().session_id;
    }

    function saveAssessment(data) {
        return Storage.set(
            APP.assessmentKey,
            {
                ...data,
                saved_at: new Date().toISOString()
            }
        );
    }

    function getAssessment() {
        return Storage.get(APP.assessmentKey, null);
    }

    function saveResult(result) {
        return Storage.set(
            APP.resultKey,
            {
                ...result,
                saved_at: new Date().toISOString()
            }
        );
    }

    function getResult() {
        return Storage.get(APP.resultKey, null);
    }

    window.StressIntelSession = {
        getSession,
        getSessionID,
        saveAssessment,
        getAssessment,
        saveResult,
        getResult,
        clear: () => Storage.clearSession()
    };

    /* ---------------------------------------------------------
       Accessibility
       --------------------------------------------------------- */

    function initializeAccessibility() {
        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key !== "Escape") {
                    return;
                }

                const dialogs = $$(
                    '[role="dialog"].is-open, .modal.is-open'
                );

                dialogs.forEach((dialog) => {
                    dialog.classList.remove("is-open");
                });

                const mobileNav =
                    $(".mobile-nav.is-open");

                if (mobileNav) {
                    mobileNav.classList.remove("is-open");

                    const toggle =
                        $(".mobile-nav-toggle");

                    if (toggle) {
                        toggle.classList.remove("is-active");
                        toggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                }
            }
        );

        document.addEventListener(
            "invalid",
            (event) => {
                const field = event.target;

                if (
                    field &&
                    field.classList
                ) {
                    field.classList.add(
                        "field-invalid"
                    );
                }
            },
            true
        );

        document.addEventListener(
            "input",
            (event) => {
                const field = event.target;

                if (
                    field &&
                    field.classList &&
                    field.classList.contains(
                        "field-invalid"
                    )
                ) {
                    field.classList.remove(
                        "field-invalid"
                    );
                }
            }
        );
    }

    /* ---------------------------------------------------------
       External Navigation Safety
       --------------------------------------------------------- */

    function initializeExternalLinks() {
        $$("a[target='_blank']").forEach((link) => {
            const rel =
                link.getAttribute("rel") || "";

            if (!rel.includes("noopener")) {
                link.setAttribute(
                    "rel",
                    `${rel} noopener noreferrer`.trim()
                );
            }
        });
    }

    /* ---------------------------------------------------------
       Health Check
       --------------------------------------------------------- */

    async function checkSystemHealth() {
        const statusElements = $$(
            "[data-system-status]"
        );

        if (!statusElements.length) {
            return null;
        }

        try {
            const response =
                await API.get("/health/");

            statusElements.forEach((element) => {
                element.textContent = "Operational";
                element.classList.remove(
                    "status-warning",
                    "status-error"
                );
                element.classList.add(
                    "status-success"
                );
            });

            return response;
        } catch (error) {
            statusElements.forEach((element) => {
                element.textContent = "Limited";
                element.classList.remove(
                    "status-success"
                );
                element.classList.add(
                    "status-warning"
                );
            });

            return null;
        }
    }

    /* ---------------------------------------------------------
       Dynamic Copyright
       --------------------------------------------------------- */

    function initializeCopyright() {
        const elements = $$(
            "[data-current-year]"
        );

        const year = new Date().getFullYear();

        elements.forEach((element) => {
            element.textContent = year;
        });
    }

    /* ---------------------------------------------------------
       Data Export Utility
       --------------------------------------------------------- */

    function downloadJSON(data, filename = "stressintel-report.json") {
        if (!data) {
            showToast(
                "No report data is available.",
                "warning"
            );

            return;
        }

        try {
            const blob = new Blob(
                [
                    JSON.stringify(
                        data,
                        null,
                        2
                    )
                ],
                {
                    type: "application/json"
                }
            );

            const url =
                URL.createObjectURL(blob);

            const anchor =
                document.createElement("a");

            anchor.href = url;
            anchor.download = filename;
            anchor.style.display = "none";

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            showToast(
                "Research data exported successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "JSON export failed:",
                error
            );

            showToast(
                "Unable to export the data.",
                "error"
            );
        }
    }

    function downloadText(
        content,
        filename = "stressintel-report.txt"
    ) {
        if (!content) {
            return;
        }

        try {
            const blob = new Blob(
                [content],
                {
                    type: "text/plain;charset=utf-8"
                }
            );

            const url =
                URL.createObjectURL(blob);

            const anchor =
                document.createElement("a");

            anchor.href = url;
            anchor.download = filename;

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
        } catch (error) {
            console.error(
                "Text export failed:",
                error
            );
        }
    }

    window.StressIntelExport = {
        downloadJSON,
        downloadText
    };

    /* ---------------------------------------------------------
       Print
       --------------------------------------------------------- */

    function printPage() {
        window.print();
    }

    window.printStressIntelReport = printPage;

    /* ---------------------------------------------------------
       Global Error Handling
       --------------------------------------------------------- */

    window.addEventListener(
        "error",
        (event) => {
            if (!event.error) {
                return;
            }

            console.error(
                "StressIntel PRO error:",
                event.error
            );
        }
    );

    window.addEventListener(
        "unhandledrejection",
        (event) => {
            console.error(
                "Unhandled StressIntel PRO rejection:",
                event.reason
            );
        }
    );

    /* ---------------------------------------------------------
       Page Initialization
       --------------------------------------------------------- */

    function initializeApp() {
        document.documentElement.dataset.app =
            APP.name;

        document.documentElement.dataset.version =
            APP.version;

        initializeNavigation();
        initializeRevealAnimations();
        initializeAccessibility();
        initializeExternalLinks();
        initializeCopyright();

        getSession();

        checkSystemHealth();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeApp,
            {
                once: true
            }
        );
    } else {
        initializeApp();
    }

    /* ---------------------------------------------------------
       Public Application Object
       --------------------------------------------------------- */

    window.StressIntel = {
        APP,
        API,
        Storage,
        showToast,
        showLoading,
        hideLoading,
        getSessionID,
        saveAssessment,
        getAssessment,
        saveResult,
        getResult,
        formatNumber,
        formatPercentage,
        normalizeRiskLevel,
        getRiskLabel,
        getRiskClass,
        getRiskDescription,
        escapeHTML
    };
})();