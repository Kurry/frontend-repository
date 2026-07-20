import type { ItemStatus } from '../contracts'

export function StatusBadge({ status, countdown }: { status: ItemStatus; countdown?: number }) {
  const label = status === 'retrying' && countdown !== undefined ? `Retrying · ${countdown}s` : status
  return (
    <span className={`status-pill status-${status}`} aria-label={`Status: ${label}`}>
      <span className="status-icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
