export interface SampleItem {
  id: string
  label: string
  category: string
}

const CATEGORIES = ['Planning', 'Research', 'Design', 'Review']

/** Deterministic sample collection for the virtualized list demo. */
export function generateSampleItems(count = 10000): SampleItem[] {
  const items: SampleItem[] = []
  for (let index = 1; index <= count; index += 1) {
    items.push({
      id: `sample-${index}`,
      label: `Sample item ${index}`,
      category: CATEGORIES[(index - 1) % CATEGORIES.length],
    })
  }
  return items
}
