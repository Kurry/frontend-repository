import React from 'react'
import * as Select from '@radix-ui/react-select'
import { CaretDown, Check } from '@phosphor-icons/react'

export function Button({ variant = 'default', className = '', children, ...props }) {
  const styles = {
    default: 'border-violet-500/50 bg-violet-500 text-white hover:bg-violet-400 hover:shadow-[0_6px_18px_rgba(139,124,246,.2)]',
    secondary: 'border-ink-600 bg-ink-800 text-mist-100 hover:border-mist-500 hover:bg-ink-700',
    ghost: 'border-transparent bg-transparent text-mist-300 hover:bg-ink-800 hover:text-mist-100',
    danger: 'border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20',
  }
  return <button className={`focusable inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 text-[13px] font-medium transition duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-35 ${styles[variant]} ${className}`} {...props}>{children}</button>
}

export function Label({ children, htmlFor, className = '' }) {
  return <label htmlFor={htmlFor} className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-[.12em] text-mist-500 ${className}`}>{children}</label>
}

export function FieldError({ children, id }) {
  if (!children) return null
  return <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">{children}</p>
}

export function TextInput({ className = '', ...props }) {
  return <input className={`focusable h-10 w-full rounded-md border border-ink-600 bg-ink-900 px-3 text-sm text-mist-100 placeholder:text-mist-500 ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`focusable w-full resize-y rounded-md border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm leading-relaxed text-mist-100 placeholder:text-mist-500 ${className}`} {...props} />
}

export function RadixSelect({ value, onValueChange, placeholder, options, ariaLabel }) {
  return (
    <Select.Root value={value || undefined} onValueChange={onValueChange}>
      <Select.Trigger aria-label={ariaLabel} className="focusable flex h-10 w-full items-center justify-between rounded-md border border-ink-600 bg-ink-900 px-3 text-left text-sm text-mist-100 data-[placeholder]:text-mist-500">
        <Select.Value placeholder={placeholder} /><Select.Icon><CaretDown size={14} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={5} className="z-[80] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-ink-600 bg-ink-850 p-1 shadow-2xl">
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item key={option.value} value={option.value} className="relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm text-mist-300 outline-none data-[highlighted]:bg-ink-700 data-[highlighted]:text-white">
                <Select.ItemIndicator className="absolute left-2"><Check size={13} /></Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

export function StatusPill({ status }) {
  const pass = status === 'pass' || status === 'complete'
  const running = status === 'running' || status === 'streaming'
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.1em] ${pass ? 'border-mint-500/25 bg-mint-500/10 text-mint-500' : running ? 'border-amber-500/25 bg-amber-500/10 text-amber-500' : 'border-red-500/25 bg-red-500/10 text-red-500'}`}><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${pass ? 'bg-mint-500' : running ? 'bg-amber-500' : 'bg-red-500'}`} />{status}</span>
}

export function SectionLabel({ children, aside }) {
  return <div className="flex items-center justify-between gap-3"><h2 className="text-[11px] font-semibold uppercase tracking-[.13em] text-mist-500">{children}</h2>{aside}</div>
}

export const titleCase = (value) => value.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')

