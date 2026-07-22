import { ref } from 'vue'

/** Reactive clock so relative labels such as "updated 2h ago" stay fresh. */
export const now = ref(Date.now())

if (typeof window !== 'undefined') {
  window.setInterval(() => {
    now.value = Date.now()
  }, 30000)
}

const MONTHS = [
  'Jan.',
  'Feb.',
  'March',
  'April',
  'May',
  'June',
  'July',
  'Aug.',
  'Sept.',
  'Oct.',
  'Nov.',
  'Dec.',
]

function formatClock(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  if (hours === 12 && minutes === 0) return 'noon'
  if (hours === 0 && minutes === 0) return 'midnight'
  const suffix = hours < 12 ? 'a.m.' : 'p.m.'
  let hour12 = hours % 12
  if (hour12 === 0) hour12 = 12
  if (minutes === 0) return `${hour12} ${suffix}`
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${suffix}`
}

/** Full dated timestamp, e.g. "March 4, 2026 · 2:30 p.m." */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const day = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  return `${day} · ${formatClock(date)}`
}

/** Compact relative label, e.g. "just now", "5m ago", "2h ago", "3d ago". */
export function formatRelative(timestamp: number, reference: number): string {
  const elapsed = Math.max(0, reference - timestamp)
  const seconds = Math.floor(elapsed / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const date = new Date(timestamp)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/** Start of the local calendar day containing the timestamp. */
export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Start of the local calendar day after the one containing the timestamp. */
export function startOfNextDay(timestamp: number): number {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime()
}

/** Compact relative label prefixed with Updated, e.g. "Updated just now", "Updated 5m ago". */
export function formatUpdatedRelative(timestamp: number, reference: number): string {
  return `Updated ${formatRelative(timestamp, reference)}`
}

/** Stable per-day index used for inclusive calendar-day arithmetic. */
export function dayNumber(timestamp: number): number {
  return Math.round(startOfDay(timestamp) / 86400000)
}
