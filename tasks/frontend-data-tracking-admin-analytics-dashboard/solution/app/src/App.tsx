import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  HomeIcon, UsersIcon, CubeIcon, ArrowsRightLeftIcon, ShoppingCartIcon, UserGroupIcon,
  ChatBubbleLeftRightIcon, PhotoIcon, DocumentTextIcon, PencilSquareIcon, TagIcon,
  ChartBarIcon, MegaphoneIcon, PuzzlePieceIcon, WrenchScrewdriverIcon, Cog6ToothIcon,
  ChevronRightIcon, MagnifyingGlassIcon, SunIcon, MoonIcon, BellIcon, Bars3Icon, XMarkIcon,
  PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, ClipboardDocumentIcon, CheckCircleIcon,
  ExclamationTriangleIcon, InformationCircleIcon, BanknotesIcon, Square3Stack3DIcon,
  ClockIcon, ClipboardDocumentListIcon, ChartPieIcon, ShieldCheckIcon, BoltIcon,
  ArrowTrendingUpIcon, TicketIcon, CircleStackIcon,
} from '@heroicons/react/24/outline';

import { RootState, store } from './store';
import {
  setTheme, toggleTheme, setAccent, setActiveView, setSidebarOpen, setExpandedGroup,
  setFilterRole, setFilterStatus, setSearch, setSort, setExportOpen, setExportTab, setDensity,
  setSelection, toggleSelection, clearSelection, setEditingId, pushToast, dismissToast,
  setConfirm, setLastMutation, setAddUserDraft, clearAddUserDraft, resetFilters, type ViewKey,
} from './store/uiSlice';
import {
  addUser, updateUser, patchUsers, deleteUser, deleteUsers, updateUsersStatus, updateUsersRole,
  setUsers,
} from './store/usersSlice';
import {
  User, ROLES, STATUSES, SEGMENTS, SortKey, userCreateSchema, userEditSchema, UserCreateValues, UserEditValues, filterUsersForKpis,
  computeKpis, sortUsers, buildCsv, buildSession, importSessionJson, importUsersCsv,
  makeUserFromCreate, relativeTime, OV, CSV_HEADER,
} from './data';
import { ColumnChart, LineChart, DonutChart, Radial, Uptime, Spark, TooltipPortal } from './charts';

const AV = (n: number) => `./assets/avatar-${n}.jpg`;
const Avatar = ({ n, name, lg }: { n: number; name: string; lg?: boolean }) => (
  <span className={`av ${lg ? 'lg' : ''}`}><img src={AV(n)} alt={`${name} profile avatar`} loading="lazy" /></span>
);

// ============================================================ Popover
function Popover({ open, onClose, up, right, width, triggerRef, children, label }:
  { open: boolean; onClose: () => void; up?: boolean; right?: boolean; width?: number; triggerRef: React.RefObject<HTMLElement | null>; children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); triggerRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, triggerRef]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="pop-backdrop" onClick={onClose} aria-hidden="true" />
          <motion.div ref={ref} role="menu" aria-label={label}

            className={`pop ${up ? 'up' : ''} ${right ? 'right' : ''}`}
            style={{ width: width || 14 * 16, left: right ? undefined : 0 }}
            initial={{ opacity: 0, scale: 0.94, y: up ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: up ? 8 : -8 }}
            transition={{ duration: 0.16 }}>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================ Header
function Header() {
  const dispatch = useDispatch();
  const { theme, sidebarOpen, search, lastMutation } = useSelector((s: RootState) => s.ui);
  const [notif, setNotif] = useState(false);
  const [prof, setProf] = useState(false);
  const notifRef = useRef<HTMLButtonElement>(null);
  const profRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault(); dispatch(setActiveView('all-users')); setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dispatch]);

  const notifRows = [
    { n: 1, t: 'New message', b: 'Ada: did you get the export?' },
    { n: 2, t: 'Reminder', b: 'Governance review at 10:00' },
    { n: 3, t: 'New payment', b: '$2,500 from Margaret Hamilton' },
    { n: 4, t: 'New payment', b: '$1,900 from Grace Hopper' },
  ];

  return (
    <header className="utilbar">
      <button className="icon-btn hamburger" aria-label="Open navigation" aria-expanded={sidebarOpen}
        onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}><Bars3Icon className="icon-md" /></button>
      <span className="page-title">Dashboard</span>
      {lastMutation && <span className="mutation-chip" aria-live="polite"><span className="dot" />{lastMutation}</span>}
      <div className="search">
        <MagnifyingGlassIcon className="si" />
        <input ref={searchRef} type="search" value={search} aria-label="Search Users"
          onFocus={() => dispatch(setActiveView('all-users'))}
          onChange={(e) => { dispatch(setSearch(e.target.value)); }}
          placeholder="Search Users" autoComplete="off" />
      </div>
      <label className="icon-btn theme-toggle" aria-label="Toggle theme" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
        <input type="checkbox" className="sr-only" checked={theme === 'light'}
          onChange={() => dispatch(toggleTheme())} aria-label="Toggle light and dark theme" />
        <span className="ic"><AnimatePresence initial={false}>
          {theme === 'dark'
            ? <motion.span key="moon" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}><MoonIcon className="icon-md" /></motion.span>
            : <motion.span key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}><SunIcon className="icon-md" /></motion.span>}
        </AnimatePresence></span>
      </label>
      <div className="pop-anchor">
        <button ref={notifRef} className="icon-btn" aria-label="Open notifications" aria-haspopup="menu" aria-expanded={notif} onClick={() => { setNotif((v) => !v); setProf(false); }}>
          <BellIcon className="icon-md" /><span className="bell-dot" aria-hidden="true" />
        </button>
        <Popover open={notif} onClose={() => setNotif(false)} right width={300} triggerRef={notifRef} label="Notifications">
          <ul>
            {notifRows.map((r) => (
              <li key={r.n}><button type="button" className="pop-row gap" role="menuitem">
                <Avatar n={r.n} name={`Notification ${r.n}`} /><span><b>{r.t}</b><br /><span style={{ color: 'var(--muted)' }}>{r.b}</span></span>
              </button></li>
            ))}
          </ul>
        </Popover>
      </div>
      <div className="pop-anchor">
        <button ref={profRef} className="icon-btn" aria-label="Open profile menu" aria-haspopup="menu" aria-expanded={prof} onClick={() => { setProf((v) => !v); setNotif(false); }}>
          <Avatar n={5} name="Current user" />
        </button>
        <Popover open={prof} onClose={() => setProf(false)} right width={200} triggerRef={profRef} label="Profile menu">
          <ul>
            {['Profile', 'Inbox', 'Settings', 'Logout'].map((m) => (
              <li key={m}><button type="button" className="pop-row" role="menuitem">{m}{m === 'Inbox' && <span className="badge badge-xs badge-accent">12</span>}</button></li>
            ))}
          </ul>
        </Popover>
      </div>
    </header>
  );
}

// ============================================================ Sidebar
const GROUPS: { key: string; label: string; icon: any; items?: { key: ViewKey; label: string }[]; badge?: string }[] = [
  { key: 'users', label: 'Users', icon: UsersIcon, items: [
    { key: 'all-users', label: 'All Users' }, { key: 'add-user', label: 'Add User' },
    { key: 'roles', label: 'Roles' }, { key: 'permissions', label: 'Permissions' },
    { key: 'user-logs', label: 'User Logs' }, { key: 'user-stats', label: 'User Stats' },
    { key: 'user-payments', label: 'User Payments' }, { key: 'user-products', label: 'User Products' },
  ] },
  { key: 'products', label: 'Products', icon: CubeIcon, items: [{ key: 'user-products', label: 'Catalog' }] },
  { key: 'transactions', label: 'Transactions', icon: ArrowsRightLeftIcon, items: [{ key: 'user-payments', label: 'Ledger' }] },
  { key: 'orders', label: 'Orders', icon: ShoppingCartIcon, items: [{ key: 'user-logs', label: 'Order history' }] },
  { key: 'customers', label: 'Customers', icon: UserGroupIcon, items: [{ key: 'user-stats', label: 'Segments' }] },
  { key: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon, badge: '12', items: [{ key: 'user-logs', label: 'Threads' }] },
  { key: 'media', label: 'Media', icon: PhotoIcon, items: [{ key: 'user-products', label: 'Library' }] },
  { key: 'pages', label: 'Pages', icon: DocumentTextIcon, items: [{ key: 'user-logs', label: 'Drafts' }] },
  { key: 'blog', label: 'Blog', icon: PencilSquareIcon, items: [{ key: 'user-logs', label: 'Posts' }] },
  { key: 'promotions', label: 'Promotions', icon: TagIcon, items: [{ key: 'user-stats', label: 'Campaigns' }] },
  { key: 'analytics', label: 'Analytics', icon: ChartBarIcon, items: [{ key: 'operations-overview', label: 'Overview' }] },
  { key: 'marketing', label: 'Marketing', icon: MegaphoneIcon, items: [{ key: 'user-stats', label: 'Funnel' }] },
  { key: 'plugins', label: 'Plugins', icon: PuzzlePieceIcon, items: [{ key: 'user-products', label: 'Installed' }] },
  { key: 'tools', label: 'Tools', icon: WrenchScrewdriverIcon, items: [{ key: 'user-logs', label: 'Console' }] },
  { key: 'settings', label: 'Settings', icon: Cog6ToothIcon, items: [{ key: 'permissions', label: 'Preferences' }] },
];

function Sidebar() {
  const dispatch = useDispatch();
  const { activeView, expandedGroup, sidebarOpen, accent } = useSelector((s: RootState) => s.ui);
  const [acct, setAcct] = useState(false);
  const acctRef = useRef<HTMLButtonElement>(null);
  const openGroup = (k: string) => dispatch(setExpandedGroup(k));
  const go = (v: ViewKey) => { dispatch(setActiveView(v)); dispatch(setSidebarOpen(false)); };
  return (
    <>
      <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => dispatch(setSidebarOpen(false))} aria-hidden="true" />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-brand"><span className="brand-mark">PT</span> Pineapple Tech</div>
        <nav className="sidebar-scroll" aria-label="Administration sections">
          <button className={`nav-top ${activeView === 'operations-overview' ? 'active' : ''}`} onClick={() => go('operations-overview')}>
            <HomeIcon className="icon-md" /> Dashboard
          </button>
          {GROUPS.map((g) => {
            const open = expandedGroup === g.key;
            const Icon = g.icon;
            return (
              <div className={`nav-group ${open ? 'open' : ''}`} key={g.key}>
                <button className="nav-group-head" aria-expanded={open} onClick={() => openGroup(g.key)}>
                  <Icon className="icon-md" style={{ opacity: 0.7 }} /> {g.label}
                  {g.badge ? <span className="count">{g.badge}</span> : <ChevronRightIcon className="icon-sm chev" />}
                </button>
                <div className="nav-items"><div>
                  {g.items?.map((it) => (
                    <button key={it.key + it.label} className={`nav-item ${activeView === it.key ? 'active' : ''}`} onClick={() => go(it.key)}>{it.label}</button>
                  ))}
                </div></div>
              </div>
            );
          })}
        </nav>
        <div className="account-footer">
          <div className="pop-anchor">
            <button ref={acctRef} className="account-btn" aria-haspopup="menu" aria-expanded={acct} onClick={() => setAcct((v) => !v)}>
              <span style={{ position: 'relative' }}><Avatar n={6} name="Ari Lane" /><span className="online-dot" aria-hidden="true" /></span>
              <span className="account-meta"><b>Ari Lane</b><span>Admin</span></span>
              <ChevronRightIcon className="icon-sm chev" style={{ marginLeft: 'auto', transform: 'rotate(-90deg)' }} />
            </button>
            <Popover open={acct} onClose={() => setAcct(false)} up right width={220} triggerRef={acctRef} label="Account menu">
              <ul>
                {[['Profile settings', Cog6ToothIcon], ['Activity log', ClipboardDocumentListIcon], ['Docs', DocumentTextIcon], ['Sign out', ArrowDownTrayIcon]].map(([label, Ic]: any) => (
                  <li key={label}><button type="button" className="pop-row" role="menuitem"><Ic className="icon-sm" /> {label}</button></li>
                ))}
              </ul>
            </Popover>
          </div>
          <div style={{ display: 'flex', gap: '.3rem', padding: '.5rem .2rem 0' }} role="group" aria-label="Accent color">
            {(['teal', 'amber', 'sky', 'rose'] as const).map((a) => (
              <button key={a} type="button" aria-label={`${a} accent`} aria-pressed={accent === a} onClick={() => dispatch(setAccent(a))}
                style={{ width: '1.3rem', height: '1.3rem', borderRadius: '50%', border: accent === a ? '2px solid var(--color-base-content)' : '1px solid var(--bd)', background: `var(--c-${a})`, cursor: 'pointer' }} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

// ============================================================ shared derived hook
function useFiltered() {
  const users = useSelector((s: RootState) => s.users.data);
  const { filterRole, filterStatus, search, sort } = useSelector((s: RootState) => s.ui);
  return useMemo(() => {
    let r = users;
    if (filterRole) r = r.filter((u) => u.role === filterRole);
    if (filterStatus) r = r.filter((u) => u.status === filterStatus);
    if (search.trim()) { const q = search.trim().toLowerCase(); r = r.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)); }
    return sortUsers(r, sort);
  }, [users, filterRole, filterStatus, search, sort]);
}

function useRoleStatusFiltered() {
  const users = useSelector((s: RootState) => s.users.data);
  const { filterRole, filterStatus } = useSelector((s: RootState) => s.ui);
  return useMemo(() => filterUsersForKpis(users, filterRole, filterStatus), [users, filterRole, filterStatus]);
}

// ============================================================ KPI strip
function KpiStrip({ users }: { users: User[] }) {
  const k = computeKpis(users);
  return (
    <div className="kpi-strip" role="group" aria-label="User KPIs">
      <div className="kpi"><div className="k-label">Total</div><div className="k-val">{k.total}</div><Spark values={[6, 7, 7, 8, 9, 9, k.total]} /></div>
      <div className="kpi"><div className="k-label">Active</div><div className="k-val">{k.active}</div><Spark values={[4, 5, 5, 6, 6, 6, k.active]} /></div>
      <div className="kpi"><div className="k-label">Paying</div><div className="k-val">{k.paying}</div><Spark values={[3, 3, 4, 4, 5, 5, k.paying]} color="var(--c-sky)" /></div>
      <div className="kpi"><div className="k-label">Suspended</div><div className="k-val err">{k.suspended}</div><Spark values={[1, 1, 2, 2, 2, 2, k.suspended]} color="var(--c-rose)" /></div>
    </div>
  );
}

// ============================================================ All Users
function AllUsers() {
  const dispatch = useDispatch();
  const users = useSelector((s: RootState) => s.users.data);
  const { filterRole, filterStatus, sort, selection, density } = useSelector((s: RootState) => s.ui);
  const filtered = useFiltered();
  const kpiUsers = useRoleStatusFiltered();
  const rowSelection = useMemo(() => {
    const next: Record<string, boolean> = {};
    selection.forEach((id) => { if (filtered.some((u) => u.id === id)) next[id] = true; });
    return next;
  }, [selection, filtered]);

  const columns = useMemo<ColumnDef<User>[]>(() => [
    { id: 'select', header: ({ table }) => (
      <input type="checkbox" aria-label="Select all rows" className="check-box"
        checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} /> ),
      cell: ({ row }) => (
        <input type="checkbox" aria-label={`Select ${row.original.firstName} ${row.original.lastName}`} className="check-box"
          checked={selection.includes(row.original.id)} onChange={() => dispatch(toggleSelection(row.original.id))} /> ),
    },
    { header: 'User', accessorFn: (r) => `${r.firstName} ${r.lastName}`, cell: (info) => {
      const u = info.row.original;
      return <div className="name-cell"><Avatar n={u.avatar} name={`${u.firstName} ${u.lastName}`} /><div className="name-text"><b>{info.getValue() as string}</b><small>{u.email}</small></div></div>;
    } },
    { header: 'Role', accessorKey: 'role', cell: (i) => <span className="badge badge-ghost">{i.getValue() as string}</span> },
    { header: 'Status', accessorKey: 'status', cell: (i) => {
      const v = i.getValue() as string; const cls = v === 'Active' ? 'badge-success' : v === 'Invited' ? 'badge-warning' : 'badge-error';
      return <span className={`badge ${cls}`}>{v}</span>;
    } },
    { header: 'Payments', accessorKey: 'payments', cell: (i) => `$${(i.getValue() as number).toLocaleString()}` },
    { header: 'Products', accessorKey: 'products' },
    { header: 'Last active', accessorKey: 'lastActive', cell: (i) => relativeTime(i.getValue() as string) },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="row-act">
        <button className="btn btn-ghost btn-sm" aria-label={`Edit ${row.original.firstName}`} onClick={() => dispatch(setEditingId(row.original.id))}><PencilIcon className="icon-sm" /></button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} aria-label={`Delete ${row.original.firstName}`}
          onClick={() => dispatch(setConfirm({ open: true, title: 'Delete user', body: `Delete ${row.original.firstName} ${row.original.lastName}? This removes them from the list, KPIs, and export previews.`, ids: [row.original.id] }))}>
          <TrashIcon className="icon-sm" /></button>
      </div>
    ) },
  ], [dispatch, filtered, selection]);

  const table = useReactTable({ data: filtered, columns, state: { rowSelection }, enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: (up) => {
      const next = typeof up === 'function' ? up(rowSelection) : up;
      dispatch(setSelection(Object.keys(next).filter((k) => next[k])));
    }, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 100 } } });

  const selCount = selection.length;
  const applyStatus = (st: string) => { if (!st || !selCount) return; dispatch(updateUsersStatus({ ids: selection, status: st as any })); dispatch(pushToast({ kind: 'success', title: 'Status changed', body: `${selCount} user(s) set to ${st}` })); dispatch(setLastMutation(`Status → ${st} (${selCount})`)); };
  const applyRole = (rl: string) => { if (!rl || !selCount) return; dispatch(updateUsersRole({ ids: selection, role: rl as any })); dispatch(pushToast({ kind: 'success', title: 'Role changed', body: `${selCount} user(s) set to ${rl}` })); dispatch(setLastMutation(`Role → ${rl} (${selCount})`)); };

  return (
    <div className="span-12">
      <div className="ctxbar" style={{ padding: 0, marginBottom: '.4rem' }}>
        <div><div className="crumbs"><h1>All Users</h1></div><p style={{ color: 'var(--muted)', margin: '.1rem 0 0', fontSize: '.85rem' }}>Manage team members and their account permissions.</p></div>
        <button className="btn btn-primary" onClick={() => dispatch(setActiveView('add-user'))}><PlusIcon className="icon-sm" /> Add User</button>
      </div>
      <div style={{ marginBottom: '1rem' }}><KpiStrip users={kpiUsers} /></div>
      <div className="card">
        <div className="toolbar">
          <select className="select" style={{ width: 'auto' }} aria-label="Filter by role" value={filterRole} onChange={(e) => dispatch(setFilterRole(e.target.value))}>
            <option value="">All roles</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} aria-label="Filter by status" value={filterStatus} onChange={(e) => dispatch(setFilterStatus(e.target.value))}>
            <option value="">All statuses</option>{STATUSES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} aria-label="Sort users" value={sort} onChange={(e) => dispatch(setSort(e.target.value as SortKey))}>
            <option value="newest">Newest</option><option value="last-active">Last active</option>
            <option value="highest-spend">Highest spend</option><option value="name-az">Name A-Z</option>
          </select>
          <div className="density-toggle" role="group" aria-label="Row density">
            <button className={density === 'comfortable' ? 'on' : ''} aria-pressed={density === 'comfortable'} onClick={() => dispatch(setDensity('comfortable'))} title="Comfortable density">Comfortable</button>
            <button className={density === 'compact' ? 'on' : ''} aria-pressed={density === 'compact'} onClick={() => dispatch(setDensity('compact'))} title="Compact density">Compact</button>
          </div>
          <div className="spacer" />
          {selCount > 0 && (
            <div className="bulkbar">
              <span className="badge badge-accent">{selCount} selected</span>
              <select className="select" style={{ width: 'auto' }} aria-label="Change status for selected" value="" onChange={(e) => applyStatus(e.target.value)}>
                <option value="">Change status…</option>{STATUSES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select className="select" style={{ width: 'auto' }} aria-label="Change role for selected" value="" onChange={(e) => applyRole(e.target.value)}>
                <option value="">Change role…</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn btn-outline btn-sm" onClick={() => dispatch(setExportOpen(true))}><ArrowDownTrayIcon className="icon-sm" /> Export</button>
              <button className="btn btn-error btn-sm" onClick={() => dispatch(setConfirm({ open: true, title: 'Delete selected users', body: `Delete ${selCount} selected user(s)? This cannot be undone.`, ids: [...selection] }))}><TrashIcon className="icon-sm" /> Delete</button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><UsersIcon className="e-ico" /><h2>No users match these filters</h2>
            <p>Try clearing the search or filters, or add a new user to the directory.</p>
            <button className="btn btn-primary" onClick={() => dispatch(setActiveView('add-user'))}><PlusIcon className="icon-sm" /> Add User</button>
          </div>
        ) : (
          <div className={`table-wrap ${density === 'compact' ? 'density-compact' : ''}`}>
            <table className="tbl tbl-zebra">
              <thead>{table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
              ))}</thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {table.getRowModel().rows.map((row) => (
                    <motion.tr key={row.original.id} className={row.getIsSelected() ? 'selected' : ''} layout transition={{ duration: 0.3 }}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, scaleY: 0.8 }} style={{ overflow: 'hidden' }}>
                      {row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="pager">
            <span className="info">Showing {table.getRowModel().rows.length} of {filtered.length} users · page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
            <div className="pages">
              <button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Previous page">‹</button>
              {Array.from({ length: table.getPageCount() }).map((_, i) => <button key={i} className={i === table.getState().pagination.pageIndex ? 'on' : ''} onClick={() => table.setPageIndex(i)} aria-label={`Page ${i + 1}`}>{i + 1}</button>)}
              <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Next page">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================ Add / Edit form
const CONTRACT_RULES = (v: any) => [
  ['firstName 1–40 chars', !!v.firstName?.trim() && v.firstName.trim().length <= 40],
  ['lastName 1–40 chars', !!v.lastName?.trim() && v.lastName.trim().length <= 40],
  ['email has a domain dot', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email || '')],
  ['phone 7–15 digits (optional)', !v.phone?.trim() || /^\d{7,15}$/.test(v.phone.trim())],
  ['notes ≤ 280 chars (optional)', !v.notes || v.notes.length <= 280],
  ['temporary password ≥ 8 chars', !!(v.temporaryPassword && v.temporaryPassword.length >= 8)],
  ['role in closed enum', ROLES.includes(v.role)],
  ['status in closed enum', STATUSES.includes(v.status)],
];

function UserForm() {
  const dispatch = useDispatch();
  const editingId = useSelector((s: RootState) => s.ui.editingId);
  const addUserDraft = useSelector((s: RootState) => s.ui.addUserDraft);
  const editing = useSelector((s: RootState) => s.users.data.find((u) => u.id === editingId));
  const isEdit = !!editing;
  const [live, setLive] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formSchema = isEdit ? userEditSchema : userCreateSchema;
  const { register, handleSubmit, watch, formState: { errors, isValid }, reset } = useForm<UserCreateValues | UserEditValues>({
    resolver: zodResolver(formSchema), mode: 'onChange',
    defaultValues: isEdit ? {
      firstName: editing!.firstName, lastName: editing!.lastName, email: editing!.email, phone: editing!.phone || '',
      notes: editing!.notes || '', temporaryPassword: '', accountSegment: editing!.accountSegment || 'Internal', status: editing!.status, role: editing!.role,
      sendInvitation: editing!.sendInvitation ?? false, enable2FA: editing!.enable2FA ?? false,
      productAccess: editing!.productAccess ?? true, permissions: editing!.permissions || ['read'],
    } : { accountSegment: 'Internal', status: 'Active', role: 'Member', sendInvitation: true, enable2FA: false, productAccess: true, permissions: ['read'], ...addUserDraft },
  });
  useEffect(() => {
    reset(isEdit ? {
      firstName: editing!.firstName, lastName: editing!.lastName, email: editing!.email, phone: editing!.phone || '',
      notes: editing!.notes || '', temporaryPassword: '', accountSegment: editing!.accountSegment || 'Internal', status: editing!.status, role: editing!.role,
      sendInvitation: editing!.sendInvitation ?? false, enable2FA: editing!.enable2FA ?? false,
      productAccess: editing!.productAccess ?? true, permissions: editing!.permissions || ['read'],
    } : { accountSegment: 'Internal', status: 'Active', role: 'Member', sendInvitation: true, enable2FA: false, productAccess: true, permissions: ['read'], ...addUserDraft });
  }, [isEdit, editingId, editing, reset]);

  useEffect(() => {
    if (isEdit) return undefined;
    const subscription = watch((value) => dispatch(setAddUserDraft(value as Partial<UserCreateValues>)));
    return () => subscription.unsubscribe();
  }, [dispatch, isEdit, watch]);

  const vals = watch();
  const rules = CONTRACT_RULES(vals);
  useEffect(() => {
    if (Object.keys(errors).length) setLive(`Validation errors: ${Object.keys(errors).map((k) => (errors as any)[k]?.message || k).join('; ')}`);
    else setLive('');
  }, [errors]);

  const onSubmit = (data: UserCreateValues) => {
    if (submitting) return; // double-submit guard
    setSubmitting(true);
    if (isEdit) {
      dispatch(updateUser({ ...editing!, firstName: data.firstName.trim(), lastName: data.lastName.trim(), email: data.email.trim(),
        phone: data.phone?.trim() || undefined, notes: data.notes?.trim() || undefined,
        accountSegment: data.accountSegment, sendInvitation: data.sendInvitation, enable2FA: data.enable2FA,
        productAccess: data.productAccess, permissions: data.permissions, role: data.role, status: data.status }));
      dispatch(pushToast({ kind: 'success', title: 'User updated', body: `${data.firstName} ${data.lastName} saved across all views` }));
      dispatch(setLastMutation(`Updated ${data.firstName}`));
      dispatch(setActiveView('all-users'));
    } else {
      dispatch(addUser(makeUserFromCreate(data)));
      dispatch(pushToast({ kind: 'success', title: 'User added', body: `${data.firstName} ${data.lastName} added to the directory` }));
      dispatch(setLastMutation(`Created ${data.firstName}`));
      dispatch(clearAddUserDraft());
      setTimeout(() => dispatch(setActiveView('all-users')), 700);
    }
    setTimeout(() => setSubmitting(false), 400);
  };
  const cancel = () => { if (!isEdit) dispatch(clearAddUserDraft()); dispatch(setActiveView('all-users')); };

  const Err = ({ k }: { k: keyof UserCreateValues }) => (errors as any)[k] ? <span className="field-error" id={`${k}-error`} role="alert">{(errors as any)[k].message}</span> : null;
  const inv = (k: keyof UserCreateValues) => !!(errors as any)[k];

  return (
    <div className="span-12">
      <div className="ctxbar" style={{ padding: 0 }}>
        <div><div className="crumbs"><h1>{isEdit ? 'Edit user' : 'Add User'}</h1></div>
          <p style={{ color: 'var(--muted)', margin: '.1rem 0 0', fontSize: '.85rem' }}>The submit payload is the API-shaped UserCreate body the directory would accept.</p></div>
        <button className="btn btn-ghost" onClick={cancel}>Cancel</button>
      </div>
      <div aria-live="polite" className="sr-only">{live}</div>
      <div className="form-layout">
        <form key={isEdit ? `edit-${editingId}` : 'add-user'} onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card"><div className="card-body">
            <h3 className="card-title">Profile</h3>
            <div className="field-grid" style={{ marginTop: '1rem' }}>
              <div className="field"><label htmlFor="firstName">First name <span className="req">*</span></label>
                <input id="firstName" className={`input ${inv('firstName') ? 'err' : ''}`} autoComplete="given-name" aria-invalid={inv('firstName')} aria-describedby={inv('firstName') ? 'firstName-error' : undefined} {...register('firstName')} /><Err k="firstName" /></div>
              <div className="field"><label htmlFor="lastName">Last name <span className="req">*</span></label>
                <input id="lastName" className={`input ${inv('lastName') ? 'err' : ''}`} autoComplete="family-name" aria-invalid={inv('lastName')} aria-describedby={inv('lastName') ? 'lastName-error' : undefined} {...register('lastName')} /><Err k="lastName" /></div>
              <div className="field"><label htmlFor="email">Email <span className="req">*</span></label>
                <input id="email" type="email" className={`input ${inv('email') ? 'err' : ''}`} autoComplete="email" aria-invalid={inv('email')} aria-describedby={inv('email') ? 'email-error' : undefined} {...register('email')} /><Err k="email" /></div>
              <div className="field"><label htmlFor="phone">Phone</label>
                <input id="phone" className={`input ${inv('phone') ? 'err' : ''}`} autoComplete="tel" aria-invalid={inv('phone')} aria-describedby={inv('phone') ? 'phone-error' : undefined} {...register('phone')} /><Err k="phone" /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="notes">Notes</label>
                <textarea id="notes" rows={2} className={`textarea ${inv('notes') ? 'err' : ''}`} aria-invalid={inv('notes')} aria-describedby={inv('notes') ? 'notes-error' : undefined} {...register('notes')} /><Err k="notes" /></div>
            </div>
          </div></div>
          <div className="card"><div className="card-body">
            <h3 className="card-title">Access</h3>
            <div className="field-grid" style={{ marginTop: '1rem' }}>
              <div className="field"><label htmlFor="temporaryPassword">Temporary password {!isEdit && <span className="req">*</span>}</label>
                <input id="temporaryPassword" type="password" className={`input ${inv('temporaryPassword') ? 'err' : ''}`} autoComplete="new-password" aria-invalid={inv('temporaryPassword')} aria-describedby={inv('temporaryPassword') ? 'temporaryPassword-error' : undefined} {...register('temporaryPassword')} /><Err k="temporaryPassword" /></div>
              <div className="field"><label htmlFor="accountSegment">Account segment <span className="req">*</span></label>
                <select id="accountSegment" className="select" {...register('accountSegment')}>{SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="field"><label className="switch" style={{ marginTop: '.4rem' }}><span className={`track ${vals.sendInvitation ? 'on' : ''}`} /><input type="checkbox" className="sr-only" {...register('sendInvitation')} /> Send invitation email</label></div>
            </div>
          </div></div>
          <div className="card"><div className="card-body">
            <h3 className="card-title">Account settings</h3>
            <div className="field-grid" style={{ marginTop: '1rem' }}>
              <div className="field"><label htmlFor="status">Status <span className="req">*</span></label>
                <select id="status" className="select" {...register('status')}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="field"><label htmlFor="role">Role <span className="req">*</span></label>
                <select id="role" className="select" {...register('role')}>{ROLES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="field"><label className="switch"><span className={`track ${vals.enable2FA ? 'on' : ''}`} /><input type="checkbox" className="sr-only" {...register('enable2FA')} /> Require 2FA</label></div>
              <div className="field"><label className="switch"><span className={`track ${vals.productAccess ? 'on' : ''}`} /><input type="checkbox" className="sr-only" {...register('productAccess')} /> Product access</label></div>
            </div>
          </div></div>
          <div className="card"><div className="card-body">
            <h3 className="card-title">Permissions</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
              {['read', 'write', 'export', 'admin'].map((p) => (
                <label key={p} className="check"><input type="checkbox" value={p} {...register('permissions')} /> {p}</label>
              ))}
            </div>
          </div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
            <button type="button" className="btn btn-ghost" onClick={cancel}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isValid || submitting}>{isEdit ? 'Save changes' : 'Create user'}</button>
          </div>
        </form>
        <aside className="card" aria-label="Field contract checklist"><div className="card-body">
          <h3 className="card-title"><ShieldCheckIcon className="ico" /> Field contract</h3>
          <p className="card-sub">Each rule lights up as the payload becomes valid.</p>
          <ul className="contract" style={{ marginTop: '.8rem' }}>
            {rules.map(([label, ok]) => <li key={label as string} className={ok ? 'ok' : ''}><span className="ck">{ok ? '✓' : ''}</span>{label}</li>)}
          </ul>
        </div></aside>
      </div>
    </div>
  );
}

// ============================================================ extra views
function ExtraView({ title, kind }: { title: string; kind: 'roles' | 'permissions' | 'logs' | 'stats' | 'payments' | 'products' }) {
  const users = useSelector((s: RootState) => s.users.data);
  const [q, setQ] = useState('');
  const rows = users.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="span-12">
      <div className="ctxbar" style={{ padding: 0 }}><div className="crumbs"><h1>{title}</h1></div></div>
      <div className="card">
        <div className="toolbar"><input className="input" style={{ width: '14rem', maxWidth: '60vw' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${title.toLowerCase()}`} aria-label={`Filter ${title}`} autoComplete="off" /></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr>
            {kind === 'roles' && <><th>User</th><th>Role</th><th>Status</th><th>Segment</th></>}
            {kind === 'permissions' && <><th>User</th><th>Role</th><th>2FA</th><th>Product access</th></>}
            {kind === 'logs' && <><th>User</th><th>Event</th><th>When</th></>}
            {kind === 'stats' && <><th>User</th><th>Products</th><th>Payments</th><th>Last active</th></>}
            {kind === 'payments' && <><th>User</th><th>Payments</th><th>Status</th></>}
            {kind === 'products' && <><th>User</th><th>Products</th><th>Email</th></>}
          </tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={4} className="empty">No records match this filter.</td></tr> :
              rows.map((u) => <tr key={u.id}>
                {kind === 'roles' && <><td>{u.firstName} {u.lastName}</td><td><span className="badge badge-ghost">{u.role}</span></td><td>{u.status}</td><td>Internal</td></>}
                {kind === 'permissions' && <><td>{u.firstName} {u.lastName}</td><td>{u.role}</td><td>{u.role === 'Admin' ? 'Required' : 'Off'}</td><td>Granted</td></>}
                {kind === 'logs' && <><td>{u.firstName} {u.lastName}</td><td>session.login</td><td>{relativeTime(u.lastActive)}</td></>}
                {kind === 'stats' && <><td>{u.firstName} {u.lastName}</td><td>{u.products}</td><td>${u.payments.toLocaleString()}</td><td>{relativeTime(u.lastActive)}</td></>}
                {kind === 'payments' && <><td>{u.firstName} {u.lastName}</td><td>${u.payments.toLocaleString()}</td><td>{u.status}</td></>}
                {kind === 'products' && <><td>{u.firstName} {u.lastName}</td><td>{u.products}</td><td>{u.email}</td></>}
              </tr>)}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

// ============================================================ Operations Overview
function Overview() {
  const dispatch = useDispatch();
  const k = computeKpis(useSelector((s: RootState) => s.users.data));
  const Card = ({ title, sub, link, span, inverse, icon: Icon, children }: any) => (
    <section className={`card ${inverse ? 'card-inverse' : ''} ${span}`}>
      <div className="card-body">
        <div className="card-title">{Icon && <Icon className="ico" />}{title}{link && <button className="card-link" onClick={() => dispatch(setActiveView('operations-overview'))}>{link}</button>}</div>
        {sub && <p className="card-sub">{sub}</p>}
        {children}
      </div>
    </section>
  );
  const prog = (label: string, v: number) => (
    <div style={{ marginBottom: '.7rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}><span>{label}</span><span>{v}%</span></div><div className="progress"><i style={{ width: `${v}%` }} /></div></div>
  );
  return (
    <div className="span-12">
      <div className="ctxbar" style={{ padding: 0 }}>
        <div className="crumbs"><button onClick={() => dispatch(setActiveView('operations-overview'))}>Dashboard</button><span className="sep">›</span><h1>Operations Overview</h1></div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-primary" onClick={() => dispatch(setActiveView('add-user'))}><PlusIcon className="icon-sm" /> New product</button>
          <button className="btn" onClick={() => dispatch(setExportOpen(true))}><ArrowDownTrayIcon className="icon-sm" /> Export session</button>
          <button className="btn"><ShieldCheckIcon className="icon-sm" /> System Health</button>
        </div>
      </div>
      <div className="kpi-strip" style={{ margin: '1rem 0 1.5rem' }}>
        <div className="kpi"><div className="k-label">Revenue</div><div className="k-val">$842K</div><div className="k-chip up">▲ 12.8% vs prior period</div></div>
        <div className="kpi"><div className="k-label">Orders</div><div className="k-val">18.2K</div><div className="k-chip">624 awaiting fulfillment</div></div>
        <div className="kpi"><div className="k-label">Active users</div><div className="k-val">{(k.active * 4700 / 1000).toFixed(1)}K</div><div className="k-chip up">▲ new this month</div></div>
        <div className="kpi"><div className="k-label">Support SLA</div><div className="k-val">94.2%</div><div className="k-chip">7 high-priority threads</div></div>
      </div>
      <div className="grid12" style={{ padding: 0 }}>
        <Card title="Revenue and demand" sub="Commerce revenue, product demand, and checkout activity" icon={ChartBarIcon} span="span-8" link="Open sales analytics">
          <div style={{ marginTop: '1rem' }}><ColumnChart values={OV.revenue} labels={OV.revenueLabels} showAvg color="var(--c-teal)" /></div>
          <div className="stat-row" style={{ marginTop: '.8rem' }}><div><div className="stat-big">$842K</div><span className="card-sub">Revenue</span></div><div><div className="stat-big">18.2K</div><span className="card-sub">Orders</span></div><div><div className="stat-big">4.8%</div><span className="card-sub">Checkout lift</span></div></div>
        </Card>
        <Card title="Order Status" sub="Current order volume by fulfillment stage" icon={ShoppingCartIcon} span="span-4">
          <div style={{ marginTop: '1rem' }}><DonutChart data={OV.orderStatus} /></div>
          <div className="stat-row" style={{ marginTop: '.6rem', flexDirection: 'column', gap: '.3rem' }}><div>Delivered <b>5,492</b></div><div>In Progress <b>1,820</b></div></div>
        </Card>

        <Card title="Recent Commerce Activity" icon={ClipboardDocumentListIcon} span="span-8" link="All orders">
          <div className="table-wrap" style={{ marginTop: '1rem' }}><table className="tbl">
            <thead><tr><th>Record</th><th>Customer</th><th>Status</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {[['Order #12092', 'Mina Park', 'Refund review', 'badge-warning', '$124,735'], ['Transaction #TRX-8842', 'Arman Bell', 'Paid', 'badge-success', '$8,180'], ['Return #RET-221', 'Nora Quinn', 'Received', 'badge-ghost', '$640'], ['Checkout #CHK-492', 'Tessa Cole', 'Abandoned', 'badge-error', '$420']].map((r) => (
                <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td><span className={`badge ${r[3]}`}>{r[2]}</span></td><td>{r[4]}</td><td>Open</td></tr>
              ))}
            </tbody>
          </table></div>
        </Card>
        <Card title="Governance and risk" sub="Payment, data access, security, and compliance posture" icon={ShieldCheckIcon} span="span-4">
          <div style={{ display: 'grid', placeItems: 'center', margin: '1rem 0' }}><Radial value={91} /></div>
          {prog('Gateway verification', 96)}{prog('Admin permission review', 84)}{prog('Webhook signing coverage', 78)}
        </Card>

        <Card title="Priority queue" icon={ExclamationTriangleIcon} span="span-6" link="7 queued">
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[['Refund review: order #PBS-248', 'Accidental 248 PlayStation 5 order', 'Support'], ['Media processor backlog', '5K derivatives waiting', 'Ops'], ['Plugin updates', '6 updates available', 'Platform'], ['Warehouse cutoff risk', 'West dock needs labels', 'Orders']].map((q) => (
              <div key={q[0]} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem', borderRadius: '.5rem', background: 'var(--wash)' }}>
                <span className="badge badge-ghost">{q[2]}</span><div style={{ minWidth: 0 }}><b style={{ fontSize: '.82rem' }}>{q[0]}</b><div className="card-sub" style={{ marginTop: 0 }}>{q[1]}</div></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Revenue run rate" sub="Daily booked revenue across storefront, invoices, and subscriptions" icon={BoltIcon} span="span-6" inverse>
          <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', marginTop: '.8rem', display: 'inline-flex' }}>$1.04M forecast</span>
          <div style={{ marginTop: '.6rem' }}><ColumnChart values={OV.revenue.map((v) => v * 0.9)} labels={OV.revenueLabels} color="rgba(255,255,255,.55)" /></div>
          <div className="stat-row" style={{ marginTop: '.6rem' }}><div><div className="stat-big">$842K</div><span className="muted">Booked</span></div><div><div className="stat-big">$187K</div><span className="muted">Pipeline</span></div></div>
        </Card>

        <Card title="Acquisition mix" sub="Sessions by top marketing channel" icon={ChartPieIcon} span="span-4"><div style={{ marginTop: '1rem' }}><DonutChart data={OV.acquisition} size={150} /></div></Card>
        <Card title="Marketing performance" sub="Email and automation revenue movement" icon={MegaphoneIcon} span="span-4"><div style={{ marginTop: '1rem' }}><LineChart values={OV.marketing} color="var(--color-info)" /></div><div className="stat-row" style={{ marginTop: '.6rem' }}><div><div className="stat-big" style={{ fontSize: '1.3rem' }}>42.6%</div><span className="card-sub">Open rate</span></div><div><div className="stat-big" style={{ fontSize: '1.3rem' }}>$118K</div><span className="card-sub">Attributed</span></div></div></Card>
        <Card title="Promotions health" icon={TagIcon} span="span-4"><div style={{ marginTop: '1rem' }}>{prog('Coupon margin', 72)}{prog('Gift card redemption', 56)}{prog('Fraud pressure', 11)}{prog('Offer health', 88)}</div></Card>

        <Card title="Infrastructure uptime" sub="Last 24 hours across public services" icon={CircleStackIcon} span="span-4"><div style={{ marginTop: '1rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}><span>Storefront</span><span>100%</span></div><Uptime series={OV.uptimeStore} /><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginTop: '.6rem' }}><span>API</span><span>99.9%</span></div><Uptime series={OV.uptimeApi} /></div></Card>
        <Card title="Satisfaction" sub="Retention, refunds, satisfaction, and service workload" icon={BanknotesIcon} span="span-4"><div style={{ display: 'grid', placeItems: 'center', margin: '1rem 0' }}><Radial value={86} /></div><div style={{ fontSize: '.82rem' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Net revenue retention</span><b>112%</b></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Refund pressure</span><b>3.8%</b></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VIP escalations</span><b>14</b></div></div></Card>
        <Card title="Inventory pressure" icon={CubeIcon} span="span-4"><div style={{ marginTop: '1rem' }}>{prog('Low stock', 42)}{prog('Oversold', 7)}{prog('Healthy stock', 88)}</div></Card>

        <Card title="Plugin and tool status" icon={PuzzlePieceIcon} span="span-6" link="Plugins">
          <div className="table-wrap" style={{ marginTop: '1rem' }}><table className="tbl"><thead><tr><th>Component</th><th>Status</th><th>Signal</th></tr></thead><tbody>
            {[['Fraud Shield', 'Active', 'badge-success', '426 coupon blocks'], ['Media Optimizer', 'Update', 'badge-warning', 'Backlog impact'], ['Backup Vault', 'Active', 'badge-success', 'Last snapshot 18m ago'], ['Import queue', 'Ready', 'badge-info', '3 validated files']].map((r) => (
              <tr key={r[0]}><td>{r[0]}</td><td><span className={`badge ${r[2]}`}>{r[1]}</span></td><td>{r[3]}</td></tr>
            ))}
          </tbody></table></div>
        </Card>
        <Card title="Fulfillment Throughput" sub="Packed, shipped, returned, and delayed order movement" icon={ArrowsRightLeftIcon} span="span-6"><div style={{ marginTop: '1rem' }}><LineChart values={OV.fulfillment} color="var(--c-amber)" /></div><div className="stat-row" style={{ marginTop: '.6rem' }}><div><div className="stat-big" style={{ fontSize: '1.3rem' }}>9,482</div><span className="card-sub">Packed</span></div><div><div className="stat-big" style={{ fontSize: '1.3rem' }}>624</div><span className="card-sub">Queued</span></div><div><div className="stat-big" style={{ fontSize: '1.3rem' }}>118</div><span className="card-sub">Returns</span></div></div></Card>

        <Card title="Automation Coverage" sub="Campaigns, refunds, imports, and fulfillment handled automatically" icon={BoltIcon} span="span-4"><div style={{ marginTop: '1rem' }}>{prog('Email flows', 82, 'var(--c-sky)')}{prog('Scheduled jobs', 68, 'var(--c-rose)')}</div></Card>
        <Card title="Security Watch" icon={ShieldCheckIcon} span="span-4">
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><span className="ping-dot" style={{ background: 'var(--color-success)' }} /><b>1,284</b> blocked attempts</div>
            <div className="card-sub">-8% from yesterday</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.8rem' }}><span className="ping-dot" style={{ background: 'var(--color-error)' }} /><b>4</b> risky sessions</div>
            <div className="card-sub">3 need review · 1 suspicious</div>
          </div>
        </Card>
        <Card title="Cash Movement" icon={BanknotesIcon} span="span-4">
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '.7rem', fontSize: '.85rem' }}>
            <div style={{ display: 'flex', gap: '.6rem' }}><b>In</b><div><b>$428K captured</b><div className="card-sub" style={{ marginTop: 0 }}>Card, wallet, invoice</div></div></div>
            <div style={{ display: 'flex', gap: '.6rem' }}><b>Hold</b><div><b>$22K under review</b><div className="card-sub" style={{ marginTop: 0 }}>Gateway disputes</div></div></div>
            <div style={{ display: 'flex', gap: '.6rem' }}><b>Out</b><div><b>$18K refunds</b><div className="card-sub" style={{ marginTop: 0 }}>Approved returns</div></div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================ Export drawer
function ExportDrawer() {
  const dispatch = useDispatch();
  const { exportOpen, exportTab } = useSelector((s: RootState) => s.ui);
  const users = useSelector((s: RootState) => s.users.data);
  const ui = useSelector((s: RootState) => s.ui);
  const [importMode, setImportMode] = useState(false);
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [printView, setPrintView] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const kpis = computeKpis(filterUsersForKpis(users, ui.filterRole, ui.filterStatus));

  const doc = buildSession(users, { role: ui.filterRole, status: ui.filterStatus, sort: ui.sort, theme: ui.theme, activeView: ui.activeView });
  const json = JSON.stringify(doc, null, 2);
  const csv = buildCsv(users);
  const text = exportTab === 'json' ? json : csv;

  // open/close effects: focus trap + restore + escape
  useEffect(() => {
    if (exportOpen) { lastFocus.current = document.activeElement as HTMLElement; }
    else {
      setImportMode(false); setDraft(''); setMsg(null);
      const opener = lastFocus.current;
      window.setTimeout(() => { if (opener && document.contains(opener)) opener.focus(); }, 0);
    }
  }, [exportOpen]);
  useEffect(() => {
    if (exportOpen) setMsg((current) => current?.text.startsWith('Imported ')
      ? current
      : { kind: 'success', text: `${exportTab === 'json' ? 'Session JSON' : 'Users CSV'} preview ready for ${users.length} users` });
  }, [exportOpen, exportTab, users.length]);
  useEffect(() => {
    if (!exportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); dispatch(setExportOpen(false)); return; }
      if (e.key === 'Tab' && drawerRef.current) {
        const f = drawerRef.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const focusTimer = window.setTimeout(() => drawerRef.current?.querySelector<HTMLElement>('button')?.focus(), 60);
    return () => { document.removeEventListener('keydown', onKey); window.clearTimeout(focusTimer); };
  }, [exportOpen, dispatch]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setMsg({ kind: 'success', text: `Copied ${exportTab === 'json' ? 'Session JSON' : 'Users CSV'} to clipboard` });
    dispatch(pushToast({ kind: 'success', title: 'Copied to clipboard', body: `${exportTab === 'json' ? 'Session JSON' : 'Users CSV'} preview copied` }));
  };
  const download = () => {
    const blob = new Blob([text], { type: exportTab === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    const fname = exportTab === 'json' ? 'session.json' : 'users.csv';
    a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    dispatch(pushToast({ kind: 'info', title: 'Download started', body: `${fname} download started` }));
  };
  const doImport = () => {
    const res = exportTab === 'json' ? importSessionJson(draft) : importUsersCsv(draft);
    if (!res.ok) { setMsg({ kind: 'error', text: `Import failed: ${res.message}` }); dispatch(pushToast({ kind: 'error', title: 'Import failed', body: res.message })); return; }
    dispatch(setUsers(res.users));
    if (res.applied) { dispatch(setFilterRole(res.applied.role || '')); dispatch(setFilterStatus(res.applied.status || '')); dispatch(setSort(res.applied.sort || 'newest')); dispatch(setTheme(res.applied.theme || 'dark')); if (res.applied.activeView) dispatch(setActiveView(res.applied.activeView as any)); }
    setMsg({ kind: 'success', text: `Imported ${res.users.length} user(s). All Users, KPIs, and previews now match.` });
    dispatch(pushToast({ kind: 'success', title: 'Import successful', body: `${res.users.length} user(s) restored` }));
    setDraft(''); setImportMode(false);
  };

  return (
    <>
      <div className={`drawer-overlay ${exportOpen ? 'open' : ''}`} style={{ zIndex: 9998 }} onClick={() => dispatch(setExportOpen(false))} aria-hidden="true" />
      <div ref={drawerRef} className={`export-drawer ${exportOpen ? 'open' : ''}`} style={{ zIndex: 9999 }} role="dialog" aria-modal="true" aria-label="Export and import session" aria-hidden={!exportOpen}>
        <div className="export-head">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{importMode ? 'Import session' : 'Export session'}</h2>
          <button className="btn btn-ghost btn-circle" aria-label="Close export drawer" onClick={() => dispatch(setExportOpen(false))}><XMarkIcon className="icon-md" /></button>
        </div>
        <div className="export-tabs" role="tablist" aria-label="Export format">
          <button role="tab" aria-selected={exportTab === 'json'} className={`btn btn-sm ${exportTab === 'json' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => dispatch(setExportTab('json'))}>Session JSON</button>
          <button role="tab" aria-selected={exportTab === 'csv'} className={`btn btn-sm ${exportTab === 'csv' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => dispatch(setExportTab('csv'))}>Users CSV</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm btn-ghost" onClick={() => setImportMode((v) => !v)}>{importMode ? 'Back to preview' : 'Import session'}</button>
        </div>
        {!importMode && (
          <div className="export-summary" aria-label="Export summary">
            <div className="es"><b>{users.length}</b><span>users</span></div>
            <div className="es"><b>{kpis.total}</b><span>KPI total</span></div>
            <div className="es"><b>{kpis.active}</b><span>active</span></div>
            <div className="es"><b>{kpis.suspended}</b><span>suspended</span></div>
            <div className="es" style={{ marginLeft: 'auto' }}><span>exported {new Date(doc.exportedAt).toLocaleTimeString()}</span></div>
          </div>
        )}
        <div aria-live="polite" className="sr-only">{msg?.text}</div>
        {msg && <div style={{ padding: '.6rem 1.2rem 0' }}><div className={`toast ${msg.kind}`} style={{ position: 'static', width: 'auto' }}><span>{msg.text}</span></div></div>}
        <div className="export-body">
          {importMode ? (
            <>
              <p className="card-sub">Paste {exportTab === 'json' ? 'Session JSON' : 'Users CSV'} text. Malformed or contract-violating input is rejected and leaves the directory unchanged.</p>
              <textarea className="textarea" style={{ flex: 1, fontFamily: 'var(--ff-mono)', fontSize: '.72rem' }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Paste ${exportTab === 'json' ? 'Session JSON' : 'Users CSV'} here`} aria-label="Import payload" />
            </>
          ) : (
            <>
              {!printView ? <pre className="export-pre" tabIndex={0}>{text}</pre>
                : <div className="export-pre" style={{ whiteSpace: 'normal' }}><b>Session summary</b> — {users.length} users · total {kpis.total} · active {kpis.active} · paying {kpis.paying} · suspended {kpis.suspended} · sort {ui.sort} · theme {ui.theme} · view {ui.activeView}.</div>}
              <button className="btn btn-sm btn-outline" onClick={() => { setPrintView((v) => !v); if (!printView) setTimeout(() => window.print(), 50); }}><DocumentTextIcon className="icon-sm" /> {printView ? 'Hide summary' : 'Print / share summary'}</button>
            </>
          )}
        </div>
        <div className="export-foot">
          {importMode ? (
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!draft.trim()} onClick={doImport}>Import data</button>
          ) : (
            <>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={copy}><ClipboardDocumentIcon className="icon-sm" /> Copy</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={download}><ArrowDownTrayIcon className="icon-sm" /> Download {exportTab === 'json' ? 'JSON' : 'CSV'}</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================ Toasts
function Toasts() {
  const dispatch = useDispatch();
  const toasts = useSelector((s: RootState) => s.ui.toasts);
  const scheduledRef = useRef(new Set<string>());
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    toasts.forEach((t) => {
      if (scheduledRef.current.has(t.id)) return;
      scheduledRef.current.add(t.id);
      timers.push(setTimeout(() => {
        scheduledRef.current.delete(t.id);
        dispatch(dismissToast(t.id));
      }, 3800));
    });
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, dispatch]);
  useEffect(() => {
    const live = new Set(toasts.map((t) => t.id));
    scheduledRef.current.forEach((id) => { if (!live.has(id)) scheduledRef.current.delete(id); });
  }, [toasts]);
  const Icon = (k: string) => k === 'success' ? <CheckCircleIcon className="icon-md t-ico" style={{ color: 'var(--color-success)' }} /> : k === 'error' ? <ExclamationTriangleIcon className="icon-md t-ico" style={{ color: 'var(--color-error)' }} /> : <InformationCircleIcon className="icon-md t-ico" style={{ color: 'var(--color-info)' }} />;
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className={`toast ${t.kind}`} role="status"
            initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
            {Icon(t.kind)}<div><div className="t-title">{t.title}</div>{t.body && <div className="t-body">{t.body}</div>}</div>
            <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'auto' }} aria-label="Dismiss notification" onClick={() => dispatch(dismissToast(t.id))}><XMarkIcon className="icon-sm" /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================ Confirm dialog
function ConfirmDialog() {
  const dispatch = useDispatch();
  const { confirm, selection } = useSelector((s: RootState) => s.ui);
  const close = () => dispatch(setConfirm({ open: false, title: '', body: '', ids: [] }));
  const confirmDel = () => {
    const ids = confirm.ids; const n = ids.length;
    dispatch(deleteUsers(ids)); dispatch(clearSelection());
    dispatch(pushToast({ kind: 'success', title: `${n} user(s) deleted`, body: 'Removed from list, KPIs, and export previews' }));
    dispatch(setLastMutation(`Deleted ${n}`)); close();
  };
  useEffect(() => {
    if (!confirm.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, [confirm.open]);
  if (!confirm.open) return null;
  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-label={confirm.title} onClick={close}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.stopPropagation()}>
        <h2>{confirm.title}</h2><p>{confirm.body}</p>
        <div className="actions"><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-error" onClick={confirmDel} autoFocus>Delete</button></div>
      </motion.div>
    </div>
  );
}

// ============================================================ WebMCP
const VIEW_DESTS = ['operations-overview', 'all-users', 'add-user', 'roles', 'permissions', 'user-logs', 'user-stats', 'user-payments', 'user-products', 'export-drawer'];
function WebMCPBinder() {
  const dispatch = useDispatch();
  useEffect(() => {
    const w: any = window;
    w.webmcp_session_info = () => ({ contract: 'zto-webmcp-v1', modules: ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'], version: 'pineapple-admin-analytics-v1' });
    w.webmcp_list_tools = () => [
      { name: 'browse_open', description: 'Open a destination view', params: { destinations: VIEW_DESTS } },
      { name: 'browse_search', description: 'Filter the All Users list by search text', params: { query: 'string' } },
      { name: 'browse_apply_filter', description: 'Apply role/status filters', params: { filters: { role: ROLES, status: STATUSES } } },
      { name: 'browse_clear_filter', description: 'Clear role/status/search filters' },
      { name: 'browse_sort', description: 'Sort the list', params: { sorts: ['last-active', 'newest', 'highest-spend', 'name-az'] } },
      { name: 'browse_set_theme', description: 'Set the UI theme', params: { themes: ['light', 'dark'] } },
      { name: 'entity_create', description: 'Create a user (validated against UserCreate contract)', params: { entity: ['user'], entity_fields: 'UserCreate' } },
      { name: 'entity_select', description: 'Set row selection', params: { entity: ['user'], target_ids: 'string[]' } },
      { name: 'entity_update', description: 'Update a user by id', params: { entity: ['user'], target_id: 'string', entity_fields: 'partial user' } },
      { name: 'entity_delete', description: 'Delete a user (requires confirm=true)', params: { entity: ['user'], target_id: 'string', confirm: true } },
      { name: 'artifact_export', description: 'Open export drawer on a format tab', params: { export_formats: ['json', 'csv'] } },
      { name: 'artifact_import', description: 'Import pasted text', params: { import_modes: ['session-json', 'users-csv'], content: 'string' } },
      { name: 'artifact_copy', description: 'Copy the active preview to clipboard', params: { export_formats: ['json', 'csv'] } },
    ];
    w.webmcp_invoke_tool = async (name: string, args: any = {}) => {
      try {
        const st = store.getState();
        switch (name) {
          case 'browse_open': {
            const d = (args.destinations && args.destinations[0]) || args.destination;
            if (!VIEW_DESTS.includes(d)) return { error: `destination must be one of ${VIEW_DESTS.join(', ')}` };
            if (d === 'export-drawer') dispatch(setExportOpen(true));
            else { dispatch(setExportOpen(false)); dispatch(setSidebarOpen(false)); dispatch(setActiveView(d)); }
            return { result: `opened ${d}` };
          }
          case 'browse_search': dispatch(setExportOpen(false)); dispatch(setActiveView('all-users')); dispatch(setSearch(String(args.query ?? ''))); return { result: 'search applied' };
          case 'browse_apply_filter':
            if (args.filters) { if (args.filters.role !== undefined) dispatch(setFilterRole(args.filters.role)); if (args.filters.status !== undefined) dispatch(setFilterStatus(args.filters.status)); }
            return { result: 'filters applied' };
          case 'browse_clear_filter': dispatch(resetFilters()); return { result: 'filters cleared' };
          case 'browse_sort': { const s = (args.sorts && args.sorts[0]) || args.sort; if (!['last-active', 'newest', 'highest-spend', 'name-az'].includes(s)) return { error: 'invalid sort' }; dispatch(setSort(s)); return { result: `sorted ${s}` }; }
          case 'browse_set_theme': { const t = (args.themes && args.themes[0]) || args.theme; if (t !== 'light' && t !== 'dark') return { error: 'theme must be light or dark' }; dispatch(setTheme(t)); return { result: `theme ${t}` }; }
          case 'entity_create': {
            if (args.entity && args.entity !== 'user') return { error: 'entity must be user' };
            const f = args.entity_fields || {};
            const parsed = userCreateSchema.safeParse({ ...f, temporaryPassword: f.temporaryPassword || 'password1', accountSegment: f.accountSegment || 'Internal', status: f.status || 'Active', role: f.role || 'Member' });
            if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
            const user = makeUserFromCreate(parsed.data);
            dispatch(addUser(user));
            dispatch(pushToast({ kind: 'success', title: 'User added', body: `${parsed.data.firstName} ${parsed.data.lastName} (via MCP)` }));
            dispatch(setLastMutation(`Created ${parsed.data.firstName} ${parsed.data.lastName}`));
            return { result: `created user ${user.id}`, userId: user.id, userCount: store.getState().users.data.length };
          }
          case 'entity_select': {
            const ids = args.target_ids || (args.target_id ? [args.target_id] : []);
            const valid = ids.filter((id: string) => st.users.data.some((u) => u.id === id));
            if (valid.length !== ids.length) return { error: 'one or more target ids not found' };
            dispatch(setSelection(valid)); return { result: `selected ${valid.length} row(s)` };
          }
          case 'entity_update': {
            const id = args.target_id; if (!id || !st.users.data.some((u) => u.id === id)) return { error: 'target_id not found' };
            const f = args.entity_fields || {}; const patch: any = {};
            if (f.name) { const [fn, ...rest] = String(f.name).split(' '); patch.firstName = fn; patch.lastName = rest.join(' ') || patch.lastName; }
            if (f.firstName !== undefined) patch.firstName = f.firstName; if (f.lastName !== undefined) patch.lastName = f.lastName;
            if (f.email !== undefined) patch.email = f.email; if (f.role !== undefined) { if (!ROLES.includes(f.role)) return { error: 'invalid role' }; patch.role = f.role; }
            if (f.status !== undefined) { if (!STATUSES.includes(f.status)) return { error: 'invalid status' }; patch.status = f.status; }
            if (f.payments !== undefined) patch.payments = Number(f.payments); if (f.products !== undefined) patch.products = Number(f.products);
            if (f['last-active'] !== undefined || f.lastActive !== undefined) patch.lastActive = f['last-active'] || f.lastActive;
            dispatch(patchUsers({ ids: [id], patch })); dispatch(setLastMutation(`Updated user ${id}`)); return { result: `updated user ${id}` };
          }
          case 'entity_delete': {
            const id = args.target_id; if (!id || !st.users.data.some((u) => u.id === id)) return { error: 'target_id not found' };
            if (args.confirm !== true) return { error: 'delete requires confirm=true' };
            dispatch(deleteUser(id)); dispatch(pushToast({ kind: 'success', title: 'User deleted', body: 'Removed via MCP' })); dispatch(setLastMutation(`Deleted user ${id}`)); return { result: `deleted user ${id}`, userCount: store.getState().users.data.length };
          }
          case 'artifact_export': {
            const fmt = (args.export_formats && args.export_formats[0]) || args.format || 'json';
            if (fmt !== 'json' && fmt !== 'csv') return { error: 'format must be json or csv' };
            dispatch(setExportTab(fmt)); dispatch(setExportOpen(true));
            const k = computeKpis(filterUsersForKpis(st.users.data, st.ui.filterRole, st.ui.filterStatus));
            return { result: `export preview set to ${fmt === 'json' ? 'Session JSON' : 'Users CSV'}: ${st.users.data.length} users, kpi total ${k.total}` };
          }
          case 'artifact_import': {
            const mode = (args.import_modes && args.import_modes[0]) || args.mode || (exportTabGuess(args.content) );
            const content = String(args.content ?? '');
            const res = mode === 'users-csv' ? importUsersCsv(content) : importSessionJson(content);
            if (!res.ok) return { error: res.message };
            dispatch(setUsers(res.users));
            if (res.applied) {
              dispatch(setFilterRole(res.applied.role || ''));
              dispatch(setFilterStatus(res.applied.status || ''));
              dispatch(setSort(res.applied.sort || 'newest'));
              dispatch(setTheme(res.applied.theme || 'dark'));
              if (res.applied.activeView) dispatch(setActiveView(res.applied.activeView as any));
            }
            return { result: `imported ${res.users.length} user(s) via ${mode}` };
          }
          case 'artifact_copy': {
            const fmt = (args.export_formats && args.export_formats[0]) || st.ui.exportTab;
            const t = fmt === 'csv' ? buildCsv(st.users.data) : JSON.stringify(buildSession(st.users.data, { role: st.ui.filterRole, status: st.ui.filterStatus, sort: st.ui.sort, theme: st.ui.theme, activeView: st.ui.activeView }), null, 2);
            try { await navigator.clipboard.writeText(t); } catch { /* ignore */ }
            dispatch(pushToast({ kind: 'success', title: 'Copied to clipboard', body: `${fmt === 'csv' ? 'Users CSV' : 'Session JSON'} copied (via MCP)` }));
            return { result: `copied ${fmt} preview (${t.length} chars)` };
          }
          default: return { error: `unknown tool ${name}` };
        }
      } catch (e: any) { return { error: e?.message || String(e) }; }
    };
    return () => { delete w.webmcp_session_info; delete w.webmcp_list_tools; delete w.webmcp_invoke_tool; };
  }, [dispatch]);
  return null;
}
function exportTabGuess(content: string) { return String(content || '').trim().startsWith('[') || String(content || '').trim().startsWith('{') ? 'session-json' : 'users-csv'; }

// ============================================================ App root
export default function App() {
  const dispatch = useDispatch();
  const { theme, accent, activeView } = useSelector((s: RootState) => s.ui);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.setAttribute('data-accent', accent); }, [accent]);
  const view = () => {
    switch (activeView) {
      case 'all-users': return <AllUsers />;
      case 'add-user': case 'edit-user': return <UserForm />;
      case 'roles': return <ExtraView title="Roles" kind="roles" />;
      case 'permissions': return <ExtraView title="Permissions" kind="permissions" />;
      case 'user-logs': return <ExtraView title="User Logs" kind="logs" />;
      case 'user-stats': return <ExtraView title="User Stats" kind="stats" />;
      case 'user-payments': return <ExtraView title="User Payments" kind="payments" />;
      case 'user-products': return <ExtraView title="User Products" kind="products" />;
      default: return <Overview />;
    }
  };
  return (
    <>
      <WebMCPBinder />
      <TooltipPortal />
      <div className="shell">
        <Sidebar />
        <main className="main-canvas">
          <Header />
          <div className="grid12">{view()}</div>
        </main>
      </div>
      <button className="fab" aria-label="Open export drawer" onClick={() => dispatch(setExportOpen(true))}><ArrowDownTrayIcon className="icon-md" /></button>
      <ExportDrawer />
      <Toasts />
      <ConfirmDialog />
    </>
  );
}
