<script>
  import { activeTheme, colorBlindMode, compareMode, previewTab, snapshotTheme, styleString } from './stores.js';

  $: theme = ($compareMode && $snapshotTheme) ? $snapshotTheme : $activeTheme;
  $: afterTheme = $activeTheme;
  $: filter = {
    None: 'none',
    Protanopia: 'url(#cb-protanopia)',
    Deuteranopia: 'url(#cb-deuteranopia)',
    Tritanopia: 'url(#cb-tritanopia)',
  }[$colorBlindMode] || 'none';

  const palette = [
    ['Base 100', 'base-100'], ['Base 200', 'base-200'], ['Base 300', 'base-300'], ['Base content', 'base-content'],
    ['Primary', 'primary'], ['Primary content', 'primary-content'], ['Secondary', 'secondary'], ['Secondary content', 'secondary-content'],
    ['Accent', 'accent'], ['Accent content', 'accent-content'], ['Neutral', 'neutral'], ['Neutral content', 'neutral-content'],
    ['Info', 'info'], ['Info content', 'info-content'], ['Success', 'success'], ['Success content', 'success-content'],
    ['Warning', 'warning'], ['Warning content', 'warning-content'], ['Error', 'error'], ['Error content', 'error-content'],
  ];
  const orders = [['Charlie Chapman', 'Sent', 'info'], ['Howard Hudson', 'Failed', 'error'], ['Fiona Fisher', 'In progress', 'warning'], ['Nick Nelson', 'Completed', 'success'], ['Amanda Anderson', 'Completed', 'success']];
  const bars = [18, 30, 16, 38, 34, 30, 22, 37, 50, 56, 67, 75, 53, 42, 60, 90, 105, 125];
</script>

<svg aria-hidden="true" width="0" height="0" style="position:absolute">
  <filter id="cb-protanopia" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/></filter>
  <filter id="cb-deuteranopia" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>
  <filter id="cb-tritanopia" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/></filter>
</svg>

<main class="preview-panel" aria-label="Live theme preview">
  <div class="preview-toolbar">
    <div>
      <span class="eyebrow">Live preview</span>
      <h2>{$previewTab === 'demo' ? 'Components Demo' : $previewTab === 'variants' ? 'Component Variants' : 'Color Palette'}</h2>
    </div>
    <div class="preview-tabs tabs tabs-box" role="tablist" aria-label="Preview view">
      <button type="button" class="tab" class:tab-active={$previewTab === 'demo'} role="tab" aria-selected={$previewTab === 'demo'} on:click={() => previewTab.set('demo')} title="Components Demo">▦ <span>Demo</span></button>
      <button type="button" class="tab" class:tab-active={$previewTab === 'variants'} role="tab" aria-selected={$previewTab === 'variants'} on:click={() => previewTab.set('variants')} title="Component Variants">☷ <span>Variants</span></button>
      <button type="button" class="tab" class:tab-active={$previewTab === 'palette'} role="tab" aria-selected={$previewTab === 'palette'} on:click={() => previewTab.set('palette')} title="Color Palette">◒ <span>Palette</span></button>
    </div>
  </div>

  {#if $compareMode && $snapshotTheme}
    <div class="compare-banner" role="status">Before / After comparison</div>
    <div class="compare-grid">
      <div class="compare-pane">
        <h3>Before</h3>
        <div class="preview-canvas" data-theme={$snapshotTheme.name} style={`${styleString($snapshotTheme)};filter:${filter}`} class:depth={!!$snapshotTheme.depth} class:noise={!!$snapshotTheme.noise}>
          <div class="palette-grid compact">
            {#each palette.slice(0, 8) as [label, key]}
              <div class="palette-swatch" style:background={$snapshotTheme.colors[key]}><b>{label}</b><code>{$snapshotTheme.colors[key]}</code></div>
            {/each}
          </div>
        </div>
      </div>
      <div class="compare-pane">
        <h3>After</h3>
        <div class="preview-canvas" data-theme={afterTheme.name} style={`${styleString(afterTheme)};filter:${filter}`} class:depth={!!afterTheme.depth} class:noise={!!afterTheme.noise}>
          <div class="palette-grid compact">
            {#each palette.slice(0, 8) as [label, key]}
              <div class="palette-swatch" style:background={afterTheme.colors[key]}><b>{label}</b><code>{afterTheme.colors[key]}</code></div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="preview-canvas" data-theme={theme.name} style={`${styleString(theme)};filter:${filter}`} class:depth={!!theme.depth} class:noise={!!theme.noise}>
      {#if $previewTab === 'demo'}
        <div class="demo-grid">
          <div class="demo-column">
            <section class="demo-card filter-card">
              <div class="card-heading"><b>◔ &nbsp; Preview</b><button type="button">more</button></div>
              <div class="tag-row"><span class="badge">Shoes <button aria-label="Remove shoes filter">×</button></span><span class="badge">Bags <button aria-label="Remove bags filter">×</button></span></div>
              {#each [['Hoodies', '25', true], ['Bags', '3', true], ['Shoes', '0', false], ['Accessories', '4', false]] as item}
                <label class="check-row"><input type="checkbox" class="checkbox checkbox-xs" checked={item[2]} /><span>{item[0]}</span><span class:warning={item[1] === '0'}>{item[1]}</span></label>
              {/each}
            </section>
            <section class="demo-card calendar-card">
              <div class="week-row">{#each [['12', 'M'], ['13', 'T'], ['14', 'W'], ['15', 'T'], ['16', 'F'], ['17', 'S'], ['18', 'S']] as day}<button type="button" class:chosen={day[0] === '14'}><b>{day[0]}</b><small>{day[1]}</small></button>{/each}</div>
              <label class="mini-search">⌕ <input placeholder="Search for events" /></label>
              <label class="switch-row"><input type="checkbox" class="toggle toggle-primary toggle-xs" checked /><span>Show all day events</span></label>
              <div class="event-row"><div><b>Team Sync Meeting</b><p>Weekly product review with design and development teams</p></div><span class="badge badge-neutral">1h</span></div>
            </section>
            <section class="demo-card tabs-card">
              <div class="inner-tabs" role="tablist"><button type="button">Overview</button><button type="button" class="active">Schedule</button><button type="button">Settings</button></div>
              <div class="tab-content">Upcoming sessions and reminders for this week.</div>
            </section>
            <section class="demo-card range-card"><b>⚙ &nbsp; Price range</b><output>50</output><input class="range range-xs" type="range" value="50" /></section>
            <section class="demo-card product-card">
              <div class="shoe-art" aria-label="Lime and black running shoe illustration"><span class="sole"></span><span class="shoe-body"></span><i></i></div>
              <div class="product-body"><div><b>Nike Shoes</b><span class="badge badge-success">SALE</span></div><p class="rating">★★★★★ <small>420 reviews</small></p><strong>$120 <del>$150</del></strong></div>
            </section>
            <section class="demo-card search-card"><label>⌕ <input placeholder="Search" /></label><button class="btn btn-neutral btn-sm" type="button">Find</button></section>
            <section class="demo-card registration-card">
              <h3>♧ &nbsp; Create new account</h3><p>Registration is free and only takes a minute</p>
              <label class="input input-bordered input-sm">♟ <input placeholder="Username" /></label>
              <label class="input input-bordered input-sm">⌘ <input type="password" placeholder="password" /></label>
              <small class="password-hint">● &nbsp; Password must be 8+ characters</small>
              <label class="switch-row"><input type="checkbox" class="toggle toggle-xs" /><span>Accept terms of service</span></label>
              <label class="switch-row"><input type="checkbox" class="toggle toggle-xs" /><span>Email product updates</span></label>
              <div><button class="btn btn-primary btn-sm" type="button">Register</button><button class="link-button" type="button">Or login</button></div>
            </section>
          </div>
          <div class="demo-column">
            <section class="demo-card chart-card"><div class="bar-chart">{#each bars as bar}<i style:height={`${bar}px`}></i>{/each}</div><p>Sales volume reached $12,450 this week, showing a 15% increase from the previous period.</p><div><button class="btn btn-sm" type="button">Charts</button><button class="btn btn-neutral btn-sm" type="button">Details</button></div></section>
            <section class="demo-card score-card"><div><small>Page Score</small><strong>91<em>/100</em></strong><p>✓ &nbsp; All good</p></div><div class="radial-progress" style="--value:91;--size:4.2rem;--thickness:5px" role="progressbar">91</div></section>
            <section class="demo-card orders-card"><h3>⌁ &nbsp; Recent orders</h3>{#each orders as order}<div><span>{order[0]}</span><span class={`badge badge-${order[2]}`}>{order[1]}</span></div>{/each}</section>
            <section class="demo-card revenue-card"><small>July Revenue</small><strong>$32,400</strong><p>↗ &nbsp; 21% more than last month</p></section>
            <section class="demo-card post-card"><h3>▱ &nbsp; Write a new post</h3><div class="format-row"><button type="button"><b>B</b></button><button type="button"><i>I</i></button><button type="button"><u>U</u></button><button type="button">Add files</button></div><textarea placeholder="What's happening?"></textarea><small>1200 characters remaining</small><div><button class="btn btn-sm" type="button">Draft</button><button class="btn btn-primary btn-sm" type="button">Publish</button></div></section>
            <section class="demo-card phone-card">
              <div class="chat chat-start"><div class="avatar-faux">OK</div><div><small>Obi-Wan Kenobi &nbsp;12:45</small><div class="chat-bubble">It's over Anakin</div></div></div>
              <div class="chat chat-start"><div class="avatar-faux">OK</div><div><div class="chat-bubble">I have the high ground</div><small>Delivered</small></div></div>
              <div class="chat chat-end"><div><div class="chat-bubble">You underestimate my power</div><small>Seen at 12:46</small></div><div class="avatar-faux alt">AS</div></div>
              <div class="phone-nav"><button>♧</button><button class="selected">◯</button><button>⚙</button></div>
            </section>
            <section class="demo-card admin-card"><h3>Admin panel</h3>{#each [['▱', 'Databases', '7'], ['◇', 'Products', ''], ['✉', 'Messages', '29'], ['⌘', 'Access tokens', ''], ['♧', 'Users', '●'], ['↕', 'Settings', '']] as item}<div><span>{item[0]} &nbsp; {item[1]}</span><small>{item[2]}</small></div>{/each}</section>
          </div>
          <div class="demo-column">
            <section class="demo-card player-card"><div class="player-controls"><button>◀</button><button>▷</button><button>▶</button></div><b>PM Zoomcall ASMR</b><small>Project Manager talking for 2 hours</small><div class="time"><span>13:39</span><progress value="12" max="100"></progress><div><small>13:39</small><small>120:00</small></div></div><div class="player-tools"><button>◖</button><button>⤨</button><button>⇄</button><button>♧</button></div></section>
            <section class="terminal mockup-code"><pre data-prefix="$"><code>npm i daisyui</code></pre><pre data-prefix=">"><code>installing...</code></pre><pre data-prefix=">"><code>Done!</code></pre></section>
            <div class="alert-stack"><div class="alert alert-info">▱ <b>There are 9 new messages</b></div><div class="alert alert-success">✓ <b>Verification process completed</b></div><div class="alert alert-warning">♢ <b>Click to verify your email</b></div><div class="alert alert-error">♙ <b>Access denied</b><small>Support</small></div></div>
            <section class="timeline-list">{#each ["Harry Potter and Sorcerer's Stack", 'Harry Potter and Chamber of Servers', 'Harry Potter and Prisoner of Azure', 'Harry Potter and Goblet of Firebase', 'Harry Potter and Elixir of Phoenix', 'Harry Potter and Half-Deployed App', 'Harry Potter and Deathly Frameworks'] as title, index}<div><i class:done={index < 4}>✓</i><span>{title}</span></div>{/each}</section>
            <section class="demo-card pricing-card"><div class="billing-tabs"><button>Monthly</button><button class="active">Yearly</button><span class="badge badge-warning">SALE</span></div><div class="price-content"><small>Starter Plan</small><h2>$200<em>/month</em></h2>{#each [['✓', '20 Tokens per day'], ['✓', '10 Projects'], ['✓', 'API Access'], ['×', 'Priority Support']] as item}<p class:error={item[0] === '×'}><b>{item[0]}</b>{item[1]}</p>{/each}<button class="btn btn-accent" type="button">Buy Now</button></div></section>
          </div>
        </div>
      {:else if $previewTab === 'variants'}
        <div class="variants-view">
          <section><h3>Buttons</h3><div class="variant-row"><button class="btn btn-primary">Primary</button><button class="btn btn-secondary">Secondary</button><button class="btn btn-accent">Accent</button><button class="btn btn-neutral">Neutral</button></div></section>
          <section><h3>Feedback</h3><div class="variant-stack"><div class="alert alert-info">Information to help you continue.</div><div class="alert alert-success">Your changes were saved.</div><div class="alert alert-warning">Review this detail before publishing.</div><div class="alert alert-error">Something needs your attention.</div></div></section>
          <section><h3>Fields and selectors</h3><div class="variant-form"><input class="input input-bordered" value="Active theme" /><select class="select select-bordered"><option>Design system</option></select><input type="checkbox" class="checkbox checkbox-primary" checked /><input type="checkbox" class="toggle toggle-primary" checked /><span class="badge badge-primary">New</span></div></section>
          <section><h3>Cards</h3><div class="card bg-base-100 shadow-xl"><div class="card-body"><h3 class="card-title">Production ready</h3><p>Tokens update every component together.</p><div class="card-actions"><button class="btn btn-primary">Continue</button></div></div></div></section>
        </div>
      {:else}
        <div class="palette-view">
          <div class="palette-intro"><span>Theme color tokens</span><h3>{theme.name}</h3><p>Every swatch below is live and comes directly from the active editor state.</p></div>
          <div class="palette-grid">
            {#each palette as [label, key]}
              <div class="palette-swatch" style:background={theme.colors[key]} style:color={key.includes('content') ? theme.colors[key.replace('-content', '')] || theme.colors['base-100'] : key === 'base-content' ? theme.colors['base-100'] : theme.colors['base-content']}>
                <b>{label}</b><span>{key}</span><code>{theme.colors[key]}</code>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</main>
