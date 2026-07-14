(function () {
    "use strict";

    const g = 9.8;
    const tau = Math.PI * 2;
    const familyOrder = ["p", "q"];

    const familyDefinitions = {
        p: {
            label: "P",
            colors: {
                point: "#ffc75a",
                launch: "#ffc75a",
                horizontal: "#5db7ff",
                vertical: "#f4f7ff",
                trajectory: "#39d6f5",
                trajectoryGlow: "rgba(57, 214, 245, 0.45)",
                landing: "#62e6a6",
                vectorGlow: "rgba(255, 199, 90, 0.32)",
            },
        },
        q: {
            label: "Q",
            colors: {
                point: "#d65cff",
                launch: "#d65cff",
                horizontal: "#ff8c42",
                vertical: "#7ee787",
                trajectory: "#ff304f",
                trajectoryGlow: "rgba(255, 48, 79, 0.45)",
                landing: "#ff6379",
                vectorGlow: "rgba(214, 92, 255, 0.32)",
            },
        },
    };

    function createFamily(key, definition) {
        const controls = {
            v0: document.getElementById(`input-${key}-v0`),
            alpha: document.getElementById(`input-${key}-alpha`),
            height: document.getElementById(`input-${key}-height`),
        };

        return {
            key,
            label: definition.label,
            colors: definition.colors,
            controls,
            outputs: {
                v0: document.getElementById(`${key}-v0-value`),
                alpha: document.getElementById(`${key}-alpha-value`),
                height: document.getElementById(`${key}-height-value`),
                stageStatus: document.getElementById(`${key}-stage-status`),
                formulaHorizontalVelocity: document.getElementById(`formula-${key}-horizontal-velocity`),
                formulaVerticalVelocity: document.getElementById(`formula-${key}-vertical-velocity`),
                formulaTime: document.getElementById(`formula-${key}-time`),
                formulaHorizontal: document.getElementById(`formula-${key}-horizontal`),
                formulaPeakTime: document.getElementById(`formula-${key}-peak-time`),
                formulaPeakAltitude: document.getElementById(`formula-${key}-peak-altitude`),
            },
            solveButton: document.getElementById(`btn-solve-${key}`),
            solveState: document.getElementById(`${key}-solve-state`),
            displayToggleButtons: {
                all: document.getElementById(`btn-toggle-${key}-lines`),
                components: document.getElementById(`btn-toggle-${key}-components`),
            },
            state: {
                v0: Number(controls.v0.value),
                alpha: Number(controls.alpha.value),
                height: Number(controls.height.value),
            },
            display: {
                launchVector: true,
                horizontalVector: true,
                verticalVector: true,
                trajectory: true,
            },
            solvedCalculation: null,
            animationProgress: 0,
            animationFrame: null,
        };
    }

    const families = Object.fromEntries(
        familyOrder.map((key) => [key, createFamily(key, familyDefinitions[key])])
    );

    const canvas = document.getElementById("trajectory-canvas");
    const ctx = canvas.getContext("2d");
    const zoomInButton = document.getElementById("btn-zoom-in");
    const zoomOutButton = document.getElementById("btn-zoom-out");
    const defaultScaleButton = document.getElementById("btn-default-scale");
    const fitViewButton = document.getElementById("btn-fit-view");
    const stageDisplayControls = document.querySelector(".stage-display-controls");
    const projectileLayout = document.querySelector(".projectile-layout");
    const stage = document.querySelector(".stage");
    const controlPanelToggle = document.getElementById("btn-toggle-control-panel");
    const controlPanelToggleIcon = document.getElementById("control-panel-toggle-icon");
    const controlPanelFullscreen = document.getElementById("btn-fullscreen-control-panel");
    const controlPanelFullscreenIcon = document.getElementById("control-panel-fullscreen-icon");
    const view = {
        centerX: 0,
        centerY: 0,
        scale: 1,
        defaultScale: null,
        initialized: false,
        userAdjusted: false,
    };
    const pan = {
        active: false,
        pointerId: null,
        lastX: 0,
        lastY: 0,
    };
    let hasStartedSolve = false;

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

    function formulaFraction(numerator, denominator) {
        return `<span class="formula-fraction"><span>${numerator}</span><span>${denominator}</span></span>`;
    }

    function formulaResult(value) {
        return `<strong class="formula-result">${value}</strong>`;
    }

    function formulaDot() {
        return '<span class="formula-dot">‧</span>';
    }

    function setFormulaOutput(element, html, accessibleText) {
        element.innerHTML = html;
        element.setAttribute("aria-label", accessibleText);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function calculateTrajectory(family) {
        const { state } = family;
        const alphaRad = degToRad(state.alpha);
        const horizontalVelocity = state.v0 * Math.cos(alphaRad);
        const verticalVelocity = state.v0 * Math.sin(alphaRad);
        const discriminant = verticalVelocity * verticalVelocity + 2 * g * state.height;
        const time = (verticalVelocity + Math.sqrt(discriminant)) / g;
        const horizontalDistance = horizontalVelocity * time;
        const apexTime = Math.max(0, verticalVelocity / g);
        const apexAltitude = state.height + (verticalVelocity * verticalVelocity) / (2 * g);
        const calculation = {
            familyKey: family.key,
            v0: state.v0,
            alpha: state.alpha,
            height: state.height,
            alphaRad,
            horizontalVelocity,
            verticalVelocity,
            time,
            horizontalDistance,
            landingAltitude: 0,
            apexTime,
            apexAltitude,
            samples: [],
        };

        for (let i = 0; i <= 150; i += 1) {
            const sampleTime = (time * i) / 150;
            calculation.samples.push(i === 150
                ? { x: horizontalDistance, y: 0 }
                : pointAtTime(sampleTime, calculation));
        }

        return calculation;
    }

    function pointAtTime(time, calculation) {
        return {
            x: calculation.horizontalVelocity * time,
            y: calculation.height
                + calculation.verticalVelocity * time
                - 0.5 * g * time * time,
        };
    }

    function getPendingCalculations() {
        return Object.fromEntries(
            familyOrder.map((key) => [key, calculateTrajectory(families[key])])
        );
    }

    function getViewCalculations(pendingCalculations = getPendingCalculations()) {
        return familyOrder.map((key) => (
            families[key].solvedCalculation || pendingCalculations[key]
        ));
    }

    function updateValues(family, calculation) {
        const { state, outputs } = family;
        outputs.v0.textContent = `${state.v0} m/s`;
        outputs.alpha.textContent = `${state.alpha}°`;
        outputs.height.textContent = `${state.height} m`;
        updateFormulaCards(family, calculation);
    }

    function updateFormulaCards(family, calculation) {
        const { state, outputs, label } = family;
        const angle = formatAngle(state.alpha, 0);
        const horizontalVelocity = formatNumber(calculation.horizontalVelocity, 4);
        const verticalVelocity = formatNumber(calculation.verticalVelocity, 4);
        const flightTime = formatNumber(calculation.time, 4);
        const horizontalVelocityResult = formatMetric(calculation.horizontalVelocity, "m/s");
        const verticalVelocityResult = formatMetric(calculation.verticalVelocity, "m/s");
        const timeResult = formatMetric(calculation.time, "秒");
        const horizontalResult = formatMetric(calculation.horizontalDistance, "m");
        const peakTimeResult = formatMetric(calculation.apexTime, "秒");
        const peakAltitudeResult = formatMetric(calculation.apexAltitude, "m");
        const dot = formulaDot();

        setFormulaOutput(
            outputs.formulaHorizontalVelocity,
            `V<sub>${label},x</sub> = ${state.v0}${dot}cos ${angle} = ${formulaResult(horizontalVelocityResult)}`,
            `${label}：V ${label},x = ${state.v0} ‧ cos ${angle} = ${horizontalVelocityResult}`
        );
        setFormulaOutput(
            outputs.formulaVerticalVelocity,
            `V<sub>${label},y</sub> = ${state.v0}${dot}sin ${angle} = ${formulaResult(verticalVelocityResult)}`,
            `${label}：V ${label},y = ${state.v0} ‧ sin ${angle} = ${verticalVelocityResult}`
        );
        setFormulaOutput(
            outputs.formulaTime,
            `t<sub>${label}</sub> = ${formulaFraction(`${verticalVelocity} + √(${verticalVelocity}² + 2${dot}9.8${dot}${state.height})`, "9.8")} = ${formulaResult(timeResult)}`,
            `${label}：t = (${verticalVelocity} + √(${verticalVelocity}² + 2 ‧ 9.8 ‧ ${state.height})) / 9.8 = ${timeResult}`
        );
        setFormulaOutput(
            outputs.formulaPeakTime,
            `t<sub>${label},最高</sub> = ${formulaFraction(verticalVelocity, "9.8")} = ${formulaResult(peakTimeResult)}`,
            `${label}：t 最高 = ${verticalVelocity} / 9.8 = ${peakTimeResult}`
        );
        setFormulaOutput(
            outputs.formulaHorizontal,
            `X<sub>${label}</sub> = ${horizontalVelocity}${dot}${flightTime} = ${formulaResult(horizontalResult)}`,
            `${label}：X = ${horizontalVelocity} ‧ ${flightTime} = ${horizontalResult}`
        );
        setFormulaOutput(
            outputs.formulaPeakAltitude,
            `Y<sub>${label},最高</sub> = ${state.height} + ${formulaFraction(`${verticalVelocity}²`, `2${dot}9.8`)} = ${formulaResult(peakAltitudeResult)}`,
            `${label}：Y 最高 = ${state.height} + ${verticalVelocity}² / (2 ‧ 9.8) = ${peakAltitudeResult}`
        );
    }

    function computeBounds(calculations) {
        const xs = [0];
        const ys = [0];

        calculations.forEach((calculation) => {
            calculation.samples.forEach((point) => {
                xs.push(point.x);
                ys.push(point.y);
            });
            xs.push(calculation.horizontalDistance);
            ys.push(calculation.height, calculation.apexAltitude);
        });

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

    function getPlotArea(width, height) {
        const left = width < 480 ? 48 : 70;
        const right = Math.max(left + 10, width - 34);
        const top = 46;
        const displayControlsHeight = stageDisplayControls
            ? stageDisplayControls.getBoundingClientRect().height
            : 80;
        const bottomInset = Math.max(34, Math.ceil(displayControlsHeight) + 28);
        const bottom = Math.max(top + 10, height - bottomInset);

        return {
            left,
            right,
            top,
            bottom,
            width: Math.max(10, right - left),
            height: Math.max(10, bottom - top),
        };
    }

    function createProjector(width, height) {
        const plot = getPlotArea(width, height);
        const centerCanvasX = plot.left + plot.width / 2;
        const centerCanvasY = plot.top + plot.height / 2;

        return {
            plot,
            toCanvas(x, y) {
                return {
                    x: centerCanvasX + (x - view.centerX) * view.scale,
                    y: centerCanvasY - (y - view.centerY) * view.scale,
                };
            },
            fromCanvas(px, py) {
                return {
                    x: view.centerX + (px - centerCanvasX) / view.scale,
                    y: view.centerY - (py - centerCanvasY) / view.scale,
                };
            },
            bounds: {
                minX: view.centerX - plot.width / (2 * view.scale),
                maxX: view.centerX + plot.width / (2 * view.scale),
                minY: view.centerY - plot.height / (2 * view.scale),
                maxY: view.centerY + plot.height / (2 * view.scale),
            },
        };
    }

    function fitViewToCalculations(calculations, width, height, userAdjusted = true) {
        const bounds = computeBounds(calculations);
        const plot = getPlotArea(width, height);
        const rangeX = Math.max(20, bounds.maxX - bounds.minX);
        const groundGap = clamp(plot.height * 0.055, 18, 38);
        const groundCanvasY = plot.bottom - groundGap;
        const availableHeightAboveGround = Math.max(10, groundCanvasY - plot.top);
        const maximumAltitude = Math.max(20, bounds.maxY);
        const horizontalScale = plot.width / rangeX;
        const verticalScale = availableHeightAboveGround / maximumAltitude;
        const centerCanvasY = plot.top + plot.height / 2;

        view.centerX = (bounds.minX + bounds.maxX) / 2;
        view.scale = clamp(Math.min(horizontalScale, verticalScale), 0.01, 100);
        view.centerY = (groundCanvasY - centerCanvasY) / view.scale;
        view.initialized = true;
        view.userAdjusted = userAdjusted;
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (!view.initialized || !view.userAdjusted) {
            fitViewToCalculations(getViewCalculations(), rect.width, rect.height, false);
            view.defaultScale = view.scale;
        }
        render();
    }

    function render() {
        const pendingCalculations = getPendingCalculations();
        familyOrder.forEach((key) => updateValues(families[key], pendingCalculations[key]));

        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return;
        }

        drawScene(pendingCalculations, rect.width, rect.height);
    }

    function drawScene(pendingCalculations, width, height) {
        ctx.clearRect(0, 0, width, height);
        drawBackground(width, height);

        const projector = createProjector(width, height);
        drawGrid(projector.bounds, projector);
        drawGround(projector);

        familyOrder.forEach((key, index) => {
            drawLaunchReferenceLine(families[key], projector, index);
            drawAltitudeGuide(families[key], projector, index);
        });

        familyOrder.forEach((key) => {
            const family = families[key];
            if (!family.solvedCalculation) {
                return;
            }
            if (family.display.trajectory) {
                drawTrajectory(
                    family.solvedCalculation,
                    projector,
                    family.animationProgress,
                    family.colors
                );
            }
            if (family.animationProgress >= 1) {
                const landingPoint = projector.toCanvas(family.solvedCalculation.horizontalDistance, 0);
                drawPoint(
                    landingPoint,
                    `T_${family.label}`,
                    family.colors.landing,
                    12,
                    family.key === "p" ? -30 : 22
                );
            }
        });

        familyOrder.forEach((key) => {
            drawVelocityVectors(families[key], pendingCalculations[key], projector);
        });
        drawLaunchPoints(projector);
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

    function drawGrid(bounds, projector) {
        const { plot } = projector;
        ctx.save();
        ctx.beginPath();
        ctx.rect(plot.left, plot.top, plot.width, plot.height);
        ctx.clip();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
        ctx.lineWidth = 1;

        const xStep = niceStep(bounds.maxX - bounds.minX);
        const yStep = niceStep(bounds.maxY - bounds.minY);

        for (let x = Math.ceil(bounds.minX / xStep) * xStep; x <= bounds.maxX; x += xStep) {
            const point = projector.toCanvas(x, 0);
            ctx.beginPath();
            ctx.moveTo(point.x, plot.top);
            ctx.lineTo(point.x, plot.bottom);
            ctx.stroke();
        }

        for (let y = Math.ceil(bounds.minY / yStep) * yStep; y <= bounds.maxY; y += yStep) {
            const point = projector.toCanvas(0, y);
            ctx.beginPath();
            ctx.moveTo(plot.left, point.y);
            ctx.lineTo(plot.right, point.y);
            ctx.stroke();
        }

        const origin = projector.toCanvas(0, 0);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.beginPath();
        ctx.moveTo(origin.x, plot.top);
        ctx.lineTo(origin.x, plot.bottom);
        ctx.moveTo(plot.left, origin.y);
        ctx.lineTo(plot.right, origin.y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "rgba(196, 215, 231, 0.72)";
        ctx.font = "600 10px Cascadia Code, Consolas, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        for (let x = Math.ceil(bounds.minX / xStep) * xStep; x <= bounds.maxX; x += xStep) {
            const point = projector.toCanvas(x, 0);
            if (point.x >= plot.left + 16 && point.x <= plot.right - 16) {
                ctx.fillText(formatTick(x), point.x, plot.bottom + 5);
            }
        }

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        for (let y = Math.ceil(bounds.minY / yStep) * yStep; y <= bounds.maxY; y += yStep) {
            const point = projector.toCanvas(0, y);
            if (point.y >= plot.top + 8 && point.y <= plot.bottom - 8) {
                ctx.fillText(formatTick(y), plot.left - 7, point.y);
            }
        }
        ctx.restore();
    }

    function formatTick(value) {
        const absolute = Math.abs(value);
        const digits = absolute > 0 && absolute < 1 ? 2 : (absolute < 10 ? 1 : 0);
        return Number(value.toFixed(digits)).toLocaleString("zh-TW");
    }

    function drawGround(projector) {
        const { plot } = projector;
        const origin = projector.toCanvas(0, 0);

        ctx.save();
        ctx.beginPath();
        ctx.rect(plot.left, plot.top, plot.width, plot.height);
        ctx.clip();
        const groundGradient = ctx.createLinearGradient(0, origin.y, 0, plot.bottom);
        groundGradient.addColorStop(0, "rgba(185, 236, 70, 0.13)");
        groundGradient.addColorStop(1, "rgba(13, 32, 53, 0.82)");
        ctx.fillStyle = groundGradient;
        ctx.fillRect(
            plot.left,
            Math.max(plot.top, origin.y),
            plot.width,
            Math.max(0, plot.bottom - Math.max(plot.top, origin.y))
        );

        ctx.strokeStyle = "#b9ec46";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(185, 236, 70, 0.42)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(plot.left, origin.y);
        ctx.lineTo(plot.right, origin.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        if (origin.y >= plot.top && origin.y <= plot.bottom) {
            drawCanvasLabel(
                "地表 y = 0",
                Math.min(Math.max(origin.x + 40, plot.left + 8), plot.right - 105),
                origin.y - 10,
                "#b9ec46"
            );
            drawCanvasLabel("水平位移X", plot.right - 112, origin.y + 28, "#39d6f5");
        }

        ctx.save();
        ctx.translate(plot.left - 28, plot.top + plot.height * 0.62);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = "#ffc75a";
        ctx.font = "700 12px Microsoft JhengHei, sans-serif";
        ctx.fillText("y 海拔／垂直位移", 0, 0);
        ctx.restore();
    }

    function drawLaunchReferenceLine(family, projector, index) {
        if (family.state.height <= 0) {
            return;
        }

        const { plot } = projector;
        const launchPoint = projector.toCanvas(0, family.state.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(plot.left, plot.top, plot.width, plot.height);
        ctx.clip();
        ctx.strokeStyle = family.colors.point;
        ctx.globalAlpha = 0.58;
        ctx.lineWidth = 1;
        ctx.setLineDash(index === 0 ? [6, 6] : [3, 5]);
        ctx.shadowColor = family.colors.point;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(plot.left, launchPoint.y);
        ctx.lineTo(plot.right, launchPoint.y);
        ctx.stroke();
        ctx.restore();

        if (launchPoint.y >= plot.top && launchPoint.y <= plot.bottom) {
            const labelX = Math.min(Math.max(launchPoint.x + 12, plot.left + 8), plot.right - 190);
            const labelY = launchPoint.y + (index === 0 ? -8 : 20);
            drawCanvasLabel(
                `${family.label}：發射點高度H${family.label}（Y軸）`,
                labelX,
                labelY,
                family.colors.point
            );
        }
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

    function drawTrajectory(calculation, projector, progress, colors) {
        const cappedProgress = clamp(progress, 0, 1);
        const finalIndex = cappedProgress * (calculation.samples.length - 1);
        const completeIndex = Math.floor(finalIndex);

        ctx.save();
        ctx.beginPath();
        ctx.rect(projector.plot.left, projector.plot.top, projector.plot.width, projector.plot.height);
        ctx.clip();
        ctx.beginPath();
        calculation.samples.slice(0, completeIndex + 1).forEach((point, index) => {
            const canvasPoint = projector.toCanvas(point.x, point.y);
            if (index === 0) {
                ctx.moveTo(canvasPoint.x, canvasPoint.y);
            } else {
                ctx.lineTo(canvasPoint.x, canvasPoint.y);
            }
        });

        if (completeIndex < calculation.samples.length - 1) {
            const start = calculation.samples[completeIndex];
            const end = calculation.samples[completeIndex + 1];
            const remainder = finalIndex - completeIndex;
            const canvasPoint = projector.toCanvas(
                start.x + (end.x - start.x) * remainder,
                start.y + (end.y - start.y) * remainder
            );
            ctx.lineTo(canvasPoint.x, canvasPoint.y);
        }

        ctx.strokeStyle = colors.trajectoryGlow;
        ctx.lineWidth = 7;
        ctx.shadowColor = colors.trajectoryGlow;
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.strokeStyle = colors.trajectory;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
    }

    function drawAltitudeGuide(family, projector, index) {
        if (family.state.height <= 0) {
            return;
        }

        const ground = projector.toCanvas(0, 0);
        const launch = projector.toCanvas(0, family.state.height);
        const guideOffset = index === 0 ? -3 : 3;

        ctx.save();
        ctx.strokeStyle = family.colors.point;
        ctx.lineWidth = 2;
        ctx.setLineDash(index === 0 ? [7, 6] : [3, 5]);
        ctx.shadowColor = family.colors.point;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(ground.x + guideOffset, ground.y);
        ctx.lineTo(launch.x + guideOffset, launch.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        drawCanvasLabel(
            `H${family.label} ${formatMetric(family.state.height, "m", 0)}`,
            launch.x + 12 + index * 4,
            (launch.y + ground.y) / 2 + index * 18,
            family.colors.point
        );
        ctx.restore();
    }

    function drawVelocityVectors(family, calculation, projector) {
        const start = projector.toCanvas(0, family.state.height);
        const minimumSpeed = Number(family.controls.v0.min);
        const maximumSpeed = Number(family.controls.v0.max);
        const speedRatio = clamp(
            (calculation.v0 - minimumSpeed) / (maximumSpeed - minimumSpeed),
            0,
            1
        );
        const minimumVectorLength = 34;
        const maximumVectorLength = clamp(projector.plot.width * 0.2, 96, 164);
        const vectorLength = minimumVectorLength
            + (maximumVectorLength - minimumVectorLength) * Math.sqrt(speedRatio);
        const referenceScale = Number.isFinite(view.defaultScale) && view.defaultScale > 0
            ? view.defaultScale
            : view.scale;
        const zoomRatio = view.scale / Math.max(referenceScale, Number.EPSILON);
        const velocityScale = (vectorLength * zoomRatio) / Math.max(calculation.v0, 1);
        const dx = calculation.horizontalVelocity * velocityScale;
        const dy = -calculation.verticalVelocity * velocityScale;
        const horizontalEnd = { x: start.x + dx, y: start.y };
        const verticalEnd = { x: start.x, y: start.y + dy };
        const velocityEnd = { x: start.x + dx, y: start.y + dy };
        const { display, colors, label } = family;

        if (display.horizontalVector) {
            drawArrow(start, horizontalEnd, colors.horizontal, [6, 5], colors.vectorGlow);
        }
        if (display.verticalVector) {
            drawArrow(start, verticalEnd, colors.vertical, [6, 5], colors.vectorGlow);
        }
        if (display.launchVector) {
            drawArrow(start, velocityEnd, colors.launch, [], colors.vectorGlow);
        }

        if (display.horizontalVector && Math.abs(dx) > 4) {
            drawCanvasVariableLabel(`${label},x`, horizontalEnd.x + 7, horizontalEnd.y + 18, colors.horizontal);
        }
        if (display.verticalVector && Math.abs(dy) > 4) {
            drawCanvasVariableLabel(`${label},y`, verticalEnd.x + 8, verticalEnd.y - 4, colors.vertical);
        }
        if (display.launchVector && Math.hypot(dx, dy) > 4) {
            drawCanvasVariableLabel(`${label}0`, velocityEnd.x + 8, velocityEnd.y - 8, colors.launch);
        }
    }

    function drawArrow(start, end, color, dash = [], glowColor = color) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        if (Math.hypot(dx, dy) < 2) {
            return;
        }

        const angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - 9 * Math.cos(angle - Math.PI / 6), end.y - 9 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - 9 * Math.cos(angle + Math.PI / 6), end.y - 9 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawLaunchPoints(projector) {
        const pFamily = families.p;
        const qFamily = families.q;
        const sameHeight = Math.abs(pFamily.state.height - qFamily.state.height) < Number.EPSILON;

        drawPoint(
            projector.toCanvas(0, pFamily.state.height),
            "P",
            pFamily.colors.point,
            -18,
            -12,
            sameHeight ? 8 : 6
        );
        drawPoint(
            projector.toCanvas(0, qFamily.state.height),
            "Q",
            qFamily.colors.point,
            sameHeight ? 14 : -18,
            sameHeight ? 19 : -12,
            sameHeight ? 4 : 6
        );
    }

    function drawPoint(point, label, color, labelDx, labelDy, radius = 6) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, tau);
        ctx.fill();
        ctx.shadowBlur = 0;
        drawCanvasLabel(label, point.x + labelDx, point.y + labelDy, color);
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

    function drawCanvasVariableLabel(subscript, x, y, color) {
        const baseFont = "700 13px Microsoft JhengHei, sans-serif";
        const subscriptFont = "700 9px Microsoft JhengHei, sans-serif";

        ctx.save();
        ctx.font = baseFont;
        const baseWidth = ctx.measureText("V").width;
        ctx.font = subscriptFont;
        const subscriptWidth = ctx.measureText(subscript).width;
        const width = baseWidth + subscriptWidth + 18;
        const height = 25;
        roundedRect(ctx, x - 6, y - 17, width, height, 5);
        ctx.fillStyle = "rgba(6, 16, 30, 0.78)";
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = baseFont;
        ctx.fillText("V", x + 2, y);
        ctx.font = subscriptFont;
        ctx.fillText(subscript, x + 2 + baseWidth, y + 4);
        ctx.restore();
    }

    function roundedRect(context, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        context.beginPath();
        context.moveTo(x + r, y);
        context.arcTo(x + width, y, x + width, y + height, r);
        context.arcTo(x + width, y + height, x, y + height, r);
        context.arcTo(x, y + height, x, y, r);
        context.arcTo(x, y, x + r, y, r);
        context.closePath();
    }

    function syncFamilyFromControls(family) {
        family.state.v0 = Number(family.controls.v0.value);
        family.state.alpha = Number(family.controls.alpha.value);
        family.state.height = Number(family.controls.height.value);
    }

    function cancelSolveAnimation(family) {
        if (family.animationFrame !== null) {
            window.cancelAnimationFrame(family.animationFrame);
            family.animationFrame = null;
        }
        family.solveButton.disabled = false;
    }

    function setSolveStatus(family, stageText, cardText) {
        family.outputs.stageStatus.textContent = stageText;
        family.solveState.textContent = cardText;
    }

    function invalidateSolution(family, message = "參數已變更，請重新解算") {
        cancelSolveAnimation(family);
        family.solvedCalculation = null;
        family.animationProgress = 0;
        setSolveStatus(family, message, "READY");
    }

    function startSolve(familyKey) {
        const family = families[familyKey];
        cancelSolveAnimation(family);
        family.solvedCalculation = calculateTrajectory(family);
        family.animationProgress = 0;

        const rect = canvas.getBoundingClientRect();
        if (!hasStartedSolve && !view.userAdjusted) {
            const pendingCalculations = getPendingCalculations();
            const fitCalculations = familyOrder.map((key) => (
                key === familyKey
                    ? family.solvedCalculation
                    : (families[key].solvedCalculation || pendingCalculations[key])
            ));
            fitViewToCalculations(fitCalculations, rect.width, rect.height, false);
            view.defaultScale = view.scale;
        }
        hasStartedSolve = true;

        family.solveButton.disabled = true;
        setSolveStatus(family, "軌跡解算中", "SOLVING");
        const duration = 1450;
        let startTime = null;

        function animate(timestamp) {
            if (startTime === null) {
                startTime = timestamp;
            }

            const linearProgress = clamp((timestamp - startTime) / duration, 0, 1);
            family.animationProgress = 1 - (1 - linearProgress) ** 3;
            render();

            if (linearProgress < 1) {
                family.animationFrame = window.requestAnimationFrame(animate);
                return;
            }

            family.animationProgress = 1;
            family.animationFrame = null;
            family.solveButton.disabled = false;
            setSolveStatus(family, "落點位於地表 y = 0", "DONE");
            render();
        }

        family.animationFrame = window.requestAnimationFrame(animate);
    }

    function zoomAtCanvasPoint(factor, canvasX, canvasY) {
        const rect = canvas.getBoundingClientRect();
        const beforeProjector = createProjector(rect.width, rect.height);
        const anchorBefore = beforeProjector.fromCanvas(canvasX, canvasY);
        view.scale = clamp(view.scale * factor, 0.01, 200);
        const afterProjector = createProjector(rect.width, rect.height);
        const anchorAfter = afterProjector.fromCanvas(canvasX, canvasY);
        view.centerX += anchorBefore.x - anchorAfter.x;
        view.centerY += anchorBefore.y - anchorAfter.y;
        view.initialized = true;
        view.userAdjusted = true;
        render();
    }

    function zoomFromCenter(factor) {
        const rect = canvas.getBoundingClientRect();
        const plot = getPlotArea(rect.width, rect.height);
        zoomAtCanvasPoint(factor, plot.left + plot.width / 2, plot.top + plot.height / 2);
    }

    function restoreDefaultScale() {
        if (!Number.isFinite(view.defaultScale) || view.defaultScale <= 0) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const plot = getPlotArea(rect.width, rect.height);
        zoomAtCanvasPoint(
            view.defaultScale / view.scale,
            plot.left + plot.width / 2,
            plot.top + plot.height / 2
        );
    }

    function setControlPanelCollapsed(collapsed) {
        if (collapsed) {
            setControlPanelFullscreen(false);
        }
        projectileLayout.classList.toggle("is-control-collapsed", collapsed);
        controlPanelToggle.setAttribute("aria-expanded", String(!collapsed));
        controlPanelToggleIcon.textContent = collapsed ? "‹" : "›";
        const label = collapsed ? "向左展開右側參數控制區" : "向右收合右側參數控制區";
        controlPanelToggle.setAttribute("aria-label", label);
        controlPanelToggle.title = label;
    }

    function setControlPanelFullscreen(fullscreen) {
        if (fullscreen) {
            projectileLayout.classList.remove("is-control-collapsed");
            controlPanelToggle.setAttribute("aria-expanded", "true");
            controlPanelToggleIcon.textContent = "›";
        }

        projectileLayout.classList.toggle("is-control-fullscreen", fullscreen);
        controlPanelFullscreen.setAttribute("aria-pressed", String(fullscreen));
        controlPanelFullscreenIcon.textContent = fullscreen ? "›" : "‹";
        const label = fullscreen ? "退出右側參數控制區全螢幕" : "向左全螢幕顯示右側參數控制區";
        controlPanelFullscreen.setAttribute("aria-label", label);
        controlPanelFullscreen.title = label;
    }

    function beginPan(event) {
        if (event.button !== 0) {
            return;
        }

        pan.active = true;
        pan.pointerId = event.pointerId;
        pan.lastX = event.clientX;
        pan.lastY = event.clientY;
        canvas.classList.add("is-panning");
        canvas.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    function movePan(event) {
        if (!pan.active || event.pointerId !== pan.pointerId) {
            return;
        }

        const deltaX = event.clientX - pan.lastX;
        const deltaY = event.clientY - pan.lastY;
        pan.lastX = event.clientX;
        pan.lastY = event.clientY;
        view.centerX -= deltaX / view.scale;
        view.centerY += deltaY / view.scale;
        view.initialized = true;
        view.userAdjusted = true;
        render();
        event.preventDefault();
    }

    function endPan(event) {
        if (!pan.active || (event.pointerId !== undefined && event.pointerId !== pan.pointerId)) {
            return;
        }

        if (pan.pointerId !== null && canvas.hasPointerCapture(pan.pointerId)) {
            canvas.releasePointerCapture(pan.pointerId);
        }
        pan.active = false;
        pan.pointerId = null;
        canvas.classList.remove("is-panning");
    }

    function setControls(nextStates) {
        familyOrder.forEach((key) => {
            const family = families[key];
            const nextState = nextStates[key];
            Object.entries(nextState).forEach(([stateKey, value]) => {
                if (family.controls[stateKey]) {
                    family.controls[stateKey].value = String(value);
                }
            });
            syncFamilyFromControls(family);
            invalidateSolution(family);
        });
        render();
    }

    function getLineVisibility(family) {
        return [
            family.display.launchVector,
            family.display.horizontalVector,
            family.display.verticalVector,
            family.display.trajectory,
        ];
    }

    function syncDisplayToggleStates(family) {
        const visibility = getLineVisibility(family);
        const allVisible = visibility.every(Boolean);
        const anyVisible = visibility.some(Boolean);
        family.displayToggleButtons.all.setAttribute(
            "aria-pressed",
            allVisible ? "true" : (anyVisible ? "mixed" : "false")
        );
        family.displayToggleButtons.all.title = anyVisible
            ? `隱藏 ${family.label} 點所有向量及拋物線`
            : `顯示 ${family.label} 點所有向量及拋物線`;

        const componentsVisible = family.display.horizontalVector && family.display.verticalVector;
        family.displayToggleButtons.components.setAttribute("aria-pressed", String(componentsVisible));
        family.displayToggleButtons.components.title = componentsVisible
            ? `隱藏 ${family.label} 初速度 V ${family.label}0 分量`
            : `顯示 ${family.label} 初速度 V ${family.label}0 分量`;
    }

    function setAllLinesVisible(family, visible) {
        family.display.launchVector = visible;
        family.display.horizontalVector = visible;
        family.display.verticalVector = visible;
        family.display.trajectory = visible;
        syncDisplayToggleStates(family);
        render();
    }

    function toggleComponentVectors(family) {
        const visible = !(family.display.horizontalVector && family.display.verticalVector);
        family.display.horizontalVector = visible;
        family.display.verticalVector = visible;
        syncDisplayToggleStates(family);
        render();
    }

    familyOrder.forEach((key) => {
        const family = families[key];
        Object.values(family.controls).forEach((control) => {
            control.addEventListener("input", () => {
                syncFamilyFromControls(family);
                invalidateSolution(family);
                render();
            });
        });
        family.solveButton.addEventListener("click", () => startSolve(key));
        family.displayToggleButtons.all.addEventListener("click", () => {
            setAllLinesVisible(family, !getLineVisibility(family).some(Boolean));
        });
        family.displayToggleButtons.components.addEventListener("click", () => {
            toggleComponentVectors(family);
        });
    });

    controlPanelToggle.addEventListener("click", () => {
        setControlPanelCollapsed(!projectileLayout.classList.contains("is-control-collapsed"));
    });
    controlPanelFullscreen.addEventListener("click", () => {
        setControlPanelFullscreen(!projectileLayout.classList.contains("is-control-fullscreen"));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && projectileLayout.classList.contains("is-control-fullscreen")) {
            setControlPanelFullscreen(false);
            controlPanelFullscreen.focus();
        }
    });

    canvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const factor = Math.exp(-event.deltaY * 0.0012);
        zoomAtCanvasPoint(factor, event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });
    canvas.addEventListener("pointerdown", beginPan);
    canvas.addEventListener("pointermove", movePan);
    canvas.addEventListener("pointerup", endPan);
    canvas.addEventListener("pointercancel", endPan);
    canvas.addEventListener("lostpointercapture", endPan);

    zoomInButton.addEventListener("click", () => zoomFromCenter(1.2));
    zoomOutButton.addEventListener("click", () => zoomFromCenter(1 / 1.2));
    defaultScaleButton.addEventListener("click", restoreDefaultScale);
    fitViewButton.addEventListener("click", () => {
        const rect = canvas.getBoundingClientRect();
        fitViewToCalculations(getViewCalculations(), rect.width, rect.height, true);
        render();
    });

    document.getElementById("btn-reset").addEventListener("click", () => {
        setControls({
            p: { v0: 50, alpha: 45, height: 0 },
            q: { v0: 70, alpha: 60, height: 100 },
        });
    });

    document.getElementById("btn-demo").addEventListener("click", () => {
        setControls({
            p: { v0: 86, alpha: 58, height: 320 },
            q: { v0: 120, alpha: 35, height: 120 },
        });
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

    if (typeof ResizeObserver !== "undefined") {
        const stageResizeObserver = new ResizeObserver(() => resizeCanvas());
        stageResizeObserver.observe(stage);
    }

    familyOrder.forEach((key) => {
        const family = families[key];
        syncFamilyFromControls(family);
        syncDisplayToggleStates(family);
        setSolveStatus(family, "等待解算", "READY");
    });
    resizeCanvas();
})();
