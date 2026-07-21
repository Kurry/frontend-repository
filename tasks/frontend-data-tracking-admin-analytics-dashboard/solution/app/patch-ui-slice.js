const fs = require('fs');
let code = fs.readFileSync('src/store/uiSlice.ts', 'utf8');

// Add draftUserForm state
if (!code.includes('draftUserForm')) {
  code = code.replace(
    'lastMutation: string | null;',
    'lastMutation: string | null;\n  draftUserForm: any;'
  );
  code = code.replace(
    'lastMutation: null,',
    'lastMutation: null,\n  draftUserForm: null,'
  );
  code = code.replace(
    'setLastMutation: (s, a: PayloadAction<string | null>) => { s.lastMutation = a.payload; },',
    'setLastMutation: (s, a: PayloadAction<string | null>) => { s.lastMutation = a.payload; },\n    setDraftUserForm: (s, a: PayloadAction<any>) => { s.draftUserForm = a.payload; },'
  );
  code = code.replace(
    'setConfirm, setLastMutation, resetFilters,',
    'setConfirm, setLastMutation, setDraftUserForm, resetFilters,'
  );
  fs.writeFileSync('src/store/uiSlice.ts', code);
}
