<script>
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { z } from 'zod';
  import {
    activeTheme, artifactOpen, colorBlindMode, compareMode, customThemes, editorNameDraft,
    openArtifact, redo, redoStack, renameActive, resetActive, randomize,
    setCompare, takeSnapshot, snapshotTheme, undo, undoStack,
    updateBorder, updateColor, updateEffect, updateFontFamily, updateOption,
    updateRadius, updateSize,
  } from './stores.js';
  import { borderValues, fontFamilies, nameSchema, radiusValues, sizeValues } from './schema.js';
  import ExportModal from './ExportModal.svelte';

  let nameError = '';
  let spin = 0;
  let nameValue = '';
  let lastThemeId = '';

  $: if ($activeTheme.id !== lastThemeId) {
    lastThemeId = $activeTheme.id;
    nameValue = $activeTheme.name;
    editorNameDraft.set(nameValue);
    nameError = '';
  }

  const { form: nameForm } = createForm({
    extend: validator({ schema: z.object({ name: nameSchema }) }),
    onSubmit: (values) => commitName(values.name),
  });

  function commitName(value) {
    nameValue = value;
    editorNameDraft.set(value);
    const parsed = nameSchema.safeParse(value);
    if (!parsed.success) {
      nameError = `Name: ${parsed.error.issues[0].message}`;
      return;
    }
    if ($activeTheme.builtin) {
      nameError = '';
      return;
    }
    const duplicate = $customThemes.some((theme) => theme.name.toLowerCase() === value.toLowerCase() && theme.id !== $activeTheme.id);
    if (duplicate) {
      nameError = 'Name: choose a unique name in My themes';
      return;
    }
    const result = renameActive(value);
    nameError = result.ok ? '' : `Name: ${result.error}`;
  }

  function random() {
    spin += 1;
    randomize();
  }

  function onSnapshot() {
    takeSnapshot();
  }

  function onCompare(event) {
    setCompare(event.currentTarget.checked);
  }

  const pairs = [
    ['primary', 'primary', 'primary-content'],
    ['secondary', 'secondary', 'secondary-content'],
    ['accent', 'accent', 'accent-content'],
    ['neutral', 'neutral', 'neutral-content'],
    ['info', 'info', 'info-content'],
    ['success', 'success', 'success-content'],
    ['warning', 'warning', 'warning-content'],
    ['error', 'error', 'error-content'],
  ];

  const radiusFamilies = [
    ['Boxes', 'card, modal, alert', 'box'],
    ['Fields', 'button, input, select, tab', 'field'],
    ['Selectors', 'checkbox, toggle, badge', 'selector'],
  ];

  const CONTRAST_PAIRS = [
    ['base-100', 'base-content'], ['base-200', 'base-content'], ['base-300', 'base-content'],
    ['primary', 'primary-content'], ['secondary', 'secondary-content'], ['accent', 'accent-content'],
    ['neutral', 'neutral-content'], ['info', 'info-content'], ['success', 'success-content'],
    ['warning', 'warning-content'], ['error', 'error-content'],
  ];

  function hexToRgb(hex) {
    const value = hex.replace('#', '');
    return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
  }
  function relLuminance([r, g, b]) {
    const ch = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  }
  function contrastRatio(a, b) {
    const l1 = relLuminance(a);
    const l2 = relLuminance(b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  $: contrastRows = CONTRAST_PAIRS.map(([bg, fg]) => {
    const ratio = contrastRatio(hexToRgb($activeTheme.colors[bg]), hexToRgb($activeTheme.colors[fg]));
    return { bg, fg, ratio, aa: ratio >= 4.5, aaa: ratio >= 7 };
  });
</script>

<aside class="editor-panel panel" aria-label="Theme token editor">
  <form use:nameForm class="name-form" on:submit|preventDefault={() => commitName(nameValue)}>
    <label for="theme-name">Name</label>
    <input
      id="theme-name"
      name="name"
      placeholder="mytheme"
      bind:value={nameValue}
      aria-describedby="name-error"
      on:input={(event) => commitName(event.currentTarget.value)}
    />
    <button type="submit" aria-label="Apply theme name">✓</button>
    <p id="name-error" class="field-error" aria-live="polite">{nameError}</p>
  </form>

  <div class="editor-actions">
    <button type="button" class="random-button" on:click={random}>
      <span style:transform={`rotate(${spin * 180}deg)`}>▦</span> Random
    </button>
    <button type="button" class="css-button" on:click={() => openArtifact('css')}>
      <span aria-hidden="true">&#123; &#125;</span> CSS
    </button>
  </div>

  <div class="studio-toolbar">
    <button type="button" class="btn btn-sm" disabled={!$undoStack.length} on:click={undo}>Undo</button>
    <button type="button" class="btn btn-sm" disabled={!$redoStack.length} on:click={redo}>Redo</button>
    <button type="button" class="btn btn-sm" on:click={onSnapshot}>Snapshot</button>
    <label class="label cursor-pointer gap-2">
      <span class="label-text">Compare</span>
      <input type="checkbox" class="toggle toggle-sm" checked={$compareMode} disabled={!$snapshotTheme} on:change={onCompare} />
    </label>
  </div>

  <section class="editor-section color-section">
    <h2><span>◇</span> Change colors</h2>
    <div class="base-grid">
      {#each [['100', 'base-100'], ['200', 'base-200'], ['300', 'base-300'], ['A', 'base-content']] as item}
        <label class="color-control" title={item[1]}>
          <input type="color" value={$activeTheme.colors[item[1]]} aria-label={`Change ${item[1]}`} on:input={(event) => updateColor(item[1], event.currentTarget.value)} />
          <span style:background={$activeTheme.colors[item[1]]} style:color={item[0] === 'A' ? $activeTheme.colors['base-100'] : $activeTheme.colors['base-content']}>{item[0]}</span>
        </label>
      {/each}
    </div>
    <small>base</small>
    <div class="semantic-grid">
      {#each pairs as [label, face, content]}
        <div class="color-pair">
          <label class="color-control" title={face}>
            <input type="color" value={$activeTheme.colors[face]} aria-label={`Change ${face}`} on:input={(e) => updateColor(face, e.currentTarget.value)} />
            <span style:background={$activeTheme.colors[face]}></span>
          </label>
          <label class="color-control content-color" title={content}>
            <input type="color" value={$activeTheme.colors[content]} aria-label={`Change ${content}`} on:input={(e) => updateColor(content, e.currentTarget.value)} />
            <span style:background={$activeTheme.colors[content]} style:color={$activeTheme.colors[face]}>A</span>
          </label>
          <small>{label}</small>
        </div>
      {/each}
    </div>
  </section>

  <section class="editor-section radius-section">
    <h2><span>⌜</span> Radius</h2>
    {#each radiusFamilies as [label, helper, key]}
      <div class="control-family">
        <b>{label}</b><small>{helper}</small>
        <div class="radius-options">
          {#each radiusValues as value, index}
            <button
              type="button"
              class:active={$activeTheme.radius[key] === value}
              aria-label={`radius ${key} ${value}`}
              aria-pressed={$activeTheme.radius[key] === value}
              on:click={() => updateRadius(key, value)}
            >
              <i style:border-radius={value}></i><em>{index}</em>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </section>

  <section class="editor-section effects-section">
    <h2><span>◈</span> Effects</h2>
    <label class="toggle-line">
      <span><b>Depth</b><small>--depth</small></span>
      <input class="toggle toggle-primary toggle-sm" type="checkbox" checked={!!$activeTheme.depth} on:change={(e) => updateEffect('depth', e.currentTarget.checked)} />
    </label>
    <label class="toggle-line">
      <span><b>Noise</b><small>--noise</small></span>
      <input class="toggle toggle-primary toggle-sm" type="checkbox" checked={!!$activeTheme.noise} on:change={(e) => updateEffect('noise', e.currentTarget.checked)} />
    </label>
  </section>

  <section class="editor-section sizes-section">
    <h2><span>↔</span> Sizes</h2>
    {#each [['Fields', 'field'], ['Selectors', 'selector']] as [label, key]}
      <div class="size-line">
        <b>{label}</b>
        <div class="size-options">
          {#each sizeValues as value}
            <button type="button" class:active={$activeTheme.size[key] === value} aria-pressed={$activeTheme.size[key] === value} on:click={() => updateSize(key, value)}>{value}</button>
          {/each}
        </div>
      </div>
    {/each}
    <div class="size-line">
      <b>Border</b>
      <div class="size-options">
        {#each borderValues as value}
          <button type="button" class:active={$activeTheme.border === value} aria-pressed={$activeTheme.border === value} aria-label={`border ${value}`} on:click={() => updateBorder(value)}>{value}</button>
        {/each}
      </div>
    </div>
  </section>

  <section class="editor-section font-section">
    <h2><span>Aa</span> Font family</h2>
    <label class="font-line" for="font-family">
      <span class="sr-only">Font family</span>
      <select id="font-family" class="select select-bordered select-sm w-full" value={$activeTheme.fontFamily} on:change={(e) => updateFontFamily(e.currentTarget.value)}>
        {#each fontFamilies as family}
          <option value={family}>{family}</option>
        {/each}
      </select>
    </label>
  </section>

  <section class="editor-section options-section">
    <h2><span>⚙</span> Options</h2>
    {#each [['Default theme', 'defaultTheme'], ['Default dark theme', 'defaultDarkTheme'], ['Dark color scheme', 'darkColorScheme']] as [label, key]}
      <label class="toggle-line">
        <b>{label}</b>
        <input class="toggle toggle-primary toggle-sm" type="checkbox" checked={$activeTheme.options[key]} on:change={(e) => updateOption(key, e.currentTarget.checked)} />
      </label>
    {/each}
    <label class="font-line" for="colorblind">
      <span>Color blindness</span>
      <select
        id="colorblind"
        class="select select-bordered select-sm w-full"
        value={$colorBlindMode}
        on:change={(e) => colorBlindMode.set(e.currentTarget.value)}
      >
        <option>None</option>
        <option>Protanopia</option>
        <option>Deuteranopia</option>
        <option>Tritanopia</option>
      </select>
    </label>
    <button class="reset-button" type="button" on:click={resetActive}>↶ Reset token edits</button>
  </section>

  <section class="editor-section contrast-section" aria-label="Contrast matrix">
    <h2>Contrast matrix</h2>
    <table class="contrast-table">
      <thead><tr><th>Pair</th><th>Ratio</th><th>AA</th><th>AAA</th></tr></thead>
      <tbody>
        {#each contrastRows as row}
          <tr>
            <td>{row.bg} / {row.fg}</td>
            <td>{row.ratio.toFixed(2)}:1</td>
            <td><span class="badge {row.aa ? 'badge-success' : 'badge-error'} badge-xs">{row.aa ? 'AA pass' : 'AA fail'}</span></td>
            <td><span class="badge {row.aaa ? 'badge-success' : 'badge-ghost'} badge-xs">{row.aaa ? 'AAA pass' : 'AAA fail'}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</aside>

{#if $artifactOpen}<ExportModal />{/if}
