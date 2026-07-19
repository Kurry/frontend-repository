const storageKey = "dashboard:sidebar-scroll-top"

function getSidebarScroller(sidebar) {
  const candidates = [sidebar, sidebar.querySelector("nav")].filter(Boolean)
  return candidates.find((element) => element.scrollHeight > element.clientHeight) || sidebar
}

function showSidebar() {
  document.documentElement.dataset.dashboardSidebarReady = ""
}

// Own dark/light toggle: theme-change clears data-theme when unchecked, which
// drops the authored dark default. Strip data-set-theme before theme-change boots.
const themeToggle = document.querySelector('input[type="checkbox"][data-set-theme]')
if (themeToggle) {
  themeToggle.removeAttribute("data-set-theme")
  const applyTheme = (isLight) => {
    const theme = isLight ? "light" : "dark"
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
    themeToggle.checked = isLight
  }
  applyTheme(localStorage.getItem("theme") === "light")
  themeToggle.addEventListener("change", () => {
    applyTheme(themeToggle.checked)
  })
}

const sidebar = document.querySelector("aside.drawer-side")

if (sidebar) {
  const scroller = getSidebarScroller(sidebar)
  const restoreScroll = () => {
    scroller.scrollTop = Number(sessionStorage.getItem(storageKey) || 0)
  }
  const saveScroll = () => {
    sessionStorage.setItem(storageKey, String(scroller.scrollTop))
  }

  restoreScroll()
  requestAnimationFrame(() => {
    restoreScroll()
    showSidebar()
  })
  scroller.addEventListener("scroll", saveScroll, { passive: true })
  sidebar.addEventListener("pointerdown", saveScroll, { passive: true })
  window.addEventListener("pagehide", saveScroll)
} else {
  showSidebar()
}

setTimeout(showSidebar, 100)
