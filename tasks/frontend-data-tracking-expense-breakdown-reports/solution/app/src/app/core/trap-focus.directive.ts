import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog-semantics helper: captures the invoking control on open, moves focus
 * inside, traps Tab while open, emits on Escape, and returns focus to the
 * invoking control when the host element is destroyed (overlay closed).
 */
@Directive({ selector: '[appTrapFocus]' })
export class TrapFocusDirective implements AfterViewInit, OnDestroy {
  /** Optional element id to focus when the captured opener is no longer usable. */
  @Input() fallbackFocusId: string | null = null;
  @Output() escapePressed = new EventEmitter<void>();

  private opener: HTMLElement | null = null;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      this.opener = active;
    }
    const root = this.host.nativeElement;
    const preferred = root.querySelector<HTMLElement>('[data-autofocus]');
    const target = preferred ?? root.querySelector<HTMLElement>(FOCUSABLE);
    // Defer one tick so *ngIf-rendered content is settled before focusing.
    setTimeout(() => (target ?? root).focus(), 0);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      this.escapePressed.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    const root = this.host.nativeElement;
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (focusables.length === 0) {
      event.preventDefault();
      root.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !root.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (!root.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  ngOnDestroy(): void {
    const opener = this.opener;
    if (opener && document.contains(opener) && !opener.hasAttribute('disabled')) {
      opener.focus();
      return;
    }
    if (this.fallbackFocusId) {
      document.getElementById(this.fallbackFocusId)?.focus();
    }
  }
}
