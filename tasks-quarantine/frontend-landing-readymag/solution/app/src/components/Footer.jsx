import styled from '@emotion/styled'
import { colors, fonts, motion } from '../theme/tokens'

const Wrap = styled.footer`
  background: ${colors.dark};
  color: ${colors.white};
  font-family: ${fonts.inter};
  font-size: 12px;
  line-height: 16px;
  font-variation-settings: 'wght' 550;
  padding: 64px 28px 40px;
`

const Grid = styled.div`
  max-width: 1024px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

const Col = styled.div`
  h4 {
    margin: 0 0 12px;
    font-size: 10px;
    letter-spacing: 0.2px;
    text-transform: lowercase;
    opacity: 0.7;
    font-weight: 400;
  }
  a {
    display: block;
    color: ${colors.white};
    text-decoration: none;
    margin: 0 0 8px;
    transition: ${motion.opacity2};
  }
  a:hover {
    opacity: 0.7;
    color: ${colors.orangeHero || colors.orange};
  }
`

const Bottom = styled.div`
  max-width: 1024px;
  margin: 48px auto 0;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  opacity: 0.8;
`

/** Multi-column footer: company / product / resources / solutions groups. */
export default function Footer() {
  return (
    <Wrap className="rm-footer">
      <Grid>
        <Col>
          <h4>company</h4>
          <a href="/about">about</a>
          <a href="/careers">careers</a>
          <a href="/reviews">reviews</a>
          <a href="/terms-and-privacy">terms of service</a>
          <a href="/terms-and-privacy/2">privacy policy</a>
          <a href="/terms-and-privacy/cookie-policy">cookie policy</a>
        </Col>
        <Col>
          <h4>product</h4>
          <a href="/pricing">pricing</a>
          <a href="/templates">templates</a>
          <a href="/updates">product updates</a>
          <a href="/affiliate-program">affiliate program</a>
          <a href="/referral">referral program</a>
          <a href="/npo">npo discount</a>
        </Col>
        <Col>
          <h4>resources</h4>
          <a href="/examples">examples</a>
          <a href="/almanac">design almanac</a>
          <a href="/designstories">design stories</a>
          <a href="/help">help</a>
          <a href="/forum">forum</a>
          <a href="/status">status</a>
          <a href="/blog">blog</a>
        </Col>
        <Col>
          <h4>solutions</h4>
          <a href="/portfolio">portfolios</a>
          <a href="/presentations">presentations</a>
          <a href="/editorial">editorials</a>
          <a href="/companies">companies</a>
          <a href="/no-code-website-builder-designers">freelancers</a>
          <a href="/students">students</a>
        </Col>
      </Grid>
      <Bottom>
        <span>© 2026 Canvasly Studio</span>
        <span>support@canvasly.example</span>
      </Bottom>
    </Wrap>
  )
}
