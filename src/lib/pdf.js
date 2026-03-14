import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, subDays } from 'date-fns'
import { buildDailyData, outputRateLabel } from './calculations'

// ─── Logo ────────────────────────────────────────────────────────────────────

/**
 * Fetch the WeeDiary wordmark PNG from the public folder and return a base64
 * data URL for embedding in jsPDF via addImage().
 */
async function getLogoPng() {
  try {
    const response = await fetch('/weediary-logo.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ─── Chart helpers ───────────────────────────────────────────────────────────

/**
 * Draw a grouped bar chart using jsPDF primitives.
 * @param {jsPDF} doc
 * @param {{ x, y, w, h, title, data, keys, colors, names, tickKey }} opts
 */
function drawBarChart(doc, { x, y, w, h, title, data, keys, colors, names, tickKey }) {
  const AXIS_LEFT = 12  // space for y-axis labels
  const LABEL_H   = 14  // space for x-axis labels below chart
  const chartW    = w - AXIS_LEFT
  const chartH    = h - LABEL_H

  // Title
  doc.setFontSize(8)
  doc.setTextColor(48, 47, 42)
  doc.setFont(undefined, 'bold')
  doc.text(title, x, y - 3)
  doc.setFont(undefined, 'normal')

  // Background
  doc.setFillColor(252, 252, 250)
  doc.rect(x + AXIS_LEFT, y, chartW, chartH, 'F')

  // Max value
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)), 1)

  // Grid lines + y labels
  const gridSteps = 3
  doc.setDrawColor(224, 219, 200)
  doc.setFontSize(6)
  doc.setTextColor(120, 120, 110)
  for (let s = 0; s <= gridSteps; s++) {
    const val = Math.round((maxVal / gridSteps) * s)
    const gy  = y + chartH - (chartH * s / gridSteps)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(x + AXIS_LEFT, gy, x + AXIS_LEFT + chartW, gy)
    doc.text(String(val), x + AXIS_LEFT - 1, gy + 1.5, { align: 'right' })
  }
  doc.setLineDashPattern([], 0)

  // Bars
  const numGroups = data.length
  const groupW    = chartW / numGroups
  const barW      = Math.max(1, (groupW * 0.7) / keys.length)

  data.forEach((d, gi) => {
    keys.forEach((k, ki) => {
      const val  = d[k] || 0
      const barH = (val / maxVal) * chartH
      const bx   = x + AXIS_LEFT + gi * groupW + ki * barW + groupW * 0.15
      const by   = y + chartH - barH
      doc.setFillColor(...colors[ki])
      doc.rect(bx, by, barW, barH, 'F')
    })
    // X tick label
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 90)
    const label = String(d[tickKey] || '')
    doc.text(label, x + AXIS_LEFT + gi * groupW + groupW / 2, y + chartH + 8, { align: 'center' })
  })

  // Axes
  doc.setDrawColor(180, 175, 160)
  doc.line(x + AXIS_LEFT, y, x + AXIS_LEFT, y + chartH)
  doc.line(x + AXIS_LEFT, y + chartH, x + AXIS_LEFT + chartW, y + chartH)

  // Legend
  let lx = x + AXIS_LEFT
  keys.forEach((k, ki) => {
    doc.setFillColor(...colors[ki])
    doc.rect(lx, y + chartH + 10, 5, 3, 'F')
    doc.setFontSize(6)
    doc.setTextColor(80, 78, 70)
    doc.text(names[ki], lx + 7, y + chartH + 12.5)
    lx += 7 + doc.getTextWidth(names[ki]) + 6
  })
}

/**
 * Draw a line chart using jsPDF primitives.
 * @param {jsPDF} doc
 * @param {{ x, y, w, h, title, data, key, color, name, tickKey, yMin, yMax, refLines }} opts
 */
function drawLineChart(doc, { x, y, w, h, title, data, key, color, name, tickKey, yMin = 0, yMax, refLines = [] }) {
  const AXIS_LEFT = 14
  const LABEL_H   = 14
  const chartW    = w - AXIS_LEFT
  const chartH    = h - LABEL_H

  const vals      = data.map(d => d[key]).filter(v => v !== null && v !== undefined)
  const computedMax = yMax ?? (vals.length ? Math.ceil(Math.max(...vals) * 1.2) : 1)
  const range     = computedMax - yMin || 1

  // Title
  doc.setFontSize(8)
  doc.setTextColor(48, 47, 42)
  doc.setFont(undefined, 'bold')
  doc.text(title, x, y - 3)
  doc.setFont(undefined, 'normal')

  // Background
  doc.setFillColor(252, 252, 250)
  doc.rect(x + AXIS_LEFT, y, chartW, chartH, 'F')

  // Grid + y labels
  const gridSteps = 4
  doc.setDrawColor(224, 219, 200)
  doc.setFontSize(6)
  doc.setTextColor(120, 120, 110)
  for (let s = 0; s <= gridSteps; s++) {
    const val = +(yMin + (range / gridSteps) * s).toFixed(1)
    const gy  = y + chartH - (chartH * s / gridSteps)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(x + AXIS_LEFT, gy, x + AXIS_LEFT + chartW, gy)
    doc.text(String(val), x + AXIS_LEFT - 1, gy + 1.5, { align: 'right' })
  }
  doc.setLineDashPattern([], 0)

  // Reference lines
  refLines.forEach(({ value, label, color: rc }) => {
    if (value < yMin || value > computedMax) return
    const gy = y + chartH - ((value - yMin) / range) * chartH
    doc.setDrawColor(...rc)
    doc.setLineDashPattern([2, 2], 0)
    doc.line(x + AXIS_LEFT, gy, x + AXIS_LEFT + chartW, gy)
    doc.setFontSize(6)
    doc.setTextColor(...rc)
    doc.text(label, x + AXIS_LEFT + 2, gy - 1.5)
  })
  doc.setLineDashPattern([], 0)

  // Line + dots
  const points = data
    .map((d, i) => {
      const v = d[key]
      if (v === null || v === undefined) return null
      return {
        px: x + AXIS_LEFT + (i / (data.length - 1 || 1)) * chartW,
        py: y + chartH - ((v - yMin) / range) * chartH,
      }
    })

  doc.setDrawColor(...color)
  doc.setLineWidth(0.6)
  let prevPt = null
  points.forEach(pt => {
    if (!pt) { prevPt = null; return }
    if (prevPt) doc.line(prevPt.px, prevPt.py, pt.px, pt.py)
    doc.setFillColor(...color)
    doc.circle(pt.px, pt.py, 1, 'F')
    prevPt = pt
  })
  doc.setLineWidth(0.2)

  // X labels
  data.forEach((d, i) => {
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 90)
    const px = x + AXIS_LEFT + (i / (data.length - 1 || 1)) * chartW
    doc.text(String(d[tickKey] || ''), px, y + chartH + 8, { align: 'center' })
  })

  // Axes
  doc.setDrawColor(180, 175, 160)
  doc.line(x + AXIS_LEFT, y, x + AXIS_LEFT, y + chartH)
  doc.line(x + AXIS_LEFT, y + chartH, x + AXIS_LEFT + chartW, y + chartH)
}

// ─── Section heading helper ───────────────────────────────────────────────────
function sectionTitle(doc, text, x, y) {
  doc.setFontSize(13)
  doc.setTextColor(48, 47, 42)
  doc.setFont(undefined, 'bold')
  doc.text(text, x, y)
  doc.setFont(undefined, 'normal')
}

// ─── Main export function ─────────────────────────────────────────────────────

/**
 * Generate a bladder diary PDF report.
 * @param {Array}       entries     - Diary entries for the selected period
 * @param {Date}        dateFrom
 * @param {Date}        dateTo
 * @param {string}      patientName
 * @param {number|null} userWeightKg
 * @returns {Promise<jsPDF>}
 */
export async function generatePDF(entries, dateFrom, dateTo, patientName, userWeightKg) {
  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW     = doc.internal.pageSize.getWidth()
  const pageH     = doc.internal.pageSize.getHeight()
  const margin    = 14
  const contentW  = pageW - margin * 2

  // ── Page 1: Cover ──────────────────────────────────────────────────────────
  // Yellow background strip
  doc.setFillColor(250, 240, 133)
  doc.rect(0, 0, pageW, 70, 'F')

  // Logo — weediary.png is 1019×238 px (aspect ≈ 238/1019)
  const logoPng = await getLogoPng()
  if (logoPng) {
    const logoW = 100
    const logoH = Math.round(logoW * 238 / 1019)
    doc.addImage(logoPng, 'PNG', (pageW - logoW) / 2, 16, logoW, logoH)
  } else {
    doc.setFontSize(22)
    doc.setTextColor(48, 47, 42)
    doc.text('WeeDiary', pageW / 2, 38, { align: 'center' })
  }

  // Subtitle
  doc.setFontSize(11)
  doc.setTextColor(48, 47, 42)
  doc.text('Bladder Diary Report', pageW / 2, 60, { align: 'center' })

  // Patient info box — height scales with number of rows (base 4 rows + optional weight row)
  const infoBoxH = userWeightKg ? 58 : 50
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, 70, contentW, infoBoxH, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setTextColor(80, 78, 70)
  const infoLines = [
    ['Patient',     patientName || 'N/A'],
    ['Date range',  `${format(dateFrom, 'd MMM yyyy')} – ${format(dateTo, 'd MMM yyyy')}`],
    ['Generated',   format(new Date(), 'd MMM yyyy, h:mm a')],
    ['Total entries', String(entries.length)],
  ]
  if (userWeightKg) infoLines.push(['Body weight', `${userWeightKg} kg`])
  infoLines.forEach(([label, value], i) => {
    doc.setFont(undefined, 'bold')
    doc.setTextColor(48, 47, 42)
    doc.text(label, margin + 6, 80 + i * 9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(80, 78, 70)
    doc.text(value, margin + 52, 80 + i * 9)
  })

  // ── Page 2: Daily Summary Table ────────────────────────────────────────────
  doc.addPage()
  sectionTitle(doc, 'Daily Summary', margin, 20)

  // Compute daily totals for summary
  const dayMap = {}
  entries.forEach(e => {
    const day = format(new Date(e.timestamp), 'yyyy-MM-dd')
    if (!dayMap[day]) dayMap[day] = {
      fluids: 0, urine: 0, padUrine: 0, leaks: 0,
      urgencySum: 0, voidCount: 0,
    }
    const d = dayMap[day]
    if (e.entryType === 'fluid') {
      d.fluids += e.fluidAmount || 0
    } else if (e.entryType === 'void') {
      d.urine     += e.urineAmount || 0
      d.voidCount++
      d.urgencySum += e.urgencyLevel || 0
      if (e.leaked) d.leaks++
    } else if (e.entryType === 'change') {
      d.padUrine += e.padUrineML || 0
    }
  })

  const hasPadData   = Object.values(dayMap).some(d => d.padUrine > 0)
  const hasRateData  = !!userWeightKg

  const summaryHead  = ['Date', 'Fluid In', 'Urine Out (voids)']
  if (hasPadData) summaryHead.push('Urine Out (pads)', 'Total Out')
  summaryHead.push('Voids', 'Leaks', 'Avg Urgency')
  if (hasRateData) summaryHead.push('Rate (mL/kg/hr)')

  const summaryRows  = Object.keys(dayMap).sort().map(day => {
    const d   = dayMap[day]
    const row = [
      format(new Date(day + 'T00:00:00'), 'd MMM'),
      `${d.fluids} ml`,
      `${d.urine} ml`,
    ]
    if (hasPadData) {
      row.push(d.padUrine > 0 ? `${d.padUrine} ml` : '-')
      row.push(`${d.urine + d.padUrine} ml`)
    }
    row.push(String(d.voidCount), String(d.leaks))
    row.push(d.voidCount ? (d.urgencySum / d.voidCount).toFixed(1) : '—')
    if (hasRateData) {
      const totalOut = d.urine + d.padUrine
      const rate     = totalOut > 0 ? (totalOut / (userWeightKg * 24)).toFixed(2) : '—'
      row.push(rate !== '—' ? rate : '—')
    }
    return row
  })

  autoTable(doc, {
    startY: 26,
    head: [summaryHead],
    body: summaryRows,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [48, 47, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 240, 133, 60] },
  })

  // ── Page 3: Charts ─────────────────────────────────────────────────────────
  doc.addPage()
  sectionTitle(doc, 'Charts', margin, 16)

  // Determine range from entry timestamps
  const entryDates = entries.map(e => new Date(e.timestamp))
  const minDate    = entryDates.length ? new Date(Math.min(...entryDates)) : subDays(new Date(), 7)
  const dayCount   = Math.min(30, Math.round((new Date() - minDate) / 86400000) + 1)
  const chartData  = buildDailyData(entries, dayCount, userWeightKg)
  // Thin out labels for readability (show every Nth)
  const step = dayCount <= 7 ? 1 : dayCount <= 14 ? 2 : 4
  const chartDataLabelled = chartData.map((d, i) => ({
    ...d,
    chartTick: i % step === 0 ? d.fullDate : '',
  }))

  const chartY1 = 22
  const chartH1 = 52

  // Chart 1: Fluid in vs Urine out
  drawBarChart(doc, {
    x: margin, y: chartY1, w: contentW, h: chartH1,
    title: 'Fluid In vs Urine Out (ml)',
    data: chartDataLabelled,
    keys: hasPadData
      ? ['fluidIn', 'urineOut', 'padUrineOut']
      : ['fluidIn', 'urineOut'],
    colors: hasPadData
      ? [[245, 158, 11], [252, 211, 77], [110, 231, 183]]
      : [[245, 158, 11], [252, 211, 77]],
    names: hasPadData
      ? ['Fluid in', 'Urine out (voids)', 'Urine out (pads)']
      : ['Fluid in', 'Urine out'],
    tickKey: 'chartTick',
  })

  // Chart 2: Urgency
  const chartY2 = chartY1 + chartH1 + 24
  drawLineChart(doc, {
    x: margin, y: chartY2, w: contentW, h: chartH1,
    title: 'Average Urgency (1–5)',
    data: chartDataLabelled,
    key: 'avgUrgency',
    color: [193, 165, 2],
    name: 'Avg urgency',
    tickKey: 'chartTick',
    yMin: 0, yMax: 5,
  })

  // Chart 3: Leaks
  const chartY3 = chartY2 + chartH1 + 24
  drawBarChart(doc, {
    x: margin, y: chartY3, w: contentW, h: chartH1,
    title: 'Leak Frequency',
    data: chartDataLabelled,
    keys: ['leaks'],
    colors: [[239, 68, 68]],
    names: ['Leaks'],
    tickKey: 'chartTick',
  })

  // ── Page 4: Urine Output Rate ───────────────────────────────────────────────
  if (userWeightKg) {
    doc.addPage()
    sectionTitle(doc, 'Urine Output Rate', margin, 16)

    const rateY = 22
    drawLineChart(doc, {
      x: margin, y: rateY, w: contentW, h: 65,
      title: `Urine Output Rate (mL/kg/hr) — Weight: ${userWeightKg} kg`,
      data: chartDataLabelled,
      key: 'urineOutputRate',
      color: [48, 47, 42],
      name: 'Output rate',
      tickKey: 'chartTick',
      yMin: 0,
      refLines: [
        { value: 0.5, label: 'Oliguria threshold (0.5)',  color: [239, 68,  68]  },
        { value: 5,   label: 'Polyuria threshold (5.0)',   color: [245, 158, 11] },
      ],
    })

    // Summary box
    const totalOut = Object.values(dayMap).reduce((s, d) => s + d.urine + d.padUrine, 0)
    const avgRate  = totalOut > 0
      ? +(totalOut / (userWeightKg * dayCount * 24)).toFixed(2)
      : null
    const interp   = outputRateLabel(avgRate)

    const summaryItems = [
      ['Total urine output', `${totalOut} ml`],
      ['Observation period', `${dayCount} days`],
      ['Body weight',        `${userWeightKg} kg`],
      ['Average output rate', avgRate !== null ? `${avgRate} mL/kg/hr` : 'Insufficient data'],
    ]
    if (interp) summaryItems.push(['Clinical interpretation', interp.label])

    // Box height: title (14) + rows (summaryItems.length × 10) + bottom padding (16)
    const boxH     = 14 + summaryItems.length * 10 + 20
    const summaryY = rateY + 75
    doc.setFillColor(250, 249, 205)
    doc.roundedRect(margin, summaryY, contentW, boxH, 3, 3, 'F')

    doc.setFontSize(10)
    doc.setTextColor(48, 47, 42)
    doc.setFont(undefined, 'bold')
    doc.text('Output Rate Summary', margin + 8, summaryY + 11)
    doc.setFont(undefined, 'normal')

    doc.setFontSize(9)
    summaryItems.forEach(([label, value], i) => {
      const rowY = summaryY + 22 + i * 10
      doc.setFont(undefined, 'bold')
      doc.setTextColor(80, 78, 70)
      doc.text(label, margin + 8, rowY)
      doc.setFont(undefined, 'normal')
      if (label === 'Clinical interpretation' && interp) {
        doc.setTextColor(...hexToRgb(interp.color))
      } else {
        doc.setTextColor(48, 47, 42)
      }
      doc.text(value, margin + 78, rowY)
      doc.setTextColor(48, 47, 42)
    })

    // Reference note below box
    doc.setFontSize(7.5)
    doc.setTextColor(110, 105, 95)
    doc.text(
      'Reference: Oliguria < 0.5 mL/kg/hr  ·  Normal 0.5–5 mL/kg/hr  ·  Polyuria > 5 mL/kg/hr',
      margin + 8, summaryY + boxH + 8
    )
  }

  // ── Page 5: Detailed Diary ─────────────────────────────────────────────────
  doc.addPage()
  sectionTitle(doc, 'Detailed Diary', margin, 20)

  const detailRows = entries
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(e => {
      let typeLabel = 'Fluid'
      let amount    = ''

      if (e.entryType === 'void') {
        typeLabel = 'Void'
        if (e.urineAmount) amount = `${e.urineAmount} ml`
      } else if (e.entryType === 'change') {
        typeLabel = 'Change'
        if (e.padUrineML) amount = `${e.padUrineML} ml`
      } else {
        if (e.fluidAmount) amount = `${e.fluidAmount} ml`
      }

      return [
        format(new Date(e.timestamp), 'd MMM'),
        format(new Date(e.timestamp), 'h:mm a'),
        typeLabel,
        e.fluidType || e.productName || '',
        amount,
        e.urgencyLevel ? `${e.urgencyLevel}/5` : '',
        e.entryType === 'void' ? (e.leaked ? 'Yes' : 'No') : '',
        e.leakSize || '',
        (e.activityNotes || '').slice(0, 35),
      ]
    })

  autoTable(doc, {
    startY: 26,
    head: [['Date', 'Time', 'Type', 'Detail', 'Amount', 'Urgency', 'Leaked', 'Size', 'Notes']],
    body: detailRows,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [48, 47, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 240, 133, 60] },
    columnStyles: { 8: { cellWidth: 32 } },
  })

  // ── Page numbers ────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 155, 140)
    doc.text(
      `Page ${i} of ${totalPages}  ·  WeeDiary App — A Urine Output Tracker  ·  ©2026 Built by the Ericksen Family`,
      pageW / 2, pageH - 8,
      { align: 'center' }
    )
  }

  return doc
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}
