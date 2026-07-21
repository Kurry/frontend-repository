<script lang="ts">
  import { onMount } from 'svelte';
  import { slide, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import Dialog from './components/Dialog.svelte';
  import Gauge from './components/Gauge.svelte';
  import Heat from './components/Heat.svelte';
  import Icon from './components/Icon.svelte';
  import Weekly from './components/Weekly.svelte';
  import {
    S,
    CATS,
    FILTERS,
    type Category,
    type Reason,
    type TimeEntry,
    entries,
    tags,
    todayMinutes,
    meaningfulRatio,
    streakDays,
    catMinutesToday,
    timelineEntries,
    listEntries,
    elapsedSec,
    fmtClock,
    fmtDur,
    fmtTimeOfDay,
    localInputNow,
    validateEntryFields,
    sessionJSONText,
    timesheetCSV,
    startTimer,
    stopTimer,
    confirmInterruption,
    cancelInterruption,
    addEntry,
    updateEntry,
    deleteEntry,
    bulkSetCategory,
    createTag,
    deleteTag,
    openOverlay,
    closeOverlay,
    setFilter,
    setSearch,
    toggleSelect,
    clearSelection,
    setManualOpen,
    toggleTheme,
    setSound,
    setTarget,
    dismissCoach,
    setReduced,
    setExportTab,
    canUndo,
    canRedo,
    undo,
    redo,
    selectBranch,
    goToSnapshot,
    applyScenario,
    current,
    beginImport,
    clearImportDraft,
    confirmImport,
    copyText,
    downloadText,
    toast,
    announce
  } from './state.svelte';

  // ---- form drafts ----------------------------------------------------------
  let timerName = $state('');
  let timerCat = $state<Category>('Meaningful');
  let timerTag = $state('');
  let timerErrs = $state<Record<string, string>>({});

  let manName = $state('');
  let manCat = $state<Category>('Meaningful');
  let manTag = $state('');
  let manDur = $state('30');
  let manStart = $state(localInputNow());
  let manErrs = $state<Record<string, string>>({});
  let manLock = $state(false);

  let tagDraft = $state('');
  let tagErrs = $state<Record<string, string>>({});

  let editName = $state('');
  let editCat = $state<Category>('Meaningful');
  let editTag = $state('');
  let editDur = $state('30');
  let editStart = $state(localInputNow());
  let editReason = $state<Reason>(null);
  let editErrs = $state<Record<string, string>>({});

  let interruptReason = $state<Reason>(null);
  let interruptErr = $state('');

  let deleteId = $state<string | null>(null);

  let paletteQ = $state('');
  let paletteIdx = $state(0);

  // ---- derived --------------------------------------------------------------
  const all = $derived(entries());
  const tg = $derived(tags());
  const mins = $derived(todayMinutes());
  const ratio = $derived(meaningfulRatio());
  const streak = $derived(streakDays());
  const cats = $derived(catMinutesToday());
  const tl = $derived(timelineEntries());
  const listed = $derived(listEntries());
  const elapsed = $derived(elapsedSec());
  const snap = $derived(current());
  const jsonText = $derived(sessionJSONText());
  const csvText = $derived(timesheetCSV());
  const leanSide = $derived(cats.Meaningful >= cats.Draining ? 'm' : 'd');
  const dur = $derived(S.reduced ? 0 : 90);

  const editEntry = $derived(
    S.overlay?.which === 'edit' && S.overlay.editId ? all.find((e) => e.id === S.overlay!.editId!) : null
  );

  type Cmd = { id: string; label: string; run: () => void; keys?: string };
  const commands = $derived.by((): Cmd[] => {
    const base: Cmd[] = [
      { id: 'timer', label: 'Start timer focus', keys: 'T', run: () => { closeOverlay(); document.getElementById('timer-name')?.focus(); } },
      { id: 'manual', label: 'Add entry manually', keys: 'M', run: () => { closeOverlay(); setManualOpen(true); } },
      { id: 'history', label: 'View history', keys: 'H', run: () => openOverlay('history') },
      { id: 'export', label: 'Export session', keys: 'E', run: () => openOverlay('export') },
      { id: 'import', label: 'Import session', keys: 'I', run: () => openOverlay('import') },
      ...FILTERS.map((f) => ({
        id: `filter-${f.value}`,
        label: `Filter ${f.label}`,
        run: () => { setFilter(f.value); closeOverlay(); }
      }))
    ];
    for (const t of tg) {
      base.push({
        id: `tag-${t}`,
        label: `Tag: ${t}`,
        run: () => { setSearch(t); closeOverlay(); }
      });
    }
    return base;
  });
  const paletteMatches = $derived.by(() => {
    const q = paletteQ.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.id.includes(q));
  });

  // ---- lifecycle ------------------------------------------------------------
  onMount(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    document.documentElement.setAttribute('data-theme', S.theme);
    const tickId = window.setInterval(() => {
      if (S.timer.running) S.tick = Date.now();
    }, 1000);
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (S.overlay?.which === 'palette') closeOverlay();
        else {
          paletteQ = '';
          paletteIdx = 0;
          openOverlay('palette');
        }
        return;
      }
      if (S.overlay?.which === 'palette') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          paletteIdx = Math.min(paletteMatches.length - 1, paletteIdx + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          paletteIdx = Math.max(0, paletteIdx - 1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const c = paletteMatches[paletteIdx];
          if (c) c.run();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearInterval(tickId);
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener?.('change', apply);
    };
  });

  $effect(() => {
    if (S.overlay?.which === 'edit' && editEntry) {
      editName = editEntry.name;
      editCat = editEntry.category;
      editTag = editEntry.tag || '';
      editDur = String(editEntry.durationMinutes);
      editStart = editEntry.startTime;
      editReason = editEntry.interruptionReason;
      editErrs = {};
    }
  });

  $effect(() => {
    if (S.overlay?.which === 'interruption') {
      interruptReason = null;
      interruptErr = '';
    }
  });

  $effect(() => {
    // keep palette highlight in range when matches shrink
    paletteMatches;
    if (paletteIdx >= paletteMatches.length) paletteIdx = Math.max(0, paletteMatches.length - 1);
  });

  // ---- actions --------------------------------------------------------------
  function validateTimer(): boolean {
    const errs: Record<string, string> = {};
    if (!timerName.trim()) errs.name = 'Name is required — enter the activity name.';
    else if (timerName.trim().length > 120) errs.name = 'Name is too long — keep it to 120 characters or fewer.';
    if (!timerCat) errs.category = 'Category is required — choose Meaningful, Neutral, or Draining.';
    if (timerTag && !tg.includes(timerTag)) errs.tag = 'Tag must be an existing custom tag, or leave it empty.';
    timerErrs = errs;
    if (Object.keys(errs).length) announce(Object.values(errs)[0]);
    return Object.keys(errs).length === 0;
  }

  function onStartTimer() {
    if (!validateTimer()) return;
    startTimer(timerName, timerCat, timerTag || null);
  }
  function onStopTimer() {
    stopTimer();
  }

  function validateManual(): boolean {
    const errs = validateEntryFields(
      {
        name: manName,
        category: manCat,
        tag: manTag || null,
        durationMinutes: manDur,
        startTime: manStart,
        interruptionReason: null
      },
      tg
    );
    manErrs = errs;
    if (Object.keys(errs).length) announce(Object.values(errs)[0]);
    return Object.keys(errs).length === 0;
  }

  function onManualSubmit() {
    if (manLock) return;
    if (!validateManual()) return;
    manLock = true;
    addEntry({
      name: manName,
      category: manCat,
      tag: manTag || null,
      durationMinutes: Number(manDur),
      startTime: manStart,
      interruptionReason: null
    });
    toast(`Saved entry “${manName.trim()}” — ${manDur} min`, 'save');
    manName = '';
    manDur = '30';
    manStart = localInputNow();
    manTag = '';
    manErrs = {};
    setManualOpen(false);
    queueMicrotask(() => {
      manLock = false;
    });
  }

  function openEdit(e: TimeEntry) {
    openOverlay('edit', e.id);
  }
  function openDelete(id: string) {
    deleteId = id;
    openOverlay('delete');
  }
  function confirmDelete() {
    if (deleteId) deleteEntry(deleteId);
    deleteId = null;
    closeOverlay();
  }

  function onEditSave() {
    if (!editEntry) return;
    const errs = validateEntryFields(
      {
        name: editName,
        category: editCat,
        tag: editTag || null,
        durationMinutes: editDur,
        startTime: editStart,
        interruptionReason: editReason
      },
      tg
    );
    editErrs = errs;
    if (Object.keys(errs).length) {
      announce(Object.values(errs)[0]);
      return;
    }
    updateEntry(editEntry.id, {
      name: editName,
      category: editCat,
      tag: editTag || null,
      durationMinutes: Number(editDur),
      startTime: editStart,
      interruptionReason: editReason
    });
    toast(`Updated “${editName.trim()}”`, 'save');
    closeOverlay();
  }

  function onCreateTag() {
    const t = tagDraft.trim();
    const errs: Record<string, string> = {};
    if (!t) errs.name = 'Tag name is required.';
    else if (t.length > 40) errs.name = 'Tag name must be 40 characters or fewer.';
    else if (tg.includes(t)) errs.name = 'That tag already exists.';
    tagErrs = errs;
    if (Object.keys(errs).length) {
      announce(Object.values(errs)[0]);
      return;
    }
    createTag(t);
    tagDraft = '';
    toast(`Created tag “${t}”`, 'save');
  }

  function onConfirmInterrupt() {
    if (interruptReason !== 'Internal' && interruptReason !== 'External') {
      interruptErr = 'Interruption reason is required — choose Internal or External.';
      announce(interruptErr);
      return;
    }
    confirmInterruption(interruptReason);
  }

  async function onImportFile(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const text = await file.text();
    const result = beginImport(text, file.name);
    if (!result.ok) {
      announce(result.errors[0]?.message || 'Import validation failed');
      openOverlay('import');
      return;
    }
    openOverlay('import');
  }

  function onConfirmImport() {
    confirmImport();
  }

  function doCopy() {
    const text = S.exportTab === 'json' ? jsonText : csvText;
    copyText(text, S.exportTab === 'json' ? 'Session JSON' : 'Timesheet CSV');
  }
  function doDownload() {
    const text = S.exportTab === 'json' ? jsonText : csvText;
    const name = S.exportTab === 'json' ? 'clockcraft-session.json' : 'clockcraft-timesheet.csv';
    downloadText(text, name);
    toast(`Downloaded ${name}`, 'export');
  }

  function bulk(cat: Category) {
    bulkSetCategory([...S.selected], cat);
  }

  function todayYmd(): string {
    const d = new Date();
    const p = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  const todayListed = $derived(all.filter((e) => e.startTime.slice(0, 10) === todayYmd()));
</script>

<a class="skip" href="#main">Skip to content</a>

<div class="sr-live" aria-live="polite" aria-atomic="true">{S.liveRegion}</div>

{#if S.coach}
  <div class="coach" role="status">
    <div class="arrow" aria-hidden="true">→</div>
    <div>
      <h3>Export is your save</h3>
      <p>ClockCraft keeps this session in memory. Use <strong>Export session</strong> anytime to download Session JSON or Timesheet CSV — then Import to restore.</p>
    </div>
    <button class="btn" type="button" onclick={dismissCoach}>Got it</button>
  </div>
{/if}

<header class="header">
  <div class="wrap">
    <div class="header-inner">
      <h1 class="wordmark">Clock<span class="accent">Craft</span></h1>
      <div class="header-actions">
        <button class="icon-btn" type="button" aria-label="Manage tags" title="Manage tags" onclick={() => openOverlay('tags')}>
          <Icon name="tags" label="Manage tags" />
        </button>
        <button class="icon-btn" type="button" aria-label="View history" title="View history" onclick={() => openOverlay('history')}>
          <Icon name="history" label="View history" />
        </button>
        <button class="icon-btn" type="button" aria-label="Export session" title="Export session" onclick={() => openOverlay('export')}>
          <Icon name="export" label="Export session" />
        </button>
        <button class="icon-btn" type="button" aria-label="Import session" title="Import session" onclick={() => document.getElementById('import-file')?.click()}>
          <Icon name="import" label="Import session" />
        </button>
        <input id="import-file" type="file" accept="application/json,.json" hidden onchange={onImportFile} />
        <button class="icon-btn" type="button" aria-label="Print day summary" title="Print day summary" onclick={() => openOverlay('print')}>
          <Icon name="print" label="Print day summary" />
        </button>
        <button
          class="icon-btn"
          type="button"
          aria-label={S.sound === 'off' ? 'Enable focus sound' : 'Disable focus sound'}
          aria-pressed={S.sound !== 'off'}
          title="Focus sound"
          onclick={() => setSound(S.sound === 'off' ? 'focus' : S.sound === 'focus' ? 'rain' : 'off')}
        >
          <Icon name={S.sound === 'off' ? 'sound-off' : 'sound'} label="Focus sound" />
        </button>
        <button class="icon-btn" type="button" aria-label="Toggle color mode" title="Toggle color mode" onclick={toggleTheme}>
          <Icon name={S.theme === 'light' ? 'moon' : 'sun'} label="Toggle color mode" />
        </button>
        <button class="icon-btn" type="button" aria-label="Open command palette" title="Command palette (⌘K)" onclick={() => { paletteQ = ''; paletteIdx = 0; openOverlay('palette'); }}>
          <Icon name="palette" label="Command palette" />
        </button>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="label">Meaningful ratio</span>
        <span class="value" class:Meaningful={leanSide === 'm'} class:Draining={leanSide === 'd'} style="color: {leanSide === 'm' ? 'var(--meaningful)' : 'var(--draining)'}">{ratio}%</span>
        <div class="lean" class:neutral={cats.Meaningful === cats.Draining} aria-hidden="true">
          <div class="m" style="width:{ratio}%"></div>
          <div class="d" style="width:{100 - ratio}%"></div>
        </div>
        <span class="caption">{cats.Meaningful} min Meaningful · {cats.Draining} min Draining</span>
      </div>
      <div class="stat minutes">
        <span class="label">Today's minutes</span>
        <div class="minutes-row">
          <span class="value">{mins}</span>
          <Gauge value={mins} target={S.target} />
        </div>
        <label class="goal-edit">
          Goal
          <input
            type="number"
            min="1"
            max="1440"
            value={S.target}
            aria-label="Daily minute target"
            oninput={(e) => setTarget(Number((e.currentTarget as HTMLInputElement).value))}
          />
          min
        </label>
      </div>
      <div class="stat">
        <span class="label">Meaningful streak</span>
        <span class="value">{streak}</span>
        <span class="caption">{streak === 1 ? '1 day' : `${streak} days`} with Meaningful &gt; Draining</span>
      </div>
    </div>
  </div>
</header>

<main id="main" class="wrap">
  <div class="toolbar">
    <div>
      <div class="label" style="font-size:13px;font-weight:600;margin-bottom:6px">Category filter</div>
      <div class="filters" role="group" aria-label="Category filter">
        {#each FILTERS as f}
          <button
            type="button"
            class="chip"
            aria-pressed={S.filter === f.value}
            onclick={() => setFilter(f.value)}
          >{f.label}</button>
        {/each}
      </div>
    </div>
    <div class="search-wrap">
      <label for="entry-search">Search entries</label>
      <div style="position:relative">
        <input
          id="entry-search"
          type="search"
          placeholder="Search by name or tag"
          value={S.search}
          oninput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
        />
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="col-stack">
      <section class="card" aria-labelledby="timer-h">
        <h2 id="timer-h">Live timer</h2>
        <div class="field">
          <label for="timer-name">Activity name</label>
          <input id="timer-name" type="text" maxlength="120" bind:value={timerName} aria-invalid={!!timerErrs.name} aria-describedby={timerErrs.name ? 'timer-name-err' : undefined} />
          {#if timerErrs.name}<div id="timer-name-err" class="error" role="alert">{timerErrs.name}</div>{/if}
        </div>
        <div class="form-row">
          <div class="field">
            <label for="timer-cat">Category</label>
            <select id="timer-cat" bind:value={timerCat} aria-invalid={!!timerErrs.category} aria-describedby={timerErrs.category ? 'timer-cat-err' : undefined}>
              {#each CATS as c}<option value={c}>{c}</option>{/each}
            </select>
            {#if timerErrs.category}<div id="timer-cat-err" class="error" role="alert">{timerErrs.category}</div>{/if}
          </div>
          <div class="field">
            <label for="timer-tag">Tag (optional)</label>
            <select id="timer-tag" bind:value={timerTag} aria-invalid={!!timerErrs.tag} aria-describedby={timerErrs.tag ? 'timer-tag-err' : undefined}>
              <option value="">No tag</option>
              {#each tg as t}<option value={t}>{t}</option>{/each}
            </select>
            {#if timerErrs.tag}<div id="timer-tag-err" class="error" role="alert">{timerErrs.tag}</div>{/if}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:4px">
          <div class="mono" style="font-size:28px;font-weight:700" aria-live="polite">{fmtClock(elapsed)}</div>
          {#if S.timer.running}
            <button class="btn danger" type="button" onclick={onStopTimer}>
              <Icon name="stop" label="" size={16} /> Stop timer
            </button>
            <span class="hint">Tracking “{S.timer.name}”</span>
          {:else}
            <button class="btn primary" type="button" onclick={onStartTimer} disabled={!!Object.keys(timerErrs).length && (!timerName.trim() || !timerCat)}>
              <Icon name="play" label="" size={16} /> Start timer
            </button>
          {/if}
        </div>
      </section>

      <section class="card" id="timeline" aria-labelledby="tl-h">
        <h2 id="tl-h">Today's timeline</h2>
        {#if tl.length === 0}
          <div class="empty">
            <Icon name="clock" label="Empty timeline" size={28} />
            <div class="empty-title">No entries yet</div>
            <div>Log a first entry with the Live timer or Add entry manually to fill today's timeline.</div>
          </div>
        {:else}
          <div class="timeline">
            {#each tl as e (e.id)}
              <button
                type="button"
                class="tl-block {e.category}"
                style="min-height:{Math.max(40, e.durationMinutes * 1.6)}px"
                transition:slide={{ duration: dur }}
                animate:flip={{ duration: dur }}
                onclick={() => openEdit(e)}
              >
                <span class="tl-name">{e.name}</span>
                <span class="tl-meta">{fmtDur(e.durationMinutes)} · {fmtTimeOfDay(e.startTime)}</span>
              </button>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card" id="weekly-chart" aria-labelledby="wk-h">
        <h2 id="wk-h">Weekly overview</h2>
        <Weekly />
      </section>

      <section class="card" id="heat-map" aria-labelledby="hm-h">
        <h2 id="hm-h">Streak heat-map</h2>
        <Heat />
      </section>
    </div>

    <div class="col-stack">
      <section class="card" aria-labelledby="man-h">
        <h2 id="man-h">Add entry manually</h2>
        {#if !S.manualOpen}
          <button class="manual-collapsed" type="button" onclick={() => setManualOpen(true)}>
            <Icon name="plus" label="" /> Open manual entry form
          </button>
        {:else}
          <form
            onsubmit={(e) => {
              e.preventDefault();
              onManualSubmit();
            }}
          >
            <div class="field">
              <label for="man-name">Activity name</label>
              <input id="man-name" type="text" maxlength="200" bind:value={manName} aria-invalid={!!manErrs.name} aria-describedby={manErrs.name ? 'man-name-err' : undefined} />
              {#if manErrs.name}<div id="man-name-err" class="error" role="alert">{manErrs.name}</div>{/if}
            </div>
            <div class="form-row">
              <div class="field">
                <label for="man-cat">Category</label>
                <select id="man-cat" bind:value={manCat}>
                  {#each CATS as c}<option value={c}>{c}</option>{/each}
                </select>
              </div>
              <div class="field">
                <label for="man-tag">Tag (optional)</label>
                <select id="man-tag" bind:value={manTag} aria-invalid={!!manErrs.tag} aria-describedby={manErrs.tag ? 'man-tag-err' : undefined}>
                  <option value="">No tag</option>
                  {#each tg as t}<option value={t}>{t}</option>{/each}
                </select>
                {#if manErrs.tag}<div id="man-tag-err" class="error" role="alert">{manErrs.tag}</div>{/if}
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label for="man-start">Start time</label>
                <input id="man-start" type="text" placeholder="YYYY-MM-DDTHH:mm" bind:value={manStart} aria-invalid={!!manErrs.startTime} aria-describedby={manErrs.startTime ? 'man-start-err' : undefined} />
                {#if manErrs.startTime}<div id="man-start-err" class="error" role="alert">{manErrs.startTime}</div>{/if}
              </div>
              <div class="field">
                <label for="man-dur">Duration (minutes)</label>
                <input id="man-dur" type="number" min="1" max="1440" bind:value={manDur} aria-invalid={!!manErrs.durationMinutes} aria-describedby={manErrs.durationMinutes ? 'man-dur-err' : undefined} />
                {#if manErrs.durationMinutes}<div id="man-dur-err" class="error" role="alert">{manErrs.durationMinutes}</div>{/if}
              </div>
            </div>
            <div class="panel-actions">
              <button class="btn" type="button" onclick={() => setManualOpen(false)}>Cancel</button>
              <button class="btn primary" type="submit" disabled={manLock}>Save entry</button>
            </div>
          </form>
        {/if}
      </section>

      <section class="card" aria-labelledby="list-h">
        <h2 id="list-h">All entries</h2>
        {#if S.selected.length}
          <div class="bulk-bar" role="region" aria-label="Bulk actions">
            <span class="count">{S.selected.length} selected</span>
            <button class="btn" type="button" onclick={() => bulk('Meaningful')}>Set category · Meaningful</button>
            <button class="btn" type="button" onclick={() => bulk('Neutral')}>Set category · Neutral</button>
            <button class="btn" type="button" onclick={() => bulk('Draining')}>Set category · Draining</button>
            <button class="btn" type="button" onclick={clearSelection}>Clear selection</button>
          </div>
        {/if}

        {#if all.length === 0}
          <div class="empty">
            <Icon name="list" label="Empty list" size={28} />
            <div class="empty-title">No entries yet</div>
            <div>Start the Live timer or open Add entry manually to create your first entry.</div>
          </div>
        {:else if listed.length === 0}
          <div class="no-results" role="status">
            No entries match this search or filter. Clear the search or choose All to restore the full list.
          </div>
        {:else}
          <ul class="entries">
            {#each listed as e (e.id)}
              <li class="entry-row" transition:slide={{ duration: dur }} animate:flip={{ duration: dur }}>
                <input
                  type="checkbox"
                  checked={S.selected.includes(e.id)}
                  aria-label={`Select ${e.name}`}
                  onchange={() => toggleSelect(e.id)}
                />
                <div class="entry-main">
                  <div class="entry-line1">
                    <button class="entry-name" type="button" onclick={() => openEdit(e)}>{e.name}</button>
                    <span class="cat {e.category}"><span class="dot"></span>{e.category}</span>
                    {#if e.tag}<span class="tag-pill">{e.tag}</span>{/if}
                    {#if e.interruptionReason}<span class="reason-pill">{e.interruptionReason}</span>{/if}
                  </div>
                  <div class="entry-line2">
                    <span>{fmtTimeOfDay(e.startTime)}</span>
                    <span>·</span>
                    <span>{e.startTime.slice(0, 10)}</span>
                  </div>
                </div>
                <div class="entry-right">
                  <span class="entry-dur">{fmtDur(e.durationMinutes)}</span>
                  <button class="icon-btn" type="button" aria-label={`Delete ${e.name}`} onclick={() => openDelete(e.id)}>
                    <Icon name="delete" label={`Delete ${e.name}`} size={16} />
                  </button>
                </div>
              </li>
            {/each}
          </ul>
          <p class="hint" style="margin-top:12px">
            Across {listed.length} {listed.length === 1 ? 'entry' : 'entries'}
            {#if S.filter !== 'all' || S.search} (filtered from {all.length}){/if}
          </p>
        {/if}
      </section>
    </div>
  </div>

  <p class="footer">ClockCraft keeps your session in memory — export Session JSON to keep your work.</p>
</main>

{#if S.tooltip}
  <div class="tip" style="left:{S.tooltip.x + 12}px;top:{S.tooltip.y + 12}px" role="tooltip">{S.tooltip.text}</div>
{/if}

<div class="toasts" aria-live="polite">
  {#each S.toasts as t (t.id)}
    <div class="toast {t.kind || ''}" transition:fly={{ y: 12, duration: dur }}>{t.text}</div>
  {/each}
</div>

{#if S.overlay?.which === 'edit' && editEntry}
  <Dialog title="Edit entry" titleId="edit-title" onClose={closeOverlay}>
    <div class="field">
      <label for="edit-name">Activity name</label>
      <input id="edit-name" type="text" bind:value={editName} aria-invalid={!!editErrs.name} aria-describedby={editErrs.name ? 'edit-name-err' : undefined} />
      {#if editErrs.name}<div id="edit-name-err" class="error" role="alert">{editErrs.name}</div>{/if}
    </div>
    <div class="form-row">
      <div class="field">
        <label for="edit-cat">Category</label>
        <select id="edit-cat" bind:value={editCat}>
          {#each CATS as c}<option value={c}>{c}</option>{/each}
        </select>
      </div>
      <div class="field">
        <label for="edit-tag">Tag (optional)</label>
        <select id="edit-tag" bind:value={editTag} aria-invalid={!!editErrs.tag} aria-describedby={editErrs.tag ? 'edit-tag-err' : undefined}>
          <option value="">No tag</option>
          {#each tg as t}<option value={t}>{t}</option>{/each}
        </select>
        {#if editErrs.tag}<div id="edit-tag-err" class="error" role="alert">{editErrs.tag}</div>{/if}
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <label for="edit-start">Start time</label>
        <input id="edit-start" type="text" bind:value={editStart} aria-invalid={!!editErrs.startTime} aria-describedby={editErrs.startTime ? 'edit-start-err' : undefined} />
        {#if editErrs.startTime}<div id="edit-start-err" class="error" role="alert">{editErrs.startTime}</div>{/if}
      </div>
      <div class="field">
        <label for="edit-dur">Duration (minutes)</label>
        <input id="edit-dur" type="number" bind:value={editDur} aria-invalid={!!editErrs.durationMinutes} aria-describedby={editErrs.durationMinutes ? 'edit-dur-err' : undefined} />
        {#if editErrs.durationMinutes}<div id="edit-dur-err" class="error" role="alert">{editErrs.durationMinutes}</div>{/if}
      </div>
    </div>
    <div class="field">
      <label for="edit-reason">Interruption reason</label>
      <select id="edit-reason" bind:value={editReason}>
        <option value={null}>None</option>
        <option value="Internal">Internal</option>
        <option value="External">External</option>
      </select>
    </div>
    <div class="panel-actions">
      <button class="btn" type="button" onclick={closeOverlay}>Cancel</button>
      <button class="btn primary" type="button" onclick={onEditSave}>Save changes</button>
    </div>
  </Dialog>
{/if}

{#if S.overlay?.which === 'delete'}
  <Dialog title="Delete entry" titleId="del-title" onClose={closeOverlay}>
    <p>Delete this entry? It will be removed from the timeline, list, ratio, chart, and heat-map.</p>
    <div class="panel-actions">
      <button class="btn" type="button" onclick={closeOverlay}>Cancel</button>
      <button class="btn danger" type="button" onclick={confirmDelete}>Delete</button>
    </div>
  </Dialog>
{/if}

{#if S.overlay?.which === 'tags'}
  <Dialog title="Manage tags" titleId="tags-title" onClose={closeOverlay}>
    <div class="tag-list">
      {#if tg.length === 0}
        <span class="hint">No custom tags yet. Create one below (for example Reading or Social Media).</span>
      {:else}
        {#each tg as t}
          <span class="tag-chip">
            {t}
            <button type="button" aria-label={`Delete tag ${t}`} onclick={() => deleteTag(t)}>×</button>
          </span>
        {/each}
      {/if}
    </div>
    <div class="field">
      <label for="tag-name">New tag name</label>
      <input id="tag-name" type="text" maxlength="40" bind:value={tagDraft} aria-invalid={!!tagErrs.name} aria-describedby={tagErrs.name ? 'tag-name-err' : undefined} />
      {#if tagErrs.name}<div id="tag-name-err" class="error" role="alert">{tagErrs.name}</div>{/if}
    </div>
    <div class="panel-actions">
      <button class="btn" type="button" onclick={closeOverlay}>Close</button>
      <button class="btn primary" type="button" onclick={onCreateTag}>Create tag</button>
    </div>
  </Dialog>
{/if}

{#if S.overlay?.which === 'history'}
  <Dialog title="History" titleId="hist-title" wide onClose={closeOverlay}>
    <div class="panel-actions" style="margin-top:0;justify-content:flex-start">
      <button class="btn" type="button" disabled={!canUndo()} onclick={undo}><Icon name="undo" label="" size={16} /> Undo</button>
      <button class="btn" type="button" disabled={!canRedo()} onclick={redo}><Icon name="redo" label="" size={16} /> Redo</button>
      <button class="btn" type="button" onclick={applyScenario}>Apply scenario change</button>
    </div>
    <div class="hist-state" aria-label="History state">
      <div class="hs-label">History state</div>
      <div><strong>{snap.label}</strong> — {snap.entries.length} {snap.entries.length === 1 ? 'entry' : 'entries'}, {snap.tags.length} {snap.tags.length === 1 ? 'tag' : 'tags'}</div>
    </div>
    {#if S.branches.length > 1}
      <div class="branch-list" role="group" aria-label="Alternate branches">
        {#each S.branches as _, i}
          <button type="button" aria-pressed={S.branchIndex === i} onclick={() => selectBranch(i)}>
            <Icon name="branch" label="" size={12} /> Branch {i + 1}
          </button>
        {/each}
      </div>
    {/if}
    <ol class="snap-list">
      {#each S.branches[S.branchIndex] as s, i}
        <li>
          <button type="button" class:current={i === S.cursors[S.branchIndex]} onclick={() => goToSnapshot(i)}>
            <span class="n">{i + 1}</span>
            <span>{s.label} · {s.entries.length} entries</span>
          </button>
        </li>
      {/each}
    </ol>
    <div class="panel-actions">
      <button class="btn" type="button" onclick={closeOverlay}>Close</button>
    </div>
  </Dialog>
{/if}

{#if S.overlay?.which === 'export'}
  <Dialog title="Export session" titleId="exp-title" wide onClose={closeOverlay}>
    <div class="tabs" role="tablist">
      <button type="button" class="tab" role="tab" aria-selected={S.exportTab === 'json'} onclick={() => setExportTab('json')}>Session JSON</button>
      <button type="button" class="tab" role="tab" aria-selected={S.exportTab === 'csv'} onclick={() => setExportTab('csv')}>Timesheet CSV</button>
    </div>
    <div class="export-meta">
      <span><b>{all.length}</b> entries</span>
      <span><b>{tg.length}</b> tags</span>
      <span>Rollup <b>{mins}</b> min · <b>{ratio}%</b> · streak <b>{streak}</b></span>
    </div>
    <pre class="codeblock" aria-live="polite">{S.exportTab === 'json' ? jsonText : csvText}</pre>
    <p class="hint">Preview regenerates live from the current session. Copy or Download the active tab.</p>
    <div class="panel-actions">
      <button class="btn" type="button" onclick={closeOverlay}>Close</button>
      <button class="btn" type="button" onclick={doCopy}><Icon name="copy" label="" size={16} /> Copy</button>
      <button class="btn primary" type="button" onclick={doDownload}><Icon name="download" label="" size={16} /> Download</button>
    </div>
  </Dialog>
{/if}

{#if S.overlay?.which === 'import'}
  <Dialog title="Import session" titleId="imp-title" wide onClose={() => { clearImportDraft(); closeOverlay(); }}>
    {#if S.importing}
      <div class="spinner"><span class="ring"></span> Importing session…</div>
    {:else if S.importDraft}
      {#if S.importDraft.result.ok}
        <div class="import-preview">
          Replace the current session with <strong>{S.importDraft.name}</strong>?
          This loads {S.importDraft.result.entries.length} entries and {S.importDraft.result.tags.length} tags.
          The current session will be replaced.
        </div>
        <div class="panel-actions">
          <button class="btn" type="button" onclick={() => { clearImportDraft(); closeOverlay(); }}>Cancel</button>
          <button class="btn primary" type="button" onclick={onConfirmImport}>Replace session</button>
        </div>
      {:else}
        <p>Import failed validation. The current session was not changed.</p>
        <ul class="import-errors" aria-live="assertive">
          {#each S.importDraft.result.errors as err}
            <li><span class="fld">{err.field}</span> — {err.message}</li>
          {/each}
        </ul>
        <div class="panel-actions">
          <button class="btn" type="button" onclick={() => { clearImportDraft(); closeOverlay(); }}>Close</button>
        </div>
      {/if}
    {:else}
      <p>Choose a previously exported Session JSON file. Valid documents replace the in-memory session after confirmation.</p>
      <div class="panel-actions">
        <button class="btn" type="button" onclick={closeOverlay}>Close</button>
        <button class="btn primary" type="button" onclick={() => document.getElementById('import-file')?.click()}>Choose file</button>
      </div>
    {/if}
  </Dialog>
{/if}

{#if S.overlay?.which === 'interruption'}
  <Dialog title="Interruption reason" titleId="int-title" onClose={cancelInterruption} showClose={true}>
    <p>This timer ran for less than 25 minutes. Choose exactly one interruption reason before the entry is saved.</p>
    <div class="radio-row" role="radiogroup" aria-label="Interruption reason">
      <label class="radio-opt" class:sel={interruptReason === 'Internal'}>
        <input type="radio" name="interrupt" value="Internal" bind:group={interruptReason} />
        Internal
      </label>
      <label class="radio-opt" class:sel={interruptReason === 'External'}>
        <input type="radio" name="interrupt" value="External" bind:group={interruptReason} />
        External
      </label>
    </div>
    {#if interruptErr}<div class="error" role="alert">{interruptErr}</div>{/if}
    <div class="panel-actions">
      <button class="btn" type="button" onclick={cancelInterruption}>Cancel</button>
      <button class="btn primary" type="button" onclick={onConfirmInterrupt} disabled={!interruptReason}>Confirm</button>
    </div>
  </Dialog>
{/if}

{#if S.overlay?.which === 'palette'}
  <Dialog title="Command palette" titleId="pal-title" onClose={closeOverlay}>
    <input
      class="palette-input"
      type="search"
      placeholder="Search commands…"
      bind:value={paletteQ}
      aria-label="Search commands"
    />
    <ul class="palette-list" role="listbox">
      {#each paletteMatches as c, i}
        <li>
          <button type="button" class:active={i === paletteIdx} role="option" aria-selected={i === paletteIdx} onclick={() => c.run()}>
            {c.label}
            {#if c.keys}<span class="cmd-key">{c.keys}</span>{/if}
          </button>
        </li>
      {/each}
      {#if paletteMatches.length === 0}
        <li class="hint" style="padding:12px">No commands match.</li>
      {/if}
    </ul>
  </Dialog>
{/if}

{#if S.overlay?.which === 'print'}
  <Dialog title="Printable day summary" titleId="print-title" wide onClose={closeOverlay}>
    <div class="import-preview print-summary">
      <h3 style="margin:0 0 8px">ClockCraft — {new Date().toLocaleDateString()}</h3>
      <p class="hint">{mins} min today · Meaningful ratio {ratio}% · streak {streak}</p>
      <ul>
        {#each todayListed as e}
          <li><strong>{e.name}</strong> — {e.category} · {fmtDur(e.durationMinutes)} · {fmtTimeOfDay(e.startTime)}</li>
        {:else}
          <li class="hint">No entries logged for today yet.</li>
        {/each}
      </ul>
    </div>
    <div class="panel-actions">
      <button class="btn" type="button" onclick={closeOverlay}>Close</button>
      <button class="btn primary" type="button" onclick={() => window.print()}>Print</button>
    </div>
  </Dialog>
{/if}

<style>
  .sr-live {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media print {
    .header-actions,
    .toolbar,
    .coach,
    .toasts,
    .skip {
      display: none !important;
    }
  }
</style>
