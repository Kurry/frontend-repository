import { cloneElement } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Chart, registerables } from 'chart.js';
import {
  HomeIcon, UsersIcon, Squares2X2Icon, CreditCardIcon, ShoppingBagIcon,
  UserGroupIcon, ChatBubbleLeftRightIcon, PhotoIcon, DocumentDuplicateIcon,
  BookOpenIcon, TicketIcon, ChartPieIcon, MegaphoneIcon, PuzzlePieceIcon,
  WrenchScrewdriverIcon, AdjustmentsHorizontalIcon, ChevronDownIcon,
  MagnifyingGlassIcon, SunIcon, MoonIcon, BellIcon, CommandLineIcon,
  Bars3Icon, XMarkIcon, UserCircleIcon, InboxIcon, Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon, PlusIcon, ArrowDownTrayIcon, ServerStackIcon,
  CurrencyDollarIcon, ShoppingCartIcon, ClockIcon, ShieldCheckIcon,
  ExclamationTriangleIcon, PresentationChartLineIcon, EnvelopeIcon, HeartIcon,
  GlobeAltIcon, TruckIcon, LockClosedIcon, BoltIcon, ArchiveBoxIcon,
  ArrowPathIcon, PencilSquareIcon, TrashIcon, DocumentArrowDownIcon,
  ClipboardDocumentIcon, CheckIcon, EllipsisHorizontalIcon, KeyIcon,
  FunnelIcon, ArrowUpTrayIcon, UserPlusIcon, BuildingOfficeIcon,
  CheckCircleIcon, EyeIcon, SignalIcon, CubeIcon
} from '@heroicons/react/24/outline';
import * as store from './store';
import { registerWebMcp } from './webmcp';

Chart.register(...registerables);

const pageSize = 6;
const destinationLabels = {
  'operations-overview': 'Operations overview', 'all-users': 'All users', 'add-user': 'Add user',
  roles: 'Roles', permissions: 'Permissions', 'user-logs': 'User logs', 'user-stats': 'User stats',
  'user-payments': 'User payments', 'user-products': 'User products', 'archive-vault': 'Archive',
  'export-drawer': 'Export directory'
};

function ChartCanvas({ type = 'line', data, options = {}, className = '' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const signature = JSON.stringify({ type, data, options, theme: store.theme.value });
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    chartRef.current?.destroy();
    const light = store.theme.value === 'light';
    chartRef.current = new Chart(canvas, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 320 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false, labels: { color: light ? '#475569' : '#cbd5e1' } },
          tooltip: { backgroundColor: light ? '#172033' : '#eef4f8', titleColor: light ? '#fff' : '#111827', bodyColor: light ? '#dbeafe' : '#334155', padding: 10, cornerRadius: 8 },
          ...options.plugins
        },
        scales: options.scales ?? {
          x: { display: false, grid: { display: false } },
          y: { display: false, grid: { display: false }, beginAtZero: true }
        },
        ...options
      }
    });
    return () => chartRef.current?.destroy();
  }, [signature]);
  return <canvas ref={ref} className={className} />;
}

const iconForGroup = {
  Products: Squares2X2Icon, Transactions: CreditCardIcon, Orders: ShoppingBagIcon,
  Customers: UserGroupIcon, Messages: ChatBubbleLeftRightIcon, Media: PhotoIcon,
  Pages: DocumentDuplicateIcon, Blog: BookOpenIcon, Promotions: TicketIcon,
  Analytics: ChartPieIcon, Marketing: MegaphoneIcon, Plugins: PuzzlePieceIcon,
  Tools: WrenchScrewdriverIcon, Settings: AdjustmentsHorizontalIcon
};

const userChildren = [
  ['all-users','All users'],['add-user','Add user'],['roles','Roles'],['permissions','Permissions'],
  ['user-logs','User logs'],['user-stats','User stats'],['user-payments','User payments'],
  ['user-products','User products'],['archive-vault','Archive']
];
const otherGroups = Object.keys(iconForGroup);

function Sidebar() {
  const open = store.sidebarGroup.value;
  const current = store.activeView.value;
  const setGroup = (name) => store.sidebarGroup.value = open === name ? null : name;
  return <>
    {store.sidebarOpen.value && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => store.sidebarOpen.value = false} />}
    <aside className={`sidebar ${store.sidebarOpen.value ? 'open' : ''}`} aria-label="Primary navigation">
      <div className="brand"><span className="brand-mark"><GlobeAltIcon className="icon" /></span>Pineapple Tech</div>
      <nav className="sidebar-nav">
        <button className={`nav-btn ${current === 'operations-overview' ? 'active' : ''}`} onClick={() => store.setView('operations-overview')}>
          <HomeIcon className="icon" /><span>Dashboard</span>
        </button>
        <button className={`nav-btn ${open === 'Users' ? 'open' : ''}`} aria-expanded={open === 'Users'} onClick={() => setGroup('Users')}>
          <UsersIcon className="icon" /><span>Users</span><ChevronDownIcon className="icon-sm chev" />
        </button>
        {open === 'Users' && <div className="nav-children">
          {userChildren.map(([id,label]) => <button key={id} className={`nav-btn nav-child ${current === id ? 'active' : ''}`} onClick={() => store.setView(id)}>{label}</button>)}
        </div>}
        {otherGroups.map((name) => {
          const Icon = iconForGroup[name];
          return <div key={name}>
            <button className={`nav-btn ${open === name ? 'open' : ''}`} aria-expanded={open === name} onClick={() => setGroup(name)}>
              <Icon className="icon" /><span>{name}</span>{name === 'Messages' && <span className="pill">4</span>}<ChevronDownIcon className="icon-sm chev" />
            </button>
            {open === name && <div className="nav-children"><button className="nav-btn nav-child" onClick={() => store.setView(`module-${name.toLowerCase()}`)}>Overview</button></div>}
          </div>;
        })}
      </nav>
      <div className="account-wrap">
        <span className="online" aria-label="Online" />
        <button className="account-btn" aria-expanded={store.accountMenuOpen.value} onClick={() => store.accountMenuOpen.value = !store.accountMenuOpen.value}>
          <img className="avatar" src="/avatars/ari.svg" alt="Ari Lane" /><span><strong style={{display:'block',fontSize:13}}>Ari Lane</strong><small className="muted">Admin</small></span><ChevronDownIcon className="icon-sm" style={{marginLeft:'auto'}} />
        </button>
        {store.accountMenuOpen.value && <div className="popover up" role="menu">
          <MenuButton icon={UserCircleIcon} label="Profile settings" />
          <MenuButton icon={BookOpenIcon} label="Docs" />
          <MenuButton icon={KeyIcon} label="API settings" />
          <MenuButton icon={ArrowRightStartOnRectangleIcon} label="Logout" />
        </div>}
      </div>
    </aside>
  </>;
}

function MenuButton({ icon: Icon, label, badge }) {
  return <button className="menu-row" role="menuitem" onClick={() => { store.resetTransientMenus(); store.toast.value = `${label} selected`; }}><Icon className="icon" />{label}{badge && <span className="pill" style={{marginLeft:'auto'}}>{badge}</span>}</button>;
}

const notifications = [
  ['/avatars/mina.svg','New message','Mina asked about directory access'],
  ['/avatars/arman.svg','Reminder','Quarterly access review is due'],
  ['/avatars/nora.svg','New payment','$640 received from Northstar'],
  ['/avatars/ari.svg','New payment','$8,180 settled successfully']
];

function Header({ commandTriggerRef, exportTriggerRef }) {
  const label = destinationLabels[store.activeView.value] || 'Workspace';
  return <header className="utility-header">
    <button className="icon-btn hamburger" aria-label="Open navigation" onClick={() => store.sidebarOpen.value = true}><Bars3Icon className="icon" /></button>
    <div className="page-title-top">{label}</div>
    <label className="header-search">
      <MagnifyingGlassIcon className="icon-sm muted" />
      <input aria-label="Search users" placeholder="Search users" autoComplete="off" value={store.searchQuery.value} onInput={(e) => { store.searchQuery.value = e.currentTarget.value; store.page.value = 1; }} />
    </label>
    <button ref={commandTriggerRef} className="command-button" onClick={() => store.commandOpen.value = true} aria-label="Open Command palette"><CommandLineIcon className="icon-sm" /><span>Command palette</span><span className="kbd">⌘ K</span></button>
    {store.lastMutationLabel.value && <span className="mutation-chip" aria-live="polite">{store.lastMutationLabel.value}</span>}
    <button className="icon-btn" aria-label={`Switch to ${store.theme.value === 'dark' ? 'light' : 'dark'} theme`} onClick={() => store.setTheme(store.theme.value === 'dark' ? 'light' : 'dark')}>
      {store.theme.value === 'dark' ? <MoonIcon className="icon theme-icon" /> : <SunIcon className="icon theme-icon" />}
    </button>
    <div className="relative">
      <button className="icon-btn" aria-label="Open notifications" aria-expanded={store.notificationsOpen.value} onClick={() => { store.notificationsOpen.value = !store.notificationsOpen.value; store.profileMenuOpen.value = false; }}><BellIcon className="icon" /><span className="dot-error" /></button>
      {store.notificationsOpen.value && <div className="popover notifications" role="menu">
        <div style={{display:'flex',justifyContent:'space-between',padding:'7px 10px 5px'}}><strong style={{fontSize:13}}>Notifications</strong><span className="badge">4 new</span></div>
        {notifications.map(([src,title,copy]) => <button key={copy} className="menu-row notify-row" onClick={() => store.notificationsOpen.value = false}><img src={src} alt="" /><span><strong style={{display:'block',fontSize:12}}>{title}</strong><small className="muted">{copy}</small></span></button>)}
      </div>}
    </div>
    <div className="relative">
      <button className="icon-btn" aria-label="Open profile menu" aria-expanded={store.profileMenuOpen.value} onClick={() => { store.profileMenuOpen.value = !store.profileMenuOpen.value; store.notificationsOpen.value = false; }}><img className="avatar header-avatar" src="/avatars/ari.svg" alt="Ari Lane" /></button>
      {store.profileMenuOpen.value && <div className="popover" role="menu">
        <MenuButton icon={UserCircleIcon} label="Profile" /><MenuButton icon={InboxIcon} label="Inbox" badge="6" /><MenuButton icon={Cog6ToothIcon} label="Settings" /><MenuButton icon={ArrowRightStartOnRectangleIcon} label="Logout" />
      </div>}
    </div>
    <button ref={exportTriggerRef} className="icon-btn" aria-label="Export directory" onClick={() => store.openExport('json')}><DocumentArrowDownIcon className="icon" /></button>
  </header>;
}

function Breadcrumb({ current }) {
  return <div className="breadcrumb"><button onClick={() => store.setView('operations-overview')}>Dashboard</button><span>›</span><span>{current}</span></div>;
}

const overviewBars = [37,42,45,43,54,60,66,70,75,82,78,91,101,108,116,122,130,143];

function OperationsOverview() {
  const lineData = (values, color = '#dff3fa') => ({ labels: values.map((_,i)=>i+1), datasets:[{data:values,borderColor:color,borderWidth:2.5,tension:.28,pointRadius:0,fill:false}] });
  return <main className="content">
    <Breadcrumb current="Operations overview" />
    <div className="page-head"><div><h1>Operations overview</h1><p>Commerce performance, service posture, and platform signals.</p></div><div className="actions">
      <button className="btn btn-primary"><PlusIcon className="icon-sm" />New product</button>
      <button className="btn" onClick={() => store.openExport('json')}><ArrowDownTrayIcon className="icon-sm" />Export</button>
      <button className="btn"><ServerStackIcon className="icon-sm" />System health</button>
    </div></div>
    <section className="card overview-stats">
      {[
        ['Revenue','$842K','+12.8% vs prior period',CurrencyDollarIcon],['Orders','18.2K','624 awaiting fulfillment',ShoppingCartIcon],
        ['Active users',`${Math.round(store.kpis.value.active * 35.5)}K`,'24.8K new this month',UsersIcon],['Support SLA','94.2%','7 high-priority threads',ChatBubbleLeftRightIcon]
      ].map(([a,b,c,I]) => <div className="overview-stat" key={a}><small>{a}</small><strong>{b}</strong><span>{c}</span><I className="icon" /></div>)}
    </section>
    <section className="mosaic">
      <OverviewCard span="8" title="Revenue and demand" subtitle="Commerce revenue, product demand, and checkout activity" icon={PresentationChartLineIcon} action="Open sales analytics">
        <div className="bars">{overviewBars.map((n,i)=><i key={i} style={{height:`${n/1.5}px`}} title={`Period ${i+1}: $${n}K`} />)}</div>
        <div className="metric-row"><div><strong>$842K</strong><span className="muted">Revenue</span></div><div><strong>18.2K</strong><span className="muted">Orders</span></div><div><strong>4.8%</strong><span className="muted">Checkout lift</span></div></div>
      </OverviewCard>
      <OverviewCard span="4" title="Order status" subtitle="Current order volume by fulfillment stage" icon={ShoppingBagIcon} action="Open orders">
        <div className="chart-wrap small"><ChartCanvas type="doughnut" data={{labels:['Delivered','In progress','Returns','Held'],datasets:[{data:[68,16,9,7],backgroundColor:['#09c8b8','#f97316','#ffb65e','#f15d79'],borderWidth:4,borderColor:store.theme.value==='dark'?'#191c20':'#fff'}]}} options={{cutout:'62%',plugins:{legend:{display:false}}}} /></div>
        <div className="metric-row"><div><strong>9,482</strong><span className="muted">Delivered</span></div><div><strong>1,820</strong><span className="muted">In progress</span></div></div>
      </OverviewCard>
      <OverviewCard span="7" title="Recent commerce activity" icon={Squares2X2Icon} action="All orders">
        <div className="table-scroll"><table className="activity-table"><thead><tr><th>Record</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead><tbody>
          {[['Order #12092','Mina Park','Refund review','$124,735'],['Transaction #TRX-8842','Arman Bell','Paid','$8,180'],['Return #RET-221','Nora Quinn','Received','$640'],['Checkout #CHK-492','Tessa Cole','Abandoned','$420']].map(r=><tr key={r[0]}>{r.map((c,i)=><td key={c}>{i===2?<span className={`badge ${c==='Abandoned'?'Suspended':''}`}>{c}</span>:c}</td>)}</tr>)}
        </tbody></table></div>
      </OverviewCard>
      <OverviewCard span="5" title="Governance and risk" subtitle="Payment, data access, security, and compliance posture" icon={ShieldCheckIcon}>
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:'-48px'}}><div className="ring" style={{'--p':91}}><span>91%</span></div></div>
        <Progress label="Gateway verification" value={96} /><Progress label="Admin permission review" value={84} /><Progress label="Webhook signing coverage" value={78} />
      </OverviewCard>
      <OverviewCard span="6" title="Priority queue" icon={ExclamationTriangleIcon} action="7 queued">
        {[['Refund review: order #PS5-248','Accidental 248 PlayStation 5 order, partial refund ready','Support'],['Media processor backlog','5K derivatives waiting, storage is healthy','Ops'],['Plugin updates','6 updates available, 2 security related','Platform'],['Warehouse cutoff risk','West dock needs 84 labels before 5 PM','Orders']].map(([a,b,c])=><div className="queue-row" key={a}><span className="queue-icon"><SignalIcon className="icon-sm" /></span><span><strong style={{display:'block',fontSize:12}}>{a}</strong><small className="muted">{b}</small></span><span className="pill">{c}</span></div>)}
      </OverviewCard>
      <OverviewCard span="6" title="Revenue run rate" subtitle="Daily booked revenue across storefront, invoices, and subscriptions" icon={PresentationChartLineIcon} inverse action="$1.04M forecast">
        <div className="bars">{[70,76,84,74,93,105,110,115,127,136,148,144,155,165].map((n,i)=><i key={i} style={{height:`${n}px`,opacity:.92}} title={`Day ${i+1}: $${n}K`} />)}</div>
        <div className="metric-row"><div><strong>$842K</strong><span className="muted">Booked</span></div><div><strong>$197K</strong><span className="muted">Pipeline</span></div><div><strong>18.6%</strong><span className="muted">Margin lift</span></div></div>
      </OverviewCard>
      <OverviewCard span="4" title="Acquisition mix" subtitle="Sessions by top marketing channel" icon={ChartPieIcon} action="Traffic analytics">
        <div className="chart-wrap small"><ChartCanvas type="doughnut" data={{labels:['Organic','Direct','Email','Referral'],datasets:[{data:[42,25,17,16],backgroundColor:['#09c8b8','#fbc33d','#25b8ef','#f15d79'],borderWidth:4,borderColor:store.theme.value==='dark'?'#191c20':'#fff'}]}} options={{cutout:'56%'}} /></div>
      </OverviewCard>
      <OverviewCard span="4" title="Marketing performance" subtitle="Email and automation revenue movement" icon={EnvelopeIcon} action="Open email studio">
        <div className="chart-wrap small"><ChartCanvas data={lineData([20,31,25,39,48,44,59,54,70,63,79,72,88])} /></div><div className="metric-row"><div><strong>42.8%</strong><span className="muted">Open rate</span></div><div><strong>$118K</strong><span className="muted">Attributed</span></div></div>
      </OverviewCard>
      <OverviewCard span="4" title="Promotions health" icon={TicketIcon} action="Manage offers"><Progress label="Coupon margin" value={72}/><Progress label="Gift card redemption" value={56}/><Progress label="Fraud pressure" value={11}/><Progress label="Offer health" value={88}/></OverviewCard>
      <OverviewCard span="4" title="Infrastructure uptime" subtitle="Last 24 hours across public services" icon={GlobeAltIcon} action="Open uptime">
        <Uptime label="Storefront" value="100%" /><Uptime label="API" value="99.9%" alert />
      </OverviewCard>
      <OverviewCard span="4" title="Satisfaction" subtitle="Retention, refunds, satisfaction, and service workload" icon={HeartIcon} action="Customer center">
        <div style={{display:'flex',gap:16,alignItems:'center',margin:'16px 0'}}><div className="ring" style={{'--p':86}}><span>86%</span></div><div className="muted" style={{fontSize:12}}>Customer health remains above the quarterly baseline.</div></div>
        <MetricLine a="Net revenue retention" b="112%"/><MetricLine a="Refund pressure" b="3.8%"/><MetricLine a="VIP escalations" b="14"/><MetricLine a="Stock on hand" b="42,800"/>
      </OverviewCard>
      <OverviewCard span="4" title="Inventory pressure" icon={ArchiveBoxIcon} action="Inventory board"><Progress label="Low stock · 42 SKUs" value={42}/><Progress label="Oversold · 7 SKUs" value={7}/><Progress label="Healthy stock · 1,284 SKUs" value={91}/></OverviewCard>
      <OverviewCard span="6" title="Plugin and tool status" icon={PuzzlePieceIcon} action="Plugins"><table className="activity-table"><thead><tr><th>Component</th><th>Status</th><th>Signal</th></tr></thead><tbody>{[['Fraud Shield','Active','426 coupon blocks'],['Media Optimizer','Update','Backlog impact'],['Backup Vault','Active','Last snapshot 18m ago'],['Import queue','Ready','3 validated files']].map(r=><tr key={r[0]}><td>{r[0]}</td><td><span className="pill">{r[1]}</span></td><td>{r[2]}</td></tr>)}</tbody></table></OverviewCard>
      <OverviewCard span="6" title="Fulfillment throughput" subtitle="Packed, shipped, returned, and delayed order movement" icon={TruckIcon}>
        <div className="chart-wrap small"><ChartCanvas data={lineData([16,22,31,28,42,53,61,55,67,78,88,81,94,103,109])}/></div><div className="metric-row"><div><strong>9,482</strong><span className="muted">Packed</span></div><div><strong>624</strong><span className="muted">Queued</span></div><div><strong>118</strong><span className="muted">Returns</span></div></div>
      </OverviewCard>
      <OverviewCard span="4" title="Automation coverage" icon={BoltIcon} action="Automation center"><p className="section-sub" style={{margin:'24px 0'}}>Campaigns, refunds, imports, and fulfillment tasks handled automatically.</p><Progress label="Email flows" value={82}/><Progress label="Scheduled jobs" value={68}/></OverviewCard>
      <OverviewCard span="4" title="Security watch" icon={LockClosedIcon} action="Audit logs"><div className="card" style={{padding:16,marginTop:18,boxShadow:'none'}}><small className="muted"><i className="status-ping"/>Blocked attempts</small><strong style={{display:'block',fontSize:21}}>1,284</strong><small className="muted">-8% from yesterday</small><hr style={{border:0,borderTop:'1px dashed var(--line)',margin:'15px -16px'}}/><small className="muted">Risky sessions</small><strong style={{display:'block',fontSize:21}}>4</strong></div></OverviewCard>
      <OverviewCard span="4" title="Cash movement" icon={CreditCardIcon} action="Transactions">{[['In','$428K captured','Card, wallet, and invoice payments'],['Hold','$22K under review','Gateway disputes and fraud checks'],['Out','$18K refunds','Approved returns and adjustments']].map(([a,b,c])=><div className="queue-row" key={a}><span className="pill">{a}</span><span><strong style={{display:'block',fontSize:12}}>{b}</strong><small className="muted">{c}</small></span></div>)}</OverviewCard>
    </section>
  </main>;
}

function OverviewCard({ span, title, subtitle, icon: Icon, action, inverse, children }) {
  return <article className={`card overview-card span-${span} ${inverse?'inverse':''}`}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><h2 className="card-title"><Icon className="icon" />{title}</h2>{subtitle&&<p className="section-sub">{subtitle}</p>}</div>{action&&<button className="btn btn-sm">{action}</button>}</div>{children}</article>;
}
function Progress({label,value}) { return <div className="progress-item"><div className="progress-label"><span>{label}</span><span>{value}%</span></div><div className="progress-line"><i style={{width:`${value}%`}}/></div></div>; }
function Uptime({label,value,alert}) { return <div style={{marginTop:50}}><div className="progress-label"><span>{label}</span><span>{value}</span></div><div className="uptime-bars">{Array.from({length:12},(_,i)=><i key={i} className={alert&&i===2?'alert':''}/>)}</div></div>; }
function MetricLine({a,b}) { return <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginTop:12}}><span>{a}</span><strong>{b}</strong></div>; }

function KpiCard({ label, value, color }) {
  const seed = [6,7,6,9,10,9,12,value];
  const max = Math.max(...seed, 1);
  const points = seed.map((point, pointIndex) => `${pointIndex * 14.25},${38 - (point / max) * 32}`).join(' ');
  return <article className="card kpi-card"><div><small>{label}</small><strong>{value}</strong></div><svg className="spark" viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label={`${label} trend chart ending at ${value}`}><polyline points={points} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke"/><circle cx="99.75" cy={38 - (value / max) * 32} r="3" fill={color}/></svg></article>;
}

function UsersShell({ children, title, subtitle, actions = true }) {
  return <main className="content"><Breadcrumb current={title}/><div className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div>{actions&&<div className="actions"><button className="btn" onClick={() => store.importOpen.value = true}><ArrowUpTrayIcon className="icon-sm"/>Import directory</button><button className="btn" onClick={() => store.openExport('json')}><DocumentArrowDownIcon className="icon-sm"/>Export directory</button><button className="btn btn-primary" onClick={() => {store.editUserId.value=null;store.duplicateSourceId.value=null;store.setView('add-user')}}><UserPlusIcon className="icon-sm"/>Add user</button></div>}</div>{children}</main>;
}

function AllUsers() {
  const rows = store.visibleUsers.value;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  if (store.page.value > pages) store.page.value = pages;
  const current = rows.slice((store.page.value-1)*pageSize,store.page.value*pageSize);
  const selected = store.selection.value;
  const allCurrent = current.length > 0 && current.every((u)=>selected.has(u.id));
  const bulkDisabled = selected.size === 0;
  return <UsersShell title="All users" subtitle="Manage access, lifecycle status, and customer value from one live directory.">
    <section className="users-kpis" aria-label="User KPIs">
      <KpiCard label="Total" value={store.kpis.value.total} color="#25b8ef"/><KpiCard label="Active" value={store.kpis.value.active} color="#09c8b8"/><KpiCard label="Paying" value={store.kpis.value.paying} color="#f5b941"/><KpiCard label="Suspended" value={store.kpis.value.suspended} color="#f15d79"/>
    </section>
    <div className="card filterbar">
      <FunnelIcon className="icon-sm muted"/>
      <select className="select" aria-label="Filter by role" value={store.filters.value.role||''} onChange={(e)=>store.setRoleFilter(e.currentTarget.value)}><option value="">All roles</option>{store.ROLES.map(r=><option key={r}>{r}</option>)}</select>
      <select className="select" aria-label="Filter by status" value={store.filters.value.status||''} onChange={(e)=>store.setStatusFilter(e.currentTarget.value)}><option value="">All statuses</option>{store.STATUSES.map(s=><option key={s}>{s}</option>)}</select>
      <select className="select" aria-label="Sort users" value={store.sort.value} onChange={(e)=>store.setSort(e.currentTarget.value)}><option value="last-active">Last active</option><option value="newest">Newest</option><option value="highest-spend">Highest spend</option><option value="name-az">Name A-Z</option></select>
      {(store.filters.value.role||store.filters.value.status||store.searchQuery.value)&&<button className="btn btn-sm btn-ghost" onClick={store.clearFilters}>Clear filters</button>}
      <span className="toolbar-sep"/>
      <button className="btn btn-sm" onClick={()=>store.openExport('csv')}><DocumentArrowDownIcon className="icon-sm"/>Export</button>
      <button className="btn btn-sm" disabled={bulkDisabled} onClick={()=>store.bulkDialog.value='status'}>Change status</button>
      <button className="btn btn-sm" disabled={bulkDisabled} onClick={()=>store.bulkDialog.value='role'}>Change role</button>
      <button className="btn btn-sm btn-danger" disabled={bulkDisabled} onClick={()=>store.archiveUsers([...selected])}><TrashIcon className="icon-sm"/>Delete</button>
      <span className="selection-copy">{selected.size} selected · {rows.length} matching</span>
    </div>
    <section className="card table-card" aria-label="Users list">
      {current.length ? <div className="table-scroll"><table className="table data-table"><thead><tr><th><input className="checkbox" type="checkbox" aria-label="Select all users on this page" checked={allCurrent} onChange={(e)=>current.forEach(u=>store.toggleSelection(u.id,e.currentTarget.checked))}/></th><th>User</th><th>Role</th><th>Status</th><th>Payments</th><th>Products</th><th>Last active</th><th>Actions</th></tr></thead><tbody>
        {current.map((u)=><UserRow key={u.id} user={u}/>)}</tbody></table></div> : <EmptyUsers filtered={store.users.value.length>0}/>} 
      <div className="pagination"><span>Showing {current.length ? (store.page.value-1)*pageSize+1 : 0}–{Math.min(store.page.value*pageSize,rows.length)} of {rows.length}</span><div className="join"><button className="btn btn-sm" disabled={store.page.value===1} onClick={()=>store.page.value--}>Previous</button>{Array.from({length:pages},(_,i)=><button key={i} className={`btn btn-sm ${store.page.value===i+1?'active':''}`} onClick={()=>store.page.value=i+1}>{i+1}</button>)}<button className="btn btn-sm" disabled={store.page.value===pages} onClick={()=>store.page.value++}>Next</button></div></div>
    </section>
  </UsersShell>;
}

function UserRow({user}) {
  return <tr><td><input className="checkbox" type="checkbox" aria-label={`Select ${user.firstName} ${user.lastName}`} checked={store.selection.value.has(user.id)} onChange={(e)=>store.toggleSelection(user.id,e.currentTarget.checked)}/></td>
    <td><div className="user-cell"><span className="user-avatar">{user.firstName[0]}{user.lastName[0]}</span><span><strong>{user.firstName} {user.lastName}</strong><small>{user.email}</small></span></div></td>
    <td><span className={`badge ${user.role}`}>{user.role}</span></td><td><span className={`badge ${user.status}`}>{user.status}</span></td><td>${user.payments.toLocaleString()}</td><td>{user.products}</td><td className="muted">{user.lastActive}</td>
    <td><div className="row-actions"><button className="btn btn-sm btn-ghost" aria-label={`Edit ${user.firstName}`} onClick={()=>{store.editUserId.value=user.id;store.duplicateSourceId.value=null;store.setView('add-user')}}><PencilSquareIcon className="icon-sm"/>Edit</button><button className="btn btn-sm btn-ghost" aria-label={`Duplicate ${user.firstName}`} onClick={()=>{store.duplicateSourceId.value=user.id;store.editUserId.value=null;store.setView('add-user')}}><DocumentDuplicateIcon className="icon-sm"/>Duplicate</button><button className="btn btn-sm btn-ghost btn-danger" aria-label={`Delete ${user.firstName}`} onClick={()=>store.archiveUsers([user.id])}><TrashIcon className="icon-sm"/>Delete</button></div></td></tr>;
}

function EmptyUsers({filtered}) { return <div className="empty"><div><div className="empty-icon"><UsersIcon className="icon"/></div><h3>{filtered?'No users match these filters':'The active directory is empty'}</h3><p className="muted">{filtered?'Clear the filters or search to see more directory records.':'Add a user or restore one from Archive to repopulate this list.'}</p><button className="btn btn-primary" onClick={()=>filtered?store.clearFilters():store.setView('add-user')}>{filtered?'Clear filters':'Add user'}</button></div></div>; }

const defaultUser = {firstName:'',lastName:'',email:'',phone:'',notes:'',temporaryPassword:'',accountSegment:'External',role:'Member',status:'Active',sendInvitation:false,twoFactorEnabled:false,productAccess:true,permissions:['users.read']};

function UserForm() {
  const editing = store.editUserId.value ? store.users.value.find(u=>u.id===store.editUserId.value) : null;
  const source = store.duplicateSourceId.value ? store.users.value.find(u=>u.id===store.duplicateSourceId.value) : null;
  const mode = editing ? 'edit' : source ? 'duplicate' : 'add';
  // Restore the saved draft when this view mounts without subscribing the
  // entire form component to every draft write; react-hook-form owns live edits.
  const draft = store.formDraft.peek();
  const draftValues = draft && draft.mode === mode && draft.editId === (editing?.id ?? null) && draft.sourceId === (source?.id ?? null)
    ? draft.values
    : null;
  const defaults = draftValues || (editing ? {...editing,temporaryPassword:''} : source ? {...source,id:undefined,email:'',temporaryPassword:'',status:'Invited',sendInvitation:true} : defaultUser);
  const schema = editing ? store.userEditSchema : store.userCreateSchema;
  const {register,handleSubmit,formState:{errors,isSubmitting,isValid},watch} = useForm({resolver:zodResolver(schema),mode:'onChange',defaultValues:defaults});
  const lock = useRef(false);
  useEffect(() => {
    const sub = watch((values) => {
      store.formDraft.value = {
        mode,
        editId: editing?.id ?? null,
        sourceId: source?.id ?? null,
        values
      };
    });
    return () => sub.unsubscribe();
  }, [watch, mode, editing?.id, source?.id]);
  const submit = (data) => {
    if(lock.current)return; lock.current=true;
    try { editing ? store.updateUser(editing.id,data) : store.createUser(data); store.formDraft.value = null; store.setView('all-users'); }
    catch(error){ store.toast.value=error.message; }
    finally { setTimeout(()=>lock.current=false,400); }
  };
  const onInvalid = (invalidFields) => {
    store.toast.value = Object.values(invalidFields).map(e=>e?.message).filter(Boolean).join('. ') || 'Fix the highlighted fields before submitting.';
  };
  const title = editing ? 'Edit user' : source ? 'Duplicate user' : 'Add user';
  return <UsersShell title={title} subtitle={editing?'Update this API-shaped directory record.':source?'Create an invited user from an existing profile.':'Create an API-shaped directory record with validated access settings.'} actions={false}>
    <form className="card form-card" onSubmit={handleSubmit(submit, onInvalid)} noValidate>
      <div className="form-section"><h3>Profile</h3><p>Identity and contact information used throughout the directory.</p><div className="form-grid">
        <Field label="First name" name="firstName" error={errors.firstName?.message}><input className="input" autoComplete="off" {...register('firstName')}/></Field>
        <Field label="Last name" name="lastName" error={errors.lastName?.message}><input className="input" autoComplete="off" {...register('lastName')}/></Field>
        <Field label="Email" name="email" error={errors.email?.message}><input className="input" type="email" autoComplete="off" {...register('email')}/></Field>
        <Field label="Phone" name="phone" error={errors.phone?.message}><input className="input" inputMode="numeric" autoComplete="off" {...register('phone')}/></Field>
        <Field full label="Notes" name="notes" error={errors.notes?.message}><textarea className="textarea" maxLength="281" autoComplete="off" {...register('notes')}/></Field>
      </div></div>
      <div className="form-section"><h3>Access</h3><p>Invitation credentials and account relationship.</p><div className="form-grid">
        <Field label={`Temporary password${editing?' (optional)':''}`} name="temporaryPassword" error={errors.temporaryPassword?.message}><input className="input" type="password" autoComplete="new-password" {...register('temporaryPassword')}/></Field>
        <Field label="Account segment" name="accountSegment" error={errors.accountSegment?.message}><select className="select" autoComplete="off" {...register('accountSegment')}>{store.SEGMENTS.map(s=><option key={s}>{s}</option>)}</select></Field>
        <label className="check-row full"><input className="checkbox" type="checkbox" {...register('sendInvitation')}/>Send invitation after creating this user</label>
      </div></div>
      <div className="form-section"><h3>Account settings</h3><p>Lifecycle, role, and account protections.</p><div className="form-grid">
        <Field label="Status" name="status" error={errors.status?.message}><select className="select" autoComplete="off" {...register('status')}>{store.STATUSES.map(s=><option key={s}>{s}</option>)}</select></Field>
        <Field label="Role" name="role" error={errors.role?.message}><select className="select" autoComplete="off" {...register('role')}>{store.ROLES.map(r=><option key={r}>{r}</option>)}</select></Field>
        <label className="check-row"><input className="checkbox" type="checkbox" {...register('twoFactorEnabled')}/>Require two-factor authentication</label>
        <label className="check-row"><input className="checkbox" type="checkbox" {...register('productAccess')}/>Enable product access</label>
      </div></div>
      <div className="form-section"><h3>Permissions</h3><p>Only declared permission IDs can be included in the payload.</p><div className="check-grid">
        {store.PERMISSIONS.map(p=><label className="check-row" key={p}><input className="checkbox" type="checkbox" value={p} {...register('permissions')}/>{p}</label>)}
      </div><div className="field-error" role="status">{errors.permissions?.message}</div></div>
      <div className="form-actions"><button className="btn" type="button" onClick={()=>{store.formDraft.value=null;store.setView('all-users')}}>Cancel</button><button className="btn btn-primary" type="submit" disabled={!isValid||isSubmitting}>{editing?'Save changes':'Create user'}</button></div>
      <div className="sr-only" aria-live="polite">{Object.values(errors).map(e=>e?.message).filter(Boolean).join('. ')}</div>
    </form>
  </UsersShell>;
}

function Field({label,name,error,full,children}) { return <div className={`field ${full?'full':''}`}><label htmlFor={name}>{label}</label>{children && cloneElement(children,{id:name,'aria-invalid':!!error,'aria-describedby':`${name}-error`})}<span id={`${name}-error`} className="field-error">{error}</span></div>; }

function ArchiveView() {
  return <UsersShell title="Archive" subtitle="A quiet vault for soft-deleted directory records.">
    <section className="card">{store.archive.value.length?store.archive.value.map(u=><div className="archive-row" key={u.id}><span className="user-avatar">{u.firstName[0]}{u.lastName[0]}</span><div><strong>{u.firstName} {u.lastName}</strong><p>{u.email} · Archived {u.archivedAt?new Date(u.archivedAt).toLocaleString():'this session'}</p></div><div className="actions"><button className="btn btn-sm" onClick={()=>store.restoreUser(u.id)}><ArrowPathIcon className="icon-sm"/>Restore</button></div></div>):<div className="empty"><div><div className="empty-icon"><ArchiveBoxIcon className="icon"/></div><h3>Archive is empty</h3><p className="muted">Users archived from All users will appear here with a Restore action.</p><button className="btn" onClick={()=>store.setView('all-users')}>View all users</button></div></div>}</section>
  </UsersShell>;
}

function LogsView() { return <UsersShell title="User logs" subtitle="A live feed generated by every directory mutation."><section className="card">{store.activityLog.value.map(log=><div className="log-row" key={log.id}><span className="log-dot"><ClockIcon className="icon-sm"/></span><span><p>{log.action}</p><small>{log.target}</small></span><small>{new Date(log.timestamp).toLocaleString()}</small></div>)}</section></UsersShell>; }

function AdditionalMode({mode}) {
  const config={
    roles:['Roles','Role assignments across the shared directory.',['Role','Members','Active','Access level']],
    permissions:['Permissions','Permission coverage and account safeguards.',['User','Permission IDs','2FA','Segment']],
    'user-stats':['User stats','Engagement and lifecycle signals.',['User','Status','Last active','Products']],
    'user-payments':['User payments','Customer value from the same active collection.',['User','Role','Payments','Status']],
    'user-products':['User products','Product access and portfolio coverage.',['User','Access','Products','Segment']]
  }[mode];
  const [title,subtitle,heads]=config;
  return <UsersShell title={title} subtitle={subtitle}><div className="card filterbar"><MagnifyingGlassIcon className="icon-sm muted"/><input className="input" aria-label={`Filter ${title}`} placeholder={`Filter ${title.toLowerCase()}`} onInput={(e)=>store.searchQuery.value=e.currentTarget.value}/><span className="selection-copy">{store.visibleUsers.value.length} records</span></div><section className="card table-card"><div className="table-scroll"><table className="data-table"><thead><tr>{heads.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{store.visibleUsers.value.map(u=><tr key={u.id}>{mode==='roles'?<><td><span className={`badge ${u.role}`}>{u.role}</span></td><td>{store.users.value.filter(x=>x.role===u.role).length}</td><td>{u.status}</td><td>{u.accountSegment}</td></>:mode==='permissions'?<><td>{u.firstName} {u.lastName}</td><td>{u.permissions.join(', ')}</td><td>{u.twoFactorEnabled?'Enabled':'Optional'}</td><td>{u.accountSegment}</td></>:mode==='user-payments'?<><td>{u.firstName} {u.lastName}</td><td>{u.role}</td><td>${u.payments.toLocaleString()}</td><td><span className={`badge ${u.status}`}>{u.status}</span></td></>:mode==='user-products'?<><td>{u.firstName} {u.lastName}</td><td>{u.productAccess?'Enabled':'Disabled'}</td><td>{u.products}</td><td>{u.accountSegment}</td></>:<><td>{u.firstName} {u.lastName}</td><td><span className={`badge ${u.status}`}>{u.status}</span></td><td>{u.lastActive}</td><td>{u.products}</td></>}</tr>)}</tbody></table></div></section></UsersShell>;
}

function GenericModule({name}) { return <main className="content"><Breadcrumb current={name}/><div className="page-head"><div><h1>{name}</h1><p>This workspace is connected to the same operations shell.</p></div></div><section className="card empty"><div><div className="empty-icon"><CubeIcon className="icon"/></div><h3>{name} overview</h3><p className="muted">Choose Dashboard or Users to continue the directory workflow.</p><button className="btn" onClick={()=>store.setView('operations-overview')}>Operations overview</button></div></section></main>; }

function BulkDialog() {
  const type=store.bulkDialog.value;
  const schema=type==='status'?z.object({status:z.enum(store.STATUSES)}):z.object({role:z.enum(store.ROLES)});
  const {register,handleSubmit,formState:{isValid}}=useForm({resolver:zodResolver(schema),mode:'onChange',defaultValues:type==='status'?{status:''}:{role:''}});
  if(!type)return null;
  const submit=(data)=>{store.bulkUpdate([...store.selection.value],data);store.bulkDialog.value=null;};
  return <div className="overlay" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)store.bulkDialog.value=null}}><form className="modal-card" role="dialog" aria-modal="true" onSubmit={handleSubmit(submit)}><div className="modal-head"><div><h2>Change {type}</h2><p>Update {store.selection.value.size} selected users.</p></div><button type="button" className="icon-btn" aria-label="Close" onClick={()=>store.bulkDialog.value=null}><XMarkIcon className="icon"/></button></div><Field label={type==='status'?'Status':'Role'} name="bulk-choice"><select id="bulk-choice" className="select" {...register(type)}><option value="">Choose {type}</option>{(type==='status'?store.STATUSES:store.ROLES).map(v=><option key={v}>{v}</option>)}</select></Field><div className="form-actions"><button type="button" className="btn" onClick={()=>store.bulkDialog.value=null}>Cancel</button><button className="btn btn-primary" disabled={!isValid}>Update users</button></div></form></div>;
}

function ImportModal() {
  const schema=z.object({mode:z.enum(['directory-json','users-csv']),text:z.string().min(1,'payload is required')});
  const {register,handleSubmit,watch,formState:{errors,isValid}}=useForm({resolver:zodResolver(schema),mode:'onChange',defaultValues:{mode:store.importMode.value,text:store.importDraft.value}});
  const mode=watch('mode');
  useEffect(()=>{store.importMode.value=mode},[mode]);
  const close=()=>{store.importOpen.value=false;store.importError.value=''};
  return <div className="overlay" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)close()}}><form className="modal-card" role="dialog" aria-modal="true" aria-label="Import directory" onSubmit={handleSubmit((data)=>{store.importDraft.value=data.text;store.importDirectory(data.text,data.mode)})}><div className="modal-head"><div><h2>Import directory</h2><p>Paste a validated directory artifact. Invalid payloads never mutate the store.</p></div><button type="button" className="icon-btn" aria-label="Close import" onClick={close}><XMarkIcon className="icon"/></button></div><div className="field"><label htmlFor="import-mode">Import mode</label><select id="import-mode" className="select" {...register('mode')}><option value="directory-json">Directory JSON</option><option value="users-csv">Users CSV</option></select><span className="field-error">{errors.mode?.message}</span></div><div className="field" style={{marginTop:12}}><label htmlFor="import-text">{mode==='directory-json'?'Directory JSON':'Users CSV'} text</label><textarea id="import-text" className="textarea" style={{minHeight:260,fontFamily:'ui-monospace,monospace',fontSize:11}} {...register('text')} onInput={(e)=>{register('text').onChange(e);store.importDraft.value=e.currentTarget.value;store.importError.value=''}}/><span className="field-error" aria-live="polite">{errors.text?.message||store.importError.value}</span></div><div className="form-actions"><button className="btn" type="button" onClick={close}>Cancel</button><button className="btn btn-primary" disabled={!isValid}>Import directory</button></div></form></div>;
}

function useFocusTrap(open, containerRef, close, returnRef) {
  useEffect(()=>{
    if(!open)return;
    const node=containerRef.current; const first=node?.querySelector('input,button,select,textarea,[tabindex]:not([tabindex="-1"])'); first?.focus();
    const onKey=(e)=>{if(e.key==='Escape'){e.preventDefault();close();setTimeout(()=>returnRef?.current?.focus(),0)}if(e.key==='Tab'&&node){const items=[...node.querySelectorAll('input,button,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled);if(!items.length)return;const a=items[0],b=items.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}}};
    document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);
  },[open]);
}

const commands=[
  ['all-users','All users','Navigate'],['archive-vault','Archive','Navigate'],['operations-overview','Operations overview','Navigate'],['export-drawer','Export directory','Artifact'],['toggle-theme','Toggle theme','Appearance']
];
function CommandPalette({triggerRef}) {
  const ref=useRef(null); const filtered=commands.filter(([,label])=>label.toLowerCase().includes(store.commandQuery.value.toLowerCase()));
  const close=()=>{store.commandOpen.value=false;store.commandQuery.value=''}; useFocusTrap(true,ref,close,triggerRef);
  const choose=(id)=>{close();if(id==='export-drawer')store.openExport('json');else if(id==='toggle-theme')store.setTheme(store.theme.value==='dark'?'light':'dark');else store.setView(id)};
  return <div className="overlay" onMouseDown={(e)=>{if(e.target===e.currentTarget)close()}}><div ref={ref} className="modal-card command-card" role="dialog" aria-modal="true" aria-label="Command palette"><div className="command-search"><MagnifyingGlassIcon className="icon"/><input aria-label="Search Command palette" placeholder="Type a command…" value={store.commandQuery.value} onInput={(e)=>store.commandQuery.value=e.currentTarget.value}/><span className="kbd">ESC</span></div><div className="command-list">{filtered.map(([id,label,kind])=><button className="command-item" key={id} onClick={()=>choose(id)}>{id==='export-drawer'?<DocumentArrowDownIcon className="icon"/>:id==='toggle-theme'?<SunIcon className="icon"/>:<CommandLineIcon className="icon"/>}<span>{label}</span><small>{kind}</small></button>)}{!filtered.length&&<div className="empty" style={{minHeight:130}}><span className="muted">No matching commands</span></div>}</div></div></div>;
}

function ExportDrawer({triggerRef}) {
  const ref=useRef(null); const returnTarget=useRef(window.__lastExportTrigger||triggerRef.current); const close=()=>store.exportOpen.value=false; useFocusTrap(true,ref,close,returnTarget);
  const text=store.exportTab.value==='json'?store.jsonPreview.value:store.csvPreview.value;
  const copy=async()=>{try{await navigator.clipboard.writeText(text);store.toast.value=`${store.exportTab.value==='json'?'Directory JSON':'Users CSV'} copied to the clipboard`;}catch{store.toast.value='Copy is unavailable; select the preview text manually';}};
  const download=()=>{const blob=new Blob([text],{type:store.exportTab.value==='json'?'application/json':'text/csv'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=store.exportTab.value==='json'?'pineapple-directory.json':'pineapple-users.csv';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);store.toast.value=`${link.download} was downloaded`;};
  return <><div className="drawer-backdrop" onClick={close}/><aside ref={ref} className="export-drawer" role="dialog" aria-modal="true" aria-label="Export directory"><div className="drawer-head"><div><h2>Export directory</h2><p>Live artifacts compiled from this session’s shared store.</p></div><button className="icon-btn" aria-label="Close export drawer" onClick={close}><XMarkIcon className="icon"/></button></div><div className="export-summary"><div className="summary-chip"><small>Active users</small><strong>{store.users.value.length}</strong></div><div className="summary-chip"><small>Archived</small><strong>{store.archive.value.length}</strong></div><div className="summary-chip"><small>Log entries</small><strong>{store.activityLog.value.length}</strong></div></div><div className="tabs" role="tablist"><button className={`tab ${store.exportTab.value==='json'?'active':''}`} onClick={()=>store.exportTab.value='json'} role="tab">Directory JSON</button><button className={`tab ${store.exportTab.value==='csv'?'active':''}`} onClick={()=>store.exportTab.value='csv'} role="tab">Users CSV</button></div><pre className="preview" tabIndex="0">{text}</pre><div className="drawer-actions"><button className="btn" onClick={copy}><ClipboardDocumentIcon className="icon-sm"/>Copy</button><button className="btn btn-primary" onClick={download}><ArrowDownTrayIcon className="icon-sm"/>Download</button></div></aside></>;
}

function CurrentView({view}) {
  if(view==='operations-overview')return <OperationsOverview/>;
  if(view==='all-users')return <AllUsers/>;
  if(view==='add-user')return <UserForm/>;
  if(view==='archive-vault')return <ArchiveView/>;
  if(view==='user-logs')return <LogsView/>;
  if(['roles','permissions','user-stats','user-payments','user-products'].includes(view))return <AdditionalMode mode={view}/>;
  return <GenericModule name={(view.replace('module-','').replaceAll('-',' ')).replace(/^./,c=>c.toUpperCase())}/>;
}

export default function App() {
  store.uiEpoch.value;
  const activeView=store.activeView.value;
  const commandTriggerRef=useRef(null),exportTriggerRef=useRef(null);
  useEffect(()=>{document.documentElement.dataset.theme=store.theme.value},[store.theme.value]);
  useEffect(()=>{const key=(e)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();store.commandOpen.value=true}if(e.key==='Escape'){store.resetTransientMenus();if(store.importOpen.value)store.importOpen.value=false;if(store.bulkDialog.value)store.bulkDialog.value=null}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[]);
  useEffect(()=>{if(!store.toast.value)return;const timer=setTimeout(()=>store.toast.value='',2600);return()=>clearTimeout(timer)},[store.toast.value]);
  useEffect(()=>registerWebMcp(),[]);
  const rememberExportTrigger=(event)=>{const button=event.target.closest?.('button');if(!button)return;const label=`${button.textContent} ${button.getAttribute('aria-label')||''}`;if(/export/i.test(label))window.__lastExportTrigger=button.closest('.command-card')?commandTriggerRef.current:button;};
  return <div className="app-shell" onClickCapture={rememberExportTrigger}><Sidebar/><div className="main"><Header commandTriggerRef={commandTriggerRef} exportTriggerRef={exportTriggerRef}/><CurrentView key={activeView} view={activeView}/></div>{store.commandOpen.value&&<CommandPalette triggerRef={commandTriggerRef}/>} {store.exportOpen.value&&<ExportDrawer triggerRef={exportTriggerRef}/>} {store.importOpen.value&&<ImportModal/>}<BulkDialog/>{store.toast.value&&<div className="toast-live" role="status" aria-live="polite"><CheckCircleIcon className="icon-sm" style={{display:'inline',marginRight:7}}/>{store.toast.value}</div>}<div className="sr-only" aria-live="polite">{store.toast.value}</div></div>;
}
