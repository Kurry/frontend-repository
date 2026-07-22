import { z } from 'zod'
import { RecordSchema, StatusSchema } from '../store/useStore'

export const ArtifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(), // RFC3339
  records: z.array(RecordSchema),
  derived: z.any(), // Not strictly validated on import, re-derived usually
  history: z.array(z.any()) // simplified for now
})

export const exportArtifact = (records, derived, history) => {
  const artifact = {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records,
    derived,
    history
  }

  const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fiction-branches-v1-forecast-ribbon.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const importArtifact = (fileContent) => {
  try {
    const data = JSON.parse(fileContent)

    // Check for duplicate IDs during parsing
    const ids = data.records?.map(r => r.id) || []
    if (new Set(ids).size !== ids.length) {
       return { success: false, error: 'Duplicate IDs found in records.' }
    }

    const result = ArtifactSchema.safeParse(data)
    if (!result.success) {
      return { success: false, error: 'Malformed schema or invalid bounds.' }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return { success: false, error: 'Invalid JSON file.' }
  }
}
