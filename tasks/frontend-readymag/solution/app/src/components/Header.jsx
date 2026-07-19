import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { colors, fonts, motion, hairlines } from '../theme/tokens'
import { webmcpBus } from '../webmcp/registerWebmcp'

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 60px;
  padding: 0 24px;
  background: ${colors.white};
  font-family: ${fonts.inter};
  font-size: 12px;
  line-height: 14px;
  font-variation-settings: 'wght' 550;
  color: ${colors.dark};
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
`

const Brand = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${colors.dark};
  text-decoration: none;
  img {
    display: block;
    height: 20px;
    width: auto;
  }
  .hover {
    display: none;
  }
  &:hover .base {
    display: none;
  }
  &:hover .hover {
    display: block;
  }
`

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  a {
    color: ${colors.dark};
    text-decoration: none;
    background: ${hairlines.muted};
    padding-bottom: 2px;
    transition: ${motion.opacity2}, color 0.2s linear;
  }
  a:hover {
    color: ${colors.black};
    background: ${hairlines.black};
  }
  @media (max-width: 768px) {
    display: none;
  }
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  a.login {
    color: ${colors.dark};
    text-decoration: none;
    background: ${hairlines.muted};
    padding-bottom: 2px;
  }
  a.login:hover {
    background: ${hairlines.black};
  }
  @media (max-width: 768px) {
    a.login {
      display: none;
    }
  }
`

const Cta = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 16px;
  border-radius: 40px;
  background: ${colors.dark};
  color: ${colors.white} !important;
  text-decoration: none;
  font-size: 12px;
  line-height: 14px;
  font-variation-settings: 'wght' 550;
  transition: ${motion.all2out};
  &:hover {
    background: ${colors.orange};
    transform: translateY(-1px);
  }
`

const MenuButton = styled.button`
  display: none;
  appearance: none;
  border: 1px solid rgba(0, 0, 0, 0.16);
  background: ${colors.white};
  color: ${colors.dark};
  font-family: ${fonts.inter};
  font-size: 12px;
  line-height: 14px;
  font-variation-settings: 'wght' 550;
  border-radius: 40px;
  padding: 8px 14px;
  cursor: pointer;
  @media (max-width: 768px) {
    display: inline-flex;
  }
`

const SolutionsButton = styled.button`
  appearance: none;
  border: 0;
  background: ${hairlines.muted};
  padding: 0 0 2px;
  font: inherit;
  color: ${colors.dark};
  cursor: pointer;
  &:hover,
  &[aria-expanded='true'] {
    background: ${hairlines.black};
  }
`

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  background: ${colors.white};
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  padding: 8px;
  a {
    display: block;
    padding: 8px 10px;
    border-radius: 8px;
    color: ${colors.dark};
    text-decoration: none;
    background: none;
  }
  a:hover,
  a:focus-visible {
    background: ${colors.grayF4};
  }
`

const MobilePanel = styled.div`
  position: absolute;
  top: calc(100% + 1px);
  left: 0;
  right: 0;
  background: ${colors.white};
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 24px 20px;
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
  a {
    display: block;
    padding: 10px 0;
    color: ${colors.dark};
    text-decoration: none;
    font-size: 14px;
  }
`

const SOLUTIONS = [
  { href: '/portfolio', label: 'Portfolios' },
  { href: '/presentations', label: 'Presentations' },
  { href: '/editorial', label: 'Editorials' },
  { href: '/companies', label: 'Companies' },
  { href: '/no-code-website-builder-designers', label: 'Freelancers' },
  { href: '/students', label: 'Students' },
]

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/examples', label: 'Examples' },
  { href: '/templates', label: 'Templates' },
  { href: '/learn', label: 'Learn' },
]

function SolutionsMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)

  // WebMCP session_trigger_demo (solutions-menu) opens the SAME menu the
  // Solutions trigger opens.
  useEffect(() => {
    webmcpBus.openSolutions = () => {
      setOpen(true)
      return { ok: true, expanded: true }
    }
    return () => {
      if (webmcpBus.openSolutions) webmcpBus.openSolutions = null
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <SolutionsButton
        ref={buttonRef}
        type="button"
        aria-label="Solutions menu"
        aria-haspopup="menu"
        aria-controls="rm-solutions-menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Solutions
      </SolutionsButton>
      {open && (
        <Panel id="rm-solutions-menu" role="menu" aria-label="Solutions">
          {SOLUTIONS.map((s) => (
            <a key={s.href} role="menuitem" href={s.href} onClick={() => setOpen(false)}>
              {s.label}
            </a>
          ))}
        </Panel>
      )}
    </div>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <Bar className="rm-header">
      <Brand href="/" aria-label="Readymag home">
        <img className="base" src="/media/logo/logo.png" srcSet="/media/logo/logo@2x.png 2x" alt="Readymag" />
        <img
          className="hover"
          src="/media/logo/logo-hover.png"
          srcSet="/media/logo/logo-hover@2x.png 2x"
          alt=""
          aria-hidden="true"
        />
      </Brand>
      <Nav aria-label="Primary">
        <SolutionsMenu />
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </Nav>
      <Actions>
        <a className="login" href="/login">
          Log in
        </a>
        <Cta href="/join">Sign up</Cta>
        <MenuButton
          type="button"
          aria-label="Menu"
          aria-haspopup="menu"
          aria-controls="rm-mobile-menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          Menu
        </MenuButton>
      </Actions>
      {mobileOpen && (
        <MobilePanel id="rm-mobile-menu" role="menu" aria-label="Menu">
          {[...NAV_LINKS, { href: '/login', label: 'Log in' }, { href: '/join', label: 'Sign up' }].map((l) => (
            <a key={l.href} role="menuitem" href={l.href} onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
        </MobilePanel>
      )}
    </Bar>
  )
}
