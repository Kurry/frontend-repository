<script>
  import { onMount, onDestroy } from 'svelte';
  import { EditorState, Compartment } from '@codemirror/state';
  import {
    EditorView,
    keymap,
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter
  } from '@codemirror/view';
  import { defaultKeymap, history, historyKeymap, undo, redo, undoDepth, redoDepth } from '@codemirror/commands';
  import {
    syntaxHighlighting,
    defaultHighlightStyle,
    foldGutter,
    foldKeymap,
    StreamLanguage
  } from '@codemirror/language';
  import { searchKeymap, highlightSelectionMatches, openSearchPanel } from '@codemirror/search';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { store } from './state.svelte.js';

  let { value = $bindable(), oninput, id, editorLabel = 'Editor' } = $props();

  let editorContainer;
  let view;
  let canUndo = $state(false);
  let canRedo = $state(false);
  const themeCompartment = new Compartment();

  // Lightweight Mermaid tokenizer: colors diagram-type keywords, directive
  // words, edge arrows, labels, and comments so keywords are visually
  // distinct from node text.
  const mermaidLanguage = StreamLanguage.define({
    token(stream) {
      if (stream.match('%%')) {
        stream.skipToEnd();
        return 'comment';
      }
      if (
        stream.match(
          /^(flowchart|graph|sequenceDiagram|classDiagram|erDiagram|stateDiagram-v2|stateDiagram|mindmap|pie|gantt|journey|gitGraph|quadrantChart|requirementDiagram|xychart-beta|C4Context)\b/
        )
      ) {
        return 'keyword';
      }
      if (
        stream.match(
          /^(title|dateFormat|axisFormat|todayMarker|excludes|inclusiveEndDates|section|participant|actor|note|loop|alt|else|opt|par|and|rect|end|direction|subgraph|root|classDef|click|linkStyle|style|activate|deactivate|autoNumber)\b/
        )
      ) {
        return 'atom';
      }
      if (stream.match(/^(<\|--|-->>|-\.->|\.\.>|\}-\.-\{|\|\|--o\{|\|\|--\|\{|==>|-->|---|->>|\.\.-|-\)|--x|<--|\|)/)) {
        return 'operator';
      }
      if (stream.match(/^\|[^|]*\|/)) return 'string';
      if (stream.match(/"[^"]*"|'[^']*'/)) return 'string';
      if (stream.match(/^-?\d+(\.\d+)?/)) return 'number';
      if (stream.match(/^[A-Za-z_][A-Za-z0-9_-]*/)) return 'variableName';
      stream.next();
      return null;
    }
  });

  const refreshHistoryState = (state) => {
    canUndo = undoDepth(state) > 0;
    canRedo = redoDepth(state) > 0;
  };

  const onUndo = () => {
    if (view && undo(view)) view.focus();
  };
  const onRedo = () => {
    if (view && redo(view)) view.focus();
  };
  const onFind = () => {
    if (view) {
      openSearchPanel(view);
      view.focus();
    }
  };

  onMount(() => {
    const isDark = store.theme === 'dark';

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      foldGutter(),
      highlightSelectionMatches(),
      mermaidLanguage,
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, ...searchKeymap]),
      EditorView.lineWrapping,
      themeCompartment.of(isDark ? oneDark : []),
      EditorView.contentAttributes.of({
        'aria-label': editorLabel,
        spellcheck: 'false',
        autocapitalize: 'off',
        autocomplete: 'off'
      }),
      EditorView.updateListener.of((update) => {
        refreshHistoryState(update.state);
        if (update.docChanged) {
          const newVal = update.state.doc.toString();
          if (newVal !== value) {
            value = newVal;
            if (oninput) oninput(newVal);
          }
        }
      })
    ];

    const state = EditorState.create({
      doc: value,
      extensions
    });

    view = new EditorView({
      state,
      parent: editorContainer
    });
    refreshHistoryState(view.state);
  });

  onDestroy(() => {
    if (view) view.destroy();
  });

  // External writes (samples, imports, WebMCP set_content, undo through the
  // toolbar) land in the visible editor document.
  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value }
      });
      refreshHistoryState(view.state);
    }
  });

  $effect(() => {
    if (view) {
      const isDark = store.theme === 'dark';
      view.dispatch({
        effects: themeCompartment.reconfigure(isDark ? oneDark : [])
      });
    }
  });
</script>

<div class="flex h-full w-full min-h-0 flex-col">
  <div
    class="flex items-center justify-end gap-1 border-b border-slate-200 bg-slate-50 px-1.5 py-0.5 dark:border-slate-700 dark:bg-slate-900/60"
    role="toolbar"
    aria-label="Editor tools"
  >
    <button
      type="button"
      onclick={onUndo}
      disabled={!canUndo}
      aria-label="Undo"
      title="Undo (Ctrl+Z)"
      class="inline-flex h-7 min-w-14 items-center justify-center rounded border border-transparent px-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-35 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      Undo
    </button>
    <button
      type="button"
      onclick={onRedo}
      disabled={!canRedo}
      aria-label="Redo"
      title="Redo (Ctrl+Shift+Z)"
      class="inline-flex h-7 min-w-14 items-center justify-center rounded border border-transparent px-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-35 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      Redo
    </button>
    <button
      type="button"
      onclick={onFind}
      aria-label="Find in editor"
      title="Find (Ctrl+F)"
      class="inline-flex h-7 min-w-14 items-center justify-center rounded border border-transparent px-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      Find
    </button>
  </div>
  <div
    {id}
    bind:this={editorContainer}
    class="min-h-0 flex-1 w-full overflow-hidden bg-transparent text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-editor]:bg-transparent [&_.cm-editor]:font-mono [&_.cm-gutters]:bg-slate-50 dark:[&_.cm-gutters]:bg-slate-900/50 [&_.cm-gutters]:border-r [&_.cm-gutters]:border-slate-200 dark:[&_.cm-gutters]:border-slate-800 [&_.cm-activeLine]:bg-slate-100/50 dark:[&_.cm-activeLine]:bg-slate-800/50 [&_.cm-searchMatch]:bg-amber-200/60 dark:[&_.cm-searchMatch]:bg-amber-500/30"
  ></div>
</div>
