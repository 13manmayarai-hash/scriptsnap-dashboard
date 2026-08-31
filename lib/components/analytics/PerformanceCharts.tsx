'use client'

import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const SAGE = '#7A8B72'
const ERROR = '#B85C5C'
const BORDER = '#E0DDD3'
const INK_MUTED = '#706E68'

interface DailyPoint { date: string; views: number; watchTimeMinutes: number; subscribersNet: number }

function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function chartTooltipStyle() {
  return { backgroundColor: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 }
}

// Split out from the Analytics page and dynamically imported there —
// recharts is a real chunk of JS that most visits to that page never
// need (Free/Basic users never see a chart at all, and Pro users don't
// need it until the performance data has actually loaded), so it
// shouldn't be part of the page's initial bundle.
export default function PerformanceCharts({ daily }: { daily: DailyPoint[] }) {
  if (daily.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="card">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Views per day</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={daily}>
            <defs>
              <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SAGE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SAGE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: INK_MUTED }} minTickGap={30} />
            <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} width={36} />
            <Tooltip labelFormatter={(label) => shortDate(String(label))} contentStyle={chartTooltipStyle()} />
            <Area type="monotone" dataKey="views" stroke={SAGE} strokeWidth={2} fill="url(#viewsFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Watch time per day (minutes)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: INK_MUTED }} minTickGap={30} />
            <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} width={36} />
            <Tooltip labelFormatter={(label) => shortDate(String(label))} contentStyle={chartTooltipStyle()} />
            <Line type="monotone" dataKey="watchTimeMinutes" stroke={SAGE} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card lg:col-span-2">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Subscribers gained/lost per day</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: INK_MUTED }} minTickGap={30} />
            <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} width={36} />
            <Tooltip labelFormatter={(label) => shortDate(String(label))} contentStyle={chartTooltipStyle()} />
            <Bar dataKey="subscribersNet" radius={[3, 3, 3, 3]}>
              {daily.map((d, i) => (
                <Cell key={i} fill={d.subscribersNet >= 0 ? SAGE : ERROR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
