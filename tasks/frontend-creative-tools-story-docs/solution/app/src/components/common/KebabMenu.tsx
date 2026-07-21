import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Ri, type RiIconName } from './Ri';

export interface KebabMenuItem {
  label: string;
  icon?: RiIconName;
  destructive?: boolean;
  onActivate: () => void;
}

/**
 * Accessible popup menu: opens on click/Enter, ArrowUp/Down move between
 * items, Home/End jump, Escape closes and returns focus to the trigger,
 * and outside clicks dismiss.
 */
export function KebabMenu({
  label,
  items,
  menuClassName,
  buttonClassName,
}: {
  label: string;
  items: KebabMenuItem[];
  menuClassName?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const count = items.length;
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      itemRefs.current[(current + 1) % count]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      itemRefs.current[(current - 1 + count) % count]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      itemRefs.current[count - 1]?.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 transition-colors',
          'hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
          open && 'bg-gray-100 text-gray-900',
          buttonClassName
        )}
      >
        <Ri name="more-2-fill" size={18} />
      </button>
      {open && (
        <ul
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={clsx(
            'menu-pop absolute right-0 z-40 mt-1 min-w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl',
            menuClassName
          )}
        >
          {items.map((item, i) => (
            <li key={item.label} role="none">
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onActivate();
                }}
                className={clsx(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
                  item.destructive
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-yellow-50 hover:text-gray-900'
                )}
              >
                {item.icon && <Ri name={item.icon} size={16} className="shrink-0" />}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
