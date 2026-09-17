/* ============================================================
   StressIntel PRO
   Research Charts & Data Visualization
   ============================================================ */

(function () {
    "use strict";

    const charts = new Map();

    /* ---------------------------------------------------------
       Utilities
       --------------------------------------------------------- */

    function $(selector, scope = document) {
        return scope.querySelector(selector);
    }

    function $$(selector, scope = document) {
        return Array.from(
            scope.querySelectorAll(selector)
        );
    }

    function number(value, fallback = 0) {
        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : fallback;
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

    function escapeHTML(value) {
        if (
            window.StressIntelUtils &&
            typeof window.StressIntelUtils.escapeHTML === "function"
        ) {
            return window.StressIntelUtils.escapeHTML(
                value
            );
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function resolveContainer(target) {
        if (!target) {
            return null;
        }

        if (
            typeof target === "string"
        ) {
            return document.querySelector(
                target
            );
        }

        return target instanceof Element
            ? target
            : null;
    }

    function getDimensions(
        container,
        fallbackWidth = 720,
        fallbackHeight = 360
    ) {
        const rect =
            container.getBoundingClientRect();

        return {
            width:
                Math.max(
                    rect.width ||
                        fallbackWidth,
                    280
                ),

            height:
                Math.max(
                    rect.height ||
                        fallbackHeight,
                    240
                )
        };
    }

    function createSVGElement(
        tag,
        attributes = {}
    ) {
        const element =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                tag
            );

        Object.entries(
            attributes
        ).forEach(
            ([key, value]) => {
                element.setAttribute(
                    key,
                    String(value)
                );
            }
        );

        return element;
    }

    function clearContainer(
        container
    ) {
        while (
            container.firstChild
        ) {
            container.removeChild(
                container.firstChild
            );
        }
    }

    function registerChart(
        id,
        cleanup
    ) {
        if (
            charts.has(id)
        ) {
            try {
                charts.get(id)();
            } catch (error) {
                console.warn(
                    "Chart cleanup failed:",
                    error
                );
            }
        }

        charts.set(
            id,
            cleanup
        );
    }

    /* ---------------------------------------------------------
       Chart Theme
       --------------------------------------------------------- */

    function getCSSVariable(
        name,
        fallback
    ) {
        const value =
            getComputedStyle(
                document.documentElement
            )
                .getPropertyValue(name)
                .trim();

        return value || fallback;
    }

    function getTheme() {
        return {
            text:
                getCSSVariable(
                    "--text-primary",
                    "#f5f7fb"
                ),

            muted:
                getCSSVariable(
                    "--text-muted",
                    "#8d96a8"
                ),

            border:
                getCSSVariable(
                    "--border-color",
                    "rgba(255,255,255,0.12)"
                ),

            surface:
                getCSSVariable(
                    "--surface",
                    "rgba(255,255,255,0.04)"
                ),

            primary:
                getCSSVariable(
                    "--primary",
                    "#8b5cf6"
                ),

            secondary:
                getCSSVariable(
                    "--secondary",
                    "#ec4899"
                ),

            success:
                getCSSVariable(
                    "--success",
                    "#22c55e"
                ),

            warning:
                getCSSVariable(
                    "--warning",
                    "#f59e0b"
                ),

            danger:
                getCSSVariable(
                    "--danger",
                    "#ef4444"
                )
        };
    }

    /* ---------------------------------------------------------
       Base SVG
       --------------------------------------------------------- */

    function createChartSVG(
        container,
        width,
        height
    ) {
        const svg =
            createSVGElement(
                "svg",
                {
                    viewBox:
                        `0 0 ${width} ${height}`,
                    width: "100%",
                    height: "100%",
                    role: "img"
                }
            );

        svg.classList.add(
            "research-chart"
        );

        clearContainer(
            container
        );

        container.appendChild(
            svg
        );

        return svg;
    }

    function addText(
        svg,
        text,
        x,
        y,
        options = {}
    ) {
        const element =
            createSVGElement(
                "text",
                {
                    x,
                    y,
                    "text-anchor":
                        options.anchor ||
                        "start",
                    "font-size":
                        options.size ||
                        12,
                    "font-weight":
                        options.weight ||
                        400,
                    fill:
                        options.color ||
                        getTheme().muted
                }
            );

        element.textContent =
            String(text);

        svg.appendChild(
            element
        );

        return element;
    }

    /* ---------------------------------------------------------
       Global SHAP Bar Chart
       --------------------------------------------------------- */

    function renderSHAPBarChart(
        target,
        data,
        options = {}
    ) {
        const container =
            resolveContainer(target);

        if (!container) {
            return null;
        }

        if (
            !Array.isArray(data) ||
            !data.length
        ) {
            clearContainer(
                container
            );

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "chart-empty";

            empty.textContent =
                "No feature importance data available.";

            container.appendChild(
                empty
            );

            return null;
        }

        const normalized =
            data
                .map(
                    (item) => ({
                        label:
                            item.feature ||
                            item.feature_name ||
                            item.name ||
                            "Feature",

                        value:
                            number(
                                item.importance ??
                                item.mean_abs_shap ??
                                item.value,
                                0
                            )
                    })
                )
                .sort(
                    (a, b) =>
                        b.value -
                        a.value
                )
                .slice(
                    0,
                    options.limit || 12
                );

        const dimensions =
            getDimensions(
                container,
                720,
                Math.max(
                    300,
                    normalized.length *
                        42
                )
            );

        const width =
            dimensions.width;

        const height =
            Math.max(
                dimensions.height,
                normalized.length *
                    42 +
                    50
            );

        const svg =
            createChartSVG(
                container,
                width,
                height
            );

        const theme =
            getTheme();

        const margin = {
            top: 20,
            right: 90,
            bottom: 20,
            left: Math.min(
                220,
                width * 0.34
            )
        };

        const plotWidth =
            width -
            margin.left -
            margin.right;

        const rowHeight =
            (
                height -
                margin.top -
                margin.bottom
            ) /
            normalized.length;

        const maxValue =
            Math.max(
                ...normalized.map(
                    (item) =>
                        item.value
                ),
                1
            );

        normalized.forEach(
            (item, index) => {
                const y =
                    margin.top +
                    index *
                        rowHeight;

                const barHeight =
                    Math.min(
                        22,
                        rowHeight -
                            12
                    );

                const barWidth =
                    (
                        item.value /
                        maxValue
                    ) *
                    plotWidth;

                addText(
                    svg,
                    item.label,
                    margin.left - 12,
                    y +
                        rowHeight / 2 +
                        4,
                    {
                        anchor: "end",
                        color:
                            theme.text,
                        size: 12
                    }
                );

                const background =
                    createSVGElement(
                        "rect",
                        {
                            x:
                                margin.left,
                            y:
                                y +
                                (
                                    rowHeight -
                                    barHeight
                                ) /
                                    2,
                            width:
                                plotWidth,
                            height:
                                barHeight,
                            rx: 6,
                            fill:
                                theme.surface
                        }
                    );

                svg.appendChild(
                    background
                );

                const bar =
                    createSVGElement(
                        "rect",
                        {
                            x:
                                margin.left,
                            y:
                                y +
                                (
                                    rowHeight -
                                    barHeight
                                ) /
                                    2,
                            width:
                                Math.max(
                                    2,
                                    barWidth
                                ),
                            height:
                                barHeight,
                            rx: 6,
                            fill:
                                theme.primary
                        }
                    );

                bar.classList.add(
                    "chart-bar"
                );

                svg.appendChild(
                    bar
                );

                addText(
                    svg,
                    item.value.toFixed(
                        4
                    ),
                    margin.left +
                        plotWidth +
                        12,
                    y +
                        rowHeight / 2 +
                        4,
                    {
                        color:
                            theme.muted,
                        size: 11
                    }
                );
            }
        );

        const chartID =
            `shap-${Date.now()}`;

        registerChart(
            chartID,
            () => {
                clearContainer(
                    container
                );
            }
        );

        return {
            id: chartID,
            svg
        };
    }

    /* ---------------------------------------------------------
       Probability Distribution
       --------------------------------------------------------- */

    function renderProbabilityChart(
        target,
        probabilities,
        options = {}
    ) {
        const container =
            resolveContainer(target);

        if (!container) {
            return null;
        }

        const classes = [
            "Low",
            "Medium",
            "High"
        ];

        const values =
            classes.map(
                (label) => {
                    const targetName =
                        label.toLowerCase();

                    let value = 0;

                    Object.entries(
                        probabilities || {}
                    ).forEach(
                        ([key, raw]) => {
                            const normalized =
                                key.toLowerCase();

                            if (
                                normalized ===
                                    targetName ||
                                normalized.includes(
                                    targetName
                                )
                            ) {
                                value =
                                    number(
                                        raw,
                                        0
                                    );

                                if (
                                    value >
                                    1
                                ) {
                                    value /=
                                        100;
                                }
                            }
                        }
                    );

                    return {
                        label,
                        value:
                            clamp(
                                value *
                                    100
                            )
                    };
                }
            );

        const dimensions =
            getDimensions(
                container,
                600,
                320
            );

        const width =
            dimensions.width;

        const height =
            dimensions.height;

        const svg =
            createChartSVG(
                container,
                width,
                height
            );

        const theme =
            getTheme();

        const margin = {
            top: 35,
            right: 25,
            bottom: 55,
            left: 45
        };

        const plotWidth =
            width -
            margin.left -
            margin.right;

        const plotHeight =
            height -
            margin.top -
            margin.bottom;

        const maxY = 100;

        for (
            let tick = 0;
            tick <= 100;
            tick += 20
        ) {
            const y =
                margin.top +
                plotHeight -
                (
                    tick /
                    maxY
                ) *
                    plotHeight;

            const line =
                createSVGElement(
                    "line",
                    {
                        x1:
                            margin.left,
                        y1: y,
                        x2:
                            width -
                            margin.right,
                        y2: y,
                        stroke:
                            theme.border,
                        "stroke-width":
                            1
                    }
                );

            svg.appendChild(
                line
            );

            addText(
                svg,
                `${tick}%`,
                margin.left - 10,
                y + 4,
                {
                    anchor: "end",
                    color:
                        theme.muted,
                    size: 10
                }
            );
        }

        const slotWidth =
            plotWidth /
            values.length;

        const barWidth =
            Math.min(
                90,
                slotWidth * 0.52
            );

        values.forEach(
            (item, index) => {
                const barHeight =
                    (
                        item.value /
                        maxY
                    ) *
                    plotHeight;

                const x =
                    margin.left +
                    index *
                        slotWidth +
                    (
                        slotWidth -
                        barWidth
                    ) /
                        2;

                const y =
                    margin.top +
                    plotHeight -
                    barHeight;

                const bar =
                    createSVGElement(
                        "rect",
                        {
                            x,
                            y,
                            width:
                                barWidth,
                            height:
                                Math.max(
                                    2,
                                    barHeight
                                ),
                            rx: 8,
                            fill:
                                index === 0
                                    ? theme.success
                                    : index === 1
                                    ? theme.warning
                                    : theme.danger
                        }
                    );

                svg.appendChild(
                    bar
                );

                addText(
                    svg,
                    `${item.value.toFixed(
                        1
                    )}%`,
                    x +
                        barWidth /
                            2,
                    y - 10,
                    {
                        anchor:
                            "middle",
                        color:
                            theme.text,
                        weight:
                            600,
                        size: 12
                    }
                );

                addText(
                    svg,
                    item.label,
                    x +
                        barWidth /
                            2,
                    height -
                        margin.bottom +
                        25,
                    {
                        anchor:
                            "middle",
                        color:
                            theme.muted,
                        size: 12
                    }
                );
            }
        );

        return svg;
    }

    /* ---------------------------------------------------------
       Confusion Matrix
       --------------------------------------------------------- */

    function renderConfusionMatrixChart(
        target,
        matrix,
        labels = [
            "Low",
            "Medium",
            "High"
        ]
    ) {
        const container =
            resolveContainer(target);

        if (!container) {
            return null;
        }

        if (
            !Array.isArray(matrix) ||
            !matrix.length
        ) {
            clearContainer(
                container
            );

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "chart-empty";

            empty.textContent =
                "No confusion matrix data available.";

            container.appendChild(
                empty
            );

            return null;
        }

        const dimensions =
            getDimensions(
                container,
                520,
                420
            );

        const width =
            dimensions.width;

        const height =
            dimensions.height;

        const svg =
            createChartSVG(
                container,
                width,
                height
            );

        const theme =
            getTheme();

        const n =
            Math.min(
                matrix.length,
                labels.length
            );

        const matrixSize =
            Math.min(
                width * 0.68,
                height * 0.68
            );

        const cellSize =
            matrixSize /
            n;

        const originX =
            (
                width -
                matrixSize
            ) /
                2 +
            25;

        const originY =
            55;

        const values =
            matrix
                .slice(0, n)
                .map(
                    (row) =>
                        row
                            .slice(0, n)
                            .map(
                                (value) =>
                                    number(
                                        value,
                                        0
                                    )
                            )
                );

        const max =
            Math.max(
                ...values.flat(),
                1
            );

        addText(
            svg,
            "Predicted class",
            originX +
                matrixSize /
                    2,
            height - 10,
            {
                anchor:
                    "middle",
                color:
                    theme.muted,
                size: 12
            }
        );

        const actualLabel =
            addText(
                svg,
                "Actual class",
                15,
                originY +
                    matrixSize /
                        2,
                {
                    anchor:
                        "middle",
                    color:
                        theme.muted,
                    size: 12
                }
            );

        actualLabel.setAttribute(
            "transform",
            `rotate(-90 15 ${
                originY +
                matrixSize /
                    2
            })`
        );

        labels
            .slice(0, n)
            .forEach(
                (label, index) => {
                    addText(
                        svg,
                        label,
                        originX +
                            index *
                                cellSize +
                            cellSize /
                                2,
                        originY - 15,
                        {
                            anchor:
                                "middle",
                            color:
                                theme.text,
                            weight:
                                600,
                            size: 11
                        }
                    );

                    addText(
                        svg,
                        label,
                        originX - 12,
                        originY +
                            index *
                                cellSize +
                            cellSize /
                                2 +
                            4,
                        {
                            anchor:
                                "end",
                            color:
                                theme.text,
                            weight:
                                600,
                            size: 11
                        }
                    );
                }
            );

        values.forEach(
            (row, rowIndex) => {
                row.forEach(
                    (value, columnIndex) => {
                        const x =
                            originX +
                            columnIndex *
                                cellSize;

                        const y =
                            originY +
                            rowIndex *
                                cellSize;

                        const intensity =
                            value /
                            max;

                        const cell =
                            createSVGElement(
                                "rect",
                                {
                                    x:
                                        x + 2,
                                    y:
                                        y + 2,
                                    width:
                                        cellSize -
                                        4,
                                    height:
                                        cellSize -
                                        4,
                                    rx: 6,
                                    fill:
                                        theme.primary,
                                    opacity:
                                        0.12 +
                                        intensity *
                                            0.78
                                }
                            );

                        cell.classList.add(
                            "matrix-chart-cell"
                        );

                        svg.appendChild(
                            cell
                        );

                        addText(
                            svg,
                            String(
                                value
                            ),
                            x +
                                cellSize /
                                    2,
                            y +
                                cellSize /
                                    2 +
                                5,
                            {
                                anchor:
                                    "middle",
                                color:
                                    intensity >
                                    0.55
                                        ? "#ffffff"
                                        : theme.text,
                                weight:
                                    700,
                                size:
                                    14
                            }
                        );
                    }
                );
            }
        );

        return svg;
    }

    /* ---------------------------------------------------------
       Calibration Curve
       --------------------------------------------------------- */

    function renderCalibrationChart(
        target,
        points
    ) {
        const container =
            resolveContainer(target);

        if (!container) {
            return null;
        }

        if (
            !Array.isArray(points) ||
            !points.length
        ) {
            clearContainer(
                container
            );

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "chart-empty";

            empty.textContent =
                "No calibration data available.";

            container.appendChild(
                empty
            );

            return null;
        }

        const normalized =
            points
                .map(
                    (point) => ({
                        x:
                            number(
                                point.x ??
                                point.predicted ??
                                point.mean_predicted,
                                0
                            ),

                        y:
                            number(
                                point.y ??
                                point.actual ??
                                point.fraction_positive,
                                0
                            )
                    })
                )
                .map(
                    (point) => ({
                        x:
                            point.x > 1
                                ? point.x /
                                  100
                                : point.x,

                        y:
                            point.y > 1
                                ? point.y /
                                  100
                                : point.y
                    })
                )
                .filter(
                    (point) =>
                        Number.isFinite(
                            point.x
                        ) &&
                        Number.isFinite(
                            point.y
                        )
                );

        if (!normalized.length) {
            return null;
        }

        const dimensions =
            getDimensions(
                container,
                650,
                380
            );

        const width =
            dimensions.width;

        const height =
            dimensions.height;

        const svg =
            createChartSVG(
                container,
                width,
                height
            );

        const theme =
            getTheme();

        const margin = {
            top: 30,
            right: 30,
            bottom: 55,
            left: 55
        };

        const plotWidth =
            width -
            margin.left -
            margin.right;

        const plotHeight =
            height -
            margin.top -
            margin.bottom;

        const xMap = (value) =>
            margin.left +
            value *
                plotWidth;

        const yMap = (value) =>
            margin.top +
            plotHeight -
            value *
                plotHeight;

        for (
            let tick = 0;
            tick <= 1;
            tick += 0.2
        ) {
            const x =
                xMap(tick);

            const y =
                yMap(tick);

            const vertical =
                createSVGElement(
                    "line",
                    {
                        x1: x,
                        y1:
                            margin.top,
                        x2: x,
                        y2:
                            margin.top +
                            plotHeight,
                        stroke:
                            theme.border,
                        "stroke-width":
                            1
                    }
                );

            const horizontal =
                createSVGElement(
                    "line",
                    {
                        x1:
                            margin.left,
                        y1: y,
                        x2:
                            margin.left +
                            plotWidth,
                        y2: y,
                        stroke:
                            theme.border,
                        "stroke-width":
                            1
                    }
                );

            svg.appendChild(
                vertical
            );

            svg.appendChild(
                horizontal
            );

            addText(
                svg,
                `${Math.round(
                    tick * 100
                )}%`,
                x,
                height -
                    margin.bottom +
                    20,
                {
                    anchor:
                        "middle",
                    color:
                        theme.muted,
                    size: 10
                }
            );

            addText(
                svg,
                `${Math.round(
                    tick * 100
                )}%`,
                margin.left - 10,
                y + 4,
                {
                    anchor:
                        "end",
                    color:
                        theme.muted,
                    size: 10
                }
            );
        }

        const diagonal =
            createSVGElement(
                "line",
                {
                    x1:
                        xMap(0),
                    y1:
                        yMap(0),
                    x2:
                        xMap(1),
                    y2:
                        yMap(1),
                    stroke:
                        theme.muted,
                    "stroke-width":
                        1.5,
                    "stroke-dasharray":
                        "6 6",
                    opacity:
                        0.6
                }
            );

        svg.appendChild(
            diagonal
        );

        const path =
            normalized
                .sort(
                    (a, b) =>
                        a.x -
                        b.x
                )
                .map(
                    (point, index) =>
                        `${index === 0 ? "M" : "L"} ${
                            xMap(point.x)
                        } ${
                            yMap(point.y)
                        }`
                )
                .join(" ");

        const curve =
            createSVGElement(
                "path",
                {
                    d: path,
                    fill: "none",
                    stroke:
                        theme.primary,
                    "stroke-width":
                        3,
                    "stroke-linecap":
                        "round",
                    "stroke-linejoin":
                        "round"
                }
            );

        svg.appendChild(
            curve
        );

        normalized.forEach(
            (point) => {
                const circle =
                    createSVGElement(
                        "circle",
                        {
                            cx:
                                xMap(
                                    point.x
                                ),
                            cy:
                                yMap(
                                    point.y
                                ),
                            r: 4,
                            fill:
                                theme.secondary
                        }
                    );

                svg.appendChild(
                    circle
                );
            }
        );

        addText(
            svg,
            "Mean predicted probability",
            margin.left +
                plotWidth /
                    2,
            height - 8,
            {
                anchor:
                    "middle",
                color:
                    theme.muted,
                size: 11
            }
        );

        addText(
            svg,
            "Observed frequency",
            15,
            margin.top +
                plotHeight /
                    2,
            {
                anchor:
                    "middle",
                color:
                    theme.muted,
                size: 11
            }
        );

        const axisLabel =
            $(
                "text:last-of-type",
                svg
            );

        if (axisLabel) {
            axisLabel.setAttribute(
                "transform",
                `rotate(-90 15 ${
                    margin.top +
                    plotHeight /
                        2
                })`
            );
        }

        return svg;
    }

    /* ---------------------------------------------------------
       Metric Comparison Chart
       --------------------------------------------------------- */

    function renderMetricComparisonChart(
        target,
        datasets,
        options = {}
    ) {
        const container =
            resolveContainer(target);

        if (!container) {
            return null;
        }

        if (
            !Array.isArray(
                datasets
            ) ||
            !datasets.length
        ) {
            return null;
        }

        const dimensions =
            getDimensions(
                container,
                720,
                360
            );

        const width =
            dimensions.width;

        const height =
            dimensions.height;

        const svg =
            createChartSVG(
                container,
                width,
                height
            );

        const theme =
            getTheme();

        const margin = {
            top: 30,
            right: 25,
            bottom: 70,
            left: 50
        };

        const plotWidth =
            width -
            margin.left -
            margin.right;

        const plotHeight =
            height -
            margin.top -
            margin.bottom;

        const groups =
            datasets.map(
                (dataset) => ({
                    label:
                        dataset.label ||
                        dataset.name ||
                        "Model",

                    accuracy:
                        clamp(
                            number(
                                dataset.accuracy,
                                0
                            ) *
                                100
                        ),

                    f1:
                        clamp(
                            number(
                                dataset.macro_f1 ??
                                dataset.f1,
                                0
                            ) *
                                100
                        )
                })
            );

        const groupWidth =
            plotWidth /
            groups.length;

        const barWidth =
            Math.min(
                30,
                groupWidth * 0.25
            );

        for (
            let tick = 0;
            tick <= 100;
            tick += 20
        ) {
            const y =
                margin.top +
                plotHeight -
                (
                    tick /
                    100
                ) *
                    plotHeight;

            const line =
                createSVGElement(
                    "line",
                    {
                        x1:
                            margin.left,
                        y1: y,
                        x2:
                            width -
                            margin.right,
                        y2: y,
                        stroke:
                            theme.border,
                        "stroke-width":
                            1
                    }
                );

            svg.appendChild(
                line
            );

            addText(
                svg,
                `${tick}%`,
                margin.left - 10,
                y + 4,
                {
                    anchor:
                        "end",
                    color:
                        theme.muted,
                    size: 10
                }
            );
        }

        groups.forEach(
            (group, index) => {
                const center =
                    margin.left +
                    index *
                        groupWidth +
                    groupWidth /
                        2;

                const accuracyHeight =
                    (
                        group.accuracy /
                        100
                    ) *
                    plotHeight;

                const f1Height =
                    (
                        group.f1 /
                        100
                    ) *
                    plotHeight;

                const accuracyBar =
                    createSVGElement(
                        "rect",
                        {
                            x:
                                center -
                                barWidth -
                                3,
                            y:
                                margin.top +
                                plotHeight -
                                accuracyHeight,
                            width:
                                barWidth,
                            height:
                                accuracyHeight,
                            rx: 5,
                            fill:
                                theme.primary
                        }
                    );

                const f1Bar =
                    createSVGElement(
                        "rect",
                        {
                            x:
                                center +
                                3,
                            y:
                                margin.top +
                                plotHeight -
                                f1Height,
                            width:
                                barWidth,
                            height:
                                f1Height,
                            rx: 5,
                            fill:
                                theme.secondary
                        }
                    );

                svg.appendChild(
                    accuracyBar
                );

                svg.appendChild(
                    f1Bar
                );

                addText(
                    svg,
                    group.label,
                    center,
                    height -
                        margin.bottom +
                        25,
                    {
                        anchor:
                            "middle",
                        color:
                            theme.text,
                        size: 11
                    }
                );
            }
        );

        addText(
            svg,
            "Accuracy",
            width -
                margin.right -
                110,
            20,
            {
                color:
                    theme.primary,
                size: 11,
                weight: 600
            }
        );

        addText(
            svg,
            "Macro F1",
            width -
                margin.right -
                45,
            20,
            {
                color:
                    theme.secondary,
                size: 11,
                weight: 600
            }
        );

        return svg;
    }

    /* ---------------------------------------------------------
       Research Dashboard Auto Rendering
       --------------------------------------------------------- */

    function initializeResearchCharts() {
        const research =
            window.StressIntelResearch;

        if (
            !research ||
            !research.state?.researchData
        ) {
            return;
        }

        const data =
            research.state.researchData;

        const featureTarget =
            $(
                "[data-shap-chart]"
            );

        if (
            featureTarget &&
            Array.isArray(
                data.feature_importance
            )
        ) {
            renderSHAPBarChart(
                featureTarget,
                data.feature_importance
            );
        }

        const matrixTarget =
            $(
                "[data-confusion-chart]"
            );

        if (
            matrixTarget &&
            Array.isArray(
                data.confusion_matrix
            )
        ) {
            renderConfusionMatrixChart(
                matrixTarget,
                data.confusion_matrix
            );
        }

        const calibrationTarget =
            $(
                "[data-calibration-chart]"
            );

        const calibration =
            data.calibration ||
            {};

        const calibrationPoints =
            calibration.curve ||
            calibration.points ||
            calibration.calibration_curve ||
            [];

        if (
            calibrationTarget &&
            calibrationPoints.length
        ) {
            renderCalibrationChart(
                calibrationTarget,
                calibrationPoints
            );
        }

        const probabilityTarget =
            $(
                "[data-probability-chart]"
            );

        if (
            probabilityTarget
        ) {
            const storedResult =
                window.StressIntelSession
                    ?.getResult?.();

            const prediction =
                storedResult?.prediction ||
                storedResult;

            if (
                prediction?.probabilities
            ) {
                renderProbabilityChart(
                    probabilityTarget,
                    prediction.probabilities
                );
            }
        }
    }

    /* ---------------------------------------------------------
       Resize Handling
       --------------------------------------------------------- */

    let resizeTimer = null;

    function initializeResizeHandling() {
        window.addEventListener(
            "resize",
            () => {
                clearTimeout(
                    resizeTimer
                );

                resizeTimer =
                    setTimeout(
                        () => {
                            initializeResearchCharts();
                        },
                        200
                    );
            }
        );
    }

    /* ---------------------------------------------------------
       Initialization
       --------------------------------------------------------- */

    function initialize() {
        initializeResizeHandling();

        /*
         * research.js may load its data asynchronously.
         * Listen for its availability briefly rather than
         * creating a second research API request here.
         */
        let attempts = 0;

        const interval =
            setInterval(
                () => {
                    attempts += 1;

                    initializeResearchCharts();

                    const research =
                        window.StressIntelResearch;

                    if (
                        research?.state?.loaded ||
                        attempts >= 20
                    ) {
                        clearInterval(
                            interval
                        );
                    }
                },
                500
            );
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

    window.StressIntelCharts = {
        charts,
        renderSHAPBarChart,
        renderProbabilityChart,
        renderConfusionMatrixChart,
        renderCalibrationChart,
        renderMetricComparisonChart,
        initializeResearchCharts
    };
})();