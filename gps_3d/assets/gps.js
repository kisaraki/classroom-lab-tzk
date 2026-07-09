(() => {
    "use strict";

    const THREE_UNAVAILABLE_MESSAGE = "3D 函式庫載入失敗，請確認網路連線後重新整理。";
    const SCALE_KM = 100;
    const EARTH_RADIUS_KM = 6371;
    const EARTH_RADIUS = EARTH_RADIUS_KM / SCALE_KM;
    const TARGETS = Object.freeze([
        { id: "yushan", name: "玉山", region: "臺灣 · 南投縣", kind: "山峰", lat: 23.47, lon: 120.957, elevationM: 3952 },
        { id: "taipei", name: "臺北", region: "臺灣 · 臺北市", kind: "城市中心", lat: 25.0333, lon: 121.5333, elevationM: 19 },
        { id: "london", name: "倫敦", region: "英國 · 英格蘭", kind: "城市中心", lat: 51.50853, lon: -0.12574, elevationM: 25 },
        { id: "washington-dc", name: "華盛頓特區", region: "美國 · 哥倫比亞特區", kind: "城市中心", lat: 38.8951118, lon: -77.0363658, elevationM: 7 },
        { id: "honolulu", name: "夏威夷（檀香山）", region: "美國 · 夏威夷州", kind: "城市代表點", lat: 21.3069444, lon: -157.8583333, elevationM: 5 },
        { id: "cape-town", name: "開普敦", region: "南非 · 西開普省", kind: "城市中心", lat: -33.925839, lon: 18.423218, elevationM: 25 },
        { id: "sydney", name: "雪梨", region: "澳洲 · 新南威爾斯州", kind: "城市中心", lat: -33.8694, lon: 151.2083, elevationM: 72 },
        { id: "everest", name: "聖母峰", region: "尼泊爾／中國 · 喜馬拉雅山", kind: "山峰", lat: 27.98791, lon: 86.92529, elevationM: 8848 },
        { id: "moscow", name: "莫斯科", region: "俄羅斯 · 莫斯科", kind: "城市中心", lat: 55.752043, lon: 37.617805, elevationM: 156 },
        { id: "stanley", name: "福克蘭群島（史坦利）", region: "英國海外領土 · 福克蘭群島", kind: "首府代表點", lat: -51.69382, lon: -57.85701, elevationM: 28 },
        { id: "rio-de-janeiro", name: "里約熱內盧", region: "巴西 · 里約熱內盧州", kind: "城市中心", lat: -22.90642, lon: -43.18223, elevationM: 5 }
    ]);
    const DISTANCE_TOLERANCE_KM = 150;

    const container = document.getElementById("canvas-container");

    if (typeof THREE === "undefined") {
        container.innerHTML = `<p style="padding:2rem;color:#ff6b7a">${THREE_UNAVAILABLE_MESSAGE}</p>`;
        return;
    }

    function latLonAltToVector3(lat, lon, altKm) {
        const radius = EARTH_RADIUS + altKm / SCALE_KM;
        const phi = lat * Math.PI / 180;
        const theta = lon * Math.PI / 180;

        return new THREE.Vector3(
            radius * Math.cos(phi) * Math.sin(theta),
            radius * Math.sin(phi),
            radius * Math.cos(phi) * Math.cos(theta)
        );
    }

    function formatDMS(degrees, isLatitude) {
        const direction = degrees >= 0
            ? (isLatitude ? "N" : "E")
            : (isLatitude ? "S" : "W");
        const absolute = Math.abs(degrees);
        const wholeDegrees = Math.floor(absolute);
        const minuteFloat = (absolute - wholeDegrees) * 60;
        const minutes = Math.floor(minuteFloat);
        const seconds = ((minuteFloat - minutes) * 60).toFixed(1);

        return `${wholeDegrees}° ${minutes}' ${seconds.padStart(4, "0")}" ${direction}`;
    }

    function formatLongitudeAsTime(longitude) {
        const normalizedLongitude = ((longitude % 360) + 360) % 360;
        const hoursFloat = normalizedLongitude / 15;
        const hours = Math.floor(hoursFloat);
        const minuteFloat = (hoursFloat - hours) * 60;
        const minutes = Math.floor(minuteFloat);
        const seconds = ((minuteFloat - minutes) * 60).toFixed(1);

        return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${seconds.padStart(4, "0")}s`;
    }

    function formatDecimalCoordinate(degrees, isLatitude) {
        const direction = degrees >= 0
            ? (isLatitude ? "N" : "E")
            : (isLatitude ? "S" : "W");
        return `${Math.abs(degrees).toFixed(6)}° ${direction}`;
    }

    function formatElevationMeters(elevationM) {
        return `${Math.round(elevationM).toLocaleString("zh-TW")} m`;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function createSeededRandom(seed) {
        let state = seed >>> 0;
        return () => {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    let activeTarget = TARGETS[0];
    let targetPosition = latLonAltToVector3(
        activeTarget.lat,
        activeTarget.lon,
        activeTarget.elevationM / 1000
    );
    const satellites = [
        { id: "A", color: 0x39d6f5, colorCss: "#39d6f5", lat: 40, lon: 130, altKm: 20200 },
        { id: "B", color: 0xb9ec46, colorCss: "#b9ec46", lat: 5, lon: 155, altKm: 20200 },
        { id: "C", color: 0xf05bb5, colorCss: "#f05bb5", lat: -10, lon: 95, altKm: 20200 },
        { id: "D", color: 0xffc75a, colorCss: "#ffc75a", lat: 35, lon: 90, altKm: 20200 },
        { id: "E", color: 0x9a8cff, colorCss: "#9a8cff", lat: -20, lon: 140, altKm: 20200 }
    ];

    let activeSatelliteCount = 3;
    let wireframeEnabled = true;
    let autoAnimationFrame = null;
    let wasPreciselyLocated = false;
    let audioContext = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06101e);
    scene.fog = new THREE.FogExp2(0x06101e, 0.00082);

    function createStarfield() {
        const random = createSeededRandom(20260709);
        const positions = [];
        const colors = [];

        for (let index = 0; index < 2200; index += 1) {
            const radius = 420 + random() * 430;
            const theta = random() * Math.PI * 2;
            const phi = Math.acos(2 * random() - 1);
            positions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
            );

            const tint = random();
            if (tint > 0.93) {
                colors.push(1, 0.78, 0.55);
            } else if (tint > 0.78) {
                colors.push(0.55, 0.82, 1);
            } else {
                const brightness = 0.58 + random() * 0.42;
                colors.push(brightness, brightness, brightness);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        return new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
                size: 1.35,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.9,
                vertexColors: true,
                depthWrite: false
            })
        );
    }

    function createSpiralGalaxy() {
        const random = createSeededRandom(314159);
        const positions = [];
        const colors = [];
        const arms = 4;

        for (let index = 0; index < 1800; index += 1) {
            const radius = Math.pow(random(), 0.62) * 150;
            const arm = index % arms;
            const angle = arm * Math.PI * 2 / arms + radius * 0.045 + (random() - 0.5) * 0.42;
            const spread = 2 + radius * 0.035;
            positions.push(
                Math.cos(angle) * radius + (random() - 0.5) * spread,
                (random() - 0.5) * (6 + radius * 0.035),
                Math.sin(angle) * radius + (random() - 0.5) * spread
            );

            const coreMix = 1 - radius / 150;
            colors.push(
                0.42 + coreMix * 0.5,
                0.58 + coreMix * 0.3,
                0.92
            );
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        const galaxy = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
                size: 1.5,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.64,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        galaxy.position.set(-300, 180, 180);
        galaxy.rotation.set(0.55, -0.3, -0.15);
        return galaxy;
    }

    function createNebulaSprite(colorStops, position, scale) {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext("2d");
        const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
        colorStops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);

        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(canvas),
                transparent: true,
                opacity: 0.38,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        sprite.position.set(...position);
        sprite.scale.set(...scale, 1);
        return sprite;
    }

    const starfield = createStarfield();
    const galaxy = createSpiralGalaxy();
    scene.add(starfield, galaxy);
    scene.add(
        createNebulaSprite(
            [[0, "rgba(57,214,245,0.28)"], [0.42, "rgba(31,89,145,0.14)"], [1, "rgba(0,0,0,0)"]],
            [-260, 130, 220],
            [360, 260]
        ),
        createNebulaSprite(
            [[0, "rgba(240,91,181,0.2)"], [0.48, "rgba(91,48,130,0.11)"], [1, "rgba(0,0,0,0)"]],
            [-160, -220, 280],
            [300, 220]
        )
    );

    const camera = new THREE.PerspectiveCamera(
        45,
        Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
        1,
        1000
    );
    camera.position.set(200, 150, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 95;
    controls.maxDistance = 620;

    scene.add(new THREE.AmbientLight(0x86a6bf, 0.3));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.84);
    directionalLight.position.set(200, 200, 100);
    scene.add(directionalLight);

    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x6f91a8,
        emissive: 0xffc77a,
        emissiveIntensity: 1.2,
        shininess: 12
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.rotation.y = -Math.PI / 2;
    scene.add(earthMesh);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    textureLoader.load(
        "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
        (texture) => {
            texture.encoding = THREE.sRGBEncoding;
            earthMaterial.map = texture;
            earthMaterial.needsUpdate = true;
        }
    );
    textureLoader.load(
        "https://threejs.org/examples/textures/planets/earth_lights_2048.png",
        (texture) => {
            texture.encoding = THREE.sRGBEncoding;
            earthMaterial.emissiveMap = texture;
            earthMaterial.needsUpdate = true;
        }
    );

    const earthGlow = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_RADIUS + 1.3, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0x39d6f5,
            transparent: true,
            opacity: 0.045,
            side: THREE.BackSide
        })
    );
    scene.add(earthGlow);

    const gridGroup = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({
        color: 0x4c829f,
        transparent: true,
        opacity: 0.35
    });
    const mainGridMaterial = new THREE.LineBasicMaterial({
        color: 0xc7eef6,
        transparent: true,
        opacity: 0.68
    });
    const gridAltitudeKm = 0.5;

    for (let latitude = -75; latitude <= 75; latitude += 15) {
        const points = [];
        for (let longitude = -180; longitude <= 180; longitude += 5) {
            points.push(latLonAltToVector3(latitude, longitude, gridAltitudeKm));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        gridGroup.add(new THREE.Line(
            geometry,
            latitude === 0 ? mainGridMaterial : gridMaterial
        ));
    }

    for (let longitude = -180; longitude < 180; longitude += 15) {
        const points = [];
        for (let latitude = -90; latitude <= 90; latitude += 5) {
            points.push(latLonAltToVector3(latitude, longitude, gridAltitudeKm));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        gridGroup.add(new THREE.Line(
            geometry,
            longitude === 0 ? mainGridMaterial : gridMaterial
        ));
    }
    scene.add(gridGroup);

    const targetMarker = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffc75a })
    );
    targetMarker.position.copy(targetPosition);
    scene.add(targetMarker);

    const targetHalo = new THREE.Mesh(
        new THREE.RingGeometry(2.1, 3.1, 32),
        new THREE.MeshBasicMaterial({
            color: 0xffc75a,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide
        })
    );
    targetHalo.position.copy(targetPosition);
    targetHalo.lookAt(targetPosition.clone().multiplyScalar(2));
    scene.add(targetHalo);

    function createTextSprite(text, color) {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext("2d");

        context.fillStyle = color;
        context.font = "700 42px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowColor = "rgba(0, 0, 0, 0.9)";
        context.shadowBlur = 7;
        context.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            depthTest: false,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(15, 7.5, 1);
        return sprite;
    }

    function updateSatellitePosition(satellite) {
        satellite.position = latLonAltToVector3(
            satellite.lat,
            satellite.lon,
            satellite.altKm
        );
        satellite.mesh.position.copy(satellite.position);
        satellite.signalMesh.position.copy(satellite.position);
        satellite.exactDistanceKm = satellite.position.distanceTo(targetPosition) * SCALE_KM;
    }

    satellites.forEach((satellite) => {
        satellite.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: satellite.color })
        );
        const label = createTextSprite(`SAT ${satellite.id}`, satellite.colorCss);
        label.position.set(0, 5, 0);
        satellite.mesh.add(label);
        scene.add(satellite.mesh);

        satellite.signalMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 36, 24),
            new THREE.MeshBasicMaterial({
                color: satellite.color,
                transparent: true,
                opacity: 0.09,
                wireframe: wireframeEnabled,
                side: THREE.DoubleSide
            })
        );
        scene.add(satellite.signalMesh);

        updateSatellitePosition(satellite);
        satellite.currentDistanceKm = clamp(
            satellite.exactDistanceKm * 0.7,
            15000,
            34000
        );
    });

    const satelliteContainer = document.getElementById("sats-container");
    const statusBadge = document.getElementById("status-badge");
    const latitudeOutput = document.getElementById("out-lat");
    const altitudeOutput = document.getElementById("out-alt");
    const longitudeOutput = document.getElementById("out-lon-dms");
    const longitudeTimeOutput = document.getElementById("out-lon-time");
    const autoButton = document.getElementById("btn-auto");
    const wireframeButton = document.getElementById("btn-wireframe");
    const targetSelect = document.getElementById("target-select");
    const targetRegion = document.getElementById("target-region");
    const resultTitle = document.getElementById("result-title");
    const stageTargetName = document.getElementById("stage-target-name");
    const locationReveal = document.getElementById("location-reveal");
    const revealName = document.getElementById("reveal-name");
    const revealRegion = document.getElementById("reveal-region");
    const revealLatitude = document.getElementById("reveal-lat");
    const revealLongitude = document.getElementById("reveal-lon");
    const revealAltitude = document.getElementById("reveal-alt");

    TARGETS.forEach((target) => {
        const option = document.createElement("option");
        option.value = target.id;
        option.textContent = `${target.name}｜${target.kind}｜${formatElevationMeters(target.elevationM)}`;
        targetSelect.appendChild(option);
    });

    function ensureAudioContext() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return null;
        }
        if (!audioContext) {
            audioContext = new AudioContextClass();
        }
        if (audioContext.state === "suspended") {
            audioContext.resume().catch(() => {});
        }
        return audioContext;
    }

    function playSuccessTone() {
        const context = ensureAudioContext();
        if (!context) {
            return;
        }

        const startAt = context.currentTime + 0.02;
        [523.25, 659.25, 880].forEach((frequency, index) => {
            const noteStart = startAt + index * 0.13;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = index === 2 ? "sine" : "triangle";
            oscillator.frequency.setValueAtTime(frequency, noteStart);
            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.075, noteStart + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.22);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.24);
        });
    }

    function showLocationReveal() {
        revealName.textContent = activeTarget.name;
        revealRegion.textContent = `${activeTarget.region} · ${activeTarget.kind}`;
        revealLatitude.textContent = formatDecimalCoordinate(activeTarget.lat, true);
        revealLongitude.textContent = formatDecimalCoordinate(activeTarget.lon, false);
        revealAltitude.textContent = formatElevationMeters(activeTarget.elevationM);
        locationReveal.classList.add("is-visible");
        locationReveal.setAttribute("aria-hidden", "false");
    }

    function hideLocationReveal() {
        locationReveal.classList.remove("is-visible");
        locationReveal.setAttribute("aria-hidden", "true");
    }

    function updateTargetInterface() {
        targetRegion.textContent = `${activeTarget.region} · ${activeTarget.kind} · 海拔 ${formatElevationMeters(activeTarget.elevationM)}`;
        resultTitle.textContent = `解算目標座標 / ${activeTarget.name}`;
        stageTargetName.textContent = `${activeTarget.name} ${Math.round(activeTarget.elevationM).toLocaleString("zh-TW")} M`;
    }

    function setActiveTarget(targetId, focusCamera = true) {
        const nextTarget = TARGETS.find((target) => target.id === targetId);
        if (!nextTarget) {
            return;
        }

        activeTarget = nextTarget;
        targetPosition = latLonAltToVector3(
            activeTarget.lat,
            activeTarget.lon,
            activeTarget.elevationM / 1000
        );
        targetMarker.position.copy(targetPosition);
        targetHalo.position.copy(targetPosition);
        targetHalo.lookAt(targetPosition.clone().multiplyScalar(2));
        targetMarker.scale.setScalar(1);
        targetHalo.scale.setScalar(1);

        satellites.forEach((satellite) => {
            updateSatellitePosition(satellite);
            satellite.currentDistanceKm = clamp(
                satellite.exactDistanceKm * 0.7,
                15000,
                34000
            );
        });

        if (focusCamera) {
            camera.position.copy(targetPosition.clone().normalize().multiplyScalar(340));
            controls.target.set(0, 0, 0);
            controls.update();
        }

        wasPreciselyLocated = false;
        hideLocationReveal();
        updateTargetInterface();
        renderSatelliteControls();
    }

    function renderSatelliteControls() {
        satelliteContainer.innerHTML = "";

        satellites.forEach((satellite, index) => {
            const isActive = index < activeSatelliteCount;
            satellite.mesh.visible = isActive;
            satellite.signalMesh.visible = isActive;

            if (!isActive) {
                return;
            }

            const card = document.createElement("article");
            card.className = "satellite-card";
            card.style.setProperty("--sat-color", satellite.colorCss);
            card.innerHTML = `
                <div class="satellite-card__header">
                    <h2 class="satellite-card__title">SATELLITE ${satellite.id}</h2>
                    <div class="coordinate-fields">
                        <label class="coordinate-field">
                            緯度 N/S
                            <input id="lat-${index}" type="number" min="-90" max="90" step="1" value="${satellite.lat}" aria-label="衛星 ${satellite.id} 緯度">
                        </label>
                        <label class="coordinate-field">
                            經度 E/W
                            <input id="lon-${index}" type="number" min="-180" max="180" step="1" value="${satellite.lon}" aria-label="衛星 ${satellite.id} 經度">
                        </label>
                    </div>
                </div>
                <div class="satellite-card__distance">
                    <span>傳輸時間測距</span>
                    <span class="distance-value" id="dist-val-${index}">${satellite.currentDistanceKm.toFixed(0)} km</span>
                </div>
                <input class="distance-slider" id="slider-${index}" type="range" min="15000" max="34000" step="50" value="${satellite.currentDistanceKm}" aria-label="衛星 ${satellite.id} 測距">
                <p class="satellite-error" id="err-${index}"></p>
            `;
            satelliteContainer.appendChild(card);

            document.getElementById(`slider-${index}`).addEventListener("input", (event) => {
                satellite.currentDistanceKm = Number.parseFloat(event.target.value);
                evaluateMeasurements();
            });

            const updateCoordinates = () => {
                const latitudeInput = document.getElementById(`lat-${index}`);
                const longitudeInput = document.getElementById(`lon-${index}`);
                satellite.lat = clamp(Number.parseFloat(latitudeInput.value) || 0, -90, 90);
                satellite.lon = clamp(Number.parseFloat(longitudeInput.value) || 0, -180, 180);
                latitudeInput.value = satellite.lat;
                longitudeInput.value = satellite.lon;
                updateSatellitePosition(satellite);
                evaluateMeasurements();
            };

            document.getElementById(`lat-${index}`).addEventListener("change", updateCoordinates);
            document.getElementById(`lon-${index}`).addEventListener("change", updateCoordinates);
        });

        evaluateMeasurements();
    }

    function updateResultsPanel(correctCount) {
        const isPrecise = correctCount === activeSatelliteCount && activeSatelliteCount >= 3;
        const outputs = [latitudeOutput, altitudeOutput, longitudeOutput, longitudeTimeOutput];

        if (isPrecise) {
            statusBadge.textContent = activeSatelliteCount > 3
                ? `高精度定位完成 · ${activeSatelliteCount} STAR`
                : "精確定位完成 · 3 STAR";
            statusBadge.dataset.state = "success";
            latitudeOutput.textContent = formatDMS(activeTarget.lat, true);
            longitudeOutput.textContent = formatDMS(activeTarget.lon, false);
            longitudeTimeOutput.textContent = formatLongitudeAsTime(activeTarget.lon);
            altitudeOutput.textContent = `${(activeTarget.elevationM / 1000).toFixed(3)} km`;
            outputs.forEach((output) => output.classList.add("is-ready"));
            targetMarker.scale.setScalar(1.5);
            targetHalo.scale.setScalar(1.35);
            if (!wasPreciselyLocated) {
                showLocationReveal();
                playSuccessTone();
            }
            wasPreciselyLocated = true;
            return;
        }

        wasPreciselyLocated = false;
        hideLocationReveal();
        latitudeOutput.textContent = `--° --' --" -`;
        longitudeOutput.textContent = `--° --' --" -`;
        longitudeTimeOutput.textContent = "--h --m --s";
        altitudeOutput.textContent = "-- km";
        outputs.forEach((output) => output.classList.remove("is-ready"));
        targetMarker.scale.setScalar(1);
        targetHalo.scale.setScalar(1);

        if (correctCount === 0) {
            statusBadge.textContent = "訊號未交集";
            statusBadge.dataset.state = "error";
        } else if (correctCount === 1) {
            statusBadge.textContent = `鎖定單星 · ${correctCount}/${activeSatelliteCount}`;
            statusBadge.dataset.state = "partial";
        } else if (correctCount === 2) {
            statusBadge.textContent = `鎖定雙星圓環 · ${correctCount}/${activeSatelliteCount}`;
            statusBadge.dataset.state = "two";
        } else {
            statusBadge.textContent = `部分交集 · ${correctCount}/${activeSatelliteCount}`;
            statusBadge.dataset.state = "partial";
        }
    }

    function evaluateMeasurements() {
        let correctCount = 0;

        for (let index = 0; index < activeSatelliteCount; index += 1) {
            const satellite = satellites[index];
            const signalRadius = satellite.currentDistanceKm / SCALE_KM;
            satellite.signalMesh.scale.setScalar(signalRadius);

            const distanceValue = document.getElementById(`dist-val-${index}`);
            const errorValue = document.getElementById(`err-${index}`);
            const difference = satellite.currentDistanceKm - satellite.exactDistanceKm;

            if (distanceValue) {
                distanceValue.textContent = `${satellite.currentDistanceKm.toFixed(0)} km`;
            }
            if (errorValue) {
                errorValue.textContent = `Δ ${difference > 0 ? "+" : ""}${difference.toFixed(0)} km`;
                const isCorrect = Math.abs(difference) < DISTANCE_TOLERANCE_KM;
                errorValue.classList.toggle("is-correct", isCorrect);
                if (isCorrect) {
                    correctCount += 1;
                }
            }
        }

        updateResultsPanel(correctCount);
    }

    document.getElementById("sat-count").addEventListener("change", (event) => {
        if (autoAnimationFrame !== null) {
            cancelAnimationFrame(autoAnimationFrame);
            autoAnimationFrame = null;
            autoButton.disabled = false;
        }
        activeSatelliteCount = Number.parseInt(event.target.value, 10);
        renderSatelliteControls();
    });

    targetSelect.addEventListener("change", (event) => {
        if (autoAnimationFrame !== null) {
            cancelAnimationFrame(autoAnimationFrame);
            autoAnimationFrame = null;
            autoButton.disabled = false;
        }
        setActiveTarget(event.target.value);
    });

    wireframeButton.addEventListener("click", () => {
        wireframeEnabled = !wireframeEnabled;
        satellites.forEach((satellite) => {
            satellite.signalMesh.material.wireframe = wireframeEnabled;
        });
        wireframeButton.setAttribute("aria-pressed", String(wireframeEnabled));
        wireframeButton.textContent = wireframeEnabled ? "顯示實體球面" : "顯示透視線框";
    });

    autoButton.addEventListener("click", () => {
        ensureAudioContext();
        if (autoAnimationFrame !== null) {
            cancelAnimationFrame(autoAnimationFrame);
        }

        let progress = 0;
        const startDistances = satellites.map((satellite) => satellite.currentDistanceKm);
        autoButton.disabled = true;

        function animateAnswer() {
            progress += 0.04;
            const clampedProgress = Math.min(progress, 1);
            const easedProgress = 1 - Math.pow(1 - clampedProgress, 3);

            for (let index = 0; index < activeSatelliteCount; index += 1) {
                const satellite = satellites[index];
                satellite.currentDistanceKm = startDistances[index]
                    + (satellite.exactDistanceKm - startDistances[index]) * easedProgress;
                const slider = document.getElementById(`slider-${index}`);
                if (slider) {
                    slider.value = satellite.currentDistanceKm;
                }
            }
            evaluateMeasurements();

            if (progress < 1) {
                autoAnimationFrame = requestAnimationFrame(animateAnswer);
            } else {
                autoAnimationFrame = null;
                autoButton.disabled = false;
            }
        }

        animateAnswer();
    });

    const modal = document.getElementById("modal-formula");
    const modalOpenButton = document.getElementById("btn-formula");
    const modalCloseButtons = modal.querySelectorAll("[data-close-modal]");

    function openModal() {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        modal.querySelector(".modal__close").focus();
    }

    function closeModal() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        modalOpenButton.focus();
    }

    modalOpenButton.addEventListener("click", openModal);
    modalCloseButtons.forEach((button) => button.addEventListener("click", closeModal));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) {
            closeModal();
        }
    });

    function resizeRenderer() {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    window.addEventListener("resize", resizeRenderer);
    targetSelect.value = activeTarget.id;
    setActiveTarget(activeTarget.id);

    function animateScene() {
        requestAnimationFrame(animateScene);
        controls.update();
        targetHalo.rotation.z += 0.004;
        starfield.rotation.y += 0.000025;
        galaxy.rotation.y += 0.00008;
        renderer.render(scene, camera);
    }
    animateScene();
})();
