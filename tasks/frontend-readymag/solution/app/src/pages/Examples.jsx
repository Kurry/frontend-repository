import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { colors, fonts, motion, exampleTags } from '../theme/tokens'

const Page = styled.main`
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 24px 96px;
  font-family: ${fonts.system};
  color: ${colors.dark};
  background: ${colors.white};
`

const Banner = styled.div`
  margin-bottom: 24px;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${colors.blueSoft};
  font-size: 12px;
  a {
    color: ${colors.blue};
    font-weight: 500;
  }
`

const Title = styled.h1`
  font-family: ${fonts.graphik};
  font-size: 40px;
  line-height: 38px;
  letter-spacing: -1.8px;
  font-weight: 400;
  margin: 0 0 8px;
`

const Lead = styled.p`
  margin: 0;
  color: ${colors.textSecondary};
  font-size: 14px;
  line-height: 18px;
  max-width: 60ch;
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 28px 0 32px;
`

const Chip = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 40px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  opacity: ${(p) => (p.$active ? 1 : 0.92)};
  box-shadow: ${(p) => (p.$active ? `0 0 0 2px ${colors.dark}` : 'none')};
  transition: ${motion.all15out};
  &:hover {
    transform: translateY(-1px);
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`

const Card = styled.a`
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 16px;
  overflow: hidden;
  background: ${colors.white};
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: ${motion.transform45}, ${motion.opacity2};
  &:hover {
    transform: translateY(-4px);
  }
  .thumb {
    aspect-ratio: 4/3;
    background: ${(p) => p.$bg};
    background-size: cover;
    background-position: center;
  }
  .meta {
    padding: 14px 14px 18px;
  }
  h3 {
    margin: 0 0 6px;
    font-family: ${fonts.graphik};
    font-size: 16px;
    line-height: 18px;
    letter-spacing: -0.4px;
    font-weight: 400;
  }
  p {
    margin: 0;
    font-size: 12px;
    line-height: 14px;
    color: ${colors.textSecondary};
  }
`

export default function Examples() {
  const { tag } = useParams()
  const [cards, setCards] = useState([])
  const [tags, setTags] = useState(exampleTags)

  useEffect(() => {
    Promise.all([
      fetch('/api/examples/tags/top').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/examples/cards/?limit=50').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([t, c]) => {
        if (Array.isArray(t) && t.length) setTags(t)
        if (Array.isArray(c) && c.length) setCards(c)
      })
      .catch(() => {})
  }, [])

  const active = tag || 'all'
  const filtered =
    active === 'all'
      ? cards
      : cards.filter((c) => (c.tags || []).some((x) => (x.slug || x) === active))

  const display =
    filtered.length > 0
      ? filtered
      : exampleTags.flatMap((t) =>
          [1, 2, 3].map((n) => ({
            _id: `${t.slug}-${n}`,
            title: `${t.title} example ${n}`,
            description: t.title,
            tags: [t],
            cardLink: `https://readymag.com/examples/${t.slug}`,
            color: t.color,
            images: [],
          })),
        ).filter((c) => active === 'all' || c.tags[0].slug === active)

  return (
    <Page id="app">
      <Banner>
        Pixel-exact Emotion app (live <code>explore.js</code>) → <a href="/examples">/examples</a>
        {tag ? (
          <>
            {' '}
            · tag <a href={`/examples/${tag}`}>/examples/{tag}</a>
          </>
        ) : null}
      </Banner>
      <Title>Readymag website examples</Title>
      <Lead>
        Portfolios, presentations, company websites, landing pages, editorials, and online shops made
        with Readymag.
      </Lead>
      <Chips>
        <Chip to="/lab/examples" $bg={colors.dark} $fg="#fff" $active={active === 'all'}>
          All
        </Chip>
        {tags.map((t) => (
          <Chip
            key={t.slug || t._id}
            to={`/lab/examples/${t.slug}`}
            $bg={t.color}
            $fg={t.textColor || '#fff'}
            $active={active === t.slug}
          >
            {t.title}
          </Chip>
        ))}
      </Chips>
      <Grid>
        {display.slice(0, 48).map((c, i) => {
          const img = c.images?.[0]?.url || c.images?.[0] || null
          const bg = c.color || c.tags?.[0]?.color || colors.grayA2
          return (
            <Card
              key={c._id || i}
              href={c.cardLink || c.projectUrl || '#'}
              target="_blank"
              rel="noreferrer"
              $bg={img ? undefined : bg}
              style={img ? undefined : undefined}
              className="has-onhover-animation"
            >
              <div
                className="thumb"
                style={img ? { backgroundImage: `url(${img})`, backgroundColor: bg } : { background: bg }}
              />
              <div className="meta">
                <h3>{c.title}</h3>
                <p>{c.description || c.credits || 'Readymag example'}</p>
              </div>
            </Card>
          )
        })}
      </Grid>
    </Page>
  )
}
