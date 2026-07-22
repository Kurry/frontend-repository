import fs from 'fs';
let content = fs.readFileSync('tasks/frontend-planning-execution-kanban/solution/app/src/store.js', 'utf8');

// I notice addComment doesn't push to undoStack or redoStack!
// Let's modify the addComment to push to history.

content = content.replace(
  `addComment: (cardId, body) => set((state) => {
    const comment = { id: uid('comment'), body: body.trim(), created_at: new Date().toISOString() }
    const cards = updateCardRecord(state.cards, cardId, (card) => ({ ...card, comments: [...card.comments, comment] }))
    return { cards }
  }),`,
  `addComment: (cardId, body) => set((state) => {
    const comment = { id: uid('comment'), body: body.trim(), created_at: new Date().toISOString() }
    const cards = updateCardRecord(state.cards, cardId, (card) => ({ ...card, comments: [...card.comments, comment] }))
    return pushHistory(state, { cards })
  }),`
);

fs.writeFileSync('tasks/frontend-planning-execution-kanban/solution/app/src/store.js', content);
