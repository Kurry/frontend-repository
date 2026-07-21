import { h } from 'preact';

// One consistent stroke-based icon set used across the header, board controls,
// saved-lines actions, Export center, command palette and star toggle. Every
// icon renders at the same optical size (.ic) with currentColor strokes so they
// align and scale uniformly.

const PATHS = {
  undo: <path d="M9 14 4 9l5-5 M4 9h11a5 5 0 0 1 0 10h-3" />,
  redo: <path d="m15 14 5-5-5-5 M20 9H9a5 5 0 0 0 0 10h3" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  command: <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3Z" />,
  export: <><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  save: <><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v6h7V3" /><path d="M8 21v-7h8v7" /></>,
  practice: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  flip: <><path d="M3 7h13l-3-3" /><path d="M21 17H8l3 3" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  check: <path d="m4 12 5 5L20 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  soundOn: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a7 7 0 0 1 0 11" /></>,
  soundOff: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="m16 9 5 6M21 9l-5 6" /></>,
  compare: <><rect x="3" y="4" width="7" height="16" rx="1.5" /><rect x="14" y="4" width="7" height="16" rx="1.5" /></>,
  link: <><path d="M10 13a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-6-6l-1.5 1.5" /><path d="M14 11a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 6 6l1.5-1.5" /></>,
  print: <><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" rx="1" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
  tag: <><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
  arrowLeft: <path d="M15 5l-7 7 7 7" />,
  arrowRight: <path d="m9 5 7 7-7 7" />,
  arrowUp: <path d="M5 15l7-7 7 7" />,
  arrowDown: <path d="m5 9 7 7 7-7" />,
  board: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 12h18M12 3v18" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  sheet: <><path d="M6 2h9l4 4v16H6z" /><path d="M15 2v4h4" /><path d="M9 12h6M9 16h6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>
};

export function Icon({ name, size = 20, filled = false, title }) {
  const node = PATHS[name];
  return (
    <svg
      class="ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width={filled ? 0 : 2}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
    >
      {title ? <title>{title}</title> : null}
      {name === 'star' ? (
        <path d="M12 3.2l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.9 6.9 18.9 8 13.2 3.7 9.2l5.8-.7z" fill={filled ? 'currentColor' : 'none'} />
      ) : node}
    </svg>
  );
}

// Star is handled specially (filled vs outline) so callers stay declarative.
Icon.STAR = 'star';
