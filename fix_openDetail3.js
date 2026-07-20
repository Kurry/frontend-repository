const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/store.js', 'utf8');

code = code.replace("openDetail: (id, push = true) => set((state) => ({ detailId: id, breadcrumbs: push && state.detailId ? [...state.breadcrumbs, state.detailId] : state.breadcrumbs, railOpen: state.railOpen })),", "openDetail: (id, push = true) => set((state) => ({ detailId: id, breadcrumbs: push && state.detailId && state.detailId !== id ? [...state.breadcrumbs, state.detailId] : push && !state.detailId ? [] : state.breadcrumbs, railOpen: state.railOpen })),");

// goBreadcrumb
code = code.replace("goBreadcrumb: (index) => set((state) => ({ detailId: state.breadcrumbs[index], breadcrumbs: state.breadcrumbs.slice(0, index + 1) })),", "goBreadcrumb: (index) => set((state) => ({ detailId: state.breadcrumbs[index], breadcrumbs: state.breadcrumbs.slice(0, index) })),");

fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/store.js', code);
