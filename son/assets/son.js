(() => {
    "use strict";

    const configs = [
        { key: "dec", title: "10進位 DEC", base: 10, signed: true, caption: "Base 10 · Signed", maxValue: 99999999 },
        { key: "hex", title: "16進位 HEX", base: 16, signed: false, caption: "Base 16 · 2's Comp", maxValue: -1 },
        { key: "oct", title: "8進位 OCT", base: 8, signed: false, caption: "Base 8 · 2's Comp", maxValue: parseInt("77777777", 8) },
        { key: "bin", title: "2進位 BIN", base: 2, signed: false, caption: "Base 2 · Low 8 bits", maxValue: parseInt("11111111", 2) }
    ];

    const demoValues = [0, 10, 255, 256, 16777215, 2147483647, -1, -2147483648];
    const state = {
        value: 0,
        overflow: false,
        demoIndex: 0
    };

    const panelState = Object.fromEntries(configs.map((config) => [
        config.key,
        { inputFocused: false, inputError: false }
    ]));

    const refs = {
        overviewSigned: document.getElementById("overview-signed"),
        overviewUnsigned: document.getElementById("overview-unsigned"),
        overviewHex: document.getElementById("overview-hex"),
        overviewBin: document.getElementById("overview-bin"),
        grid: document.getElementById("base-grid"),
        template: document.getElementById("base-panel-template")
    };

    const panelRefs = new Map();

    function toInt32(value) {
        return Object.is(value, -0) ? -0 : value | 0;
    }

    function isNegativeValue(value = state.value) {
        return value < 0 || Object.is(value, -0);
    }

    function unsigned32(value = state.value) {
        return value >>> 0;
    }

    function padLeft(value, size) {
        return value.padStart(size, "0");
    }

    function formatBinary32(value = state.value) {
        const bits = padLeft(unsigned32(value).toString(2), 32);
        return bits.match(/.{8}/g).join(" ");
    }

    function formatSigned(value = state.value) {
        return Object.is(value, -0) ? "-0" : String(value);
    }

    function formatInput(config) {
        if (config.signed) {
            return formatSigned();
        }

        return unsigned32().toString(config.base).toUpperCase();
    }

    function digitLabel(place) {
        return `位 ${place + 1}`;
    }

    function getDigits(config) {
        const digits = [];
        let temp = config.signed ? Math.abs(state.value) : unsigned32();

        for (let index = 0; index < 8; index += 1) {
            digits.push(temp % config.base);
            temp = Math.floor(temp / config.base);
        }

        return digits.reverse();
    }

    function isPanelOverflow(config) {
        const unsigned = unsigned32();

        if (state.overflow) return true;
        if (config.base === 10 && (state.value > 99999999 || state.value < -99999999)) return true;
        if (config.base === 2 && unsigned > 255) return true;
        if (config.base === 8 && unsigned > 16777215) return true;
        return false;
    }

    function validateAndParse(config, rawValue) {
        const value = rawValue.trim();

        if (value === "") {
            return { ok: false, overflow: false, parsed: state.value };
        }

        if (config.signed) {
            if (!/^-?\d+$/.test(value)) {
                return { ok: false, overflow: false, parsed: state.value };
            }

            const parsed = Number.parseInt(value, 10);
            const overflow = parsed > 2147483647 || parsed < -2147483648;
            return { ok: true, overflow, parsed };
        }

        const regex = config.base === 16
            ? /^[0-9A-Fa-f]+$/
            : config.base === 8
                ? /^[0-7]+$/
                : /^[01]+$/;

        if (!regex.test(value)) {
            return { ok: false, overflow: false, parsed: state.value };
        }

        const parsed = Number.parseInt(value, config.base);
        const overflow = parsed > 0xFFFFFFFF;
        return { ok: true, overflow, parsed };
    }

    function setValue(nextValue, overflow = false) {
        state.value = toInt32(nextValue);
        state.overflow = overflow;
        render();
    }

    function stepValue(amount) {
        const trueNext = state.value + amount;
        setValue(trueNext, trueNext > 2147483647 || trueNext < -2147483648);
    }

    function adjustPlace(config, place, direction) {
        const baseAmount = Math.pow(config.base, place);
        const signedDirection = config.signed && isNegativeValue() ? -direction : direction;
        const trueNext = state.value + signedDirection * baseAmount;
        setValue(trueNext, trueNext > 2147483647 || trueNext < -2147483648);
    }

    function toggleSign() {
        if (state.value === 0) {
            state.value = Object.is(state.value, -0) ? 0 : -0;
            state.overflow = false;
            render();
            return;
        }

        const trueNext = -state.value;
        setValue(trueNext, trueNext > 2147483647 || trueNext < -2147483648);
    }

    function createDigitDial(config, place, initialValue) {
        const wrapper = document.createElement("div");
        wrapper.className = "digit-dial";
        wrapper.dataset.place = String(place);

        const placeLabel = document.createElement("div");
        placeLabel.className = "place-label";
        placeLabel.innerHTML = `<span>${digitLabel(place)}</span><span>${place}</span>`;

        const up = document.createElement("button");
        up.className = "dial-button";
        up.type = "button";
        up.dataset.direction = "up";
        up.setAttribute("aria-label", `${config.title} 第 ${place} 位加一`);
        up.textContent = "⌃";

        const windowEl = document.createElement("div");
        windowEl.className = "digit-window";

        const reel = document.createElement("div");
        reel.className = "digit-reel";

        for (let value = 0; value < config.base; value += 1) {
            const cell = document.createElement("div");
            cell.className = "digit-cell";
            cell.textContent = value.toString(config.base).toUpperCase();
            reel.appendChild(cell);
        }

        const down = document.createElement("button");
        down.className = "dial-button";
        down.type = "button";
        down.dataset.direction = "down";
        down.setAttribute("aria-label", `${config.title} 第 ${place} 位減一`);
        down.textContent = "⌄";

        windowEl.appendChild(reel);
        wrapper.append(placeLabel, up, windowEl, down);
        setDigitValue(reel, initialValue);

        up.addEventListener("click", () => adjustPlace(config, place, 1));
        down.addEventListener("click", () => adjustPlace(config, place, -1));

        return { wrapper, reel };
    }

    function createSignDial(config) {
        const wrapper = document.createElement("div");
        wrapper.className = "sign-dial";

        const placeLabel = document.createElement("div");
        placeLabel.className = "place-label";
        placeLabel.innerHTML = "<span>符號</span><span>±</span>";

        const up = document.createElement("button");
        up.className = "dial-button";
        up.type = "button";
        up.setAttribute("aria-label", "切換十進位正負號");
        up.textContent = "⌃";

        const windowEl = document.createElement("div");
        windowEl.className = "sign-window";

        const symbol = document.createElement("div");
        symbol.className = "sign-symbol";
        symbol.textContent = "+";

        const down = document.createElement("button");
        down.className = "dial-button";
        down.type = "button";
        down.setAttribute("aria-label", "切換十進位正負號");
        down.textContent = "⌄";

        up.addEventListener("click", toggleSign);
        down.addEventListener("click", toggleSign);

        windowEl.appendChild(symbol);
        wrapper.append(placeLabel, up, windowEl, down);

        return { wrapper, symbol };
    }

    function setDigitValue(reel, value) {
        reel.style.transform = `translateY(-${value * 3.25}rem)`;
    }

    function createPanel(config) {
        const fragment = refs.template.content.cloneNode(true);
        const panel = fragment.querySelector(".base-panel");
        const title = fragment.querySelector("h2");
        const caption = fragment.querySelector(".base-panel__title p");
        const input = fragment.querySelector("input");
        const dialBank = fragment.querySelector(".dial-bank");
        const buttons = fragment.querySelectorAll("[data-action]");
        const indicators = {
            err: fragment.querySelector(".indicator--err"),
            ovf: fragment.querySelector(".indicator--ovf"),
            neg: fragment.querySelector(".indicator--neg")
        };
        const digitRefs = [];
        let signRef = null;

        panel.dataset.theme = config.key;
        title.textContent = config.title;
        caption.textContent = config.caption;
        input.dataset.key = config.key;

        if (config.signed) {
            signRef = createSignDial(config);
            dialBank.appendChild(signRef.wrapper);
        } else {
            const spacer = document.createElement("div");
            spacer.className = "sign-dial";
            spacer.setAttribute("aria-hidden", "true");
            spacer.innerHTML = '<div class="place-label" style="opacity:0"><span>符號</span><span>±</span></div><div class="dial-button"></div><div class="sign-window" style="visibility:hidden"></div><div class="dial-button"></div>';
            dialBank.appendChild(spacer);
        }

        getDigits(config).forEach((digit, index) => {
            const place = 7 - index;
            const dial = createDigitDial(config, place, digit);
            digitRefs.push(dial);
            dialBank.appendChild(dial.wrapper);
        });

        input.addEventListener("focus", () => {
            panelState[config.key].inputFocused = true;
        });

        input.addEventListener("blur", () => {
            panelState[config.key].inputFocused = false;
            panelState[config.key].inputError = false;
            render();
        });

        input.addEventListener("input", (event) => {
            const result = validateAndParse(config, event.target.value);
            panelState[config.key].inputError = !result.ok;
            if (result.ok) {
                state.value = toInt32(result.parsed);
                state.overflow = result.overflow;
            }
            render();
        });

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const action = button.dataset.action;
                panelState[config.key].inputError = false;

                if (action === "step-up") stepValue(1);
                if (action === "step-down") stepValue(-1);
                if (action === "max") setValue(config.maxValue, false);
                if (action === "zero") setValue(0, false);
            });
        });

        refs.grid.appendChild(fragment);
        panelRefs.set(config.key, {
            config,
            panel,
            input,
            digitRefs,
            signRef,
            indicators
        });
    }

    function updateOverview() {
        const binary32 = formatBinary32();
        refs.overviewSigned.textContent = formatSigned();
        refs.overviewUnsigned.textContent = unsigned32().toLocaleString("en-US");
        refs.overviewHex.textContent = padLeft(unsigned32().toString(16).toUpperCase(), 8);
        refs.overviewBin.textContent = binary32;
        refs.overviewBin.setAttribute("aria-label", `第 32 位至第 1 位：${binary32}`);
    }

    function updatePanel(panelRef) {
        const { config, input, digitRefs, signRef, indicators } = panelRef;
        const localState = panelState[config.key];
        const digits = getDigits(config);
        const negative = isNegativeValue();
        const overflow = isPanelOverflow(config);

        if (!localState.inputFocused) {
            input.value = formatInput(config);
        }

        input.classList.toggle("is-error", localState.inputError);
        indicators.err.classList.toggle("is-on", localState.inputError);
        indicators.ovf.classList.toggle("is-on", overflow);
        indicators.neg.classList.toggle("is-on", negative);

        digitRefs.forEach((dial, index) => {
            setDigitValue(dial.reel, digits[index]);
        });

        if (signRef) {
            signRef.symbol.textContent = negative ? "−" : "+";
        }
    }

    function render() {
        updateOverview();
        panelRefs.forEach(updatePanel);
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
                if (event.target === modal) closeModal(modal);
            });
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            document.querySelectorAll(".modal.is-open").forEach(closeModal);
        });
    }

    function setupGlobalControls() {
        document.getElementById("btn-reset").addEventListener("click", () => {
            Object.values(panelState).forEach((item) => {
                item.inputError = false;
            });
            setValue(0, false);
        });

        document.getElementById("btn-demo").addEventListener("click", () => {
            state.demoIndex = (state.demoIndex + 1) % demoValues.length;
            Object.values(panelState).forEach((item) => {
                item.inputError = false;
            });
            setValue(demoValues[state.demoIndex], false);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        configs.forEach(createPanel);
        setupModals();
        setupGlobalControls();
        render();
    });
})();
