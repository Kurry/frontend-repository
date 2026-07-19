import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { Global, css } from '@emotion/react'
import { registerWebmcp } from './webmcp/registerWebmcp'
import Header from './components/Header'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Examples from './pages/Examples'
import Templates from './pages/Templates'
import ContentPage from './pages/ContentPage'
import { colors, fonts } from './theme/tokens'
import './motion/keyframes.css'

/**
 * Native React app. `/` is the graded homepage; the secondary catalog routes
 * (`/pricing`, `/examples`, `/templates`, …) exist so header and footer
 * navigation resolves, but only the homepage is in scope.
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
          <Route path="pricing" element={<Pricing />} />
          <Route path="examples" element={<Examples />} />
          <Route path="examples/:tag" element={<Examples />} />
          <Route path="templates" element={<Templates />} />
          <Route path="templates/:slug" element={<Templates />} />
          <Route path="join" element={<ContentPage title="Join / Login" kind="auth" />} />
          <Route path="login" element={<ContentPage title="Join / Login" kind="auth" />} />
          <Route path="about" element={<ContentPage title="About Readymag" kind="viewer" slug="about" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
