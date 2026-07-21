import os
import re

APP_DIR = 'tasks/frontend-workflow-gate-console/solution/app'

# 1. Focus Trap Fix in src/lib/actions.ts
actions_path = os.path.join(APP_DIR, 'src/lib/actions.ts')
with open(actions_path, 'r') as f:
    actions_code = f.read()
if 'let previousFocus' not in actions_code:
    actions_code = actions_code.replace('function focusTrap(node: HTMLElement) {', '''function focusTrap(node: HTMLElement) {
  let previousFocus: HTMLElement | null = null;
  if (typeof document !== 'undefined') {
    previousFocus = document.activeElement as HTMLElement | null;
  }''')
    actions_code = actions_code.replace('document.removeEventListener(\'focusin\', handleFocusIn, true);\n    }', '''document.removeEventListener('focusin', handleFocusIn, true);
      if (previousFocus) {
        previousFocus.focus();
      }
    }''')
    with open(actions_path, 'w') as f:
        f.write(actions_code)
    print("Patched actions.ts")

# 2. Console Store Fixes (Import, Rerun, What-if Revert)
store_path = os.path.join(APP_DIR, 'src/lib/console-store.svelte.ts')
with open(store_path, 'r') as f:
    store_code = f.read()

# Rerun double-start
store_code = store_code.replace('''async startRerun(stageName: StageName = this.selectedStage.name): Promise<boolean> {
    if (this.rerun.active) return false;
    const run = this.selectedRun;''', '''async startRerun(stageName: StageName = this.selectedStage.name): Promise<boolean> {
    if (this.rerun.active) return false;
    this.rerun.active = true;
    const run = this.selectedRun;''')

store_code = store_code.replace('''if (!stage) return false;''', '''if (!stage) {
      this.rerun.active = false;
      return false;
    }''')

# Import Fix
store_code = store_code.replace('''timeline: payload.timeline.map((entry, index) => ({ ...entry, id: `import-${index}-${Date.now()}` }))''', '''timeline: payload.timeline.map((entry) => ({ ...entry }))''')
store_code = store_code.replace('''this.runs = nextRuns;''', '''this.runs = [...nextRuns];''')
store_code = store_code.replace('''this.resetTransientStageState();
    this.touchExport();''', '''this.exportedAt = payload.exportedAt;
    this.resetTransientStageState();''')

with open(store_path, 'w') as f:
    f.write(store_code)
print("Patched console-store.svelte.ts")

# 3. Clipboard fallback and label fixes in ModalLayer.svelte
modal_path = os.path.join(APP_DIR, 'src/lib/components/ModalLayer.svelte')
with open(modal_path, 'r') as f:
    modal_code = f.read()

fallback_code = """      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }"""

modal_code = modal_code.replace('await navigator.clipboard.writeText(value);', fallback_code)
modal_code = modal_code.replace(">Copy<", ">Copy acceptance package<")
modal_code = modal_code.replace(">Download<", ">Download acceptance package<")

with open(modal_path, 'w') as f:
    f.write(modal_code)
print("Patched ModalLayer.svelte")

# 4. App.svelte (Clipboard, Contrast, What-if reactivity, UI labels, Spin)
app_path = os.path.join(APP_DIR, 'src/App.svelte')
with open(app_path, 'r') as f:
    app_code = f.read()

app_code = app_code.replace('await navigator.clipboard.writeText(cert.fingerprint);', fallback_code.replace('value', 'cert.fingerprint'))
app_code = app_code.replace("color:#6f8094", "color:#546478")

# Fix what-if reactivity by using displayedStageStatus
app_code = app_code.replace("{consoleStore.selectedStage.status}", "{consoleStore.displayedStageStatus}")

# Fix copy fingerprint with confirmation aria-live? And ARIA labels.
if 'aria-label="Toggle theme"' not in app_code:
    app_code = app_code.replace('class="theme-toggle" on:click={consoleStore.toggleTheme.bind(consoleStore)}>', 'class="theme-toggle" aria-label="Toggle theme" on:click={consoleStore.toggleTheme.bind(consoleStore)}>')
if 'aria-label="Add note"' not in app_code:
    app_code = app_code.replace('<button aria-label="Add note" class="action-btn"', '<button aria-label="Add note" class="action-btn"')

# Toasts need live region
app_code = app_code.replace('class="toast"', 'class="toast" role="status" aria-live="polite"')

# Add loading spinner to re-run button
app_code = app_code.replace('''<button
                class="header-action primary"
                class:active={consoleStore.rerun.active}
                disabled={consoleStore.rerun.active}
                on:click={() => consoleStore.startRerun()}
              >
                <Play size={16} weight="fill" /> {consoleStore.rerun.active ? 'Re-run active' : 'Start re-run'}
              </button>''', '''<button
                class="header-action primary"
                class:active={consoleStore.rerun.active}
                disabled={consoleStore.rerun.active}
                on:click={() => consoleStore.startRerun()}
              >
                {#if consoleStore.rerun.active}
                  <CircleNotch size={16} weight="bold" class="spin" />
                {:else}
                  <Play size={16} weight="fill" />
                {/if}
                {consoleStore.rerun.active ? 'Re-run active' : 'Start re-run'}
              </button>''')

# Performance - transitions under 100ms, except spin!
app_code = app_code.replace('.18s', '.09s').replace('.14s', '.09s').replace('.12s', '.09s').replace('.3s ease', '0.09s linear')
app_code = app_code.replace('.spin { animation:spin .85s linear infinite; }', '.spin { animation:spin .85s linear infinite; }') # Ensure we didn't break it

# Responsiveness
app_code = app_code.replace('class="detail-canvas"', 'class="detail-canvas" style="max-width: 100vw;"')
app_code = app_code.replace('class="run-meta"', 'class="run-meta" style="max-width: 100vw; overflow-x: auto;"')

with open(app_path, 'w') as f:
    f.write(app_code)
print("Patched App.svelte")

# 5. Global CSS and motion
css_path = os.path.join(APP_DIR, 'src/app.css')
with open(css_path, 'r') as f:
    css_code = f.read()

css_code = css_code.replace('.18s', '.09s').replace('.12s', '.09s').replace('.28s', '.09s').replace('.32s', '.09s')
if '@media (prefers-reduced-motion: reduce)' not in css_code:
    css_code += '''

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
'''
if 'min-height: 44px' not in css_code:
    css_code += '''
@media (max-width: 768px) {
  button, .run-card, .whatif-toggle, select, input {
    min-height: 44px !important;
  }
}
'''
with open(css_path, 'w') as f:
    f.write(css_code)
print("Patched app.css")

# 6. Components motion patches (except spin)
for comp in ['CertificateChain.svelte', 'GateRegistry.svelte', 'GateRow.svelte', 'NoteForm.svelte', 'StageStrip.svelte']:
    comp_path = os.path.join(APP_DIR, 'src/lib/components', comp)
    if os.path.exists(comp_path):
        with open(comp_path, 'r') as f:
            code = f.read()
        code = code.replace('.18s', '.09s').replace('.12s', '.09s').replace('.28s', '.09s').replace('.32s', '.09s')
        if comp == 'GateRow.svelte' and 'aria-label="Add note"' not in code:
            code = code.replace('<button class="action-btn"', '<button aria-label="Add note" class="action-btn"')
        with open(comp_path, 'w') as f:
            f.write(code)
        print(f"Patched {comp}")
