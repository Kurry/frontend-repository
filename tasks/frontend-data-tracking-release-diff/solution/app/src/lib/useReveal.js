import { onBeforeUnmount, onMounted } from 'vue'

// Scroll storytelling: elements carrying .reveal ease into place the first
// time they enter the viewport, with a short stagger between siblings. A
// failsafe guarantees nothing ever stays hidden (and reduced-motion users
// see every item immediately via the stylesheet override).
export function useReveal(rootRef, { stagger = 60, failsafeMs = 1800 } = {}) {
  let io = null
  let mo = null
  let failsafe = null
  onMounted(() => {
    const root = rootRef.value
    if (!root || typeof IntersectionObserver === 'undefined') {
      root?.querySelectorAll('.reveal').forEach((el) => el.classList.add('revealed'))
      return
    }
    const items = [...root.querySelectorAll('.reveal')]
    if (!items.length) return
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target
        el.classList.add('revealed')
        el.addEventListener('transitionend', () => { el.style.transitionDelay = '' }, { once: true })
        io.unobserve(el)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' })
    items.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index, 8) * stagger}ms`
      io.observe(el)
    })
    failsafe = window.setTimeout(() => {
      items.forEach((el) => {
        if (el.classList.contains('revealed')) return
        const box = el.getBoundingClientRect()
        if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('revealed')
      })
    }, failsafeMs)
    // Elements inserted after mount (new timeline events, fresh history rows)
    // are already covered by their TransitionGroup enter animation — reveal
    // them immediately so they never sit invisible waiting for an observer.
    mo = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          if (node.classList.contains('reveal')) node.classList.add('revealed')
          node.querySelectorAll?.('.reveal').forEach((child) => child.classList.add('revealed'))
        })
      })
    })
    mo.observe(root, { childList: true, subtree: true })
  })
  onBeforeUnmount(() => {
    io?.disconnect()
    mo?.disconnect()
    if (failsafe !== null) window.clearTimeout(failsafe)
  })
}
