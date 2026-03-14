import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

export function generatePDF(entries, dateFrom, dateTo, patientName) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(22)
  doc.setTextColor(146, 64, 14)
  doc.text('Wee Diary', pageWidth / 2, 40, { align: 'center' })
  doc.setFontSize(14)
  doc.setTextColor(60, 60, 60)
  doc.text('Bladder Diary Report', pageWidth / 2, 50, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  const lines = [
    `Patient: ${patientName || 'N/A'}`,
    `Date range: ${format(dateFrom, 'd MMM yyyy')} – ${format(dateTo, 'd MMM yyyy')}`,
    `Generated: ${format(new Date(), 'd MMM yyyy, h:mm a')}`,
    `Total entries: ${entries.length}`,
  ]
  lines.forEach((line, i) => doc.text(line, pageWidth / 2, 65 + i * 7, { align: 'center' }))

  const dailyMap = {}
  entries.forEach(e => {
    const day = format(new Date(e.timestamp), 'yyyy-MM-dd')
    if (!dailyMap[day]) dailyMap[day] = { fluids: 0, urine: 0, leaks: 0, urgencySum: 0, voidCount: 0 }
    if (e.entryType === 'fluid') {
      dailyMap[day].fluids += e.fluidAmount || 0
    } else {
      dailyMap[day].urine += e.urineAmount || 0
      dailyMap[day].voidCount++
      dailyMap[day].urgencySum += e.urgencyLevel || 0
      if (e.leaked) dailyMap[day].leaks++
    }
  })

  const summaryRows = Object.keys(dailyMap).sort().map(day => {
    const d = dailyMap[day]
    return [
      format(new Date(day + 'T00:00:00'), 'd MMM'),
      `${d.fluids} ml`,
      `${d.urine} ml`,
      String(d.voidCount),
      String(d.leaks),
      d.voidCount ? (d.urgencySum / d.voidCount).toFixed(1) : '-'
    ]
  })

  doc.addPage()
  doc.setFontSize(14)
  doc.setTextColor(60, 60, 60)
  doc.text('Daily Summary', 14, 20)

  autoTable(doc, {
    startY: 26,
    head: [['Date', 'Fluid In', 'Urine Out', 'Voids', 'Leaks', 'Avg Urgency']],
    body: summaryRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 251, 235] },
  })

  doc.addPage()
  doc.setFontSize(14)
  doc.text('Detailed Diary', 14, 20)

  const detailRows = entries
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(e => [
      format(new Date(e.timestamp), 'd MMM'),
      format(new Date(e.timestamp), 'h:mm a'),
      e.entryType === 'fluid' ? 'Fluid' : 'Void',
      e.fluidType || '',
      e.fluidAmount ? `${e.fluidAmount}` : (e.urineAmount ? `${e.urineAmount}` : ''),
      e.urgencyLevel ? `${e.urgencyLevel}/5` : '',
      e.leaked ? 'Yes' : (e.entryType === 'void' ? 'No' : ''),
      e.leakSize || '',
      e.padChanged ? 'Yes' : '',
      (e.activityNotes || '').slice(0, 40),
    ])

  autoTable(doc, {
    startY: 26,
    head: [['Date', 'Time', 'Type', 'Fluid', 'ml', 'Urgency', 'Leaked', 'Size', 'Changed', 'Notes']],
    body: detailRows,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: {
      9: { cellWidth: 30 }
    }
  })

  return doc
}
