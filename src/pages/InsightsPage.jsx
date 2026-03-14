import { useState, useEffect } from 'react'
import { subDays, format, endOfDay } from 'date-fns'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import useAuthStore from '../stores/authStore'
import useEntriesStore from '../stores/entriesStore'
import useSettingsStore from '../stores/settingsStore'
import './InsightsPage.css'

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
]

export default function InsightsPage() {
  const user = useAuthStore(s => s.user)
  const { entries, fetchEntries, loading } = useEntriesStore()
  const { userWeightKg } = useSettingsStore()
  const [range, setRange] = useState(7)

  useEffect(() => {
    if (user) {
      fetchEntries(user.$id, subDays(new Date(), range), endOfDay(new Date()))
    }
  }, [user, range])

  const dailyData = []
  for (let i = range - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dayEntries = entries.filter(e => {
      const d = new Date(e.timestamp)
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate()
    })
    const fluids = dayEntries.filter(e => e.entryType === 'fluid')
    const voids = dayEntries.filter(e => e.entryType === 'void')
    const changes = dayEntries.filter(e => e.entryType === 'change')

    const padUrineOut = changes.reduce((sum, e) => {
      if (e.wetWeightG && e.productDryWeightG) {
        return sum + Math.max(0, e.wetWeightG - e.productDryWeightG)
      }
      return sum
    }, 0)

    const urineOut = voids.reduce((s, e) => s + (e.urineAmount || 0), 0)
    const fluidIn = fluids.reduce((s, e) => s + (e.fluidAmount || 0), 0)

    dailyData.push({
      day: format(date, 'EEE'),
      date: format(date, 'd/M'),
      fluidIn,
      urineOut,
      padUrineOut,
      totalOut: urineOut + padUrineOut,
      balance: fluidIn - (urineOut + padUrineOut),
      leaks: voids.filter(e => e.leaked).length,
      avgUrgency: voids.length
        ? +(voids.reduce((s, e) => s + (e.urgencyLevel || 0), 0) / voids.length).toFixed(1)
        : null,
    })
  }

  const totalFluidIn = dailyData.reduce((s, d) => s + d.fluidIn, 0)
  const totalUrineOut = dailyData.reduce((s, d) => s + d.urineOut, 0)
  const totalPadOut = dailyData.reduce((s, d) => s + d.padUrineOut, 0)
  const totalOut = totalUrineOut + totalPadOut
  const netBalance = totalFluidIn - totalOut

  const expectedDailyOutput = userWeightKg ? Math.round(userWeightKg * 30) : null

  const hourBuckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, leaks: 0, highUrgency: 0 }))
  entries.forEach(e => {
    if (e.entryType !== 'void') return
    const hour = new Date(e.timestamp).getHours()
    if (e.leaked) hourBuckets[hour].leaks++
    if (e.urgencyLevel >= 4) hourBuckets[hour].highUrgency++
  })
  const troubleHours = hourBuckets
    .filter(h => h.leaks > 0 || h.highUrgency > 0)
    .sort((a, b) => (b.leaks + b.highUrgency) - (a.leaks + a.highUrgency))
    .slice(0, 5)

  const tickLabel = range <= 7 ? 'day' : 'date'
  const hasPadData = totalPadOut > 0

  return (
    <div className="page fade-in">
      <h1 className="page-title">Insights</h1>

      <div className="range-selector">
        {RANGES.map(r => (
          <button
            key={r.days}
            className={`range-btn ${range === r.days ? 'active' : ''}`}
            onClick={() => setRange(r.days)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="empty-state">No data yet. Start logging to see insights!</p>
      ) : (
        <div className="charts">

          {/* Fluid in vs Urine out (expanded with pad urine) */}
          <div className="chart-card card">
            <h3 className="chart-title">Fluid in vs Urine out</h3>
            {hasPadData && (
              <p className="chart-sub">Includes urine calculated from pad weight changes</p>
            )}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey={tickLabel} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="fluidIn" name="Fluid in (ml)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="urineOut" name="Urine out (ml)" fill="#FCD34D" radius={[3, 3, 0, 0]} />
                {hasPadData && (
                  <Bar dataKey="padUrineOut" name="Pad urine (ml)" fill="#6EE7B7" radius={[3, 3, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fluid Balance Summary */}
          <div className="chart-card card balance-card">
            <h3 className="chart-title">Fluid balance — {range} day total</h3>
            <div className="balance-stats">
              <div className="balance-row">
                <span className="balance-label">Fluid in</span>
                <span className="balance-value fluid-in">{totalFluidIn} ml</span>
              </div>
              <div className="balance-row">
                <span className="balance-label">Urine out (voids)</span>
                <span className="balance-value urine-out">{totalUrineOut} ml</span>
              </div>
              {totalPadOut > 0 && (
                <div className="balance-row">
                  <span className="balance-label">Urine out (pads)</span>
                  <span className="balance-value pad-out">{totalPadOut} ml</span>
                </div>
              )}
              <div className="balance-row balance-row-total">
                <span className="balance-label">Net balance</span>
                <span className={`balance-value ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                  {netBalance >= 0 ? '+' : ''}{netBalance} ml
                </span>
              </div>
            </div>
            {expectedDailyOutput && (
              <p className="balance-note">
                Expected daily output for your weight ({userWeightKg} kg): ≈ {expectedDailyOutput} ml/day
              </p>
            )}
          </div>

          <div className="chart-card card">
            <h3 className="chart-title">Urgency over time</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey={tickLabel} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} width={30} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgUrgency"
                  name="Avg urgency"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-primary)', r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card card">
            <h3 className="chart-title">Leak frequency</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey={tickLabel} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                <Tooltip />
                <Bar dataKey="leaks" name="Leaks" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {troubleHours.length > 0 && (
            <div className="chart-card card">
              <h3 className="chart-title">Times to watch</h3>
              <p className="chart-sub">Hours with most leaks or high urgency</p>
              <div className="trouble-list">
                {troubleHours.map(h => (
                  <div key={h.hour} className="trouble-row">
                    <span className="trouble-time">
                      {format(new Date(2000, 0, 1, h.hour), 'h a')}
                    </span>
                    <div className="trouble-stats">
                      {h.leaks > 0 && <span className="trouble-leak">{h.leaks} leak{h.leaks > 1 ? 's' : ''}</span>}
                      {h.highUrgency > 0 && <span className="trouble-urgency">{h.highUrgency} high urgency</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
