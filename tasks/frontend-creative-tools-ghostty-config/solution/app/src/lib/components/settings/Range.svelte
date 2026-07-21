<script lang="ts">
    import {relativeTooltip} from "$lib/actions/tooltip.svelte";
    import {countDecimalPlaces} from "$lib/utils/numbers";
    import {numberCodec} from "$lib/settings/codecs";

    interface RangeProps {
        min: number;
        max: number;
        step?: number;
        value: string; // flat-store string; parsed to a number internally via numberCodec
        showLabels?: boolean;
        showInput?: boolean; // companion number field: typed out-of-bound values clamp + show an inline message
    }

    // why is eslint like this smh
    // eslint-disable-next-line prefer-const
    let {value = $bindable(""), min, max, step = 1, showLabels = true, showInput = false}: RangeProps = $props();

    // html refs
    let track: HTMLDivElement | undefined = $state();
    let thumb: HTMLDivElement | undefined = $state();

    // The bound `value` is a string; slider math works off this parsed number (empty/garbage -> min).
    const num = $derived(numberCodec.parse(value) ?? min);
    const commit = (n: number) => value = numberCodec.serialize(n);

    // Calculate the percentage position of the thumb based on the current value
    const percentage = $derived(((num - min) / (max - min)) * 100);

    // Calculate the number of decimal places to show based on step, min, and max
    const maxDecimalPlaces = $derived(Math.max(countDecimalPlaces(min), countDecimalPlaces(max), countDecimalPlaces(step)));

    // Get the value based on a pointer event's clientX position relative to the track
    function valueFromPointer(e: PointerEvent): number {
        if (!track) return num;
        const rect = track.getBoundingClientRect();
        const raw = ((e.clientX - rect.left) / rect.width) * (max - min) + min;
        const stepped = Math.round((raw - min) / step) * step + min;
        return parseFloat(Math.min(max, Math.max(min, stepped)).toFixed(maxDecimalPlaces));
    }

    // Pointer event handlers for dragging the thumb
    import { getSetting } from "$lib/contexts";
    const setting = getSetting();
    let dragging = $state(false);
    function onPointerDown(e: PointerEvent) {
        if (!track || e.button !== 0) return;
        dragging = true;
        track.setPointerCapture(e.pointerId);
        commit(valueFromPointer(e));
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging) return;
        commit(valueFromPointer(e));
    }

    function onPointerUp(e: PointerEvent) {
        dragging = false;
        if (track) track.releasePointerCapture(e.pointerId);
    }

    function onKeyDown(e: KeyboardEvent) {
        const inc = e.shiftKey ? step * 10 : step;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            commit(parseFloat(Math.min(max, num + inc).toFixed(maxDecimalPlaces)));
        }
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            commit(parseFloat(Math.max(min, num - inc).toFixed(maxDecimalPlaces)));
        }
        else if (e.key === "Home") {
            e.preventDefault();
            commit(parseFloat(min.toFixed(maxDecimalPlaces)));
        }
        else if (e.key === "End") {
            e.preventDefault();
            commit(parseFloat(max.toFixed(maxDecimalPlaces)));
        }
    }

    // Companion input: typing an out-of-bound value clamps into range AND shows an inline
    // message naming the setting and its accepted bounds — the generated config never sees
    // the malformed value.
    let rangeWarning = $state("");
    let warningTimer: ReturnType<typeof setTimeout> | undefined;

    function handleInputEntry(event: Event) {
        const target = event.target as HTMLInputElement;
        const raw = target.value.trim();
        if (raw === "") return;
        const parsed = parseFloat(raw);
        if (Number.isNaN(parsed)) {
            rangeWarning = `${setting?.settingKey ?? "value"} must be a number from ${min} to ${max}`;
        }
        else if (parsed < min || parsed > max) {
            rangeWarning = `${setting?.settingKey ?? "value"} must be between ${min} and ${max} (typed ${parsed})`;
            commit(parseFloat(Math.min(max, Math.max(min, parsed)).toFixed(maxDecimalPlaces)));
        }
        else {
            rangeWarning = "";
            commit(parseFloat(parsed.toFixed(maxDecimalPlaces)));
        }
        clearTimeout(warningTimer);
        warningTimer = setTimeout(() => {rangeWarning = "";}, 5000);
    }
</script>


<div class="slider-setting">
    {#if showInput}
        <div class="slider-input-row">
            <label class="sr-only" for={`${setting?.labelId ?? "slider"}-input`}>{setting?.name ?? "Value"}</label>
            <input
                id={`${setting?.labelId ?? "slider"}-input`}
                class="slider-input"
                type="text"
                inputmode="decimal"
                value={Number.isInteger(step) ? num.toString() : num.toFixed(maxDecimalPlaces)}
                onchange={handleInputEntry}
                onblur={(event) => {(event.currentTarget as HTMLInputElement).value = Number.isInteger(step) ? num.toString() : num.toFixed(maxDecimalPlaces);}}
                aria-invalid={rangeWarning ? "true" : undefined}
            />
        </div>
    {/if}
    {#if rangeWarning}<p class="range-warning" role="alert">{rangeWarning}</p>{/if}
    <div
        aria-labelledby={setting?.labelId} class="slider"
        role="slider"
        tabindex="0"
        bind:this={track}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={num}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
        onkeydown={onKeyDown}
        use:relativeTooltip={{
            text: Number.isInteger(step) ? num.toString() : num.toFixed(maxDecimalPlaces),
            relativeTarget: thumb,
            numeric: true,
            offsetY: -4
        }}
    >
        <div class="track"></div>

        <div
            class="thumb"
            class:dragging
            style:left={`${percentage}%`}
            bind:this={thumb}
        ></div>
    </div>
    {#if showLabels}
        <div class="labels">
            <span>{min}</span>
            <span>{max}</span>
        </div>
    {/if}
</div>


<style>
.slider-setting {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin: 0 6px;
    width: 163px;
}

.labels {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 13px;
    font-size: 0.75rem;
    color: var(--font-color, #ccc);
    font-variant-numeric: tabular-nums;
}

.labels span:first-child {
    position: absolute;
    left: 0;
    transform: translateX(calc(-50% - 1.5px));
}

.labels span:last-child {
    position: absolute;
    right: 0;
    transform: translateX(calc(50% + 1.5px));
}

.slider {
    position: relative;
    height: 24px;
    display: flex;
    align-items: center;
    cursor: pointer;
    touch-action: none;
    width: 100%;
}

.track {
    position: absolute;
    width: 100%;
    height: 4px;
    background: var(--border-level-4);
}

.track::before,
.track::after {
    content: "";
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 10px;
    width: 3px;
    border-radius: 2px;
    background: var(--bg-basic-button);
    z-index: 1;
}

.track::before {
    left: -3px;
}

.track::after {
    right: -3px;
}

.thumb {
    position: absolute;
    width: 8px;
    height: 21px;
    border-radius: 4px;
    background: hsl(270, 7%, 62%);
    transform: translateX(-50%);
    pointer-events: none;
    box-shadow: 0 0 5px rgba(0,0,0,0.6);
    z-index: 2;
}

.thumb.dragging {
    background: hsl(270, 7%, 75%);
}

.slider-input-row {
    display: flex;
    justify-content: flex-end;
    width: 100%;
}

.slider-input {
    width: 56px;
    background: var(--bg-level-2);
    border: 1px solid var(--border-input);
    border-radius: var(--radius-level-5);
    color: inherit;
    text-align: right;
    padding: 2px 6px 3px;
    font-size: 0.85rem;
    outline: none;
}

.slider-input:focus {
    background: var(--bg-input-focus);
    outline: var(--border-input-focus);
}

.range-warning {
    margin: -2px 0 0;
    width: 100%;
    text-align: right;
    color: var(--color-danger);
    font-size: 0.72rem;
    font-weight: 500;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
}
</style>
