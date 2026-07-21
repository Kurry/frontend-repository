import { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { colors, fonts } from '../theme/tokens'
import { webmcpBus } from '../webmcp/registerWebmcp'

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`
const popIn = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 20, 0.42);
  backdrop-filter: blur(2px);
  z-index: 2147482000;
  animation: ${fadeIn} 0.18s ease-out;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Content = styled(Dialog.Content)`
  position: fixed;
  top: 14vh;
  left: 50%;
  transform: translateX(-50%);
  width: min(560px, calc(100vw - 32px));
  background: ${colors.white};
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  z-index: 2147482001;
  font-family: ${fonts.inter};
  animation: ${popIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  &:focus {
    outline: none;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const SearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`

const SearchInput = styled.input`
  flex: 1;
  border: 0;
  outline: none;
  font-family: ${fonts.inter};
  font-size: 16px;
  color: ${colors.dark};
  background: transparent;
  &::placeholder {
    color: ${colors.gray8C};
  }
`

const Kbd = styled.kbd`
  font-family: ${fonts.inter};
  font-size: 11px;
  color: ${colors.gray8C};
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-bottom-width: 2px;
  border-radius: 6px;
  padding: 2px 6px;
  background: ${colors.grayF4};
`

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 8px;
  max-height: 46vh;
  overflow-y: auto;
`

const Item = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: ${colors.dark};
  font-size: 14px;
  background: ${(p) => (p.$active ? colors.grayF4 : 'transparent')};
  outline: none;
  &[data-highlighted] {
    background: ${colors.grayF4};
  }
  .hint {
    color: ${colors.gray8C};
    font-size: 12px;
  }
`

const Empty = styled.li`
  padding: 18px 12px;
  color: ${colors.gray8C};
  font-size: 13px;
  text-align: center;
`

const SECTIONS = [
  { id: 'hero', label: 'hero' },
  { id: 'workflow', label: 'workflow' },
  { id: 'teams', label: 'teams' },
  { id: 'support', label: 'support' },
  { id: 'closing', label: 'closing' },
  { id: 'trial-brief', label: 'trial brief' },
]

/**
 * Command palette (Ctrl/Cmd+K). Built on Radix Dialog so the surface carries
 * role=dialog + aria-modal, traps focus while open, closes on Escape / backdrop
 * click, and the search field exposes an accessible name. Opening it dismisses
 * the Solutions menu first (PRD contract). Enter runs the highlighted command;
 * "Jump to trial brief" scrolls the panel into view and closes the palette.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const prevFocusRef = useRef(null)

  // Open on Ctrl/Cmd+K (and close Solutions first); toggle if already open.
  // Capture the currently-focused control synchronously here — Radix blurs it
  // during its open sequence, so reading document.activeElement later would
  // already yield <body> and we couldn't restore focus on close.
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpen((v) => {
          if (!v) {
            prevFocusRef.current = document.activeElement
            if (typeof webmcpBus.closeSolutions === 'function') webmcpBus.closeSolutions()
            setQuery('')
          }
          return !v
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const commands = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = [
      ...SECTIONS.map((s) => ({
        id: `jump-${s.id}`,
        label: `Jump to ${s.label}`,
        run: () => {
          const el = document.getElementById(`rm-section-${s.id}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        },
      })),
      {
        id: 'advance',
        label: 'Advance slideshow',
        run: () => {
          if (typeof webmcpBus.advanceSlideshow === 'function') webmcpBus.advanceSlideshow()
        },
      },
    ]
    if (!q) return base
    return base.filter((c) => c.label.toLowerCase().includes(q))
  }, [query])

  const runCommand = (cmd) => {
    if (!cmd) return
    cmd.run()
    setOpen(false)
  }

  const handleOpenChange = (next) => {
    // Escape / backdrop close pass through here; opening is handled in the
    // keydown listener so the previously-focused control is captured in time.
    setOpen(next)
  }

  // Radix returns focus to the (null) trigger on Cmd+K open; restore the real
  // previously-focused control on close instead. The restore is deferred one
  // tick so it lands after Radix's own focus-guard cycle (which would otherwise
  // bounce focus back to <body>).
  const restoreFocus = (e) => {
    e.preventDefault()
    const el = prevFocusRef.current
    prevFocusRef.current = null
    if (el && typeof el.focus === 'function' && document.contains(el)) {
      setTimeout(() => el.focus(), 0)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Overlay />
        <Content
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
          onCloseAutoFocus={restoreFocus}
        >
          <Dialog.Title
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clipPath: 'inset(50%)',
            }}
          >
            Command palette
          </Dialog.Title>
          <SearchWrap>
            <SearchInput
              ref={inputRef}
              type="text"
              aria-label="Search commands"
              placeholder="Search commands…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  runCommand(commands[0])
                }
              }}
            />
            <Kbd>Esc</Kbd>
          </SearchWrap>
          <List role="listbox" aria-label="Commands">
            {commands.length === 0 ? (
              <Empty>No matching commands</Empty>
            ) : (
              commands.map((cmd, i) => (
                <Item
                  key={cmd.id}
                  role="option"
                  aria-selected={i === 0}
                  data-highlighted={i === 0 ? '' : undefined}
                  $active={i === 0}
                  onMouseDown={(e) => {
                    // mousedown so the input keeps focus until we close
                    e.preventDefault()
                    runCommand(cmd)
                  }}
                >
                  <span>{cmd.label}</span>
                  <span className="hint">{i === 0 ? '↵' : ''}</span>
                </Item>
              ))
            )}
          </List>
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
