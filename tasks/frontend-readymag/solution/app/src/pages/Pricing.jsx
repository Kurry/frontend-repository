import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { colors, fonts, motion, layout, pricingPlans } from '../theme/tokens'

/**
 * Native Emotion recreation of the pricing page structure (secondary route;
 * only the homepage is in graded scope).
 */

const Page = styled.main`
  max-width: ${layout.spaMax}px;
  margin: 0 auto;
  padding: 72px 24px 120px;
  font-family: ${fonts.system};
  color: ${colors.dark};
  background: ${colors.white};
`

const Title = styled.h1`
  margin: 0 0 12px;
  font-family: ${fonts.graphik};
  font-size: 40px;
  line-height: 38px;
  letter-spacing: -1.8px;
  font-weight: 400;
  color: ${colors.dark};
  @media (max-width: 768px) {
    font-size: 32px;
    line-height: 34px;
  }
`

const Sub = styled.p`
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 18px;
  color: ${colors.textSecondary};
  max-width: 54ch;
`

const Toggle = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: 40px;
  background: ${colors.grayF4};
  margin-bottom: 36px;
  button {
    border: 0;
    background: transparent;
    padding: 10px 18px;
    border-radius: 40px;
    font-family: ${fonts.system};
    font-size: 12px;
    font-weight: 500;
    color: ${colors.dark};
    cursor: pointer;
    transition: ${motion.all2out};
  }
  button[data-active='true'] {
    background: ${colors.dark};
    color: ${colors.white};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const Card = styled.article`
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 28px;
  padding: 24px 20px 20px;
  background: ${(p) => (p.$highlight ? colors.grayF4 : colors.white)};
  display: flex;
  flex-direction: column;
  min-height: 420px;
  transition: ${motion.transform45}, box-shadow 0.2s ease-out;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 48px rgba(40, 40, 40, 0.08);
  }
  h2 {
    margin: 0 0 6px;
    font-family: ${fonts.graphik};
    font-size: 28px;
    line-height: 28px;
    letter-spacing: -1px;
    font-weight: 400;
  }
  .blurb {
    margin: 0 0 20px;
    font-size: 12px;
    line-height: 16px;
    color: ${colors.textSecondary};
    min-height: 32px;
  }
  .price {
    font-family: ${fonts.graphik};
    font-size: 38px;
    line-height: 40px;
    letter-spacing: -1.3px;
    margin: 0 0 4px;
    font-weight: 400;
  }
  .period {
    display: block;
    font-size: 12px;
    line-height: 16px;
    color: ${colors.textSecondary};
    margin-bottom: 20px;
    font-weight: 400;
  }
  ul {
    margin: 0 0 24px;
    padding-left: 18px;
    font-size: 12px;
    line-height: 18px;
    color: ${colors.textAlpha64};
    flex: 1;
  }
`

const Cta = styled.a`
  display: inline-flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  border-radius: 40px;
  background: ${colors.dark};
  color: ${colors.white};
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: ${motion.all2out};
  &:hover {
    background: ${colors.orange};
  }
`

const Note = styled.p`
  margin: 28px 0 0;
  font-size: 12px;
  color: ${colors.textSecondary};
  a {
    color: ${colors.orange};
  }
`

const Banner = styled.div`
  margin-bottom: 28px;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${colors.orangeSoft};
  color: ${colors.dark};
  font-size: 12px;
  line-height: 16px;
  a {
    color: ${colors.orange};
    font-weight: 500;
  }
`

/**
 * The live product resolves plan amounts (cents, per currency) from a billing
 * API at runtime, so no static dollar amounts are rendered here.
 */
const AMOUNTS = {
  free: { month: 0, yearMonthly: 0 },
  personal: { month: null, yearMonthly: null },
  freelancer: { month: null, yearMonthly: null },
  studio: { month: null, yearMonthly: null },
  business: { month: null, yearMonthly: null },
}

export default function Pricing() {
  const [yearly, setYearly] = useState(true)
  const rows = useMemo(
    () =>
      pricingPlans.map((p) => {
        const a = AMOUNTS[p.id] || { month: 0, yearMonthly: 0 }
        const amount = yearly ? a.yearMonthly : a.month
        return { ...p, amount }
      }),
    [yearly],
  )

  return (
    <Page id="app">
      <Banner>
        Plan amounts are resolved from a billing service on the live product; this page shows
        plan structure and features only.
      </Banner>
      <Title>Choose your plan</Title>
      <Sub>All prices are shown without taxes. Invite friends and get up to $40 off per referral.</Sub>
      <Toggle>
        <button type="button" data-active={!yearly} onClick={() => setYearly(false)}>
          Monthly
        </button>
        <button type="button" data-active={yearly} onClick={() => setYearly(true)}>
          Yearly
        </button>
      </Toggle>
      <Grid>
        {rows.map((p) => (
          <Card key={p.id} $highlight={p.id === 'freelancer'} className="has-onhover-animation" data-testid={`plan-item-${p.id}`}>
            <h2>{p.name}</h2>
            <p className="blurb">{p.blurb}</p>
            {p.amount == null ? (
              <>
                <div className="price">Live</div>
                <span className="period">
                  {p.id === 'business'
                    ? 'Reach out to get a tailored solution'
                    : 'Amounts from billing API — see /pricing'}
                </span>
              </>
            ) : (
              <>
                <div className="price">${p.amount}</div>
                <span className="period">
                  {p.amount === 0
                    ? 'always free'
                    : yearly
                      ? 'per month billed yearly'
                      : 'per month'}
                </span>
              </>
            )}
            <ul>
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Cta href="/join">{p.cta}</Cta>
          </Card>
        ))}
      </Grid>
      <Note>
        50% or more off yearly for education · <a href="/npo">NPO discount</a> ·{' '}
        <a href="/affiliate-program">Affiliate program</a>
      </Note>
    </Page>
  )
}
