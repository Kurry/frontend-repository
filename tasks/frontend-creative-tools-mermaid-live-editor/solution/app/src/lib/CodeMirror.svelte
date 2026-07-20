<script>
  import { onMount, onDestroy } from 'svelte';
  import { EditorState, Compartment } from '@codemirror/state';
  import { EditorView, keymap, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { syntaxHighlighting, defaultHighlightStyle, foldGutter, foldKeymap } from '@codemirror/language';
  import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { store } from './state.svelte.js';

  let { value = $bindable(), readonly = false, oninput, id } = $props();

  let editorContainer;
  let view;
  const themeCompartment = new Compartment();

  onMount(() => {
    const isDark = store.theme === 'dark';
    
    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      history(),
      foldGutter(),
      highlightSelectionMatches(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...searchKeymap
      ]),
      themeCompartment.of(isDark ? oneDark : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newVal = update.state.doc.toString();
          if (newVal !== value) {
            value = newVal;
            if (oninput) oninput(newVal);
          }
        }
      })
    ];

    if (readonly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const state = EditorState.create({
      doc: value,
      extensions
    });

    view = new EditorView({
      state,
      parent: editorContainer
    });
  });

  onDestroy(() => {
    if (view) view.destroy();
  });

  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value }
      });
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

<div
  {id}
  bind:this={editorContainer}
  class="h-full w-full bg-transparent overflow-hidden text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-slate-50 dark:[&_.cm-gutters]:bg-slate-900/50 [&_.cm-gutters]:border-r [&_.cm-gutters]:border-slate-200 dark:[&_.cm-gutters]:border-slate-800 [&_.cm-activeLine]:bg-slate-100/50 dark:[&_.cm-activeLine]:bg-slate-800/50"
></div>
