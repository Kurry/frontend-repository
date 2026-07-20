import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { css, keyframes } from '@emotion/react'
import { colors, fonts, layout, motion, hairlines, exampleTags, type } from '../theme/tokens'
import { webmcpBus } from '../webmcp/registerWebmcp'
import TrialBrief from '../components/TrialBrief'

/**
 * Native homepage — React/Emotion implementation of the 1024px Readymag
 * homepage design. The artboard scales down from the top-left on narrow
 * viewports (scale = min(1, vw / 1024)) and the document height follows the
 * scale, per the PRD's responsive contract.
 */

const DESIGN_WIDTH = layout.desktopWidth // 1024

const IMG = '/media/images/homepage'

// Opening gallery rows (mirrored local project imagery, 165:100 crops).
const ROW1 = [
  `${IMG}/4267026/image-bace0915-e4cd-4be5-8992-d06a68285eef.webp`,
  `${IMG}/5725690/image-1957a8d5-7fc8-473c-9c64-47bf4b7468a7.webp`,
  `${IMG}/5725690/image-ad491d0d-a48b-4c97-af5b-f90111a72a1b.webp`,
  `${IMG}/5725690/image-a06a6882-eebe-4abd-91aa-d91d7dc03e77.webp`,
]
const ROW2 = [
  `${IMG}/5725690/image-a579a6bd-f09c-4912-9664-260883df464d.webp`,
  `${IMG}/5725690/image-c182519e-a81f-4099-ae94-2f946f74e367.webp`,
  `${IMG}/5725690/image-124e4676-8ee6-4558-8212-a6f1f4c20dfe.webp`,
  `${IMG}/5725690/image-94e40677-411c-4629-a634-dd83da677ec3.webp`,
  `${IMG}/4267026/image-f3faea49-2d1d-4324-ac09-969068666c6c.webp`,
  `${IMG}/5725690/image-009b03ba-f433-4cab-93f4-143c5760b39d.webp`,
]
const ROW3 = [
  `${IMG}/4267026/image-109139a7-90be-4d39-8dcb-e0bf01bbd1dc.webp`,
  `${IMG}/5725690/image-7d18a54c-aa05-445a-84f1-ffe6479313b0.webp`,
  `${IMG}/5725690/image-49ec59de-177c-413a-b397-fcc1cd9093ca.webp`,
  `${IMG}/5725690/image-be6e185a-5eb9-4054-a8d8-f2a194151246.webp`,
  `${IMG}/5725690/image-4a5f246a-4497-4b75-870c-bb343a8f3a96.webp`,
  `${IMG}/5725690/image-31d4ade9-63e4-49e5-b018-fdafc4af6184.webp`,
  `${IMG}/5725690/image-db1b910d-9d6c-4b3f-97dd-74385862c6eb.webp`,
  `${IMG}/5725690/image-63fd1c2f-b8c5-4fa6-9872-f8771ec257b0.webp`,
]

const SLIDES = [
  `${IMG}/4267026/image-3bc1ba86-2cf9-444a-8cf9-21598b57aa42.webp`,
  `${IMG}/4267026/image-3dd24827-2cd2-460f-9980-55d3036c40e7.webp`,
  `${IMG}/4267026/image-002875d0-59a0-42f4-ab7d-6d2490f7c91d.webp`,
  `${IMG}/4267026/image-067612e1-a8df-4936-9e93-03fd0bd6cde5.webp`,
  `${IMG}/4267026/image-1247fb08-59df-431a-95f8-f041abe6340b.webp`,
  `${IMG}/4267026/image-1480a3ae-2589-42a9-a65b-470935a57c1b.webp`,
]

/* ---------------------------------------------------------------- motion */

const galleryTravel1 = keyframes`
  0% { offset-distance: 0px; }
  100% { offset-distance: 1496px; }
`
const galleryTravel2 = keyframes`
  0% { offset-distance: 0px; }
  100% { offset-distance: 1655px; }
`
const galleryTravel3 = keyframes`
  0% { offset-distance: 0px; }
  100% { offset-distance: 1696px; }
`
const marqueeTravel = keyframes`
  0% { offset-distance: 0px; }
  100% { offset-distance: 1496px; }
`
const orbTravel = keyframes`
  0% { offset-distance: 0px; }
  100% { offset-distance: 1561px; }
`
const tiltNeg = keyframes`
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  100% { transform: translate(-8px, -15px) rotate(-6deg) scale(1); }
`
const tiltPos = keyframes`
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  100% { transform: translate(8px, -16px) rotate(6deg) scale(1); }
`
const tiltNegSmall = keyframes`
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  100% { transform: translate(-6px, -6px) rotate(-6deg) scale(1); }
`
const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0); }
`

/* ---------------------------------------------------------------- layout */

const ScrollWrapper = styled.div`
  overflow: visible;
`

const Artboard = styled.main`
  width: ${DESIGN_WIDTH}px;
  max-width: ${layout.scaleWidth}px;
  background: ${colors.white};
  color: ${colors.dark};
  transform-origin: top left;
`

const Hero = styled.section`
  position: relative;
  padding: 0 0 72px;
`

const GalleryBand = styled.div`
  position: relative;
  height: 528px;
  margin-bottom: 56px;
`

const GalleryRow = styled.div`
  position: absolute;
  left: ${(p) => p.$left}px;
  top: ${(p) => p.$top}px;
  width: ${(p) => p.$width}px;
  height: ${(p) => p.$height}px;
`

const GalleryTrack = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: ${(p) => p.$width}px;
  height: ${(p) => p.$height}px;
  display: flex;
  gap: ${(p) => p.$gap}px;
  offset-rotate: 0deg;
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    offset-distance: 0 !important;
  }
`

const GalleryTile = styled.img`
  flex: 0 0 ${(p) => p.$w}px;
  width: ${(p) => p.$w}px;
  height: ${(p) => p.$h}px;
  object-fit: cover;
  display: block;
`

const HeroInner = styled.div`
  position: relative;
  padding: 0 28px;
`

const HeroTitle = styled.h1`
  margin: 0 0 20px;
  font-family: ${fonts.pxGrotesk};
  font-size: ${type.h1Px.fontSize}px;
  line-height: 0.9;
  letter-spacing: -2px;
  font-weight: 400;
  color: ${colors.black};
  max-width: 15ch;
  animation: ${fadeUp} 0.8s ${motion.easeViewer} both;
`

const HeroSub = styled.p`
  margin: 0 0 28px;
  font-family: ${fonts.pxGrotesk};
  font-size: ${type.body1Px.fontSize}px;
  line-height: ${type.body1Px.lineHeight}px;
  letter-spacing: ${type.body1Px.letterSpacing}px;
  color: ${colors.textAlpha64};
  max-width: 36ch;
  animation: ${fadeUp} 0.8s ${motion.easeViewer} 0.08s both;
`

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  animation: ${fadeUp} 0.8s ${motion.easeViewer} 0.16s both;
`

const PrimaryCta = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 22px;
  height: 44px;
  border-radius: 102px;
  background: ${colors.dark};
  color: ${colors.white};
  text-decoration: none;
  font-family: ${fonts.inter};
  font-size: 14px;
  line-height: 16px;
  font-variation-settings: 'wght' 550;
  transition:
    ${motion.transform45},
    background-color 0.2s ease-in-out;
  &:hover {
    background: ${colors.orangeHero};
    transform: translateY(-2px);
  }
`

const GhostLink = styled.a`
  color: ${colors.dark};
  font-family: ${fonts.inter};
  font-size: 14px;
  line-height: 16px;
  text-decoration: none;
  background: ${hairlines.muted};
  padding-bottom: 3px;
  transition: color 0.2s linear;
  &:hover {
    background: ${hairlines.black};
  }
`

const FloatingCard = styled.div`
  position: absolute;
  right: 44px;
  top: -36px;
  width: 380px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.12);
  animation: ${tiltNeg} 4.5s ease-in-out infinite alternate;
  video {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    background: ${colors.grayF4};
  }
  @media (max-width: 768px) {
    display: none;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
  }
`

const HelloCluster = styled.div`
  margin-top: 88px;
  padding: 0 28px;
  font-family: 'custom_37866', ${fonts.pxGrotesk};
  font-size: 132px;
  line-height: 0.92;
  letter-spacing: -3px;
  .hello {
    display: inline-block;
    color: ${colors.orangeHero};
    animation: ${fadeUp} 0.6s ${motion.easeViewer} both;
  }
  .ready {
    display: inline-block;
    margin-left: 40px;
    color: #7a24ff;
    animation: ${tiltPos} 3.2s ease-in-out infinite alternate;
  }
  .qmark {
    display: inline-block;
    margin-left: 8px;
    color: #7a24ff;
    animation: ${tiltNegSmall} 3.2s ease-in-out infinite alternate;
  }
  @media (prefers-reduced-motion: reduce) {
    .hello,
    .ready,
    .qmark {
      animation: none;
      transform: none;
      opacity: 1;
    }
  }
`

const Section = styled.section`
  padding: 96px 28px;
`

const SectionTitle = styled.h2`
  margin: 0 0 16px;
  font-family: ${fonts.pxGrotesk};
  font-size: ${type.h2Px.fontSize}px;
  line-height: ${type.h2Px.lineHeight}px;
  letter-spacing: ${type.h2Px.letterSpacing}px;
  font-weight: 400;
  color: ${colors.dark};
`

const SectionBody = styled.p`
  margin: 0 0 12px;
  font-family: ${fonts.pxGrotesk};
  font-size: ${type.body2Px.fontSize}px;
  line-height: ${type.body2Px.lineHeight}px;
  letter-spacing: ${type.body2Px.letterSpacing}px;
  color: ${colors.textAlpha64};
  max-width: 52ch;
`

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 48px 32px;
  margin-top: 48px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const FeatureCard = styled.article`
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: translateY(${(p) => (p.$visible ? '0' : '28px')});
  transition:
    opacity 0.45s ${motion.easeViewer},
    transform 0.45s ${motion.easeViewer};
  transition-delay: ${(p) => p.$delay || '0ms'};
  h3 {
    margin: 0 0 10px;
    font-family: ${fonts.pxGrotesk};
    font-size: ${type.h3Px.fontSize}px;
    line-height: ${type.h3Px.lineHeight}px;
    letter-spacing: ${type.h3Px.letterSpacing}px;
    font-weight: 400;
  }
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
  }
`

const Slideshow = styled.div`
  display: flex;
  gap: 16px;
  overflow: hidden;
  margin-top: 56px;
`

const Slide = styled.div`
  flex: 0 0 ${layout.slideshowWidth}px;
  width: ${layout.slideshowWidth}px;
  height: 180px;
  border-radius: 12px;
  background-color: ${colors.grayF4};
  background-image: url(${(p) => p.$src});
  background-size: cover;
  background-position: center;
  opacity: ${(p) => (p.$active ? 1 : 0.35)};
  transition: opacity 0.35s ease-in-out;
`

const TagGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 40px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

const Tag = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 88px;
  border-radius: 16px;
  background: ${(p) => p.$bg};
  color: #fff;
  text-decoration: none;
  font-family: ${fonts.inter};
  font-size: 14px;
  line-height: 16px;
  font-variation-settings: 'wght' 550;
  transition: ${motion.transform45}, ${motion.opacity2};
  &:hover {
    transform: rotate(-2deg) scale(1.02);
  }
  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
    }
  }
`

const SupportBand = styled.section`
  background: ${colors.dark};
  color: ${colors.white};
  padding: 96px 28px 72px;
  text-align: center;
  h2 {
    margin: 0 0 16px;
    font-family: ${fonts.pxGrotesk};
    font-size: ${type.h2Px.fontSize}px;
    line-height: ${type.h2Px.lineHeight}px;
    letter-spacing: ${type.h2Px.letterSpacing}px;
    font-weight: 400;
  }
  p {
    margin: 0 auto;
    max-width: 40ch;
    font-family: ${fonts.pxGrotesk};
    font-size: ${type.body2Px.fontSize}px;
    line-height: ${type.body2Px.lineHeight}px;
    letter-spacing: ${type.body2Px.letterSpacing}px;
    color: rgba(255, 255, 255, 0.85);
  }
  .accent {
    color: ${colors.orangeHero};
  }
`

const OrbLane = styled.div`
  position: relative;
  height: 120px;
  margin-top: 48px;
`

const PathOrb = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${colors.orangeHero};
  offset-path: path('M 0 0 C 120 80, 240 -40, 480 60 S 820 20, 960 80');
  offset-rotate: 0deg;
  animation: ${orbTravel} 18s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    offset-distance: 0;
  }
`

const MarqueeSection = styled.section`
  padding: 96px 0;
  overflow: hidden;
`

const MarqueeLane = styled.div`
  position: relative;
  height: 80px;
`

const MarqueeTrack = styled.div`
  position: absolute;
  left: -1496px;
  top: 0;
  display: flex;
  gap: 48px;
  white-space: nowrap;
  font-family: ${fonts.pxGrotesk};
  font-size: 60px;
  letter-spacing: -2px;
  color: ${colors.dark};
  offset-path: path('M 0 40 L 2000 40');
  offset-rotate: 0deg;
  animation: ${marqueeTravel} 28s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    offset-distance: 0;
  }
`

const Closing = styled.section`
  padding: 120px 28px;
  text-align: center;
  h2 {
    margin: 0 0 12px;
    font-family: ${fonts.pxGrotesk};
    font-size: 60px;
    line-height: 0.95;
    letter-spacing: -2px;
    font-weight: 400;
  }
  p {
    margin: 0 0 28px;
    font-family: ${fonts.inter};
    font-size: 14px;
    color: ${colors.textAlpha64};
  }
`

/* ---------------------------------------------------------------- data */

const FEATURES = [
  {
    title: 'Enjoy easy workflow',
    body: 'The intuitive drag-and-drop interface gives you everything you need. Designers can switch to Readymag seamlessly, and marketers quickly get used to it.',
  },
  {
    title: 'Streamline teamwork',
    body: 'Collaborate in real time — comment, iterate, and ship without leaving the canvas.',
  },
  {
    title: 'Attract with interactivity',
    body: 'Scroll animations, hover states, custom cursors, video, and Lottie — built into the Viewer.',
  },
  {
    title: 'Expand functionality to infinity',
    body: 'Integrate embeds, forms, e-commerce, analytics, and code snippets when you need them.',
  },
]

const MARQUEE_LABELS = [
  'Company websites',
  'Landing pages',
  'Editorials',
  'Presentations',
  'Design studios',
  'Portfolios',
]

/* ---------------------------------------------------------------- hooks */

function useInView(ref, rootMargin = '0px 0px -10% 0px') {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true)
      },
      { rootMargin, threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return visible
}

/** Zoom the 1024px design down to the viewport from the top-left origin. */
function useArtboardScale(wrapRef, pageRef) {
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current
      const page = pageRef.current
      if (!wrap || !page) return
      const scale = Math.min(1, window.innerWidth / DESIGN_WIDTH)
      page.style.transform = scale < 1 ? `scale(${scale})` : 'none'
      wrap.style.height = `${Math.round(page.offsetHeight * scale)}px`
    }
    fit()
    window.addEventListener('resize', fit)
    let ro
    if (typeof ResizeObserver !== 'undefined' && pageRef.current) {
      ro = new ResizeObserver(fit)
      ro.observe(pageRef.current)
    }
    return () => {
      window.removeEventListener('resize', fit)
      if (ro) ro.disconnect()
    }
  }, [wrapRef, pageRef])
}

/* ---------------------------------------------------------------- parts */

function GalleryMarquee() {
  // Track widths mirror the tile pitch so each loop advances exactly one
  // sequence: 8×360 + 7×14 = 2978, 12×264 + 11×12 = 3300, 16×200 + 15×12 = 3380.
  const rows = [
    {
      images: [...ROW1, ...ROW1],
      left: -424,
      top: 0,
      width: 2978,
      tileW: 360,
      tileH: 219,
      gap: 14,
      path: "path('M 1489.01 109.5 C 1489.01 109.5 -6.995 109.5 -6.995 109.5')",
      anim: galleryTravel1,
      duration: '40s',
    },
    {
      images: [...ROW2, ...ROW2],
      left: -186,
      top: 233,
      width: 3300,
      tileW: 264,
      tileH: 160,
      gap: 12,
      path: "path('M 1649.5 80 C 1649.5 80 -5.5 80 -5.5 80')",
      anim: galleryTravel2,
      duration: '46s',
    },
    {
      images: [...ROW3, ...ROW3],
      left: -506,
      top: 407,
      width: 3380,
      tileW: 200,
      tileH: 121,
      gap: 12,
      path: "path('M 1690.5 60.5 C 1690.5 60.5 -5.5 60.5 -5.5 60.5')",
      anim: galleryTravel3,
      duration: '52s',
    },
  ]
  return (
    <GalleryBand aria-hidden="true">
      {rows.map((row, i) => (
        <GalleryRow key={i} $left={row.left} $top={row.top} $width={row.width} $height={row.tileH}>
          <GalleryTrack
            className="rm-anim-path"
            $width={row.width}
            $height={row.tileH}
            $gap={row.gap}
            css={css`
              offset-path: ${row.path};
              animation: ${row.anim} ${row.duration} linear infinite;
            `}
          >
            {row.images.map((src, j) => (
              <GalleryTile key={j} src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'} $w={row.tileW} $h={row.tileH} />
            ))}
          </GalleryTrack>
        </GalleryRow>
      ))}
    </GalleryBand>
  )
}

function ProjectSlideshow() {
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  activeRef.current = active
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((s) => (s + 1) % SLIDES.length), 2200)
    return () => clearInterval(id)
  }, [])
  // WebMCP session_advance drives the SAME setActive the timer uses.
  useEffect(() => {
    webmcpBus.advanceSlideshow = () => {
      const next = (activeRef.current + 1) % SLIDES.length
      setActive(next)
      return { ok: true, active: next, total: SLIDES.length }
    }
    return () => {
      if (webmcpBus.advanceSlideshow) webmcpBus.advanceSlideshow = null
    }
  }, [])
  return (
    <Slideshow
      className="common-slideshow"
      role="group"
      aria-roledescription="carousel"
      aria-label="Rotating gallery of projects made with Readymag"
    >
      {SLIDES.map((src, i) => (
        <Slide
          key={src}
          $src={src}
          $active={i === active}
          role="img"
          aria-label={`Project example ${i + 1} of ${SLIDES.length}`}
        />
      ))}
    </Slideshow>
  )
}

/* ---------------------------------------------------------------- page */

export default function Home() {
  const wrapRef = useRef(null)
  const pageRef = useRef(null)
  const featRef = useRef(null)
  const featuresVisible = useInView(featRef)
  useArtboardScale(wrapRef, pageRef)

  return (
    <ScrollWrapper className="content-scroll-wrapper" ref={wrapRef}>
      <Artboard className="page" ref={pageRef}>
        <Hero id="rm-section-hero" aria-label="Introduction">
          <GalleryMarquee />
          <HeroInner>
            <FloatingCard className="has-onhover-animation" aria-hidden="true">
              <video
                poster="/media/video/hero/poster.jpg"
                src="/media/video/hero/playlist.m3u8"
                muted
                playsInline
                preload="none"
              />
            </FloatingCard>
            <HeroTitle>Design and launch outstanding websites</HeroTitle>
            <HeroSub>Design, prototype, collaborate, publish.</HeroSub>
            <CtaRow>
              <PrimaryCta href="/join" className="rm-hotspot">
                Try Readymag
              </PrimaryCta>
              <GhostLink href="/pricing">or choose your subscription plan</GhostLink>
            </CtaRow>
          </HeroInner>
          <HelloCluster aria-hidden="true">
            <span className="hello rm-anim-load">Hello!</span>
            <span className="ready rm-anim-tilt">Ready</span>
            <span className="qmark rm-anim-tilt">?</span>
          </HelloCluster>
        </Hero>

        <Section id="rm-section-workflow" ref={featRef} aria-label="Workflow">
          <SectionTitle>Enjoy easy workflow</SectionTitle>
          <SectionBody>
            The intuitive drag-and-drop interface gives you everything you need. Designers can
            switch to Readymag seamlessly, and marketers quickly get used to it.
          </SectionBody>
          <FeatureGrid>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} $visible={featuresVisible} $delay={`${i * 80}ms`}>
                <h3>{f.title}</h3>
                <SectionBody as="p">{f.body}</SectionBody>
              </FeatureCard>
            ))}
          </FeatureGrid>
          <ProjectSlideshow />
        </Section>

        <Section id="rm-section-teams" aria-label="Use cases">
          <SectionTitle>
            Teams of all sizes
            <br />
            create websites with Readymag
          </SectionTitle>
          <TagGrid>
            {exampleTags.map((t) => (
              <Tag key={t.slug} href={`/examples/${t.slug}`} $bg={t.color}>
                {t.title}
              </Tag>
            ))}
          </TagGrid>
        </Section>

        <SupportBand id="rm-section-support" aria-label="Support">
          <h2>Get the best support</h2>
          <p>
            Our agents offer{' '}
            <span className="accent">around-the-clock support on business days</span> and treat you
            with care.
          </p>
          <OrbLane aria-hidden="true">
            <PathOrb className="rm-anim-path" />
          </OrbLane>
        </SupportBand>

        <MarqueeSection aria-label="What people build with Readymag">
          <MarqueeLane>
            <MarqueeTrack className="rm-anim-path" aria-hidden="true">
              {[...MARQUEE_LABELS, ...MARQUEE_LABELS].map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </MarqueeTrack>
            <span
              css={css`
                position: absolute;
                width: 1px;
                height: 1px;
                overflow: hidden;
                clip-path: inset(50%);
              `}
            >
              {MARQUEE_LABELS.join(', ')}
            </span>
          </MarqueeLane>
        </MarqueeSection>

        <Closing id="rm-section-closing" aria-label="Sign up">
          <h2>Try for free</h2>
          <p>or choose your subscription plan</p>
          <CtaRow style={{ justifyContent: 'center' }}>
            <PrimaryCta href="/join">Try Readymag</PrimaryCta>
            <GhostLink href="/pricing">View pricing</GhostLink>
          </CtaRow>
          <TrialBrief />
        </Closing>
      </Artboard>
    </ScrollWrapper>
  )
}
