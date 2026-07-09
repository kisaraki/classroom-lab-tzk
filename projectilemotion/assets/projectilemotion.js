(function () {
    "use strict";

    const g = 9.8;
    const tau = Math.PI * 2;

    const controls = {
        v0: document.getElementById("input-v0"),
        alpha: document.getElementById("input-alpha"),
        theta: document.getElementById("input-theta"),
        height: document.getElementById("input-height"),
    };

    const outputs = {
        v0: document.getElementById("v0-value"),
        alpha: document.getElementById("alpha-value"),
        alphaRelative: document.getElementById("alpha-relative-value"),
        theta: document.getElementById("theta-value"),
        height: document.getElementById("height-value"),
        stageStatus: document.getElementById("stage-status"),
        formulaRelativeAngle: document.getElementById("formula-relative-angle"),
        formulaTime: document.getElementById("formula-time"),
        formulaHorizontal: document.getElementById("formula-horizontal"),
        formulaVertical: document.getElementById("formula-vertical"),
        formulaDistance: document.getElementById("formula-distance"),
        formulaAltitude: document.getElementById("formula-altitude"),
        formulaPeakTime: document.getElementById("formula-peak-time"),
        formulaPeakAltitude: document.getElementById("formula-peak-altitude"),
    };

    const canvas = document.getElementById("trajectory-canvas");
    const ctx = canvas.getContext("2d");
    const state = {
        v0: Number(controls.v0.value),
        alpha: Number(controls.alpha.value),
        theta: Number(controls.theta.value),
        height: Number(controls.height.value),
    };

    function degToRad(deg) {
        return (deg * Math.PI) / 180;
    }

    function formatNumber(value, digits = 2) {
        if (!Number.isFinite(value)) {
            return "--";
        }

        return value.toLocaleString("zh-TW", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
    }

    function formatMetric(value, unit, digits = 2) {
        return `${formatNumber(value, digits)} ${unit}`;
    }

    function formatAngle(value, digits = 1) {
        return `${formatNumber(value, digits)}°`;
    }

    function angleTerm(value) {
        return value < 0 ? `(${formatAngle(value, 0)})` : formatAngle(value, 0);
    }

    function calculateTrajectory() {
        const alphaRad = degToRad(state.alpha);
        const thetaRad = degToRad(state.theta);
        const relativeAngle = state.alpha - state.theta;
        const denominator = g * Math.cos(thetaRad);
        const time = (2 * state.v0 * Math.sin(alphaRad - thetaRad)) / denominator;
        const isVerticalSlope = Math.abs(Math.cos(thetaRad)) < 0.0001;
        const isValid = !isVerticalSlope && Number.isFinite(time) && time > 0.0001;

        const apexTime = Math.max(0, (state.v0 * Math.sin(alphaRad)) / g);
        const fallbackTime = Math.max(3, apexTime * 2, state.v0 / g);
        const drawTime = isValid ? time : Math.min(18, fallbackTime);
        const samples = [];

        for (let i = 0; i <= 150; i += 1) {
            const t = (drawTime * i) / 150;
            samples.push(pointAtTime(t, alphaRad));
        }

        let x = 0;
        let y = 0;
        let distance = 0;
        let targetAltitude = state.height;

        if (isValid) {
            x = state.v0 * Math.cos(alphaRad) * time;
            y = x * Math.tan(thetaRad);
            distance = Math.hypot(x, y);
            targetAltitude = state.height + y;
        }

        const apexPoint = pointAtTime(apexTime, alphaRad);

        return {
            alphaRad,
            thetaRad,
            relativeAngle,
            time,
            isVerticalSlope,
            isValid,
            x,
            y,
            distance,
            targetAltitude,
            apexTime,
            apexAltitude: apexPoint.y,
            samples,
        };
    }

    function pointAtTime(time, alphaRad) {
        return {
            x: state.v0 * Math.cos(alphaRad) * time,
            y: state.height + state.v0 * Math.sin(alphaRad) * time - 0.5 * g * time * time,
        };
    }

    function updateValues(calc) {
        outputs.v0.textContent = `${state.v0} m/s`;
        outputs.alpha.textContent = `${state.alpha}°`;
        outputs.alphaRelative.textContent = `相對斜面 ${formatAngle(calc.relativeAngle)}`;
        outputs.theta.textContent = `${state.theta}°`;
        outputs.height.textContent = `${state.height} m`;

        if (calc.isValid) {
            outputs.stageStatus.textContent = "可與斜面交會";
            outputs.stageStatus.style.color = "var(--lime)";
        } else {
            outputs.stageStatus.textContent = "未與斜面交會";
            outputs.stageStatus.style.color = "var(--danger)";
        }

        updateFormulaCards(calc);
    }

    function updateFormulaCards(calc) {
        const beta = formatAngle(calc.relativeAngle);
        const invalidMessage = "目前沒有正時間交會，後續落點公式暫無有效結果。";

        outputs.formulaRelativeAngle.textContent = `β = ${formatAngle(state.alpha, 0)} − ${angleTerm(state.theta)} = ${beta}`;
        outputs.formulaTime.textContent = calc.isValid
            ? `t = 2 × ${state.v0} × sin(${beta}) ÷ [9.8 × cos(${formatAngle(state.theta, 0)})] = ${formatMetric(calc.time, "秒")}`
            : calc.isVerticalSlope
                ? `θ = ${formatAngle(state.theta, 0)} 時斜面為垂直線，國中斜面模型暫不計算交會時間`
            : `t = 2 × ${state.v0} × sin(${beta}) ÷ [9.8 × cos(${formatAngle(state.theta, 0)})] = ${formatMetric(calc.time, "秒")}，所以無效`;
        outputs.formulaHorizontal.textContent = calc.isValid
            ? `X = ${state.v0} × cos(${formatAngle(state.alpha, 0)}) × ${formatNumber(calc.time, 2)} = ${formatMetric(calc.x, "m")}`
            : invalidMessage;
        outputs.formulaVertical.textContent = calc.isValid
            ? `Y = ${formatNumber(calc.x, 2)} × tan(${formatAngle(state.theta, 0)}) = ${formatMetric(calc.y, "m")}`
            : invalidMessage;
        outputs.formulaDistance.textContent = calc.isValid
            ? `PT = √(${formatNumber(calc.x, 2)}² + ${formatNumber(calc.y, 2)}²) = ${formatMetric(calc.distance, "m")}`
            : invalidMessage;
        outputs.formulaAltitude.textContent = calc.isValid
            ? `落點海拔 = ${state.height} + ${formatNumber(calc.y, 2)} = ${formatMetric(calc.targetAltitude, "m")}`
            : invalidMessage;
        outputs.formulaPeakTime.textContent = `t最高 = ${state.v0} × sin(${formatAngle(state.alpha, 0)}) ÷ 9.8 = ${formatMetric(calc.apexTime, "秒")}`;
        outputs.formulaPeakAltitude.textContent = `最高點海拔 = ${state.height} + ${state.v0} × sin(${formatAngle(state.alpha, 0)}) × ${formatNumber(calc.apexTime, 2)} − 4.9 × ${formatNumber(calc.apexTime, 2)}² = ${formatMetric(calc.apexAltitude, "m")}`;

        [
            outputs.formulaTime,
            outputs.formulaHorizontal,
            outputs.formulaVertical,
            outputs.formulaDistance,
            outputs.formulaAltitude,
        ].forEach((formula) => {
            formula.classList.toggle("is-invalid", !calc.isValid);
        });
    }

    function computeBounds(calc) {
        const xs = calc.samples.map((point) => point.x);
        const ys = calc.samples.map((point) => point.y);

        xs.push(0, calc.isValid ? calc.x : Math.max(40, state.v0));
        ys.push(0, state.height, calc.isValid ? calc.targetAltitude : state.height, calc.apexAltitude);

        let minX = Math.min(...xs);
        let maxX = Math.max(...xs);
        let rangeX = Math.max(maxX - minX, 20);
        minX -= rangeX * 0.12;
        maxX += rangeX * 0.12;

        let minY = Math.min(...ys);
        let maxY = Math.max(...ys);
        let rangeY = Math.max(maxY - minY, 20);
        minY -= rangeY * 0.16;
        maxY += rangeY * 0.2;

        if (Math.abs(maxX - minX) < 20) {
            maxX += 10;
            minX -= 10;
        }

        if (Math.abs(maxY - minY) < 20) {
            maxY += 10;
            minY -= 10;
        }

        return { minX, maxX, minY, maxY };
    }

    function getResultStripLayout(width, height) {
        const columns = width >= 900 ? 6 : (width >= 520 ? 3 : 2);
        const stripHeight = columns === 6
            ? Math.min(86, Math.max(76, height * 0.13))
            : columns === 3
                ? Math.min(118, Math.max(104, height * 0.18))
                : Math.min(156, Math.max(136, height * 0.28));

        return {
            columns,
            margin: 12,
            stripHeight,
        };
    }

    function createProjector(bounds, width, height) {
        const resultStripLayout = getResultStripLayout(Math.max(260, width - 96), height);
        const resultStripPadding = resultStripLayout.stripHeight + resultStripLayout.margin * 2 + 16;
        const padding = {
            top: 46,
            right: 34,
            bottom: resultStripPadding,
            left: 70,
        };

        const plotWidth = Math.max(10, width - padding.left - padding.right);
        const plotHeight = Math.max(10, height - padding.top - padding.bottom);
        const rangeX = bounds.maxX - bounds.minX;
        const rangeY = bounds.maxY - bounds.minY;

        return {
            padding,
            toCanvas(x, y) {
                return {
                    x: padding.left + ((x - bounds.minX) / rangeX) * plotWidth,
                    y: padding.top + (1 - (y - bounds.minY) / rangeY) * plotHeight,
                };
            },
            fromCanvasX(px) {
                return bounds.minX + ((px - padding.left) / plotWidth) * rangeX;
            },
        };
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        render();
    }

    function render() {
        const calc = calculateTrajectory();
        updateValues(calc);

        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return;
        }

        drawScene(calc, rect.width, rect.height);
    }

    function drawScene(calc, width, height) {
        ctx.clearRect(0, 0, width, height);
        drawBackground(width, height);

        const bounds = computeBounds(calc);
        const projector = createProjector(bounds, width, height);

        drawGrid(bounds, projector, width, height);
        drawLaunchReferenceLine(projector, width);
        drawSlope(calc, bounds, projector);
        drawTrajectory(calc, projector);
        drawSlopeDistanceGuide(calc, projector);
        drawLaunchVector(calc, projector);
        drawPoint(projector.toCanvas(0, state.height), "P", "#ffc75a", -18, -12);

        if (calc.isValid) {
            drawPoint(projector.toCanvas(calc.x, calc.targetAltitude), "T", "#62e6a6", 12, -12);
        } else {
            drawWarning(width);
        }

        drawResultStrip(calc, width, height, projector);
    }

    function drawBackground(width, height) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#06101e");
        gradient.addColorStop(0.55, "#0b1c30");
        gradient.addColorStop(1, "#101a2c");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 120; i += 1) {
            const x = pseudoRandom(i, 17) * width;
            const y = pseudoRandom(i, 43) * height;
            const radius = 0.45 + pseudoRandom(i, 91) * 1.25;
            ctx.globalAlpha = 0.18 + pseudoRandom(i, 31) * 0.32;
            ctx.fillStyle = i % 9 === 0 ? "#b9ec46" : "#d8f6ff";
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, tau);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    function pseudoRandom(index, salt) {
        const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
        return value - Math.floor(value);
    }

    function drawGrid(bounds, projector, width, height) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
        ctx.lineWidth = 1;

        const xStep = niceStep(bounds.maxX - bounds.minX);
        const yStep = niceStep(bounds.maxY - bounds.minY);

        for (let x = Math.ceil(bounds.minX / xStep) * xStep; x <= bounds.maxX; x += xStep) {
            const point = projector.toCanvas(x, 0);
            ctx.beginPath();
            ctx.moveTo(point.x, 0);
            ctx.lineTo(point.x, height);
            ctx.stroke();
        }

        for (let y = Math.ceil(bounds.minY / yStep) * yStep; y <= bounds.maxY; y += yStep) {
            const point = projector.toCanvas(0, y);
            ctx.beginPath();
            ctx.moveTo(0, point.y);
            ctx.lineTo(width, point.y);
            ctx.stroke();
        }

        const origin = projector.toCanvas(0, 0);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, height);
        ctx.moveTo(0, origin.y);
        ctx.lineTo(width, origin.y);
        ctx.stroke();

        ctx.fillStyle = "rgba(191, 204, 218, 0.72)";
        ctx.font = "12px Microsoft JhengHei, sans-serif";
        ctx.fillText("海平面 y = 0", Math.min(origin.x + 8, width - 96), Math.max(origin.y - 8, 18));
        ctx.restore();
    }

    function drawLaunchReferenceLine(projector, width) {
        const launchPoint = projector.toCanvas(0, state.height);

        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.shadowColor = "rgba(255, 255, 255, 0.55)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, launchPoint.y);
        ctx.lineTo(width, launchPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        const labelX = Math.min(Math.max(launchPoint.x + 12, 12), width - 150);
        drawCanvasLabel("P 點水平參考線", labelX, launchPoint.y - 8, "rgba(255, 255, 255, 0.92)");
        ctx.restore();
    }

    function niceStep(range) {
        const target = range / 6;
        const magnitude = 10 ** Math.floor(Math.log10(target));
        const normalized = target / magnitude;

        if (normalized < 1.5) {
            return magnitude;
        }

        if (normalized < 3.5) {
            return 2 * magnitude;
        }

        if (normalized < 7.5) {
            return 5 * magnitude;
        }

        return 10 * magnitude;
    }

    function drawSlope(calc, bounds, projector) {
        if (calc.isVerticalSlope) {
            const a = projector.toCanvas(0, bounds.minY);
            const b = projector.toCanvas(0, bounds.maxY);
            const mid = projector.toCanvas(0, (bounds.minY + bounds.maxY) / 2);

            ctx.save();
            ctx.strokeStyle = "#a78bfa";
            ctx.lineWidth = 3;
            ctx.shadowColor = "rgba(167, 139, 250, 0.35)";
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
            drawCanvasLabel("垂直斜面 L", mid.x + 10, mid.y - 8, "#a78bfa");
            ctx.restore();
            return;
        }

        const segment = getSlopeSegmentWithinBounds(calc, bounds);
        if (!segment) {
            return;
        }

        const a = projector.toCanvas(segment.start.x, segment.start.y);
        const b = projector.toCanvas(segment.end.x, segment.end.y);
        const mid = projector.toCanvas(
            (segment.start.x + segment.end.x) / 2,
            (segment.start.y + segment.end.y) / 2
        );

        ctx.save();
        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(167, 139, 250, 0.35)";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        drawCanvasLabel("斜面 L", mid.x + 10, mid.y - 8, "#a78bfa");
        ctx.restore();
    }

    function getSlopeSegmentWithinBounds(calc, bounds) {
        const slope = Math.tan(calc.thetaRad);
        const candidates = [];

        addSlopeCandidate(bounds.minX, state.height + bounds.minX * slope);
        addSlopeCandidate(bounds.maxX, state.height + bounds.maxX * slope);

        if (Math.abs(slope) > 0.0001) {
            addSlopeCandidate((bounds.minY - state.height) / slope, bounds.minY);
            addSlopeCandidate((bounds.maxY - state.height) / slope, bounds.maxY);
        }

        if (candidates.length < 2) {
            return null;
        }

        let bestPair = [candidates[0], candidates[1]];
        let bestDistance = -Infinity;
        for (let i = 0; i < candidates.length; i += 1) {
            for (let j = i + 1; j < candidates.length; j += 1) {
                const distance = Math.hypot(candidates[i].x - candidates[j].x, candidates[i].y - candidates[j].y);
                if (distance > bestDistance) {
                    bestDistance = distance;
                    bestPair = [candidates[i], candidates[j]];
                }
            }
        }

        return {
            start: bestPair[0],
            end: bestPair[1],
        };

        function addSlopeCandidate(x, y) {
            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return;
            }

            const tolerance = 0.0001;
            const isInside =
                x >= bounds.minX - tolerance &&
                x <= bounds.maxX + tolerance &&
                y >= bounds.minY - tolerance &&
                y <= bounds.maxY + tolerance;

            if (!isInside) {
                return;
            }

            const isDuplicate = candidates.some((point) => {
                return Math.abs(point.x - x) < tolerance && Math.abs(point.y - y) < tolerance;
            });

            if (!isDuplicate) {
                candidates.push({ x, y });
            }
        }
    }

    function drawTrajectory(calc, projector) {
        ctx.save();
        ctx.strokeStyle = calc.isValid ? "#39d6f5" : "#ff6b7a";
        ctx.lineWidth = 3;
        ctx.shadowColor = calc.isValid ? "rgba(57, 214, 245, 0.45)" : "rgba(255, 107, 122, 0.35)";
        ctx.shadowBlur = 18;

        if (!calc.isValid) {
            ctx.setLineDash([8, 7]);
        }

        ctx.beginPath();
        calc.samples.forEach((point, index) => {
            const canvasPoint = projector.toCanvas(point.x, point.y);
            if (index === 0) {
                ctx.moveTo(canvasPoint.x, canvasPoint.y);
            } else {
                ctx.lineTo(canvasPoint.x, canvasPoint.y);
            }
        });
        ctx.stroke();
        ctx.restore();
    }

    function drawSlopeDistanceGuide(calc, projector) {
        if (!calc.isValid) {
            return;
        }

        const start = projector.toCanvas(0, state.height);
        const end = projector.toCanvas(calc.x, calc.targetAltitude);
        const mid = projector.toCanvas(calc.x / 2, state.height + calc.y / 2);

        ctx.save();
        ctx.strokeStyle = "#ffc75a";
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 6]);
        ctx.shadowColor = "rgba(255, 199, 90, 0.28)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        drawCanvasLabel(`PT ${formatMetric(calc.distance, "m")}`, mid.x + 10, mid.y - 12, "#ffc75a");
        ctx.restore();
    }

    function drawLaunchVector(calc, projector) {
        const start = projector.toCanvas(0, state.height);
        const bounds = computeBounds(calc);
        const scale = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.13;
        const end = projector.toCanvas(
            Math.cos(calc.alphaRad) * scale,
            state.height + Math.sin(calc.alphaRad) * scale
        );

        ctx.save();
        ctx.strokeStyle = "#ffc75a";
        ctx.fillStyle = "#ffc75a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - 10 * Math.cos(angle - Math.PI / 6), end.y - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - 10 * Math.cos(angle + Math.PI / 6), end.y - 10 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        drawCanvasLabel("V₀", end.x + 8, end.y - 8, "#ffc75a");
        ctx.restore();
    }

    function drawPoint(point, label, color, labelDx, labelDy) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, tau);
        ctx.fill();
        ctx.shadowBlur = 0;
        drawCanvasLabel(label, point.x + labelDx, point.y + labelDy, color);
        ctx.restore();
    }

    function drawResultStrip(calc, width, height, projector) {
        const origin = projector.toCanvas(0, 0);
        const axisGap = 8;
        const margin = 12;
        const minimumPanelWidth = Math.min(180, width - margin * 2);
        const x = Math.min(
            Math.max(margin, origin.x + axisGap),
            Math.max(margin, width - minimumPanelWidth - margin)
        );
        const panelWidth = width - x - margin;
        const layout = getResultStripLayout(panelWidth, height);
        const availableBelowXAxis = height - (origin.y + axisGap) - margin;
        const stripHeight = Math.min(layout.stripHeight, Math.max(40, availableBelowXAxis));
        const y = origin.y + axisGap;
        const columns = layout.columns;
        const panelRadius = 10;
        const statusText = calc.isValid ? "軌跡有效" : "角度無效";
        const statusColor = calc.isValid ? "#62e6a6" : "#ff6b7a";
        const valueColors = ["#62e6a6", "#39d6f5", "#ffc75a", "#f05bb5", "#7db7ff", "#ffffff"];
        const resultItems = calc.isValid
            ? [
                ["飛行時間", formatMetric(calc.time, "s")],
                ["水平距離 X", formatMetric(calc.x, "m")],
                ["升降高度 Y", formatMetric(calc.y, "m")],
                ["PT 斜面直線距離", formatMetric(calc.distance, "m")],
                ["落點海拔", formatMetric(calc.targetAltitude, "m")],
                ["最高點海拔", formatMetric(calc.apexAltitude, "m")],
            ]
            : [
                ["飛行時間", "無正時間交會"],
                ["水平距離 X", "-- m"],
                ["升降高度 Y", "-- m"],
                ["PT 斜面直線距離", "-- m"],
                ["落點海拔", "-- m"],
                ["最高點海拔", formatMetric(calc.apexAltitude, "m")],
            ];

        ctx.save();
        roundedRect(ctx, x, y, panelWidth, stripHeight, panelRadius);
        const panelGradient = ctx.createLinearGradient(x, y, x + panelWidth, y + stripHeight);
        panelGradient.addColorStop(0, "rgba(5, 19, 34, 0.94)");
        panelGradient.addColorStop(0.55, "rgba(9, 31, 51, 0.9)");
        panelGradient.addColorStop(1, "rgba(6, 16, 30, 0.92)");
        ctx.fillStyle = panelGradient;
        ctx.fill();
        ctx.strokeStyle = "rgba(57, 214, 245, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#39d6f5";
        ctx.shadowColor = "rgba(57, 214, 245, 0.45)";
        ctx.shadowBlur = 12;
        ctx.font = "800 14px Cascadia Code, Consolas, monospace";
        ctx.fillText("解算結果 / 斜面交會", x + 16, y + 23);
        ctx.shadowBlur = 0;

        ctx.font = "800 11px Cascadia Code, Consolas, monospace";
        const badgeTextWidth = ctx.measureText(statusText).width + 18;
        const badgeX = x + panelWidth - badgeTextWidth - 14;
        roundedRect(ctx, badgeX, y + 8, badgeTextWidth, 24, 999);
        ctx.fillStyle = calc.isValid ? "rgba(98, 230, 166, 0.16)" : "rgba(255, 107, 122, 0.16)";
        ctx.fill();
        ctx.strokeStyle = statusColor;
        ctx.stroke();
        ctx.fillStyle = statusColor;
        ctx.fillText(statusText, badgeX + 9, y + 24);

        const gridTop = y + (columns === 6 ? 38 : 42);
        const gridHeight = stripHeight - (columns === 6 ? 44 : 48);
        const rows = Math.ceil(resultItems.length / columns);
        const cellWidth = panelWidth / columns;
        const cellHeight = gridHeight / rows;

        resultItems.forEach(([label, value], index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const cellX = x + col * cellWidth + 16;
            const cellY = gridTop + row * cellHeight;

            ctx.fillStyle = "#9fb1c4";
            ctx.font = "700 11px Microsoft JhengHei, sans-serif";
            ctx.fillText(label, cellX, cellY + 10);

            ctx.fillStyle = calc.isValid || label === "最高點海拔" ? valueColors[index % valueColors.length] : "#7f8fa2";
            ctx.font = "800 15px Cascadia Code, Consolas, monospace";
            ctx.fillText(value, cellX, cellY + 31);
        });

        ctx.restore();
    }

    function drawCanvasLabel(text, x, y, color) {
        ctx.save();
        ctx.font = "700 13px Microsoft JhengHei, sans-serif";
        const metrics = ctx.measureText(text);
        const width = metrics.width + 16;
        const height = 24;
        roundedRect(ctx, x - 6, y - 17, width, height, 5);
        ctx.fillStyle = "rgba(6, 16, 30, 0.78)";
        ctx.fill();
        ctx.fillStyle = color;
        ctx.fillText(text, x + 2, y);
        ctx.restore();
    }

    function roundedRect(context, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        context.beginPath();
        context.moveTo(x + r, y);
        context.arcTo(x + width, y, x + width, y + height, r);
        context.arcTo(x + width, y + height, x, y + height, r);
        context.arcTo(x, y + height, x, y, r);
        context.arcTo(x, y, x + width, y, r);
        context.closePath();
    }

    function drawWarning(width) {
        ctx.save();
        const text = "目前 α − θ ≤ 0，拋體不會在正時間重新命中斜面";
        ctx.font = "700 15px Microsoft JhengHei, sans-serif";
        const textWidth = ctx.measureText(text).width;
        const boxWidth = Math.min(width - 32, textWidth + 34);
        roundedRect(ctx, 16, 22, boxWidth, 42, 7);
        ctx.fillStyle = "rgba(255, 107, 122, 0.12)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 107, 122, 0.45)";
        ctx.stroke();
        ctx.fillStyle = "#ff9aa5";
        ctx.fillText(text, 32, 49);
        ctx.restore();
    }

    function syncStateFromControls() {
        state.v0 = Number(controls.v0.value);
        state.alpha = Number(controls.alpha.value);
        state.theta = Number(controls.theta.value);
        state.height = Number(controls.height.value);
    }

    function setControls(nextState) {
        Object.entries(nextState).forEach(([key, value]) => {
            if (controls[key]) {
                controls[key].value = String(value);
            }
        });
        syncStateFromControls();
        render();
    }

    Object.values(controls).forEach((control) => {
        control.addEventListener("input", () => {
            syncStateFromControls();
            render();
        });
    });

    document.getElementById("btn-reset").addEventListener("click", () => {
        setControls({ v0: 50, alpha: 45, theta: 0, height: 0 });
    });

    document.getElementById("btn-demo").addEventListener("click", () => {
        setControls({ v0: 86, alpha: 58, theta: 24, height: 320 });
    });

    function openModal(id) {
        const modal = document.getElementById(id);
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        const closeButton = modal.querySelector("[data-close-modal]");
        if (closeButton) {
            closeButton.focus();
        }
    }

    function closeModal(modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
    }

    document.getElementById("btn-guide").addEventListener("click", () => openModal("modal-guide"));
    document.getElementById("btn-formula").addEventListener("click", () => openModal("modal-formula"));

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

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            document.querySelectorAll(".modal.is-open").forEach(closeModal);
        }
    });

    window.addEventListener("resize", resizeCanvas);

    syncStateFromControls();
    resizeCanvas();
})();
