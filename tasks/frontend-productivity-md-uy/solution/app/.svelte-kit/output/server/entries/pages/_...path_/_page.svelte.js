import { q as attr } from "../../../chunks/attributes.js";
import "marked";
import { EditorView } from "codemirror";
EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "0.92rem",
    backgroundColor: "var(--card)",
    color: "var(--foreground)"
  },
  "&.cm-focused": {
    outline: "none"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--foreground)"
  },
  ".cm-content": {
    fontFamily: "var(--font-mono)",
    "padding-inline": "2rem",
    "padding-block": "1.5rem",
    "line-height": "1.6"
  },
  ".cm-gutters": {
    display: "none"
  },
  ".cm-activeLine": {
    backgroundColor: "transparent"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent"
  }
});
const NANOID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NANOID_LENGTH = 20;
const isValidId = (id) => {
  return new RegExp(`^([${NANOID_ALPHABET}]{10}|[${NANOID_ALPHABET}]{${NANOID_LENGTH}})$`).test(id);
};
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let joinId = "";
    $$renderer2.push(`<div class="flex h-screen w-full flex-col overflow-hidden"><header class="flex items-center justify-between gap-2 border-b px-4 py-2"><div class="flex items-center text-xs"><a href="/" class="text-foreground/70 hover:text-foreground transition-colors">md.uy</a> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-2"><button class="hover:bg-accent hover:text-accent-foreground relative flex size-7 items-center justify-center rounded transition-colors" aria-label="Toggle theme" title="Toggle theme">`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button> <div class="relative hidden md:block"><input${attr("value", joinId)} placeholder="document id" autocomplete="off"${attr("maxlength", 20)} class="border-input bg-background h-7 w-32 rounded border pr-8 pl-2 font-mono text-xs focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2"/> <button${attr("disabled", !isValidId(joinId), true)} aria-label="Open document" title="Open document" class="hover:bg-accent hover:text-accent-foreground absolute top-1/2 right-1 flex size-5 -translate-y-1/2 items-center justify-center rounded transition-colors disabled:pointer-events-none disabled:opacity-40"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button></div> <button class="bg-primary text-primary-foreground hover:bg-primary/90 flex size-7 items-center justify-center rounded transition-colors" aria-label="New document" title="New document"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg></button></div></header> `);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="text-muted-foreground flex flex-1 items-center justify-center text-sm">Loading…</div>`);
    }
    $$renderer2.push(`<!--]--> <footer class="text-foreground/50 flex items-center justify-center gap-2 border-t px-3 py-2 font-mono text-[0.7rem]"><span>md.uy</span> <span>•</span> <span>the peer-to-peer markdown editor</span> <span>•</span> <span>download important notes</span></footer></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
