import { columns } from './data.js'

export const compileBoard = (state) => ({
  board: { id: state.board.id, name: state.board.name },
  columns: columns.map((column) => ({
    id: column.id,
    name: column.name,
    wip_limit: state.wipLimits[column.id],
    card_ids: state.order[column.id],
  })),
  cards: columns.flatMap((column) => state.order[column.id].map((id, position) => {
    const card = state.cards[id]
    return {
      id: card.id,
      title: card.title,
      description: card.description,
      column: column.id,
      position,
      assignee: card.assignee,
      attached_prompt: card.attached_prompt,
      status: card.status,
      tasks: card.tasks.map(({ id: taskId, title, status, attempts }) => ({ id: taskId, title, status, attempts })),
      comments: card.comments.map(({ id: commentId, body, created_at }) => ({ id: commentId, body, created_at })),
    }
  })),
  prompts: state.prompts.map(({ id, title, text }) => ({ id, title, text })),
  assignees: state.assignees.map(({ id, name, initials, color }) => ({ id, name, initials, color })),
})

export const compileJSON = (state) => JSON.stringify(compileBoard(state), null, 2)

export const compileMarkdown = (state) => {
  const assignees = new Map(state.assignees.map((person) => [person.id, person.name]))
  const lines = [`# ${state.board.name}`, '', 'Live execution card digest.', '']
  columns.forEach((column) => {
    lines.push(`## ${column.name}`, '')
    const ids = state.order[column.id]
    if (!ids.length) lines.push('_No cards._', '')
    ids.forEach((id) => {
      const card = state.cards[id]
      const complete = card.tasks.filter((task) => task.status === 'complete').length
      lines.push(`### ${card.title}`)
      lines.push(`- Status: ${card.status}`)
      lines.push(`- Assignee: ${card.assignee ? assignees.get(card.assignee) : 'Unassigned'}`)
      lines.push(`- Progress: ${complete} of ${card.tasks.length}`)
      lines.push('- Tasks:')
      card.tasks.forEach((item) => lines.push(`  - [${item.status === 'complete' ? 'x' : ' '}] ${item.title} (${item.status})`))
      lines.push('')
    })
  })
  return lines.join('\n')
}
