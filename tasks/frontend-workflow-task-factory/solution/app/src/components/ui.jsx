import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { IconCheck, IconChevronDown, IconX } from '@tabler/icons-react'
import { cn } from '../lib/utils'

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  return <button className={cn('button', `button-${variant}`, `button-${size}`, className)} {...props} />
}

export function Badge({ className, variant = 'neutral', children, ...props }) {
  return <span className={cn('badge', `badge-${variant}`, className)} {...props}>{children}</span>
}

export function Card({ className, ...props }) {
  return <div className={cn('card', className)} {...props} />
}

export function Select({ value, onValueChange, placeholder, options, ariaLabel }) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="select-trigger" aria-label={ariaLabel}>
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon><IconChevronDown size={16} /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="select-content" position="popper" sideOffset={5}>
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item className="select-item" value={option.value} key={option.value}>
                <SelectPrimitive.ItemIndicator className="select-indicator"><IconCheck size={14} /></SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export function EmptyState({ title, description, onClear }) {
  return (
    <div className="empty-state">
      <div className="empty-state-mark">0</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onClear && <Button variant="secondary" onClick={onClear}>Clear filter</Button>}
    </div>
  )
}

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn('toast', `toast-${toast.kind}`)} role="status">
          <span className="toast-dot" />
          <p>{toast.message}</p>
          <button aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}><IconX size={16} /></button>
        </div>
      ))}
    </div>
  )
}
