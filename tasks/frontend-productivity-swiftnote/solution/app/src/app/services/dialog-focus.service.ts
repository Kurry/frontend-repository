import { Injectable } from '@angular/core';

/** Remembers which control opened a dialog so focus can return on close. */
@Injectable({ providedIn: 'root' })
export class DialogFocusService {
  private opener: HTMLElement | null = null;

  remember(target: EventTarget | null | undefined): void {
    this.opener = (target as HTMLElement) ?? null;
  }

  restore(): void {
    const el = this.opener;
    this.opener = null;
    if (el && typeof el.focus === 'function') {
      setTimeout(() => el.focus(), 0);
    }
  }
}

export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
