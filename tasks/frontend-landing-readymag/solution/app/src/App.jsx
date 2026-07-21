import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { Global, css } from '@emotion/react'
import { registerWebmcp } from './webmcp/registerWebmcp'
import Header from './components/Header'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import Home from './pages/Home'
import { colors, fonts } from './theme/tokens'
import './motion/keyframes.css'

/**
 * Single-page Canvasly homepage. Only route "/" is in scope; every header,
 * footer, CTA, tile, and menu link resolves back to the homepage (the
 * catch-all redirects any other path), so chrome never lands on a blank,
 * error, or "Not found" page and secondary destinations are never promoted
 * into separate features.
 */

const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  html,
  body,
  #root {
    margin: 0;
    min-height: 100%;
  }
  html {
    overflow-x: clip;
  }
  body {
    font-family: ${fonts.graphik};
    color: ${colors.dark};
    background: ${colors.white};
    overflow-x: clip;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  body.rm-cursor-on,
  body.rm-cursor-on * {
    cursor: none !important;
  }
  ::selection {
    background-color: ${colors.grayA2};
  }
  a {
    color: inherit;
  }
  img {
    max-width: 100%;
    display: block;
  }
  a:focus-visible,
  button:focus-visible {
    outline: 2px solid ${colors.blueDeep};
    outline-offset: 2px;
  }
  code {
    font-size: 0.92em;
  }
`

function SiteLayout() {
  return (
    <>
      <CustomCursor />
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

export default function App() {
  useEffect(() => {
    registerWebmcp()
  }, [])
  return (
    <BrowserRouter>
      <Global styles={globalStyles} />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
