/** Design tokens for the Canvasly recreation (PRD color/typography/layout values). */
export const colors = {
  black: 'rgba(0, 0, 0, 1)',
  black31: 'rgba(0, 0, 0, 0.31)',
  dark: '#282828',
  dark96: 'rgba(40, 40, 40, 0.96)',
  gray: 'rgba(128, 128, 128, 1)',
  gray24: 'rgba(128, 128, 128, 0.24)',
  grayA2: '#A2A2A2',
  gray8C: '#6E6E6E',
  grayAAA: '#AAAAAA',
  grayB8: '#B8B8B8',
  grayF4: '#F4F4F4',
  grayF4_96: 'rgba(244, 244, 244, 0.96)',
  // Accessible body/support text on the white canvas (>= WCAG AA 4.5:1).
  // The reference's rgba(0,0,0,.392) (#9b9b9b, ~2.8:1) is kept only as a
  // decorative token; real copy uses this AA-compliant value.
  textBodyOnWhite: 'rgba(0, 0, 0, 0.62)',
  white: '#FFFFFF',
  white52: '#FFFFFF52',
  orange: '#EC520B',
  orangeHero: 'rgba(255, 102, 0, 1)',
  orangeSoft: '#FBDCCE',
  amber: '#F8A32C',
  yellow: '#FFCB00',
  yellowBright: '#FFD600',
  lime: '#BFE500',
  green: '#408D27',
  greenDark: '#005240',
  blue: '#0080FF',
  blueSoft: '#CCE6FF',
  blueDeep: '#032BFF',
  indigo: '#3242A8',
  pink: '#FF7CBE',
  gold: '#A07A40',
  cookieBg: '#444444',
  cookiePopup: '#4f4f4f',
  textPrimary: '#282828',
  textSecondary: '#6E6E6E',
  // Decorative reference value (low contrast) — NOT used for real body copy.
  textAlpha64Ref: 'rgba(0, 0, 0, 0.392)',
  textAlpha64: 'rgba(0, 0, 0, 0.62)',
  tagPortfolio: '#FF88BA',
  tagLanding: '#FFCB00',
  tagEditorial: '#008BFF',
  tagBusiness: '#A6A6A6',
  tagStudio: '#4AAC54',
  tagByTeam: '#EC520B',
  viewerBlue: '#0078ff',
  rgb255_72_40: 'rgb(255, 72, 40)',
}

export const fonts = {
  graphik: '"Graphik", "Inter", -apple-system, system-ui, sans-serif',
  inter: 'Inter, "Graphik", -apple-system, system-ui, sans-serif',
  pxGrotesk: '"Graphik", "Px Grotesk", custom_157067, sans-serif',
  pxGroteskBold: '"Graphik", "Px Grotesk", custom_162036, sans-serif',
  system:
    '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Fira Sans", Roboto, "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
}

/** Type scale (px) — Graphik-first display faces, Inter UI faces. */
export const type = {
  h1Px: { fontFamily: fonts.graphik, fontSize: 60, lineHeight: 52, letterSpacing: -2, fontWeight: 400 },
  h2Px: { fontFamily: fonts.graphik, fontSize: 40, lineHeight: 38, letterSpacing: -1.8, fontWeight: 400 },
  h3Px: { fontFamily: fonts.graphik, fontSize: 28, lineHeight: 28, letterSpacing: -1, fontWeight: 400 },
  h1Inter: { fontFamily: fonts.inter, fontSize: 38, lineHeight: 40, letterSpacing: -1.3, fontWeight: 400, fontVariationSettings: "'wght' 550" },
  h2Inter: { fontFamily: fonts.inter, fontSize: 16, lineHeight: 20, letterSpacing: -0.2, fontWeight: 400, fontVariationSettings: "'wght' 550" },
  body1Px: { fontFamily: fonts.graphik, fontSize: 21, lineHeight: 24, letterSpacing: -1, fontWeight: 400 },
  body2Px: { fontFamily: fonts.graphik, fontSize: 18, lineHeight: 20, letterSpacing: -0.8, fontWeight: 400 },
  body3Px: { fontFamily: fonts.graphik, fontSize: 16, lineHeight: 18, fontWeight: 400 },
  body1Inter: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 14, fontWeight: 400, fontVariationSettings: "'wght' 550" },
  body2Inter: { fontFamily: fonts.inter, fontSize: 10, lineHeight: 10, letterSpacing: 0, fontWeight: 400, fontVariationSettings: "'wght' 550" },
  body3Inter: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 16, fontWeight: 400, fontVariationSettings: "'wght' 550" },
  caption1Px: { fontFamily: fonts.graphik, fontSize: 14, lineHeight: 16, letterSpacing: -0.2, fontWeight: 700 },
  caption2Px: { fontFamily: fonts.graphik, fontSize: 12, lineHeight: 14, letterSpacing: 0, fontWeight: 700 },
  spaPrice: { fontFamily: fonts.system, fontSize: 16, fontWeight: 500 },
}

export const layout = {
  desktopWidth: 1024,
  phoneWidth: 320,
  scaleWidth: 3600,
  pageHeightDesktop: 3690,
  pageHeightPhone: 5819,
  cursorSize: 43,
  slideshowWidth: 276,
  spaMax: 1200,
  cookieMax: 478,
}

export const motion = {
  easeViewer: 'cubic-bezier(.56,.86,.59,1)',
  transform45: 'transform .45s cubic-bezier(.56,.86,.59,1)',
  opacity2: 'opacity .2s ease-in-out',
  opacity4: 'opacity .4s ease-in-out',
  all2out: 'all .2s ease-out',
  all15out: 'all .15s ease-out',
  all3inout: 'all .3s ease-in-out',
  slideshow: 'opacity 0s ease-in-out',
  preloader: '1.3s linear 0s infinite normal',
  spin: '.8s infinite linear',
}

export const hairlines = {
  muted: `linear-gradient(to right, ${colors.black31} 0%, ${colors.black31} 100%) 0 90%/1px 2px repeat-x`,
  black: `linear-gradient(to right, ${colors.black} 0%, ${colors.black} 100%) 0 100%/1px 1px repeat-x`,
  white: `linear-gradient(to right, ${colors.white} 0%, ${colors.white} 100%) 0 95%/1px 1px repeat-x`,
}

export const exampleTags = [
  { slug: 'portfolio', title: 'Portfolios', color: colors.tagPortfolio, textColor: '#fff' },
  { slug: 'landing-pages', title: 'Landing pages', color: colors.tagLanding, textColor: '#fff' },
  { slug: 'editorial', title: 'Editorials', color: colors.tagEditorial, textColor: '#fff' },
  { slug: 'business-website', title: 'Company websites', color: colors.tagBusiness, textColor: '#fff' },
  { slug: 'design-studio', title: 'Design studios', color: colors.tagStudio, textColor: '#fff' },
  { slug: 'by-canvasly-team', title: 'by Canvasly team', color: colors.tagByTeam, textColor: '#fff' },
]

/** Pricing plan structure (names, blurbs, features). Live amounts come from a billing API. */
export const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    cta: 'Try for free',
    blurb: 'always free',
    features: ['Free Canvasly hosting', 'Publish with a Canvasly subdomain', 'Core widgets'],
  },
  {
    id: 'personal',
    name: 'Personal',
    cta: 'Subscribe',
    blurb: 'For individual designers',
    features: ['Custom domains', 'Remove Canvasly branding', 'Forms & analytics', 'Bundled open-license fonts'],
  },
  {
    id: 'freelancer',
    name: 'Freelancer',
    cta: 'Subscribe',
    blurb: 'Client work & handoff',
    features: ['More published websites', 'Project transfer', 'Collaborators', 'Code export / PDF'],
  },
  {
    id: 'studio',
    name: 'Studio',
    cta: 'Subscribe',
    blurb: 'Teams shipping together',
    features: ['Team seats', 'Version history', 'Priority support', 'Advanced SEO'],
  },
  {
    id: 'business',
    name: 'Business',
    cta: 'Subscribe',
    blurb: 'Reach out to get a tailored solution',
    features: ['Personal manager', 'Onboarding sessions', 'Prepublish checks', 'Volume domains & views'],
  },
]
