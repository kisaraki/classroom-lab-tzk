(() => {
    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";
    const state = {
        lensType: "convex",
        pRatio: 2,
        demoIndex: 0
    };

    const demoStates = [
        { lensType: "convex", pRatio: 2 },
        { lensType: "convex", pRatio: 1.5 },
        { lensType: "convex", pRatio: 0.6 },
        { lensType: "concave", pRatio: 1.8 }
    ];

    const svg = document.getElementById("lens-svg");
    const stage = document.querySelector(".lens-stage");
    const pRatioInput = document.getElementById("input-p-ratio");
    const lensTypeInputs = Array.from(document.querySelectorAll('input[name="lens-type"]'));

    const output = {
        pRatioValue: document.getElementById("p-ratio-value"),
        lensTypeSummary: document.getElementById("lens-type-summary"),
        stageStatus: document.getElementById("stage-status"),
        focal: document.getElementById("result-focal"),
        objectDistance: document.getElementById("result-object-distance"),
        imageDistance: document.getElementById("result-image-distance"),
        magnification: document.getElementById("result-magnification"),
        imageType: document.getElementById("result-image-type"),
        orientation: document.getElementById("result-orientation"),
        interpretation: document.getElementById("result-interpretation"),
        formulaLens: document.getElementById("formula-lens-equation"),
        formulaImageDistance: document.getElementById("formula-image-distance"),
        formulaMagnification: document.getElementById("formula-magnification"),
        formulaJudgement: document.getElementById("formula-judgement")
    };

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function formatNumber(value, digits = 2) {
        if (!Number.isFinite(value)) return "∞";
        const fixed = Number(value).toFixed(digits);
        return fixed.replace("-0.00", "0.00").replace("-0.0", "0.0");
    }

    function formatSigned(value) {
        if (!Number.isFinite(value)) return "∞";
        return `${value >= 0 ? "+" : ""}${formatNumber(value)}`;
    }

    function svgEl(tagName, attrs = {}, textContent = "") {
        const element = document.createElementNS(SVG_NS, tagName);
        Object.entries(attrs).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                element.setAttribute(key, String(value));
            }
        });
        if (textContent) {
            element.textContent = textContent;
        }
        return element;
    }

    function append(parent, ...children) {
        children.forEach((child) => parent.appendChild(child));
        return parent;
    }

    function line(attrs) {
        return svgEl("line", attrs);
    }

    function text(x, y, content, className = "svg-label", anchor = "middle") {
        return svgEl("text", {
            x,
            y,
            class: className,
            "text-anchor": anchor
        }, content);
    }

    function pointAtX(a, b, x) {
        const dx = b.x - a.x;
        if (Math.abs(dx) < 0.0001) {
            return { x, y: b.y };
        }
        const slope = (b.y - a.y) / dx;
        return { x, y: a.y + slope * (x - a.x) };
    }

    function createRaySegment(from, to, className, dashed = false) {
        return line({
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y,
            class: `ray-line ${className}${dashed ? " ray-virtual" : ""}`
        });
    }

    function calculateLens() {
        const f = state.lensType === "convex" ? 1 : -1;
        const p = state.pRatio;
        const isAtFocus = state.lensType === "convex" && Math.abs(p - 1) < 0.001;

        if (isAtFocus) {
            return {
                f,
                p,
                q: Infinity,
                magnification: Infinity,
                imageType: "不成像",
                orientation: "折射後近似平行",
                side: "無有限像距",
                isAtFocus
            };
        }

        const q = (f * p) / (p - f);
        const magnification = -q / p;
        const imageType = q > 0 ? "實像" : "虛像";
        const orientation = magnification < 0 ? "倒立" : "正立";
        const side = q > 0 ? "異側" : "同側";

        return {
            f,
            p,
            q,
            magnification,
            imageType,
            orientation,
            side,
            isAtFocus
        };
    }

    function describeImage(model) {
        if (model.isAtFocus) {
            return "物體剛好位在凸透鏡焦點 f 上，折射後光線近似平行，因此不會在有限距離形成清楚影像。";
        }

        if (state.lensType === "concave") {
            return "凹透鏡使光線發散，反向延長線在物體同側相交，形成正立、縮小的虛像。";
        }

        if (model.p > 2) {
            return "物體在 2f 外，會在另一側 f' 到 2f' 之間形成縮小的倒立實像。";
        }

        if (Math.abs(model.p - 2) < 0.001) {
            return "物體在 2f，會在另一側 2f' 形成等大的倒立實像。";
        }

        if (model.p > 1) {
            return "物體在 f 與 2f 之間，會在另一側 2f' 外形成放大的倒立實像。";
        }

        return "物體在焦距內，折射光線不會真的會合；反向延長線形成同側、正立、放大的虛像。";
    }

    function updateReadout(model) {
        const lensName = state.lensType === "convex" ? "凸透鏡" : "凹透鏡";
        output.pRatioValue.textContent = `${formatNumber(model.p)} f`;
        output.lensTypeSummary.textContent = lensName;
        output.focal.textContent = `${formatSigned(model.f)} f`;
        output.objectDistance.textContent = `${formatNumber(model.p)} f`;

        if (model.isAtFocus) {
            output.imageDistance.textContent = "無窮遠";
            output.magnification.textContent = "∞";
            output.imageType.textContent = "不成像";
            output.orientation.textContent = "折射後近似平行";
            output.stageStatus.textContent = "不成像";
            output.formulaLens.textContent = `1/+1.00 = 1/${formatNumber(model.p)} + 1/∞`;
            output.formulaImageDistance.textContent = "p = f，分母為 0，q 趨近無窮遠。";
            output.formulaMagnification.textContent = "M 無法以有限數值表示。";
            output.formulaJudgement.textContent = "光線近似平行，所以沒有有限距離的清楚影像。";
        } else {
            output.imageDistance.textContent = `${formatSigned(model.q)} f'`;
            output.magnification.textContent = formatNumber(model.magnification);
            output.imageType.textContent = model.imageType;
            output.orientation.textContent = `${model.orientation} · ${model.side}`;
            output.stageStatus.textContent = `${model.imageType} · ${model.orientation}`;
            output.formulaLens.textContent = `1/${formatSigned(model.f)} = 1/${formatNumber(model.p)} + 1/${formatSigned(model.q)}`;
            output.formulaImageDistance.textContent = `q = ${formatSigned(model.f)} × ${formatNumber(model.p)} ÷ (${formatNumber(model.p)} − ${formatSigned(model.f)}) = ${formatSigned(model.q)} f`;
            output.formulaMagnification.textContent = `M = −(${formatSigned(model.q)}) ÷ ${formatNumber(model.p)} = ${formatNumber(model.magnification)}`;
            output.formulaJudgement.textContent = model.q > 0 ? "q > 0，所以是異側實像。" : "q < 0，所以是同側虛像。";
        }

        output.interpretation.textContent = describeImage(model);
    }

    function drawGrid(root, width, height) {
        const group = svgEl("g", { "aria-hidden": "true" });
        const spacing = 64;

        for (let x = 0; x <= width; x += spacing) {
            group.appendChild(line({
                x1: x,
                y1: 0,
                x2: x,
                y2: height,
                class: "svg-grid-line"
            }));
        }

        for (let y = 0; y <= height; y += spacing) {
            group.appendChild(line({
                x1: 0,
                y1: y,
                x2: width,
                y2: y,
                class: "svg-grid-line"
            }));
        }

        root.appendChild(group);
    }

    function drawMarkers(root) {
        const defs = svgEl("defs");
        const markers = [
            ["arrow-object", "#5bbcff"],
            ["arrow-real", "#ffc75a"],
            ["arrow-virtual", "#d2dce8"]
        ];

        markers.forEach(([id, color]) => {
            const marker = svgEl("marker", {
                id,
                viewBox: "0 0 10 10",
                refX: 8,
                refY: 5,
                markerWidth: 6,
                markerHeight: 6,
                orient: "auto-start-reverse"
            });
            marker.appendChild(svgEl("path", {
                d: "M 0 0 L 10 5 L 0 10 z",
                fill: color
            }));
            defs.appendChild(marker);
        });

        root.appendChild(defs);
    }

    function drawFocalMarkers(root, center, axisY, focalPx) {
        const marks = [
            [-2.5, "2.5f"],
            [-2, "2f"],
            [-1.5, "1.5f"],
            [-1, "f"],
            [-0.5, "0.5f"],
            [0.5, "0.5f'"],
            [1, "f'"],
            [1.5, "1.5f'"],
            [2, "2f'"],
            [2.5, "2.5f'"]
        ];

        marks.forEach(([ratio, label]) => {
            const x = center.x + ratio * focalPx;
            if (x < 18 || x > Number(svg.getAttribute("data-width")) - 18) return;
            append(root,
                svgEl("circle", {
                    cx: x,
                    cy: axisY,
                    r: Math.abs(ratio) === 1 ? 5 : 3.5,
                    class: "svg-focal-marker"
                }),
                text(x, axisY + 27, label, "svg-muted-label")
            );
        });
    }

    function drawLens(root, center, height, lensType) {
        const top = 46;
        const bottom = height - 46;
        const cx = center.x;
        const topTipY = lensType === "convex" ? top : top + 12;
        const topBaseY = lensType === "convex" ? top + 12 : top;
        const bottomTipY = lensType === "convex" ? bottom : bottom - 12;
        const bottomBaseY = lensType === "convex" ? bottom - 12 : bottom;

        append(root,
            line({
                x1: cx,
                y1: top,
                x2: cx,
                y2: bottom,
                class: "svg-lens-line"
            }),
            svgEl("path", {
                d: `M ${cx - 11} ${topBaseY} L ${cx} ${topTipY} L ${cx + 11} ${topBaseY}`,
                class: "svg-lens-tip"
            }),
            svgEl("path", {
                d: `M ${cx - 11} ${bottomBaseY} L ${cx} ${bottomTipY} L ${cx + 11} ${bottomBaseY}`,
                class: "svg-lens-tip"
            }),
            text(cx + 18, center.y + 23, "G", "svg-label", "start")
        );
    }

    function drawObjectAndImage(root, geometry, model) {
        append(root,
            line({
                x1: geometry.objectBase.x,
                y1: geometry.objectBase.y,
                x2: geometry.objectTip.x,
                y2: geometry.objectTip.y,
                class: "object-line",
                "marker-end": "url(#arrow-object)"
            }),
            text(geometry.objectBase.x, geometry.objectBase.y + 30, "物", "svg-label")
        );

        if (model.isAtFocus || !geometry.imageVisible) {
            return;
        }

        append(root,
            line({
                x1: geometry.imageBase.x,
                y1: geometry.imageBase.y,
                x2: geometry.imageTip.x,
                y2: geometry.imageTip.y,
                class: model.q > 0 ? "image-real" : "image-virtual",
                "marker-end": model.q > 0 ? "url(#arrow-real)" : "url(#arrow-virtual)"
            }),
            text(
                geometry.imageBase.x,
                geometry.imageBase.y + 30,
                model.q > 0 ? "實像" : "虛像",
                model.q > 0 ? "svg-label" : "svg-muted-label"
            )
        );
    }

    function drawRays(root, geometry, model, width) {
        const rightEdge = width - 24;
        const leftEdge = 24;
        const {
            center,
            axisY,
            focalLeft,
            focalRight,
            objectTip,
            imageTip
        } = geometry;

        if (model.isAtFocus) {
            const lensPoint = { x: center.x, y: objectTip.y };
            const focalPoint = { x: focalRight, y: axisY };
            const refractedEnd = pointAtX(lensPoint, focalPoint, rightEdge);
            const centerRayEnd = pointAtX(objectTip, center, rightEdge);
            append(root,
                createRaySegment(objectTip, lensPoint, "ray-1"),
                createRaySegment(lensPoint, refractedEnd, "ray-1"),
                createRaySegment(objectTip, centerRayEnd, "ray-2"),
                text(lensPoint.x + 12, lensPoint.y - 16, "L1", "svg-muted-label", "start"),
                text(center.x + 12, center.y - 16, "L2", "svg-muted-label", "start")
            );
            return;
        }

        const rayGroup = svgEl("g", {});

        const r1Lens = { x: center.x, y: objectTip.y };
        const r1Reference = model.f > 0
            ? { x: focalRight, y: axisY }
            : { x: focalLeft, y: axisY };
        const r1End = pointAtX(r1Reference, r1Lens, rightEdge);
        append(rayGroup,
            createRaySegment(objectTip, r1Lens, "ray-1"),
            createRaySegment(r1Lens, r1End, "ray-1")
        );
        if (model.q < 0) {
            append(rayGroup, createRaySegment(r1Lens, imageTip, "ray-1", true));
        }

        const r2End = pointAtX(objectTip, center, rightEdge);
        append(rayGroup, createRaySegment(objectTip, r2End, "ray-2"));
        if (model.q < 0) {
            append(rayGroup, createRaySegment(center, imageTip, "ray-2", true));
        }

        const r3Focus = model.f > 0
            ? { x: focalLeft, y: axisY }
            : { x: focalRight, y: axisY };
        const r3Lens = pointAtX(objectTip, r3Focus, center.x);
        append(rayGroup,
            createRaySegment(objectTip, r3Lens, "ray-3"),
            createRaySegment(r3Lens, { x: rightEdge, y: r3Lens.y }, "ray-3")
        );
        if (model.q < 0) {
            append(rayGroup, createRaySegment(r3Lens, imageTip, "ray-3", true));
        } else if (model.q > 0 && geometry.imageVisible) {
            append(rayGroup, createRaySegment(r3Lens, imageTip, "ray-3", true));
            rayGroup.lastChild.setAttribute("opacity", "0.26");
        }

        append(rayGroup,
            text(r1Lens.x + 12, r1Lens.y - 16, "L1", "svg-muted-label", "start"),
            text(center.x + 12, center.y - 16, "L2", "svg-muted-label", "start"),
            text(r3Lens.x + 12, r3Lens.y + 22, "L3", "svg-muted-label", "start")
        );

        if (model.q < 0 && geometry.imageVisible) {
            append(rayGroup,
                line({
                    x1: leftEdge,
                    y1: imageTip.y,
                    x2: imageTip.x,
                    y2: imageTip.y,
                    stroke: "rgba(210, 220, 232, 0.18)",
                    "stroke-width": 1,
                    "stroke-dasharray": "6 8"
                })
            );
        }

        root.appendChild(rayGroup);
    }

    function buildGeometry(model, width, height) {
        const center = {
            x: width / 2,
            y: height / 2
        };
        const axisY = center.y;
        const focalPx = Math.min(width * 0.16, height * 0.28);
        const objectHeight = clamp(height * 0.16, 48, 76);
        const objectX = center.x - model.p * focalPx;
        const objectBase = { x: objectX, y: axisY };
        const objectTip = { x: objectX, y: axisY - objectHeight };
        const imageX = Number.isFinite(model.q) ? center.x + model.q * focalPx : Infinity;
        const imageHeight = Number.isFinite(model.magnification) ? model.magnification * objectHeight : Infinity;
        const imageBase = { x: imageX, y: axisY };
        const imageTip = { x: imageX, y: axisY - imageHeight };
        const imageVisible = Number.isFinite(imageX)
            && imageX > -width * 0.15
            && imageX < width * 1.15
            && Math.abs(imageHeight) < height * 1.4;

        return {
            center,
            axisY,
            focalPx,
            focalLeft: center.x - focalPx,
            focalRight: center.x + focalPx,
            objectBase,
            objectTip,
            imageBase,
            imageTip,
            imageVisible
        };
    }

    function render() {
        const rect = svg.getBoundingClientRect();
        const width = Math.max(520, Math.round(rect.width || 900));
        const height = Math.max(360, Math.round(rect.height || 520));
        const model = calculateLens();
        const geometry = buildGeometry(model, width, height);

        svg.textContent = "";
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("data-width", width);
        svg.setAttribute("data-height", height);

        append(svg,
            svgEl("title", { id: "lens-svg-title" }, "透鏡成像光線圖"),
            svgEl("desc", { id: "lens-svg-desc" }, "顯示光軸、透鏡、焦點、物體、成像位置與三條主光線。")
        );

        drawMarkers(svg);
        drawGrid(svg, width, height);

        append(svg,
            line({
                x1: 0,
                y1: geometry.axisY,
                x2: width,
                y2: geometry.axisY,
                class: "svg-axis"
            }),
            text(24, geometry.axisY - 12, "光軸", "svg-muted-label", "start")
        );

        drawFocalMarkers(svg, geometry.center, geometry.axisY, geometry.focalPx);
        drawLens(svg, geometry.center, height, state.lensType);
        drawRays(svg, geometry, model, width);
        drawObjectAndImage(svg, geometry, model);

        if (!geometry.imageVisible && !model.isAtFocus) {
            const side = model.q > 0 ? "右側遠方" : "左側遠方";
            const noticeGroup = svgEl("g", { class: "distant-image-notice-group" });
            append(noticeGroup,
                svgEl("rect", {
                    x: width / 2 - 176,
                    y: Math.max(78, height * 0.18),
                    width: 352,
                    height: 86,
                    rx: 14,
                    class: "distant-image-notice-box"
                }),
                text(
                    width / 2,
                    Math.max(78, height * 0.18) + 38,
                    `成像在${side}`,
                    "distant-image-notice"
                ),
                text(
                    width / 2,
                    Math.max(78, height * 0.18) + 64,
                    "請調整物距，讓成像回到畫面內觀察",
                    "distant-image-notice-sub"
                )
            );
            append(svg,
                noticeGroup
            );
        }

        updateReadout(model);
    }

    function syncInputs() {
        pRatioInput.value = String(state.pRatio);
        lensTypeInputs.forEach((input) => {
            input.checked = input.value === state.lensType;
        });
    }

    function setState(next) {
        state.lensType = next.lensType ?? state.lensType;
        state.pRatio = Number(next.pRatio ?? state.pRatio);
        syncInputs();
        render();
    }

    function setupControls() {
        pRatioInput.addEventListener("input", (event) => {
            state.pRatio = Number(event.target.value);
            render();
        });

        lensTypeInputs.forEach((input) => {
            input.addEventListener("change", (event) => {
                if (event.target.checked) {
                    state.lensType = event.target.value;
                    render();
                }
            });
        });

        document.getElementById("btn-reset").addEventListener("click", () => {
            state.demoIndex = 0;
            setState({ lensType: "convex", pRatio: 2 });
        });

        document.getElementById("btn-demo").addEventListener("click", () => {
            state.demoIndex = (state.demoIndex + 1) % demoStates.length;
            setState(demoStates[state.demoIndex]);
        });
    }

    function setupModals() {
        const guideModal = document.getElementById("modal-guide");
        const formulaModal = document.getElementById("modal-formula");

        function openModal(modal) {
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            const closeButton = modal.querySelector("[data-close-modal]");
            if (closeButton) closeButton.focus();
        }

        function closeModal(modal) {
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
        }

        document.getElementById("btn-guide").addEventListener("click", () => openModal(guideModal));
        document.getElementById("btn-formula").addEventListener("click", () => openModal(formulaModal));

        document.querySelectorAll("[data-close-modal]").forEach((button) => {
            button.addEventListener("click", () => closeModal(button.closest(".modal")));
        });

        document.querySelectorAll(".modal").forEach((modal) => {
            modal.addEventListener("click", (event) => {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            document.querySelectorAll(".modal.is-open").forEach(closeModal);
        });
    }

    function setupResize() {
        if ("ResizeObserver" in window) {
            const observer = new ResizeObserver(render);
            observer.observe(stage);
        } else {
            window.addEventListener("resize", render);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        setupControls();
        setupModals();
        setupResize();
        syncInputs();
        render();
    });
})();
