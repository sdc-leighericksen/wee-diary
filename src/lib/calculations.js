import { format, subDays } from 'date-fns'

/**
 * Aggregate diary entries into per-day statistics.
 * @param {Array}       entries   - All diary entries within the date range
 * @param {number}      range     - Number of days to cover (7 | 14 | 30)
 * @param {number|null} weightKg  - User body weight (kg) for output-rate calc
 * @returns {Array} dailyData
 */
export function buildDailyData(entries, range, weightKg) {
  const data = []
  for (let i = range - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dayEntries = entries.filter(e => {
      const d = new Date(e.timestamp)
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth()    === date.getMonth()    &&
        d.getDate()     === date.getDate()
      )
    })

    const fluids  = dayEntries.filter(e => e.entryType === 'fluid')
    const voids   = dayEntries.filter(e => e.entryType === 'void')
    const changes = dayEntries.filter(e => e.entryType === 'change')

    const padUrineOut = changes.reduce((sum, e) => sum + (e.padUrineML || 0), 0)

    const urineOut = voids.reduce((s, e) => s + (e.urineAmount || 0), 0)
    const fluidIn  = fluids.reduce((s, e) => s + (e.fluidAmount || 0), 0)
    const totalOut = urineOut + padUrineOut

    // mL/kg/hr — only meaningful when weight is set and there is output to report
    const urineOutputRate =
      weightKg && totalOut > 0
        ? +(totalOut / (weightKg * 24)).toFixed(2)
        : null

    data.push({
      day:      format(date, 'EEE'),
      date:     format(date, 'd/M'),
      fullDate: format(date, 'd MMM'),
      fluidIn,
      urineOut,
      padUrineOut,
      totalOut,
      balance:  fluidIn - totalOut,
      leaks:    voids.filter(e => e.leaked).length,
      voidCount: voids.length,
      avgUrgency: voids.length
        ? +(voids.reduce((s, e) => s + (e.urgencyLevel || 0), 0) / voids.length).toFixed(1)
        : null,
      urineOutputRate,
    })
  }
  return data
}

/**
 * Return a clinical interpretation label for a urine output rate.
 * Based on MDCalc / standard clinical thresholds.
 * @param {number|null} rate - mL/kg/hr
 * @returns {{ label: string, color: string, note: string } | null}
 */
export function outputRateLabel(rate) {
  if (rate === null || rate === undefined) return null
  if (rate < 0.5) return {
    label: 'Oliguria',
    color: '#EF4444',
    note:  'Below normal — possible low fluid intake',
  }
  if (rate > 5) return {
    label: 'Polyuria',
    color: '#F59E0B',
    note:  'Above normal — unusually high urine output',
  }
  return {
    label: 'Normal',
    color: '#10B981',
    note:  'Within expected range (0.5–5 mL/kg/hr)',
  }
}
