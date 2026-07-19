const storageKey = "dashboard:sidebar-scroll-top"

function getSidebarScroller(sidebar) {
  const candidates = [sidebar, sidebar.querySelector("nav")].filter(Boolean)
  return candidates.find((element) => element.scrollHeight > element.clientHeight) || sidebar
}

function showSidebar() {
  document.documentElement.dataset.dashboardSidebarReady = ""
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
