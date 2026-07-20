const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/store.js', 'utf8');

code = code.replace("openDetail: (id, push = true) => set((state) => ({ detailId: id, breadcrumbs: push ? [...state.breadcrumbs, id] : state.breadcrumbs, railOpen: state.railOpen })),", "openDetail: (id, push = true) => set((state) => ({ detailId: id, breadcrumbs: push && state.detailId ? [...state.breadcrumbs, state.detailId] : state.breadcrumbs, railOpen: state.railOpen })),"); // Actually, breadcrumbs shouldn't duplicate if we are pushing the previous or new one? Wait, standard breadcrumb pattern: when you open a new detail from an existing one, the old one goes to breadcrumbs. If you open from search, breadcrumbs clear? Let's check `closeDetail` or search actions. `runQuery` resets `detailId`? No.

fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/store.js', code);
