import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import { colors, fonts, motion, layout } from '../theme/tokens'

const Page = styled.main`
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 24px 96px;
  font-family: ${fonts.system};
  color: ${colors.dark};
`

const Banner = styled.div`
  margin-bottom: 24px;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${colors.lime};
  color: ${colors.dark};
  font-size: 12px;
  a {
    font-weight: 600;
    color: ${colors.dark};
  }
`

const Title = styled.h1`
  font-family: ${fonts.graphik};
  font-size: 40px;
  line-height: 38px;
  letter-spacing: -1.8px;
  font-weight: 400;
  margin: 0 0 12px;
`

const Lead = styled.p`
  margin: 0;
  max-width: 52ch;
  color: ${colors.textSecondary};
  font-size: 14px;
  line-height: 18px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 32px;
`

const Card = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: ${colors.white};
  transition: ${motion.transform45};
  &:hover {
    transform: translateY(-3px);
  }
  .thumb {
    height: 180px;
    background: linear-gradient(135deg, ${colors.grayF4}, ${colors.dark});
  }
  .meta {
    padding: 16px;
  }
  h3 {
    margin: 0 0 6px;
    font-family: ${fonts.graphik};
    font-size: 18px;
    letter-spacing: -0.8px;
    font-weight: 400;
  }
  p {
    margin: 0;
    font-size: 12px;
    color: ${colors.textSecondary};
  }
`

const templates = [
  { slug: 'presentation', title: 'Presentation', blurb: 'Pitch decks & talks', tone: colors.yellow },
  { slug: 'portfolio', title: 'Portfolio', blurb: 'Case-study heavy sites', tone: colors.tagPortfolio },
  { slug: 'landing', title: 'Landing page', blurb: 'Campaign pages', tone: colors.blue },
  { slug: 'editorial', title: 'Editorial', blurb: 'Longform storytelling', tone: colors.tagEditorial },
  { slug: 'commerce', title: 'E-commerce', blurb: 'Product stories', tone: colors.lime },
  { slug: 'company', title: 'Company website', blurb: 'Brand & careers', tone: colors.grayA2 },
]

export default function Templates() {
  return (
    <Page id="app">
      <Banner>
        Pixel-exact Emotion app (live <code>templates.js</code>) → <a href="/templates">/templates</a>
      </Banner>
      <Title>Readymag templates</Title>
      <Lead>
        Curated collection of versatile templates made with Readymag. Artboard contract{' '}
        {layout.desktopWidth}px.
      </Lead>
      <Grid>
        {templates.map((t) => (
          <Card key={t.slug} to={`/lab/templates/${t.slug}`} className="has-onhover-animation">
            <div className="thumb" style={{ background: `linear-gradient(145deg, ${t.tone}, ${colors.dark})` }} />
            <div className="meta">
              <h3>{t.title}</h3>
              <p>{t.blurb}</p>
            </div>
          </Card>
        ))}
      </Grid>
    </Page>
  )
}
