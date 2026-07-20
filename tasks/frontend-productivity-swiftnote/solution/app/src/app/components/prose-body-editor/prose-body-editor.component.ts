import {
  Component, ElementRef, ViewChild, input, output,
  AfterViewInit, OnDestroy, effect, inject, NgZone,
} from '@angular/core';
import { defineBasicExtension, type BasicExtension } from 'prosekit/basic';
import 'prosekit/basic/style.css';
import 'prosekit/basic/typography.css';
import {
  createEditor, defineDocChangeHandler, union, type Editor,
} from 'prosekit/core';

const BODY_MAX = 20000;

function plainToHtml(body: string): string {
  if (!body.trim()) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  return body
    .split(/\n{2,}/)
    .map(p => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function htmlToPlain(html: string): string {
  if (!html.trim()) return '';
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent ?? '').replace(/\u00a0/g, ' ');
}

export interface FormatActiveState {
  bold: boolean;
  italic: boolean;
  heading: boolean;
  bulletList: boolean;
}

@Component({
  selector: 'app-prose-body-editor',
  standalone: true,
  template: `
    <div
      #host
      id="note-body"
      class="prose-body-host"
      role="textbox"
      aria-multiline="true"
      aria-labelledby="note-body-label"
    ></div>
  `,
  styles: [`
    .prose-body-host {
      background: transparent;
      border: none;
      outline: none;
      font-family: 'Roboto', sans-serif;
      font-size: 16px;
      color: rgba(255,255,255,0.9);
      width: 100%;
      min-height: 200px;
      flex: 1;
      line-height: 1.55;
      padding: 0;
    }
    .prose-body-host:focus-visible {
      outline: 2px solid #F45B69;
      outline-offset: 4px;
      border-radius: 4px;
    }
    .prose-body-host :global(p) { margin: 0 0 0.75em; }
    .prose-body-host :global(strong) { font-weight: 700; }
    .prose-body-host :global(em) { font-style: italic; }
    .prose-body-host :global(h1),
    .prose-body-host :global(h2),
    .prose-body-host :global(h3) {
      font-weight: 600;
      margin: 0.5em 0;
    }
    .prose-body-host :global(ul) {
      margin: 0.5em 0;
      padding-left: 1.4em;
    }
  `],
})
export class ProseBodyEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host') hostRef!: ElementRef<HTMLDivElement>;

  content = input<string>('');
  noteId = input<string | null>(null);

  contentChange = output<string>();
  formatActiveChange = output<FormatActiveState>();
  bodyError = output<string | null>();

  private zone = inject(NgZone);
  private editor: Editor<BasicExtension> | null = null;
  private mountedNoteId: string | null = null;
  private suppressEmit = false;
  private changeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const id = this.noteId();
      const html = this.content();
      if (!this.editor || id === this.mountedNoteId) return;
      this.mountedNoteId = id;
      this.suppressEmit = true;
      this.editor.setContent(plainToHtml(html));
      this.suppressEmit = false;
      this.emitActiveState();
    });
  }

  ngAfterViewInit(): void {
    const onDocChange = defineDocChangeHandler(() => {
      if (this.suppressEmit || !this.editor) return;
      if (this.changeTimer) clearTimeout(this.changeTimer);
      this.changeTimer = setTimeout(() => this.zone.run(() => this.emitChange()), 60);
    });

    const extension = union(defineBasicExtension(), onDocChange);
    this.editor = createEditor({
      extension,
      defaultContent: plainToHtml(this.content()),
    });
    this.editor.mount(this.hostRef.nativeElement);
    this.mountedNoteId = this.noteId();
    this.emitActiveState();

    this.editor.view.dom.addEventListener('keyup', () => this.emitActiveState());
    this.editor.view.dom.addEventListener('mouseup', () => this.emitActiveState());
  }

  ngOnDestroy(): void {
    if (this.changeTimer) clearTimeout(this.changeTimer);
    this.editor?.unmount();
    this.editor = null;
  }

  toggleBold(): void { this.editor?.commands.toggleBold(); this.emitActiveState(); }
  toggleItalic(): void { this.editor?.commands.toggleItalic(); this.emitActiveState(); }
  toggleHeading(): void { this.editor?.commands.toggleHeading({ level: 2 }); this.emitActiveState(); }
  toggleBulletList(): void { this.editor?.commands.toggleList({ kind: 'bullet' }); this.emitActiveState(); }
  undo(): void { this.editor?.commands.undo(); }
  redo(): void { this.editor?.commands.redo(); }

  focus(): void {
    this.editor?.view.focus();
  }

  getActiveState(): FormatActiveState {
    if (!this.editor) {
      return { bold: false, italic: false, heading: false, bulletList: false };
    }
    return {
      bold: this.editor.marks.bold?.isActive() ?? false,
      italic: this.editor.marks.italic?.isActive() ?? false,
      heading: this.editor.nodes.heading?.isActive() ?? false,
      bulletList: this.editor.nodes.list?.isActive({ kind: 'bullet' }) ?? false,
    };
  }

  private emitActiveState(): void {
    this.formatActiveChange.emit(this.getActiveState());
  }

  private emitChange(): void {
    if (!this.editor || this.suppressEmit) return;
    const html = this.editor.getDocHTML().trim();
    const plainLen = htmlToPlain(html).length;
    if (plainLen > BODY_MAX) {
      this.bodyError.emit(`Body must be ${BODY_MAX} characters or fewer.`);
      return;
    }
    this.bodyError.emit(null);
    this.contentChange.emit(html === '<p></p>' ? '' : html);
    this.emitActiveState();
  }
}

export { htmlToPlain, plainToHtml };
