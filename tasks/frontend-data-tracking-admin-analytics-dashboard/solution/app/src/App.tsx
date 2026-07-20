import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, store } from './store';
import { setTheme, setActiveView, setSidebarOpen, setFilterRole, setFilterStatus, setSortCriteria, setExportDrawerOpen, setExportPreviewTab } from './store/uiSlice';
import { addUser, deleteUser, deleteUsers, updateUsersStatus, updateUsersRole, setUsers, User } from './store/usersSlice';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';

// === SCHEMAS ===
const userSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(40, "First name must be at most 40 characters"),
  lastName: z.string().min(1, "Last name is required").max(40, "Last name must be at most 40 characters"),
  email: z.string().email("Invalid email format (must contain @ and domain)"),
  phone: z.string().regex(/^\d{7,15}$/, "Phone must be 7-15 digits").optional().or(z.literal('')),
  notes: z.string().max(280, "Notes must be at most 280 characters").optional(),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
  accountSegment: z.enum(['Internal', 'Partner', 'External']),
  status: z.enum(['Active', 'Invited', 'Suspended']),
  role: z.enum(['Admin', 'Manager', 'Member', 'Viewer']),
  sendInvitation: z.boolean().optional(),
});
type UserFormValues = z.infer<typeof userSchema>;

// === HEADER ===
function Header() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  return (
    <header className="span-12 flex items-center gap-3">
      <label
        htmlFor="my-drawer"
        className="btn btn-square btn-ghost drawer-button drawer-button-desktop-hidden"
        aria-label="Open sidebar"
        onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
      >
        <svg data-src="./assets/icons/bars-3.svg" className="icon-sm" />
      </label>
      <div className="grow">
        <h1 className="page-title">Dashboard</h1>
      </div>
      <div>
        <input type="text" placeholder="Search" className="input input-sm search-pill" aria-label="Search" />
      </div>
      <label className="btn btn-circle btn-sm btn-ghost swap swap-rotate" aria-label="Toggle theme">
        <input
          type="checkbox"
          className="hidden"
          checked={theme === 'light'}
          onChange={() => dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))}
        />
        <div className="relative w-6 h-6 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {theme === 'dark' ? (
              <motion.svg key="moon" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }} className="icon-sm fill-current absolute" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" /></motion.svg>
            ) : (
              <motion.svg key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }} className="icon-sm fill-current absolute" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" /></motion.svg>
            )}
          </AnimatePresence>
        </div>
      </label>
      <div className="relative">
        <button type="button" className="btn btn-circle btn-sm btn-ghost" aria-label="Open notifications" data-popovertarget="header-notifications-dropdown" style={{anchorName: '--header-notifications-anchor'} as React.CSSProperties}>
          <div className="indicator">
            <span className="status indicator-item status-error" />
            <svg data-src="./assets/icons/bell.svg" className="icon-sm" />
          </div>
        </button>
        <ul className="menu dropdown rounded-box bg-base-100 shadow-lg popover-menu" data-popover="auto" id="header-notifications-dropdown" style={{positionAnchor: '--header-notifications-anchor'} as React.CSSProperties}>
          <li>
            <button type="button" className="inert-nav gap-3">
              <div className="avatar">
                <div className="avatar-sm rounded-full">
                  <img src="./assets/avatar-1.jpg" alt="Alice avatar" />
                </div>
              </div>
              <span><b>New message</b><br />Alice: Hi, did you get my files?</span>
            </button>
          </li>
        </ul>
      </div>
      <div className="relative">
        <button type="button" className="avatar btn btn-sm btn-circle btn-ghost" aria-label="Open profile menu" data-popovertarget="header-profile-dropdown" style={{anchorName: '--header-profile-anchor'} as React.CSSProperties}>
          <div className="avatar-md rounded-full">
            <img src="./assets/avatar-5.jpg" alt="Current user avatar" />
          </div>
        </button>
        <ul className="menu dropdown rounded-box bg-base-100 shadow-lg popover-menu" data-popover="auto" id="header-profile-dropdown" style={{positionAnchor: '--header-profile-anchor'} as React.CSSProperties}>
          <li><button type="button" className="inert-nav">Profile</button></li>
          <li><button type="button" className="inert-nav">Inbox <span className="badge badge-xs">12</span></button></li>
          <li><button type="button" className="inert-nav">Settings</button></li>
          <li><button type="button" className="inert-nav text-error mt-2 border-t border-base-200">Logout</button></li>
        </ul>
      </div>
    </header>
  );
}

// === SIDEBAR ===
function Sidebar() {
  const dispatch = useDispatch();
  const activeView = useSelector((state: RootState) => state.ui.activeView);

  const handleNav = (view: any) => {
    dispatch(setActiveView(view));
    dispatch(setSidebarOpen(false));
  };

  return (
    <aside className="drawer-side z-50">
      <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay" onClick={() => dispatch(setSidebarOpen(false))}></label>
      <nav className="menu bg-base-200 text-base-content min-h-full w-72 p-4 flex flex-col pt-0 gap-6">
        <div className="sticky top-0 bg-base-200 py-4 z-10 flex items-center gap-3">
          <div className="avatar">
            <div className="w-8 rounded-full bg-primary text-primary-content grid place-items-center font-bold">
              PT
            </div>
          </div>
          <span className="text-lg font-bold">Pineapple Tech</span>
        </div>

        <ul className="menu menu-md rounded-box flex-1">
          <li>
            <button type="button" className={activeView === 'operations-overview' ? 'active' : ''} onClick={() => handleNav('operations-overview')}>
              <svg data-src="./assets/icons/squares-2x2.svg" className="icon-sm opacity-50" aria-hidden="true" /> Dashboard
            </button>
          </li>

          <li>
            <h2 className="menu-title flex items-center gap-2"><svg data-src="./assets/icons/users.svg" className="icon-sm opacity-50" aria-hidden="true" /> Users</h2>
            <ul>
              <li><button type="button" className={activeView === 'all-users' ? 'active' : ''} onClick={() => handleNav('all-users')}>All Users</button></li>
              <li><button type="button" className={activeView === 'add-user' ? 'active' : ''} onClick={() => handleNav('add-user')}>Add User</button></li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

// === OPERATIONS OVERVIEW ===
function OperationsOverview() {
  return (
    <div className="view-operations-overview span-12 grid grid-cols-1 gap-6 pb-6">
      <div className="mosaic-grid">
        <section className="card bg-base-100 shadow-sm border border-base-200 card-dash-main col-span-1 lg:col-span-8">
          <div className="card-body">
            <h2 className="card-title flex items-center justify-between">
              Revenue Outlook
            </h2>
            <p className="text-base-content/60">Daily booked revenue across storefront, invoices, and subscriptions</p>
            <div className="mt-4 flex items-end gap-4">
              <div className="text-4xl font-bold">$1.2M</div>
              <div className="text-success flex items-center gap-1 font-medium mb-1"><svg data-src="./assets/icons/arrow-trending-up.svg" className="icon-sm" /> +14.2%</div>
            </div>
            <div className="mt-8 chart-tall">
              <tc-line className="chart-line-main" values="[120,180,150,220,190,280,240,310,290,380,350,420,380,450,410,480,440,510]" labels='["Jan 1","Jan 3","Jan 5","Jan 7","Jan 9","Jan 11","Jan 13","Jan 15","Jan 17","Jan 19","Jan 21","Jan 23","Jan 25","Jan 27","Jan 29","Jan 31","Feb 2","Feb 4"]' shape-radius={4} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// === ALL USERS ===
function AllUsers() {
  const dispatch = useDispatch();
  const users = useSelector((state: RootState) => state.users.data);
  const { filterRole, filterStatus, sortCriteria } = useSelector((state: RootState) => state.ui);

  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label={`Select row for ${row.original.firstName} ${row.original.lastName}`}
          />
        ),
      },
      {
        header: 'User',
        accessorFn: row => `${row.firstName} ${row.lastName}`,
        cell: info => (
          <div>
            <div className="font-bold">{info.getValue() as string}</div>
            <div className="text-sm opacity-50">{info.row.original.email}</div>
          </div>
        )
      },
      {
        header: 'Role',
        accessorKey: 'role',
        cell: info => <span className="badge badge-ghost badge-sm">{info.getValue() as string}</span>
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => {
          const val = info.getValue() as string;
          let badgeClass = 'badge-ghost';
          if (val === 'Active') badgeClass = 'badge-success';
          if (val === 'Invited') badgeClass = 'badge-warning';
          if (val === 'Suspended') badgeClass = 'badge-error';
          return <span className={`badge badge-sm ${badgeClass}`}>{val}</span>;
        }
      },
      {
        header: 'Payments',
        accessorKey: 'payments',
        cell: info => `$${(info.getValue() as number).toLocaleString()}`
      },
      {
        header: 'Products',
        accessorKey: 'products',
      },
      {
        header: 'Last Active',
        accessorKey: 'lastActive',
        cell: info => new Date(info.getValue() as string).toLocaleDateString()
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button className="btn btn-sm btn-ghost btn-circle text-error" aria-label="Delete user" onClick={() => dispatch(deleteUsers([row.original.id]))}>
              <svg data-src="./assets/icons/trash.svg" className="icon-sm" />
            </button>
          </div>
        )
      }
    ],
    [dispatch]
  );

  const filteredUsers = useMemo(() => {
    let result = users;
    if (filterRole) result = result.filter(u => u.role === filterRole);
    if (filterStatus) result = result.filter(u => u.status === filterStatus);

    result = [...result].sort((a, b) => {
      if (sortCriteria === 'newest') return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      if (sortCriteria === 'highest-spend') return b.payments - a.payments;
      if (sortCriteria === 'name-az') return a.firstName.localeCompare(b.firstName);
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });
    return result;
  }, [users, filterRole, filterStatus, sortCriteria]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="span-12 view-users">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">All Users</h2>
          <p className="text-sm opacity-70">Manage your team members and their account permissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch(setActiveView('add-user'))}>Add User</button>
      </div>

      <div className="stats shadow mb-6 w-full overflow-hidden">
        <div className="stat">
          <div className="stat-title">Total</div>
          <div className="stat-value">{filteredUsers.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Active</div>
          <div className="stat-value">{filteredUsers.filter(u => u.status === 'Active').length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Paying</div>
          <div className="stat-value">{filteredUsers.filter(u => u.payments > 0).length}</div>
        </div>
        <div className="stat text-error">
          <div className="stat-title text-error">Suspended</div>
          <div className="stat-value">{filteredUsers.filter(u => u.status === 'Suspended').length}</div>
        </div>
      </div>

      <div className="bg-base-100 border border-base-200 rounded-box">
        <div className="p-4 border-b border-base-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select className="select select-sm select-bordered" aria-label="Filter role" value={filterRole} onChange={e => dispatch(setFilterRole(e.target.value))}>
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Member">Member</option>
              <option value="Viewer">Viewer</option>
            </select>
            <select className="select select-sm select-bordered" aria-label="Filter status" value={filterStatus} onChange={e => dispatch(setFilterStatus(e.target.value))}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Invited">Invited</option>
              <option value="Suspended">Suspended</option>
            </select>
            <select className="select select-sm select-bordered" aria-label="Sort users" value={sortCriteria} onChange={e => dispatch(setSortCriteria(e.target.value as any))}>
              <option value="newest">Newest</option>
              <option value="highest-spend">Highest spend</option>
              <option value="name-az">Name A-Z</option>
            </select>
          </div>
          {selectedCount > 0 && (
            <div className="flex gap-2">
              <span className="text-sm opacity-70 self-center">{selectedCount} selected</span>
              <button className="btn btn-sm text-error" onClick={() => {
                const ids = table.getSelectedRowModel().flatRows.map(r => r.original.id);
                dispatch(deleteUsers(ids));
                setRowSelection({});
              }}>Delete</button>
            </div>
          )}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-opacity-50">
            No users found matching the criteria. Please try a different filter or add a user.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                <AnimatePresence>
                  {table.getRowModel().rows.map(row => (
                    <motion.tr
                      key={row.original.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// === ADD USER FORM ===
function AddUserForm() {
  const dispatch = useDispatch();
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      accountSegment: 'Internal',
      status: 'Active',
      role: 'Member',
      sendInvitation: true,
    }
  });

  const onSubmit = (data: UserFormValues) => {
    const newUser = {
      id: Date.now().toString(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
      status: data.status,
      role: data.role,
      payments: 0,
      products: 0,
      lastActive: new Date().toISOString(),
    };
    dispatch(addUser(newUser));
    setSuccessMsg(`User ${data.firstName} ${data.lastName} added successfully!`);
    setTimeout(() => {
      dispatch(setActiveView('all-users'));
    }, 1500);
  };

  return (
    <div className="span-12 view-add-user max-w-4xl mx-auto w-full pb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Add User</h2>
          <p className="text-sm opacity-70">Create a new user and set their access level.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => dispatch(setActiveView('all-users'))}>Cancel</button>
      </div>

      <div aria-live="polite" className="sr-only">
        {successMsg && successMsg}
        {Object.keys(errors).length > 0 && "There are validation errors in the form."}
      </div>

      {successMsg && (
        <div className="alert alert-success mb-6 shadow-sm">
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg border-b border-base-200 pb-2">Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="form-control">
                <label className="label" htmlFor="firstName"><span className="label-text">First Name *</span><span className="sr-only">Required</span></label>
                <input id="firstName" type="text" className={`input input-bordered ${errors.firstName ? 'input-error' : ''}`} {...register('firstName')} aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'firstName-error' : undefined} />
                {errors.firstName && <span id="firstName-error" className="text-error text-xs mt-1">{errors.firstName.message}</span>}
              </div>
              <div className="form-control">
                <label className="label" htmlFor="lastName"><span className="label-text">Last Name *</span><span className="sr-only">Required</span></label>
                <input id="lastName" type="text" className={`input input-bordered ${errors.lastName ? 'input-error' : ''}`} {...register('lastName')} aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'lastName-error' : undefined} />
                {errors.lastName && <span id="lastName-error" className="text-error text-xs mt-1">{errors.lastName.message}</span>}
              </div>
              <div className="form-control">
                <label className="label" htmlFor="email"><span className="label-text">Email *</span><span className="sr-only">Required</span></label>
                <input id="email" type="email" className={`input input-bordered ${errors.email ? 'input-error' : ''}`} {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
                {errors.email && <span id="email-error" className="text-error text-xs mt-1">{errors.email.message}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg border-b border-base-200 pb-2">Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="form-control">
                <label className="label" htmlFor="temporaryPassword"><span className="label-text">Temporary Password *</span><span className="sr-only">Required</span></label>
                <input id="temporaryPassword" type="password" className={`input input-bordered ${errors.temporaryPassword ? 'input-error' : ''}`} {...register('temporaryPassword')} aria-invalid={!!errors.temporaryPassword} aria-describedby={errors.temporaryPassword ? 'temporaryPassword-error' : undefined} />
                {errors.temporaryPassword && <span id="temporaryPassword-error" className="text-error text-xs mt-1">{errors.temporaryPassword.message}</span>}
              </div>
              <div className="form-control">
                <label className="label" htmlFor="accountSegment"><span className="label-text">Account Segment *</span></label>
                <select id="accountSegment" className={`select select-bordered ${errors.accountSegment ? 'select-error' : ''}`} {...register('accountSegment')}>
                  <option value="Internal">Internal</option>
                  <option value="Partner">Partner</option>
                  <option value="External">External</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 mt-8">
          <button type="button" className="btn btn-ghost" onClick={() => dispatch(setActiveView('all-users'))}>Cancel</button>
          <button type="submit" className="btn btn-primary">Create User</button>
        </div>
      </form>
    </div>
  );
}

// === EXPORT DRAWER ===
function ExportDrawer() {
  const dispatch = useDispatch();
  const { exportDrawerOpen, exportPreviewTab } = useSelector((state: RootState) => state.ui);
  const users = useSelector((state: RootState) => state.users.data);
  const [importDraft, setImportDraft] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [msg, setMsg] = useState('');

  const sessionJson = useMemo(() => {
    const kpis = {
      total: users.length,
      active: users.filter(u => u.status === 'Active').length,
      paying: users.filter(u => u.payments > 0).length,
      suspended: users.filter(u => u.status === 'Suspended').length,
    };
    return JSON.stringify({ schemaVersion: 'pineapple-admin-analytics-v1', kpis, users }, null, 2);
  }, [users]);

  const usersCsv = useMemo(() => {
    if (users.length === 0) return 'id,firstName,lastName,email,role,status,payments,products,lastActive\n';
    const header = Object.keys(users[0]).join(',');
    const rows = users.map(u => Object.values(u).map(v => `"${v}"`).join(','));
    return [header, ...rows].join('\n');
  }, [users]);

  const handleCopy = () => {
    const text = exportPreviewTab === 'json' ? sessionJson : usersCsv;
    navigator.clipboard.writeText(text);
    setMsg('Copied to clipboard');
    setTimeout(() => setMsg(''), 2000);
  };

  const handleImport = () => {
    try {
      if (exportPreviewTab === 'json') {
        const parsed = JSON.parse(importDraft);
        if (parsed.schemaVersion === 'pineapple-admin-analytics-v1' && Array.isArray(parsed.users)) {
          dispatch(setUsers(parsed.users));
          setMsg('Import successful');
          setImportDraft('');
        } else {
          setMsg('Import error: Invalid schemaVersion or missing users array');
        }
      } else {
        const lines = importDraft.trim().split('\n');
        if (lines.length > 0) {
          const headers = lines[0].split(',');
          const newUsers: User[] = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, i) => { obj[h] = values[i] });
            return {
              ...obj,
              payments: Number(obj.payments) || 0,
              products: Number(obj.products) || 0,
            } as User;
          });
          dispatch(setUsers(newUsers));
          setMsg('Import successful');
          setImportDraft('');
        }
      }
    } catch (e: any) {
      setMsg(`Import error: ${e.message}`);
    }
  };

  return (
    <div className={`drawer drawer-end ${exportDrawerOpen ? 'drawer-open' : ''} z-50 fixed inset-0 pointer-events-none`}>
      <input type="checkbox" className="drawer-toggle" checked={exportDrawerOpen} readOnly />
      <div className="drawer-side pointer-events-auto">
        <label aria-label="close sidebar" className="drawer-overlay" onClick={() => dispatch(setExportDrawerOpen(false))}></label>
        <div className="menu bg-base-200 text-base-content min-h-full w-96 p-0 flex flex-col">
          <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-100">
            <h2 className="text-xl font-bold">Export / Import</h2>
            <button className="btn btn-sm btn-ghost btn-circle" onClick={() => dispatch(setExportDrawerOpen(false))} aria-label="Close drawer">
              <svg data-src="./assets/icons/x-mark.svg" className="icon-sm" />
            </button>
          </div>

          <div className="p-4 flex gap-2 border-b border-base-300 bg-base-100">
            <button className={`btn btn-sm ${exportPreviewTab === 'json' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => dispatch(setExportPreviewTab('json'))}>Session JSON</button>
            <button className={`btn btn-sm ${exportPreviewTab === 'csv' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => dispatch(setExportPreviewTab('csv'))}>Users CSV</button>
          </div>

          <div aria-live="polite" className="sr-only">{msg}</div>

          {msg && (
            <div className="p-4 bg-base-100">
              <div className={`alert ${msg.includes('error') ? 'alert-error' : 'alert-success'} shadow-sm text-sm`}>
                {msg}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4 flex flex-col gap-4 bg-base-100">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{importMode ? 'Paste Import Data' : 'Preview'}</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setImportMode(!importMode)}>
                {importMode ? 'Cancel Import' : 'Import Mode'}
              </button>
            </div>

            {importMode ? (
              <textarea
                className="textarea textarea-bordered w-full flex-1 font-mono text-xs"
                placeholder={`Paste ${exportPreviewTab.toUpperCase()} here...`}
                value={importDraft}
                onChange={e => setImportDraft(e.target.value)}
              />
            ) : (
              <pre className="bg-base-200 p-4 rounded-box overflow-auto flex-1 text-xs font-mono">
                {exportPreviewTab === 'json' ? sessionJson : usersCsv}
              </pre>
            )}
          </div>

          <div className="p-4 border-t border-base-300 bg-base-200 flex gap-2">
            {importMode ? (
              <button className="btn btn-primary flex-1" onClick={handleImport} disabled={!importDraft}>Import Data</button>
            ) : (
              <>
                <button className="btn btn-outline flex-1" onClick={handleCopy}>Copy</button>
                <button className="btn btn-primary flex-1">Download</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// === WEBMCP BINDER ===
function WebMCPBinder() {
  const dispatch = useDispatch();

  useEffect(() => {
    (window as any).webmcp_list_tools = () => {
      return [
        { name: "browse_open", description: "Open a destination view" },
        { name: "browse_apply_filter", description: "Filter the list" },
        { name: "browse_clear_filter", description: "Clear filters" },
        { name: "browse_sort", description: "Sort the list" },
        { name: "browse_set_theme", description: "Set the UI theme" },
        { name: "entity_create", description: "Create a user" },
        { name: "entity_update", description: "Update user properties" },
        { name: "entity_delete", description: "Delete a user" },
        { name: "artifact_export", description: "Export session data" },
        { name: "artifact_import", description: "Import session data" },
        { name: "artifact_copy", description: "Copy artifact to clipboard" }
      ];
    };

    (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
      try {
        switch (name) {
          case 'browse_open':
            if (args.destinations && args.destinations[0]) {
              dispatch(setActiveView(args.destinations[0]));
            }
            return { result: "Success" };
          case 'browse_apply_filter':
            if (args.filters) {
              if (args.filters.role !== undefined) dispatch(setFilterRole(args.filters.role));
              if (args.filters.status !== undefined) dispatch(setFilterStatus(args.filters.status));
            }
            return { result: "Success" };
          case 'browse_clear_filter':
            dispatch(setFilterRole(''));
            dispatch(setFilterStatus(''));
            return { result: "Success" };
          case 'browse_sort':
            if (args.sorts && args.sorts[0]) dispatch(setSortCriteria(args.sorts[0]));
            return { result: "Success" };
          case 'browse_set_theme':
            if (args.themes && args.themes[0]) dispatch(setTheme(args.themes[0]));
            return { result: "Success" };
          case 'entity_create':
            if (args.entity === 'user' && args.entity_fields) {
              dispatch(addUser({
                id: Date.now().toString(),
                firstName: args.entity_fields.firstName || args.entity_fields.name?.split(' ')[0] || 'Unknown',
                lastName: args.entity_fields.lastName || args.entity_fields.name?.split(' ').slice(1).join(' ') || 'Unknown',
                email: args.entity_fields.email || 'unknown@example.com',
                role: args.entity_fields.role || 'User',
                status: args.entity_fields.status || 'Active',
                payments: args.entity_fields.payments || 0,
                products: args.entity_fields.products || 0,
                lastActive: new Date().toISOString(),
              }));
            }
            return { result: "Success" };
          case 'entity_update':
            if (args.entity === 'user' && args.entity_fields && args.target_id) {
              if (args.entity_fields.role) dispatch(updateUsersRole({ ids: [args.target_id], role: args.entity_fields.role }));
              if (args.entity_fields.status) dispatch(updateUsersStatus({ ids: [args.target_id], status: args.entity_fields.status }));
            }
            return { result: "Success" };
          case 'entity_delete':
            if (args.entity === 'user' && args.target_id && args.confirm === true) {
              dispatch(deleteUser(args.target_id));
            }
            return { result: "Success" };
          case 'artifact_export': {
            const users = store.getState().users.data;
            if (args.export_formats && args.export_formats[0] === 'json') {
               return { result: JSON.stringify({ schemaVersion: 'pineapple-admin-analytics-v1', users }) };
            }
            return { result: "CSV Export Not fully implemented in tool string return" };
          }
          case 'artifact_import':
            if (args.import_modes && args.import_modes[0] === 'session-json' && args.content) {
              const parsed = JSON.parse(args.content);
              dispatch(setUsers(parsed.users));
            }
            return { result: "Success" };
          default:
            return { error: `Unknown tool: ${name}` };
        }
      } catch (err: any) {
        return { error: err.message };
      }
    };
  }, [dispatch]);

  return null;
}

// === ARIA LIVE ===
function AriaLivePolite() {
  const users = useSelector((state: RootState) => state.users.data);
  const [msg, setMsg] = useState('');
  const [prevCount, setPrevCount] = useState(users.length);

  useEffect(() => {
    if (users.length > prevCount) {
      setMsg('User successfully added.');
    } else if (users.length < prevCount) {
      setMsg('User successfully deleted.');
    }
    setPrevCount(users.length);
  }, [users.length]);

  return (
    <div aria-live="polite" className="sr-only">
      {msg}
    </div>
  );
}

// === APP ROOT ===
export default function App() {
  const activeView = useSelector((state: RootState) => state.ui.activeView);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const dispatch = useDispatch();

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "light") {
      dispatch(setTheme("light"));
    }
  }, [dispatch]);

  return (
    <>
      <WebMCPBinder />
      <AriaLivePolite />
      <div className={`drawer lg:drawer-open dashboard-shell bg-base-200 ${sidebarOpen ? 'drawer-open' : ''}`}>
        <input id="my-drawer" type="checkbox" className="drawer-toggle" checked={sidebarOpen} readOnly aria-label="Toggle sidebar" />
        <main className="drawer-content bg-base-100 main-canvas">
          <div className="dashboard-grid">
            <Header />
            {activeView === 'operations-overview' && <OperationsOverview />}
            {activeView === 'all-users' && <AllUsers />}
            {activeView === 'add-user' && <AddUserForm />}
          </div>
        </main>
        <Sidebar />
      </div>
      <ExportDrawer />

      <button
        className="fixed bottom-4 right-4 btn btn-circle btn-primary shadow-lg"
        onClick={() => dispatch(setExportDrawerOpen(true))}
        aria-label="Open export drawer"
      >
        <svg data-src="./assets/icons/arrow-down-tray.svg" className="icon-sm" />
      </button>
    </>
  );
}
