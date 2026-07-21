import React from 'react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Legend } from 'recharts'
import { TRAITS } from '../store'

const pretty = (value) => value.charAt(0).toUpperCase() + value.slice(1)

export default function TraitRadar({ primary, secondary, primaryName = 'Current persona', secondaryName = 'Comparison', compact = false }) {
  const safeNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
  const data = TRAITS.map((trait) => ({ trait: pretty(trait), primary: safeNumber(primary?.[trait]), secondary: safeNumber(secondary?.[trait]), fullMark: 100 }))
  const isReduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  const animate = !isReduced
  return (
    <div className={compact ? 'radar radar--compact' : 'radar'} aria-label="Trait radar chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={compact ? '65%' : '72%'}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="trait" tick={{ fill: '#94a3b8', fontSize: compact ? 9 : 11 }} />
          <Radar name={primaryName} dataKey="primary" stroke="#78a9ff" fill="#4589ff" fillOpacity={0.28} isAnimationActive={animate} animationDuration={260} />
          {secondary && <Radar name={secondaryName} dataKey="secondary" stroke="#42be65" fill="#42be65" fillOpacity={0.18} isAnimationActive={animate} animationDuration={260} />}
          {secondary && <Legend wrapperStyle={{ fontSize: 11 }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
