(() => {
  const COLORS = {
    income: "#0F3D3E",
    net: "#2A8F82",
    groups: [
      "#00a2c7",
      "#7BC4B8",
      "#d97706",
      "#b54a3c",
      "#6366f1",
      "#0ea5e9",
      "#16a34a",
      "#db2777",
      "#64748b",
      "#ca8a04",
    ],
  };

  /* Totals MUST match summary cards: income 128450 / expenses 31820.40 / net 96629.60 */
  const GROUP_FLOWS = [
    { name: "Paychecks", amount: 69000, kind: "income" },
    { name: "Business Income", amount: 52400, kind: "income" },
    { name: "Other Income", amount: 7000, kind: "income" },
    { name: "Interest", amount: 50, kind: "income" },
    { name: "Shopping", amount: 9413, kind: "expense" },
    { name: "Food & Dining", amount: 5938.5, kind: "expense" },
    { name: "Financial", amount: 3480, kind: "expense" },
    { name: "Travel & Lifestyle", amount: 3220, kind: "expense" },
    { name: "Other", amount: 4200.5, kind: "expense" },
    { name: "Health & Wellness", amount: 1940, kind: "expense" },
    { name: "Business", amount: 1620, kind: "expense" },
    { name: "Auto & Transport", amount: 1342, kind: "expense" },
    { name: "Bills & Utilities", amount: 416.4, kind: "expense" },
    { name: "Gifts & Donations", amount: 250, kind: "expense" },
  ];

  /* Slice total MUST match Total Expenses ($31,820.40) */
  const PIE_SLICES = [
    { name: "Shopping", amount: 8640, color: "#00a2c7" },
    { name: "Restaurants & Bars", amount: 5420, color: "#7BC4B8" },
    { name: "Miscellaneous", amount: 3720, color: "#d97706" },
    { name: "Cash & ATM", amount: 3200, color: "#b54a3c" },
    { name: "Travel & Vacation", amount: 2350, color: "#6366f1" },
    { name: "Office Supplies", amount: 1620, color: "#0ea5e9" },
    { name: "Taxi & Ride Shares", amount: 1210, color: "#16a34a" },
    { name: "Electronics", amount: 585, color: "#db2777" },
    { name: "Groceries", amount: 490, color: "#ca8a04" },
    { name: "Everything else", amount: 4585.4, color: "#64748b" },
  ];

  const TRANSACTIONS = [
    {
      date: "Mar 16, 2025",
      payee: "Northwind Labs",
      category: "Paychecks",
      account: "Primary Checking (…4821)",
      amount: 9250,
      income: true,
    },
    {
      date: "Mar 16, 2025",
      payee: "Internal Transfer",
      category: "Transfers",
      account: "Primary Checking (…4821)",
      amount: 850,
      income: false,
    },
    {
      date: "Mar 15, 2025",
      payee: "Summit Devices",
      category: "Electronics",
      account: "Wallet Pay",
      amount: 142,
      income: false,
    },
    {
      date: "Mar 15, 2025",
      payee: "QuickBite Delivery",
      category: "Restaurants & Bars",
      account: "Primary Checking (…4821)",
      amount: 31.2,
      income: false,
    },
    {
      date: "Mar 15, 2025",
      payee: "CityRide",
      category: "Taxi & Ride Shares",
      account: "Primary Checking (…4821)",
      amount: 18,
      income: false,
    },
    {
      date: "Mar 14, 2025",
      payee: "Harbor Market",
      category: "Shopping",
      account: "Primary Checking (…4821)",
      amount: 198.5,
      income: false,
    },
    {
      date: "Mar 14, 2025",
      payee: "Brightline AI",
      category: "Miscellaneous",
      account: "Primary Checking (…4821)",
      amount: 40.42,
      income: false,
    },
    {
      date: "Mar 13, 2025",
      payee: "Streamhouse",
      category: "Entertainment & Recreation",
      account: "Wallet Pay",
      amount: 182,
      income: false,
    },
    {
      date: "Mar 13, 2025",
      payee: "Orbit Models",
      category: "Software",
      account: "Primary Checking (…4821)",
      amount: 45,
      income: false,
    },
    {
      date: "Mar 13, 2025",
      payee: "Marketplace Co",
      category: "Shopping",
      account: "Primary Checking (…4821)",
      amount: 74,
      income: false,
    },
  ];

  const toast = document.createElement("div");
  toast.id = "demo-toast";
  toast.setAttribute("role", "status");
  toast.textContent = "Demo only";
  document.body.appendChild(toast);

  let toastTimer = 0;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
  }

  function money(n, signed = false) {
    const abs = Math.abs(n).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    if (!signed) return abs;
    return n >= 0 ? `+${abs}` : `-${abs}`;
  }

  function pct(part, whole) {
    return `${((part / whole) * 100).toFixed(2)}%`;
  }

  /* ---- Toast handlers ---- */
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("button.inert-nav");
    if (!btn) return;
    event.preventDefault();
    const label =
      (btn.getAttribute("aria-label") || btn.textContent || "Action")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48) || "Action";
    showToast(`${label} — demo only`);
  });

  document.addEventListener("click", (event) => {
    const el = event.target.closest("[data-demo-action]");
    if (!el) return;
    const label = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
    showToast(`${label} — demo only`);
  });

  /* ---- Tabs ---- */
  const breakdown = document.getElementById("demo-breakdown-panel");
  const trends = document.getElementById("demo-trends-panel");
  let pieChart = null;

  function setTab(mode) {
    if (!breakdown || !trends) return;
    const showBreakdown = mode === "breakdown";
    breakdown.hidden = !showBreakdown;
    trends.hidden = showBreakdown;
    breakdown.setAttribute("aria-hidden", showBreakdown ? "false" : "true");
    trends.setAttribute("aria-hidden", showBreakdown ? "true" : "false");

    document.querySelectorAll(".pill-tabs .pill").forEach((tab) => {
      const active = tab.dataset.tab === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (!showBreakdown) {
      // Chart.js measures 0×0 if created while the panel is display:none
      ensurePieChart();
    }
  }

  document.querySelectorAll(".pill-tabs .pill").forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.tab;
      setTab(mode);
      showToast(mode === "breakdown" ? "Breakdown view" : "Trends view");
    });
  });

  /* ---- Sankey (lightweight SVG) ---- */
  function renderSankey() {
    const svg = document.getElementById("sankey-svg");
    const legend = document.getElementById("breakdown-legend");
    if (!svg || !legend) return;

    const incomeNodes = GROUP_FLOWS.filter((g) => g.kind === "income");
    const expenseNodes = GROUP_FLOWS.filter((g) => g.kind === "expense");
    const totalIncome = incomeNodes.reduce((s, n) => s + n.amount, 0);
    const totalExpense = expenseNodes.reduce((s, n) => s + n.amount, 0);
    const net = totalIncome - totalExpense;

    const W = 960;
    const H = 420;
    /* Leave room for left/right labels inside the viewBox (avoid clipping). */
    const colX = [150, 430, 700];
    const nodeW = 18;
    const pad = 12;

    function layout(nodes, total, x) {
      const usable = H - pad * 2 - (nodes.length - 1) * 6;
      let y = pad;
      return nodes.map((n, i) => {
        const h = Math.max(10, (n.amount / total) * usable);
        const item = {
          ...n,
          x,
          y,
          h,
          color: n.kind === "income" ? COLORS.income : COLORS.groups[i % COLORS.groups.length],
        };
        y += h + 6;
        return item;
      });
    }

    const left = layout(incomeNodes, totalIncome, colX[0]);
    const incomeHubH = Math.max(48, H * 0.46);
    const netHubH = Math.max(32, (net / totalIncome) * (H * 0.26));
    const midGap = 56; /* keep Income amount + Net Income title from overlapping */
    const mid = [
      {
        name: "Income",
        amount: totalIncome,
        x: colX[1],
        y: pad + 10,
        h: incomeHubH,
        color: COLORS.income,
        kind: "hub",
      },
      {
        name: "Net Income",
        amount: net,
        x: colX[1],
        y: pad + 10 + incomeHubH + midGap,
        h: netHubH,
        color: COLORS.net,
        kind: "hub",
      },
    ];
    const right = layout(expenseNodes, totalExpense, colX[2]);

    function linkPath(a, b, thickness) {
      const x0 = a.x + nodeW;
      const x1 = b.x;
      const y0 = a.y + a.h / 2;
      const y1 = b.y + b.h / 2;
      const t = Math.max(2, thickness);
      const c = (x1 - x0) * 0.45;
      return `
        M ${x0} ${y0 - t / 2}
        C ${x0 + c} ${y0 - t / 2}, ${x1 - c} ${y1 - t / 2}, ${x1} ${y1 - t / 2}
        L ${x1} ${y1 + t / 2}
        C ${x1 - c} ${y1 + t / 2}, ${x0 + c} ${y0 + t / 2}, ${x0} ${y0 + t / 2}
        Z
      `;
    }

    const parts = [];
    left.forEach((n) => {
      const thickness = Math.max(3, (n.amount / totalIncome) * 48);
      parts.push(
        `<path d="${linkPath(n, mid[0], thickness)}" fill="${n.color}" fill-opacity="0.28"></path>`
      );
    });

    // Income hub → expense groups (proportional spend of expense share)
    right.forEach((n, i) => {
      const thickness = Math.max(2.5, (n.amount / totalExpense) * 42);
      const fakeSource = {
        x: mid[0].x,
        y: mid[0].y + (i / right.length) * mid[0].h * 0.85,
        h: thickness,
      };
      parts.push(
        `<path d="${linkPath(fakeSource, n, thickness)}" fill="${n.color}" fill-opacity="0.22"></path>`
      );
    });

    // Net income residual link
    parts.push(
      `<path d="${linkPath(
        { x: mid[0].x, y: mid[0].y + mid[0].h * 0.7, h: 12 },
        mid[1],
        Math.max(8, (net / totalIncome) * 36)
      )}" fill="${COLORS.net}" fill-opacity="0.35"></path>`
    );

    function drawNode(n, align = "left") {
      const labelX = align === "left" ? n.x - 8 : n.x + nodeW + 8;
      const anchor = align === "left" ? "end" : "start";
      return `
        <rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" rx="4" fill="${n.color}"></rect>
        <text x="${labelX}" y="${n.y + n.h / 2}" dominant-baseline="middle" text-anchor="${anchor}"
          font-size="12" font-weight="600" fill="#1c2423" font-family="DM Sans, sans-serif">${n.name}</text>
        <text x="${labelX}" y="${n.y + n.h / 2 + 14}" dominant-baseline="middle" text-anchor="${anchor}"
          font-size="11" fill="#5a6b68" font-family="DM Sans, sans-serif">${money(n.amount)}</text>
      `;
    }

    left.forEach((n) => parts.push(drawNode(n, "left")));
    mid.forEach((n) => {
      parts.push(`
        <rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" rx="4" fill="${n.color}"></rect>
        <text x="${n.x + nodeW / 2}" y="${n.y - 8}" text-anchor="middle" font-size="12" font-weight="700"
          fill="#0F3D3E" font-family="DM Sans, sans-serif">${n.name}</text>
        <text x="${n.x + nodeW / 2}" y="${n.y + n.h + 14}" text-anchor="middle" font-size="11"
          fill="#5a6b68" font-family="DM Sans, sans-serif">${money(n.amount)}</text>
      `);
    });
    right.forEach((n) => parts.push(drawNode(n, "right")));

    svg.innerHTML = parts.join("");

    legend.innerHTML = expenseNodes
      .map((n, i) => {
        const color = COLORS.groups[i % COLORS.groups.length];
        return `<li><span class="swatch" style="background:${color}"></span><span>${n.name}</span><span class="legend-meta">${money(n.amount)} (${pct(n.amount, totalExpense)})</span></li>`;
      })
      .join("");
  }

  /* ---- Pie (lazy: only after Trends panel is visible) ---- */
  function renderPieLegend() {
    const legend = document.getElementById("trends-legend");
    if (!legend) return 0;
    const total = PIE_SLICES.reduce((s, x) => s + x.amount, 0);
    legend.innerHTML = PIE_SLICES.map(
      (s) =>
        `<li><span class="swatch" style="background:${s.color}"></span><span>${s.name}</span><span class="legend-meta">${money(s.amount)} (${pct(s.amount, total)})</span></li>`
    ).join("");
    return total;
  }

  function ensurePieChart() {
    const canvas = document.getElementById("trends-pie");
    if (!canvas || typeof Chart === "undefined") return;

    const total = renderPieLegend();

    if (pieChart) {
      requestAnimationFrame(() => {
        pieChart.resize();
      });
      return;
    }

    // Wait a frame so the un-hidden panel has a non-zero box for Chart.js
    requestAnimationFrame(() => {
      if (pieChart || typeof Chart === "undefined") return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect || rect.width < 8 || rect.height < 8) {
        // Retry once on next frame if layout is still settling
        requestAnimationFrame(() => ensurePieChart());
        return;
      }

      pieChart = new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: PIE_SLICES.map((s) => s.name),
          datasets: [
            {
              data: PIE_SLICES.map((s) => s.amount),
              backgroundColor: PIE_SLICES.map((s) => s.color),
              borderWidth: 2,
              borderColor: "#ffffff",
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: "58%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const v = ctx.parsed;
                  return ` ${money(v)} (${pct(v, total)})`;
                },
              },
            },
          },
        },
      });
    });
  }

  /* ---- Transactions ---- */
  function renderTransactions() {
    const body = document.getElementById("tx-body");
    if (!body) return;
    body.innerHTML = TRANSACTIONS.map((tx) => {
      const amt = tx.income ? money(tx.amount, true) : money(tx.amount);
      const cls = tx.income ? "num income" : "num expense";
      return `
        <tr>
          <td>${tx.date}</td>
          <td class="payee">${tx.payee}</td>
          <td class="muted">${tx.category}</td>
          <td class="muted">${tx.account}</td>
          <td class="${cls}">${amt}</td>
        </tr>
      `;
    }).join("");
  }

  renderSankey();
  renderPieLegend();
  renderTransactions();
  setTab("breakdown");
})();
