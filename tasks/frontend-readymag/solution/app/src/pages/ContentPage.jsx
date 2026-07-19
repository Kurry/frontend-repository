import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { colors, fonts, layout, motion } from '../theme/tokens'

const Page = styled.main`
  max-width: ${layout.desktopWidth}px;
  margin: 0 auto;
  padding: 64px 28px 96px;
  font-family: ${fonts.inter};
  color: ${colors.dark};
`

const Title = styled.h1`
  font-family: ${fonts.pxGrotesk};
  font-size: 40px;
  line-height: 38px;
  letter-spacing: -1.8px;
  font-weight: 400;
  margin: 0 0 16px;
`

const Card = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 28px;
  padding: 28px;
  background: ${colors.white};
  max-width: 560px;
  p {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 20px;
    color: ${colors.textAlpha64};
    font-variation-settings: 'wght' 550;
  }
`

const Field = styled.label`
  display: block;
  margin: 0 0 14px;
  font-size: 12px;
  line-height: 16px;
  font-variation-settings: 'wght' 550;
  input {
    display: block;
    width: 100%;
    margin-top: 6px;
    padding: 12px 14px;
    border: 1px solid rgba(0, 0, 0, 0.16);
    border-radius: 12px;
    font: inherit;
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
  a,
  button {
    display: inline-flex;
    padding: 12px 18px;
    border-radius: 40px;
    background: ${colors.dark};
    color: ${colors.white};
    border: 0;
    cursor: pointer;
    text-decoration: none;
    font-size: 12px;
    font-family: inherit;
    font-variation-settings: 'wght' 550;
    transition: ${motion.all2out};
  }
  a:hover,
  button:hover {
    background: ${colors.orange};
  }
  a.secondary {
    background: transparent;
    color: ${colors.dark};
    border: 1px solid rgba(0, 0, 0, 0.15);
  }
`

/** Lightweight secondary page for auth and content destinations linked from the homepage. */
export default function ContentPage({ title, kind = 'viewer' }) {
  return (
    <Page>
      <Title>{title}</Title>
      <Card>
        {kind === 'auth' ? (
          <form onSubmit={(e) => e.preventDefault()} aria-label="Sign up or log in">
            <p>Create a Readymag account, or log in to continue to your workspace.</p>
            <Field>
              Email
              <input type="email" name="email" autoComplete="email" placeholder="you@studio.com" />
            </Field>
            <Field>
              Password
              <input type="password" name="password" autoComplete="current-password" placeholder="••••••••" />
            </Field>
            <Actions>
              <button type="submit">Continue</button>
              <Link className="secondary" to="/" style={{ color: colors.dark }}>
                Back to homepage
              </Link>
            </Actions>
          </form>
        ) : (
          <>
            <p>
              Readymag is a design tool for creating outstanding websites — landing pages,
              portfolios, editorials, and presentations — with no code.
            </p>
            <Actions>
              <Link to="/" style={{ color: colors.white }}>
                Home
              </Link>
              <a className="secondary" href="/pricing">
                View pricing
              </a>
            </Actions>
          </>
        )}
      </Card>
    </Page>
  )
}
