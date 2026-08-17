import { useState } from 'react'
import { PieChart, Pie, Cell, Sector, Tooltip } from 'recharts'

import './DeviceTypeDonut.css'

const SEGMENT_META = {
  energy_meter: { label: 'Meters', color: 'var(--ember)' },
  thermostat: { label: 'Thermostats', color: 'var(--teal)' },
  boiler: { label: 'Boilers', color: 'color-mix(in srgb, var(--teal) 60%, white)' },
}

const SEGMENT_ORDER = ['energy_meter', 'thermostat', 'boiler']

const CHART_SIZE = 120
const INNER_RADIUS = 36
const OUTER_RADIUS = 55

function renderActiveSlice (props) {
  return <Sector {...props} outerRadius={OUTER_RADIUS + 4} />
}

function DonutTooltip ({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const segment = payload[0].payload
  const percent = Math.round((segment.count / total) * 100)

  return (
    <div className="device-type-donut__tooltip">
      <span className="device-type-donut__tooltip-swatch" style={{ background: segment.color }} />
      <span className="device-type-donut__tooltip-label">{segment.label}</span>
      <span className="device-type-donut__tooltip-value">{segment.count} · {percent}%</span>
    </div>
  )
}

export default function DeviceTypeDonut ({ counts }) {
  const [activeIndex, setActiveIndex] = useState(-1)

  const total = counts.reduce((sum, { count }) => sum + count, 0)
  if (total === 0) return null

  const byType = Object.fromEntries(counts.map(({ type, count }) => [type, count]))
  const segments = SEGMENT_ORDER
    .map((type) => ({ type, count: byType[type] || 0, ...SEGMENT_META[type] }))
    .filter((segment) => segment.count > 0)

  return (
    <div className="device-type-donut">
      <div>
        <p className="device-type-donut__title">Devices by Type (All Facilities)</p>
        <div className="device-type-donut__chart-wrap">
          <PieChart
            width={CHART_SIZE}
            height={CHART_SIZE}
            className="device-type-donut__chart"
            role="img"
            aria-label="Device type distribution"
          >
            <Pie
              data={segments}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={INNER_RADIUS}
              outerRadius={OUTER_RADIUS}
              isAnimationActive={false}
              stroke="none"
              activeIndex={activeIndex}
              activeShape={renderActiveSlice}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {segments.map((segment) => (
                <Cell key={segment.type} fill={segment.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip total={total} />} />
          </PieChart>
          <div className="device-type-donut__center">
            <span className="device-type-donut__total">{total}</span>
            <span className="device-type-donut__total-label">{total === 1 ? 'Device' : 'Devices'}</span>
          </div>
        </div>
      </div>
      <ul className="device-type-donut__legend">
        {segments.map((segment) => (
          <li key={segment.type} className="device-type-donut__legend-item">
            <span className="device-type-donut__legend-swatch" style={{ background: segment.color }} />
            <span className="device-type-donut__legend-label">{segment.label}</span>
            <span className="device-type-donut__legend-count">{segment.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
