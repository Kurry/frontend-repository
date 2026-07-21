import { useMemo, useState } from 'react'
import { Gauge, ArrowsClockwise } from '@phosphor-icons/react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MODELS } from './schemas'
import { deriveAggregates, MODEL_COLORS, useQueueStore } from './store'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{payload[0].name}</strong><span>Mean reward {Number(payload[0].value).toFixed(3)}</span></div>
}

export default function AggregatesView() {
  const jobs = useQueueStore((state) => state.jobs)
  const [hidden, setHidden] = useState(() => new Set())
  const aggregates = useMemo(() => deriveAggregates(jobs), [jobs])
  const chartData = [{ group: 'Completed jobs', ...aggregates.meanRewardByModel }]
  const toggle = (model) => setHidden((current) => {
    const next = new Set(current)
    if (next.has(model)) next.delete(model); else next.add(model)
    return next
  })

  return (
    <div className="aggregates-grid">
      <section className="panel chart-panel">
        <div className="panel-heading"><div><p className="section-kicker">Quality</p><h2>Mean reward by model</h2></div><span className="panel-note">Completed jobs only</span></div>
        <div className="chart-legend" aria-label="Toggle model series">{MODELS.map((model) => <button key={model} className={hidden.has(model) ? 'legend-hidden' : ''} onClick={() => toggle(model)} aria-pressed={!hidden.has(model)}><span style={{ background: MODEL_COLORS[model] }} aria-hidden="true" />{model}</button>)}</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={395} minWidth={0} minHeight={320}>
            <BarChart data={chartData} barGap={10} margin={{ top: 15, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#27322e" />
              <XAxis dataKey="group" stroke="#7e8b85" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 1]} stroke="#7e8b85" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(114, 215, 174, .04)' }} />
              {MODELS.map((model) => (
                <Bar
                  key={model}
                  dataKey={model}
                  name={model}
                  hide={hidden.has(model)}
                  fill={MODEL_COLORS[model]}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={58}
                  animationDuration={400}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel cost-panel">
        <div className="cost-icon"><Gauge size={25} aria-hidden="true" /></div>
        <p>Total evaluation cost</p>
        <strong>${aggregates.totalCost.toFixed(2)}</strong>
        <span>Derived live from completed trials</span>
        <div className="model-cost-list">{MODELS.map((model) => <div key={model}><i style={{ background: MODEL_COLORS[model] }} aria-hidden="true" /><span>{model}</span><b>{jobs.flatMap((job) => job.model === model ? job.trials : []).filter((trial) => trial.status === 'completed').length} trials</b></div>)}</div>
      </section>
      <section className="panel aggregate-context">
        <div className="panel-sparkline" aria-label="Lane throughput comparison">
          <div className="sparkline-row"><span>Northgale</span><div className="sparkline-track"><i className="spark-normal" /></div></div>
          <div className="sparkline-row"><span>Bluefjord</span><div className="sparkline-track"><i className="spark-throttled" /></div></div>
          <div className="sparkline-row"><span>Skylark</span><div className="sparkline-track"><i className="spark-normal" /></div></div>
        </div>
        <div><ArrowsClockwise size={20} aria-hidden="true" /><span>Live calculation</span></div><p>Rewards and cost update the moment a running trial completes. Hidden chart series remain in the queue snapshot.</p>
      </section>
    </div>
  )
}
