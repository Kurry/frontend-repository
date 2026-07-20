import { signal, computed } from '@preact/signals';
import { HomeIcon, UserGroupIcon, Bars3Icon, UserCircleIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon, BellIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'preact/hooks';

export const theme = signal('light');
export const activeView = signal('all-users');
export const sidebarOpen = signal(true);

const users = signal([
  { id: 1, name: 'Alice Smith', email: 'alice@example.com', role: 'Admin', status: 'Active', payments: 1200, products: 4, lastActive: '2h ago' },
  { id: 2, name: 'Bob Jones', email: 'bob@example.com', role: 'Manager', status: 'Active', payments: 800, products: 2, lastActive: '1d ago' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Member', status: 'Invited', payments: 0, products: 0, lastActive: 'Never' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Viewer', status: 'Suspended', payments: 50, products: 1, lastActive: '1mo ago' },
  { id: 5, name: 'Evan Davis', email: 'evan@example.com', role: 'Member', status: 'Active', payments: 400, products: 1, lastActive: '5m ago' },
  { id: 6, name: 'Fiona Gallagher', email: 'fiona@example.com', role: 'Manager', status: 'Active', payments: 2000, products: 5, lastActive: '1w ago' },
  { id: 7, name: 'George Harrison', email: 'george@example.com', role: 'Viewer', status: 'Active', payments: 150, products: 1, lastActive: '2d ago' },
  { id: 8, name: 'Hannah Abbott', email: 'hannah@example.com', role: 'Member', status: 'Active', payments: 900, products: 3, lastActive: '3h ago' }
]);

const userLogs = signal([]);
const archive = signal([]);

// Destinations actually rendered by the main canvas (see <main> below). The
// WebMCP contract declares a wider set of bindable destinations than this
// build implements views for; browse_open must fail honestly for the rest
// rather than swap in a destination nothing renders.
const IMPLEMENTED_VIEWS = ['operations-overview', 'all-users', 'add-user'];

// Single source of truth for theme changes so the `data-theme` attribute
// never lags the signal: writing it here (not only inside a React effect,
// which is deferred to the next commit) keeps it synchronous with every
// caller, including the WebMCP bridge.
function setTheme(value) {
  theme.value = value;
  document.documentElement.dataset.theme = value;
}

function logActivity(action, detail) {
  userLogs.value = [...userLogs.value, { id: Date.now(), action, detail, timestamp: new Date().toISOString() }];
}

// Shared by the Add User form and the entity_create/form_submit WebMCP tools
// so every entry point produces the same record shape. `name` lets callers
// that only collect a single display name (entity_create's declared fields
// have no first/last split) skip the firstName/lastName split honestly
// instead of forcing blank values into the record.
function createUser({ firstName, lastName, name, email, role, status, temporaryPassword, accountSegment }) {
  const fullName = name ?? [firstName, lastName].filter(Boolean).join(' ');
  const user = {
    id: Date.now(),
    firstName,
    lastName,
    name: fullName,
    email,
    role,
    status,
    temporaryPassword,
    accountSegment,
    payments: 0,
    products: 0,
    lastActive: 'Just now'
  };
  users.value = [...users.value, user];
  logActivity('create', `Created user ${user.name}`);
  return user;
}

// Shared by the row Delete button and the entity_delete WebMCP tool.
function deleteUser(id) {
  const deleted = users.value.find(u => String(u.id) === String(id));
  if (!deleted) return null;
  users.value = users.value.filter(u => String(u.id) !== String(id));
  archive.value = [...archive.value, deleted];
  logActivity('delete', `Archived user ${deleted.name}`);
  return deleted;
}

export function App() {
  useEffect(() => {
    document.documentElement.dataset.theme = theme.value;
  }, [theme.value]);

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" checked={sidebarOpen.value} onChange={e => sidebarOpen.value = e.target.checked} />
      <div className="drawer-content flex flex-col min-h-screen">
        <header className="navbar bg-base-100 border-b border-base-200">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer" className="btn btn-square btn-ghost">
              <Bars3Icon className="h-5 w-5" />
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold px-4">Pineapple Tech Dashboard</h1>
          </div>
          <div className="flex-none gap-2">
            <button className="btn btn-ghost btn-circle" onClick={() => setTheme(theme.value === 'light' ? 'dark' : 'light')}>
              {theme.value === 'light' ? '🌙' : '☀️'}
            </button>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle">
                <div className="indicator">
                  <BellIcon className="h-5 w-5" />
                  <span className="badge badge-xs badge-primary indicator-item"></span>
                </div>
              </label>
            </div>
          </div>
        </header>

        <main className="p-6 flex-1">
          {activeView.value === 'operations-overview' && <OperationsOverview />}
          {activeView.value === 'all-users' && <AllUsers />}
          {activeView.value === 'add-user' && <AddUser />}
        </main>
      </div>
      <div className="drawer-side">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
          <li className="menu-title">Pineapple Tech</li>
          <li>
            <a onClick={() => activeView.value = 'operations-overview'} className={activeView.value === 'operations-overview' ? 'active' : ''}>
              <HomeIcon className="h-5 w-5" /> Dashboard
            </a>
          </li>
          <li>
            <details open>
              <summary><UserGroupIcon className="h-5 w-5" /> Users</summary>
              <ul>
                <li><a onClick={() => activeView.value = 'all-users'} className={activeView.value === 'all-users' ? 'active' : ''}>All Users</a></li>
                <li><a onClick={() => activeView.value = 'add-user'} className={activeView.value === 'add-user' ? 'active' : ''}>Add User</a></li>
                <li><a>Roles</a></li>
                <li><a>Permissions</a></li>
                <li><a>User Logs</a></li>
                <li><a>User Stats</a></li>
                <li><a>User Payments</a></li>
                <li><a>User Products</a></li>
                <li><a>Archive</a></li>
              </ul>
            </details>
          </li>
          <div className="mt-auto absolute bottom-4 w-full pr-8">
            <div className="flex items-center gap-3 p-2 bg-base-300 rounded-box cursor-pointer">
               <UserCircleIcon className="h-10 w-10 text-base-content" />
               <div>
                  <div className="font-bold">Ari Lane</div>
                  <div className="text-xs opacity-70">Admin</div>
               </div>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
}

function OperationsOverview() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Operations Overview</h2>
      <div className="stats shadow w-full mb-6">
        <div className="stat">
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value">$842K</div>
          <div className="stat-desc">↗︎ 400 (22%)</div>
        </div>
        <div className="stat">
          <div className="stat-title">New Users</div>
          <div className="stat-value">4,200</div>
          <div className="stat-desc">↗︎ 400 (22%)</div>
        </div>
        <div className="stat">
          <div className="stat-title">Active Sessions</div>
          <div className="stat-value">1,200</div>
          <div className="stat-desc">↘︎ 90 (14%)</div>
        </div>
      </div>
    </div>
  );
}

function AllUsers() {
  const activeCount = computed(() => users.value.filter(u => u.status === 'Active').length);
  const payingCount = computed(() => users.value.filter(u => u.payments > 0).length);
  const suspendedCount = computed(() => users.value.filter(u => u.status === 'Suspended').length);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">All Users</h2>
        <button className="btn btn-primary btn-sm" onClick={() => activeView.value = 'add-user'}>Add User</button>
      </div>

      <div className="stats shadow w-full mb-6">
        <div className="stat">
          <div className="stat-title">Total Users</div>
          <div className="stat-value">{users.value.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Active</div>
          <div className="stat-value">{activeCount.value}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Paying</div>
          <div className="stat-value">{payingCount.value}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Suspended</div>
          <div className="stat-value">{suspendedCount.value}</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box border border-base-200">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Payments</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.value.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="font-bold">{user.name}</div>
                  <div className="text-sm opacity-50">{user.email}</div>
                </td>
                <td><span className="badge badge-ghost">{user.role}</span></td>
                <td>
                  <span className={`badge ${user.status === 'Active' ? 'badge-success' : user.status === 'Suspended' ? 'badge-error' : 'badge-warning'}`}>
                    {user.status}
                  </span>
                </td>
                <td>${user.payments}</td>
                <td>{user.products}</td>
                <td>
                  <button className="btn btn-xs btn-ghost text-error" onClick={() => deleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.value.length === 0 && (
          <div className="text-center p-8 opacity-50">No users found.</div>
        )}
      </div>
    </div>
  );
}

function AddUser() {
  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    createUser({
      firstName: fd.get('firstName'),
      lastName: fd.get('lastName'),
      email: fd.get('email'),
      role: fd.get('role'),
      status: fd.get('status'),
      temporaryPassword: fd.get('temporaryPassword'),
      accountSegment: fd.get('accountSegment')
    });

    activeView.value = 'all-users';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Add User</h2>
      <form className="space-y-6" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">First Name</label>
            <input name="firstName" required minLength={1} maxLength={40} type="text" className="input input-bordered" />
          </div>
          <div className="form-control">
            <label className="label">Last Name</label>
            <input name="lastName" required minLength={1} maxLength={40} type="text" className="input input-bordered" />
          </div>
        </div>
        <div className="form-control">
          <label className="label">Email</label>
          <input name="email" required type="email" pattern=".*@.*\..*" className="input input-bordered" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">Role</label>
            <select name="role" className="select select-bordered" required>
              <option>Admin</option>
              <option>Manager</option>
              <option>Member</option>
              <option>Viewer</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label">Status</label>
            <select name="status" className="select select-bordered" required>
              <option>Active</option>
              <option>Invited</option>
              <option>Suspended</option>
            </select>
          </div>
        </div>
        <div className="form-control">
          <label className="label">Temporary Password</label>
          <input name="temporaryPassword" required minLength={8} type="password" className="input input-bordered" />
        </div>
        <div className="form-control">
          <label className="label">Account Segment</label>
          <select name="accountSegment" className="select select-bordered" required>
            <option>Internal</option>
            <option>Partner</option>
            <option>External</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => activeView.value = 'all-users'}>Cancel</button>
          <button type="submit" className="btn btn-primary">Add User</button>
        </div>
      </form>
    </div>
  );
}

// Basic WebMCP bindings
window.webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1",
  modules: [
    "browse-query-v1",
    "entity-collection-v1",
    "form-workflow-v1",
    "artifact-transfer-v1"
  ]
});

window.webmcp_list_tools = () => [
  { name: "browse_open", description: "Open a destination" },
  { name: "browse_apply_filter", description: "Apply a filter" },
  { name: "browse_clear_filter", description: "Clear a filter" },
  { name: "browse_sort", description: "Sort list" },
  { name: "browse_set_theme", description: "Set theme" },
  { name: "entity_create", description: "Create user" },
  { name: "entity_select", description: "Select user" },
  { name: "entity_update", description: "Update user" },
  { name: "entity_delete", description: "Delete user" },
  { name: "entity_toggle", description: "Toggle user selection" },
  { name: "form_validate", description: "Validate form" },
  { name: "form_submit", description: "Submit form" },
  { name: "form_cancel", description: "Cancel form" },
  { name: "artifact_export", description: "Export data" },
  { name: "artifact_import", description: "Import data" },
  { name: "artifact_copy", description: "Copy data" }
];

// value_bounds from the WebMCP contract, mirrored from the same enums/lengths
// the Add User <select>/<input> elements enforce via HTML constraints below.
const ROLE_VALUES = ['Admin', 'Manager', 'Member', 'Viewer'];
const STATUS_VALUES = ['Active', 'Invited', 'Suspended'];
const ACCOUNT_SEGMENT_VALUES = ['Internal', 'Partner', 'External'];
const EMAIL_PATTERN = /.*@.*\..*/;

// Contract-shaped tool calls (entity.create, form.submit) send a `fields`
// object keyed by the declared kebab-case field names, not top-level
// camelCase args -- reading args.firstName directly silently produces
// undefined values and diverging records from the visible form.
function readFields(args) {
  const fields = args.fields;
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new Error('"fields" must be an object of field-name/value pairs.');
  }
  return fields;
}

function requireField(fields, key, { minLength, maxLength, enumValues, pattern } = {}) {
  const value = fields[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`"${key}" is required.`);
  }
  if (minLength !== undefined && value.length < minLength) {
    throw new Error(`"${key}" must be at least ${minLength} characters.`);
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new Error(`"${key}" must be at most ${maxLength} characters.`);
  }
  if (pattern && !pattern.test(value)) {
    throw new Error(`"${key}" is not a valid value.`);
  }
  if (enumValues && !enumValues.includes(value)) {
    throw new Error(`"${key}" must be one of: ${enumValues.join(', ')}.`);
  }
  return value;
}

function optionalField(fields, key, { enumValues } = {}) {
  const value = fields[key];
  if (value === undefined) return undefined;
  if (enumValues && !enumValues.includes(value)) {
    throw new Error(`"${key}" must be one of: ${enumValues.join(', ')}.`);
  }
  return value;
}

window.webmcp_invoke_tool = (name, args = {}) => {
  // Every branch below calls the same handler the visible UI uses, and every
  // unimplemented tool/destination throws instead of reporting fake success
  // (the contract explicitly forbids WebMCP success paths with no UI-visible
  // effect; the stdio bridge turns a thrown Error into an isError response).
  if (name === 'browse_open') {
    // browse-query-v1's browse.open operation takes a single `destination`
    // string (see packages/webmcp-contracts browse-query-v1.ts) -- the
    // Bindings list names the declared value set "Destinations" (plural),
    // but the per-call argument key itself is singular.
    const destination = args.destination;
    if (!IMPLEMENTED_VIEWS.includes(destination)) {
      throw new Error(`Destination "${destination}" has no rendered view in this build.`);
    }
    activeView.value = destination;
    return { status: "success", result: { activeView: destination } };
  }

  if (name === 'browse_set_theme') {
    // Same singular-key rule as browse_open: the operation arg is `theme`,
    // not the plural "Themes" binding-set name.
    if (args.theme !== 'light' && args.theme !== 'dark') {
      throw new Error(`Unknown theme "${args.theme}".`);
    }
    setTheme(args.theme);
    return { status: "success", result: { theme: theme.value } };
  }

  if (name === 'entity_create') {
    // entity_fields (declared bindings) is name/email/role/status/payments/
    // products/last-active -- no first/last split and no password/segment,
    // so this path honestly creates a lighter record than the full Add User
    // form; it never fabricates those missing fields.
    const fields = readFields(args);
    const user = createUser({
      name: requireField(fields, 'name', { minLength: 1, maxLength: 80 }),
      email: requireField(fields, 'email', { pattern: EMAIL_PATTERN }),
      role: optionalField(fields, 'role', { enumValues: ROLE_VALUES }),
      status: optionalField(fields, 'status', { enumValues: STATUS_VALUES })
    });
    return { status: "success", result: user };
  }

  if (name === 'entity_delete') {
    if (args.confirm !== true) {
      throw new Error('Delete requires confirm=true.');
    }
    const deleted = deleteUser(args.id);
    if (!deleted) {
      throw new Error(`No user with id "${args.id}".`);
    }
    return { status: "success", result: deleted };
  }

  if (name === 'form_submit' && activeView.value === 'add-user') {
    // Same required/bounds/enum checks as the Add User form's HTML
    // constraints (required, minLength/maxLength, pattern, <select> enums)
    // so MCP and UI validation cannot diverge.
    const fields = readFields(args);
    const user = createUser({
      firstName: requireField(fields, 'first-name', { minLength: 1, maxLength: 40 }),
      lastName: requireField(fields, 'last-name', { minLength: 1, maxLength: 40 }),
      email: requireField(fields, 'email', { pattern: EMAIL_PATTERN }),
      role: requireField(fields, 'role', { enumValues: ROLE_VALUES }),
      status: requireField(fields, 'status', { enumValues: STATUS_VALUES }),
      temporaryPassword: requireField(fields, 'temporary-password', { minLength: 8 }),
      accountSegment: requireField(fields, 'account-segment', { enumValues: ACCOUNT_SEGMENT_VALUES })
    });
    activeView.value = 'all-users';
    return { status: "success", result: user };
  }

  if (name === 'form_cancel' && activeView.value === 'add-user') {
    activeView.value = 'all-users';
    return { status: "success" };
  }

  throw new Error(`"${name}" is not implemented in this build.`);
};
