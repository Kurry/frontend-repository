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
            <button className="btn btn-ghost btn-circle" onClick={() => theme.value = theme.value === 'light' ? 'dark' : 'light'}>
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
                  <button className="btn btn-xs btn-ghost text-error" onClick={() => {
                    const deleted = users.value.find(u => u.id === user.id);
                    users.value = users.value.filter(u => u.id !== user.id);
                    archive.value = [...archive.value, deleted];
                  }}>Delete</button>
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
    const firstName = fd.get('firstName');
    const lastName = fd.get('lastName');
    const email = fd.get('email');
    const role = fd.get('role');
    const status = fd.get('status');

    users.value = [...users.value, {
      id: Date.now(),
      name: `${firstName} ${lastName}`,
      email,
      role,
      status,
      payments: 0,
      products: 0,
      lastActive: 'Just now'
    }];

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

window.webmcp_invoke_tool = (name, args) => {
  if (name === 'browse_open' && args.destinations) {
    activeView.value = args.destinations;
    return { status: "success" };
  }
  if (name === 'browse_set_theme' && args.themes) {
    theme.value = args.themes;
    return { status: "success" };
  }
  if (name === 'entity_create') {
     // Simplified mock
     users.value = [...users.value, { ...args, id: Date.now() }];
     return { status: "success" };
  }
  return { status: "success", result: "mock action " + name };
};
