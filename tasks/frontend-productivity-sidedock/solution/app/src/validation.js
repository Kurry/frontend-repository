import { z } from 'zod'

export const WORKSPACE_COLORS = [
  '#E54610', '#D97706', '#65A30D', '#059669', '#0891B2',
  '#2563EB', '#7C3AED', '#DB2777', '#6B7280',
]

export const workspaceCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(40, 'Name must be 40 characters or fewer'),
  color: z.enum(WORKSPACE_COLORS, { message: 'accentColor is invalid' }),
})

export const bookmarkCreateSchema = z.object({
  url: z.string().min(1, 'Enter a URL to add a bookmark').refine((val) => {
    let fullUrl = val
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) fullUrl = `https://${fullUrl}`
    try {
      const u = new URL(fullUrl)
      return ['http:', 'https:'].includes(u.protocol)
        && (u.hostname === 'localhost' || u.hostname.includes('.'))
    } catch {
      return false
    }
  }, 'Enter a complete web address, such as https://example.com'),
  title: z.string().max(120, 'Title must be 120 characters or fewer').optional(),
  folder: z.string().nullable().optional(),
})

export function normalizeBookmarkUrl(url) {
  let fullUrl = (url || '').trim()
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) fullUrl = `https://${fullUrl}`
  return fullUrl
}
