import { useEffect, useState } from 'react'
import { layout } from '../theme/tokens'

/**
 * Custom 43×43 image cursor for fine pointers.
 * default: /media/cursor.png  hover: /media/cursor-hover.png
 */
export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [hover, setHover] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) {
      setVisible(false)
      return
    }
    document.body.classList.add('rm-cursor-on')
    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY })
      const t = e.target
      const interactive =
        t?.closest?.('a, button, [role="button"], .rm-hotspot, .has-onhover-animation') != null
      setHover(!!interactive)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.body.classList.remove('rm-cursor-on')
    }
  }, [])

  if (!visible) return null

  const size = layout.cursorSize
  return (
    <div
      className="rm-custom-cursor"
      aria-hidden
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        pointerEvents: 'none',
        zIndex: 2147483000,
        backgroundImage: `url(${hover ? '/media/cursor-hover.png' : '/media/cursor.png'})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        transition: 'opacity .15s ease-out',
      }}
    />
  )
}
