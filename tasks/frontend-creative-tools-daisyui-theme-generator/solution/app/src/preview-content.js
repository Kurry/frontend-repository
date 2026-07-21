// Static markup for the three preview tabs. Everything is styled through the
// active theme's CSS custom properties (set on the stage), so a token edit
// re-themes every component instantly. No id attributes — the compare stage
// clones this markup.
import { COLOR_KEYS, SEMANTIC_NAMES } from './data.js';

const demoTab = `
<div class="pv-grid">
  <section class="pv-card pv-span2">
    <div class="pv-toolbar">
      <label class="pv-search">
        <span class="pv-search-icon" aria-hidden="true">&#8981;</span>
        <input class="pv-input" type="search" placeholder="Search components, tokens, docs" aria-label="Search components" />
      </label>
      <div class="pv-tags" role="group" aria-label="Filter tags">
        <button class="pv-chip pv-chip-on">All</button>
        <button class="pv-chip">Design</button>
        <button class="pv-chip">Development</button>
        <button class="pv-chip">Docs</button>
        <button class="pv-chip">Releases</button>
      </div>
    </div>
    <div class="pv-stats">
      <div class="pv-stat">
        <h3 class="pv-h">July Revenue</h3>
        <p class="pv-stat-num">$48,210</p>
        <p class="pv-trend pv-trend-up">&#9650; 12.4% vs June</p>
      </div>
      <div class="pv-stat">
        <h3 class="pv-h">Active Users</h3>
        <p class="pv-stat-num">8,912</p>
        <p class="pv-trend pv-trend-up">&#9650; 3.1% this week</p>
      </div>
      <div class="pv-stat">
        <h3 class="pv-h">Conversion Rate</h3>
        <p class="pv-stat-num">3.42%</p>
        <p class="pv-trend pv-trend-down">&#9660; 0.4% vs target</p>
      </div>
    </div>
  </section>

  <section class="pv-card">
    <h3 class="pv-h">Calendar</h3>
    <p class="pv-cal-month">July 2026</p>
    <ol class="pv-cal" aria-label="July 2026 calendar">
      ${['M','T','W','T','F','S','S'].map((d, i) => `<li class="pv-cal-dow" aria-hidden="true">${d}</li>`).join('')}
      ${Array.from({ length: 35 }, (_, i) => {
        const day = i - 2;
        const ev = { 8: 'pv-ev-a', 14: 'pv-ev-b', 21: 'pv-ev-a', 27: 'pv-ev-b' }[day] || '';
        return `<li class="pv-cal-day ${day === 14 ? 'pv-cal-today' : ''} ${day < 1 || day > 31 ? 'pv-cal-dim' : ''}">
          ${day >= 1 && day <= 31 ? day : ''}${ev ? `<span class="pv-cal-dot ${ev}" aria-hidden="true"></span>` : ''}
        </li>`;
      }).join('')}
    </ol>
    <ul class="pv-events">
      <li><span class="pv-cal-dot pv-ev-a" aria-hidden="true"></span> Design review — Jul 21, 10:00</li>
      <li><span class="pv-cal-dot pv-ev-b" aria-hidden="true"></span> Ship daisyUI 5.6 — Jul 24, 16:00</li>
    </ul>
  </section>

  <section class="pv-card">
    <h3 class="pv-h">Product Card</h3>
    <div class="pv-product">
      <div class="pv-product-img" role="img" aria-label="Aurora desk lamp in brushed brass">
        <span aria-hidden="true">&#128161;</span>
      </div>
      <div class="pv-product-body">
        <p class="pv-product-name">Aurora Desk Lamp</p>
        <p class="pv-product-meta">Brushed brass · 3 brightness levels</p>
        <div class="pv-product-row">
          <strong class="pv-price">$89.00</strong>
          <button class="pv-btn pv-btn-primary">Add to Cart</button>
        </div>
      </div>
    </div>
    <div class="pv-range">
      <label class="pv-range-label" for="pv-brightness">Brightness</label>
      <input class="pv-range-input" type="range" min="0" max="100" value="64" />
      <output class="pv-range-out">64%</output>
    </div>
  </section>

  <section class="pv-card">
    <h3 class="pv-h">Create Account</h3>
    <form class="pv-form" onsubmit="return false">
      <label class="pv-field">
        <span>Full name</span>
        <input class="pv-input" type="text" placeholder="Ada Lovelace" autocomplete="off" />
      </label>
      <label class="pv-field">
        <span>Email</span>
        <input class="pv-input" type="email" placeholder="ada@analytical.engine" autocomplete="off" />
      </label>
      <label class="pv-field">
        <span>Password</span>
        <input class="pv-input" type="password" placeholder="Minimum 12 characters" />
      </label>
      <div class="pv-check-row">
        <input class="pv-checkbox" type="checkbox" checked />
        <span>Send me the monthly changelog</span>
      </div>
      <button class="pv-btn pv-btn-primary pv-btn-wide" type="submit">Create Account</button>
    </form>
  </section>

  <section class="pv-card">
    <h3 class="pv-h">Workspace Usage</h3>
    <div class="pv-tabs-mini" role="group" aria-label="Usage views">
      <button class="pv-mini-tab pv-mini-on">Overview</button>
      <button class="pv-mini-tab">Activity</button>
      <button class="pv-mini-tab">Billing</button>
    </div>
    <div class="pv-radial-wrap">
      <div class="pv-radial" role="img" aria-label="Storage 72 percent used">
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle class="pv-radial-bg" cx="18" cy="18" r="15.9"></circle>
          <circle class="pv-radial-fg" cx="18" cy="18" r="15.9" stroke-dasharray="72, 100"></circle>
        </svg>
        <span class="pv-radial-num">72%</span>
      </div>
      <ul class="pv-usage">
        <li><span>Storage</span><strong>36.1 / 50 GB</strong></li>
        <li><span>Build minutes</span><strong>2,180 / 3,000</strong></li>
        <li><span>Seats</span><strong>9 / 12</strong></li>
      </ul>
    </div>
  </section>

  <section class="pv-card pv-span2">
    <h3 class="pv-h">Recent Orders</h3>
    <table class="pv-table">
      <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th class="pv-num">Total</th></tr></thead>
      <tbody>
        <tr><td>#3201</td><td>Mercado Studio</td><td><span class="pv-badge pv-badge-success">Paid</span></td><td class="pv-num">$1,240.00</td></tr>
        <tr><td>#3200</td><td>Northwind Labs</td><td><span class="pv-badge pv-badge-warning">Pending</span></td><td class="pv-num">$318.50</td></tr>
        <tr><td>#3199</td><td>Kestrel &amp; Co</td><td><span class="pv-badge pv-badge-success">Paid</span></td><td class="pv-num">$96.00</td></tr>
        <tr><td>#3198</td><td>Bluefin Freight</td><td><span class="pv-badge pv-badge-error">Refunded</span></td><td class="pv-num">$512.25</td></tr>
      </tbody>
    </table>
  </section>

  <section class="pv-card">
    <h3 class="pv-h">Team Chat</h3>
    <div class="pv-chat">
      <p class="pv-bubble pv-bubble-in">The new token grid shipped — primary reads much better on dark surfaces.</p>
      <p class="pv-bubble pv-bubble-out">Agreed. Merging the radius pass before the 5.6 cutoff.</p>
      <p class="pv-bubble pv-bubble-in">I'll draft the release notes tonight.</p>
    </div>
  </section>

  <section class="pv-card">
    <h3 class="pv-h">Deploy Log</h3>
    <div class="pv-terminal" role="log" aria-label="Mock terminal output">
      <p><span class="pv-term-prompt">$</span> daisyui theme build aurora</p>
      <p class="pv-term-dim">&#10003; 20 color tokens compiled</p>
      <p class="pv-term-dim">&#10003; radius + size scales written</p>
      <p><span class="pv-term-prompt">$</span> daisyui deploy --env production</p>
      <p class="pv-term-ok">&#9679; live at aurora.daisyui.example</p>
    </div>
  </section>

  <section class="pv-card pv-span2">
    <h3 class="pv-h">Pricing</h3>
    <div class="pv-plans">
      <div class="pv-plan">
        <p class="pv-plan-name">Starter</p>
        <p class="pv-plan-price">$0<span>/mo</span></p>
        <ul><li>3 saved themes</li><li>Community support</li><li>CSS + JSON export</li></ul>
        <button class="pv-btn pv-btn-outline">Start Free</button>
      </div>
      <div class="pv-plan pv-plan-hot">
        <p class="pv-plan-name">Pro</p>
        <p class="pv-plan-price">$12<span>/mo</span></p>
        <ul><li>Unlimited themes</li><li>Config export for CI</li><li>Contrast audits</li></ul>
        <button class="pv-btn pv-btn-primary">Upgrade to Pro</button>
      </div>
      <div class="pv-plan">
        <p class="pv-plan-name">Studio</p>
        <p class="pv-plan-price">$39<span>/mo</span></p>
        <ul><li>Team libraries</li><li>Shared token contracts</li><li>Priority support</li></ul>
        <button class="pv-btn pv-btn-outline">Contact Sales</button>
      </div>
    </div>
  </section>
</div>`;

const variantsTab = `
<div class="pv-grid">
  <section class="pv-card pv-span2">
    <h3 class="pv-h">Buttons</h3>
    <div class="pv-row">
      ${SEMANTIC_NAMES.map((n) => `<button class="pv-btn pv-btn-${n}">${n[0].toUpperCase() + n.slice(1)}</button>`).join('')}
    </div>
    <div class="pv-row">
      ${SEMANTIC_NAMES.slice(0, 4).map((n) => `<button class="pv-btn pv-btn-outline pv-btn-${n}">${n[0].toUpperCase() + n.slice(1)} Outline</button>`).join('')}
    </div>
    <div class="pv-row">
      <button class="pv-btn pv-btn-ghost">Ghost</button>
      <button class="pv-btn pv-btn-primary" disabled>Disabled</button>
      <button class="pv-btn pv-btn-neutral pv-btn-wide">Neutral Wide</button>
    </div>
  </section>
  <section class="pv-card">
    <h3 class="pv-h">Badges</h3>
    <div class="pv-row pv-wrap">
      ${SEMANTIC_NAMES.map((n) => `<span class="pv-badge pv-badge-${n}">${n}</span>`).join('')}
      <span class="pv-badge pv-badge-ghost">ghost</span>
    </div>
    <h3 class="pv-h pv-h2">Form Controls</h3>
    <div class="pv-row pv-wrap">
      <label class="pv-check-row"><input class="pv-checkbox" type="checkbox" checked /> Subscribed</label>
      <label class="pv-check-row"><input class="pv-checkbox" type="checkbox" /> Archived</label>
      <label class="pv-check-row"><input class="pv-toggle" type="checkbox" checked /> <span class="pv-toggle-ui" aria-hidden="true"></span> Notifications</label>
      <label class="pv-check-row"><input class="pv-toggle" type="checkbox" /> <span class="pv-toggle-ui" aria-hidden="true"></span> Beta features</label>
    </div>
  </section>
  <section class="pv-card pv-span2">
    <h3 class="pv-h">Alerts</h3>
    <div class="pv-alert pv-alert-info"><strong>Heads up:</strong> the 5.6 release train leaves Friday.</div>
    <div class="pv-alert pv-alert-success"><strong>Deployed:</strong> aurora theme is live in production.</div>
    <div class="pv-alert pv-alert-warning"><strong>Low contrast:</strong> warning content sits at 3.9:1 on this surface.</div>
    <div class="pv-alert pv-alert-error"><strong>Build failed:</strong> token --color-primary is missing a value.</div>
  </section>
  <section class="pv-card">
    <h3 class="pv-h">Inputs &amp; Selects</h3>
    <label class="pv-field"><span>Project</span><input class="pv-input" type="text" placeholder="theme-studio" /></label>
    <label class="pv-field"><span>Visibility</span>
      <select class="pv-input"><option>Private</option><option>Team</option><option>Public</option></select>
    </label>
    <label class="pv-field"><span>Progress</span><input class="pv-range-input" type="range" min="0" max="100" value="38" /></label>
  </section>
</div>`;

const paletteTab = `
<div class="pv-grid">
  <section class="pv-card pv-span2">
    <h3 class="pv-h">Token Swatches</h3>
    <div class="pv-swatches">
      ${COLOR_KEYS.map((k) => `
        <div class="pv-swatch" data-swatch="${k}">
          <span class="pv-swatch-chip"></span>
          <span class="pv-swatch-name">${k.replace('--color-', '')}</span>
          <code class="pv-swatch-hex"></code>
        </div>`).join('')}
    </div>
  </section>
  <section class="pv-card">
    <h3 class="pv-h">Token Relationships</h3>
    <p class="pv-diagram-note">Semantic faces derive their contrast from paired content tokens; everything rests on the base scale.</p>
    <svg class="pv-diagram" viewBox="0 0 260 240" role="img" aria-label="Diagram of base tokens feeding the eight semantic token pairs">
      ${[
        ['primary', 60, 60], ['secondary', 200, 60], ['accent', 60, 130], ['neutral', 200, 130],
        ['info', 60, 200], ['success', 130, 220], ['warning', 200, 200], ['error', 130, 30],
      ].map(([n, x, y]) => `<line class="pv-diagram-line" x1="130" y1="130" x2="${x}" y2="${y}"></line>`).join('')}
      ${[
        ['primary', 60, 60], ['secondary', 200, 60], ['accent', 60, 130], ['neutral', 200, 130],
        ['info', 60, 200], ['success', 130, 220], ['warning', 200, 200], ['error', 130, 30],
      ].map(([n, x, y]) => `<g><circle class="pv-diagram-node" data-node="${n}" cx="${x}" cy="${y}" r="11"></circle>
        <text x="${x}" y="${y + (y > 130 ? 24 : -18)}" text-anchor="middle" class="pv-diagram-label">${n}</text></g>`).join('')}
      <circle class="pv-diagram-node pv-diagram-base" cx="130" cy="130" r="15"></circle>
      <text x="130" y="158" text-anchor="middle" class="pv-diagram-label">base</text>
    </svg>
  </section>
</div>`;

export const PREVIEW_TABS = [
  { id: 'demo', label: 'Components Demo', html: demoTab },
  { id: 'variants', label: 'Component Variants', html: variantsTab },
  { id: 'palette', label: 'Color Palette', html: paletteTab },
];
