const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update imports
code = code.replace(
  'setConfirm, setLastMutation, resetFilters, type ViewKey,',
  'setConfirm, setLastMutation, setDraftUserForm, resetFilters, type ViewKey,'
);

// Update UserForm
// Find UserForm declaration
let formStart = code.indexOf('function UserForm() {');
let formEnd = code.indexOf('function ExtraView', formStart);
let userFormStr = code.substring(formStart, formEnd);

// Add draft retrieval
userFormStr = userFormStr.replace(
  'const { register, handleSubmit, watch, formState: { errors, isValid }, reset } = useForm<UserCreateValues | UserEditValues>({',
  `const draftUserForm = useSelector((s: RootState) => s.ui.draftUserForm);
  const defaultValues = isEdit ? {
      firstName: editing!.firstName, lastName: editing!.lastName, email: editing!.email, phone: editing!.phone || '',
      notes: editing!.notes || '', temporaryPassword: '', accountSegment: 'Internal', status: editing!.status, role: editing!.role,
      sendInvitation: false, enable2FA: false, productAccess: true, permissions: ['read'],
    } : (draftUserForm || { accountSegment: 'Internal', status: 'Active', role: 'Member', sendInvitation: true, enable2FA: false, productAccess: true, permissions: ['read'] });

  const { register, handleSubmit, watch, formState: { errors, isValid }, reset } = useForm<UserCreateValues | UserEditValues>({`
);

userFormStr = userFormStr.replace(
  `    defaultValues: isEdit ? {
      firstName: editing!.firstName, lastName: editing!.lastName, email: editing!.email, phone: editing!.phone || '',
      notes: editing!.notes || '', temporaryPassword: '', accountSegment: 'Internal', status: editing!.status, role: editing!.role,
      sendInvitation: false, enable2FA: false, productAccess: true, permissions: ['read'],
    } : { accountSegment: 'Internal', status: 'Active', role: 'Member', sendInvitation: true, enable2FA: false, productAccess: true, permissions: ['read'] },`,
  '    defaultValues,'
);

userFormStr = userFormStr.replace(
  `    reset(isEdit ? {
      firstName: editing!.firstName, lastName: editing!.lastName, email: editing!.email, phone: editing!.phone || '',
      notes: editing!.notes || '', temporaryPassword: '', accountSegment: 'Internal', status: editing!.status, role: editing!.role,
      sendInvitation: false, enable2FA: false, productAccess: true, permissions: ['read'],
    } : { accountSegment: 'Internal', status: 'Active', role: 'Member', sendInvitation: true, enable2FA: false, productAccess: true, permissions: ['read'] });`,
  `    reset(isEdit ? {
      firstName: editing!.firstName, lastName: editing!.lastName, email: editing!.email, phone: editing!.phone || '',
      notes: editing!.notes || '', temporaryPassword: '', accountSegment: 'Internal', status: editing!.status, role: editing!.role,
      sendInvitation: false, enable2FA: false, productAccess: true, permissions: ['read'],
    } : (draftUserForm || { accountSegment: 'Internal', status: 'Active', role: 'Member', sendInvitation: true, enable2FA: false, productAccess: true, permissions: ['read'] }));`
);

// We need to save the draft when component unmounts
userFormStr = userFormStr.replace(
  '  const vals = watch();',
  `  const vals = watch();

  // Save to draft on unmount
  useEffect(() => {
    return () => {
      if (!isEdit) dispatch(setDraftUserForm(vals));
    };
  }, [dispatch, isEdit, vals]);`
);

// Clear draft on successful submit or cancel
userFormStr = userFormStr.replace(
  '      dispatch(setLastMutation(`Created ${data.firstName}`));',
  '      dispatch(setLastMutation(`Created ${data.firstName}`));\n      dispatch(setDraftUserForm(null));'
);
userFormStr = userFormStr.replace(
  '  const cancel = () => { dispatch(setActiveView(\'all-users\')); };',
  '  const cancel = () => { dispatch(setDraftUserForm(null)); dispatch(setActiveView(\'all-users\')); };'
);

code = code.substring(0, formStart) + userFormStr + code.substring(formEnd);
fs.writeFileSync('src/App.tsx', code);
