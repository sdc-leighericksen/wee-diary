import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ArrowLeft, FileDown } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useSettingsStore from '../stores/settingsStore'

import { listEntries } from '../lib/appwrite'
import { generatePDF } from '../lib/pdf'
import Button from '../components/ui/Button'
import './ExportPage.css'

export default function ExportPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { displayName, userWeightKg } = useSettingsStore()

  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [generating, setGenerating] = useState(false)
  const [entryCount, setEntryCount] = useState(null)

  const handlePreview = async () => {
    const res = await listEntries(
      user.$id,
      startOfDay(new Date(fromDate)).toISOString(),
      endOfDay(new Date(toDate)).toISOString(),
      500
    )
    setEntryCount(res.documents.length)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await listEntries(
        user.$id,
        startOfDay(new Date(fromDate)).toISOString(),
        endOfDay(new Date(toDate)).toISOString(),
        500
      )
      const patientName = displayName || user.name || ''
      const pdf = await generatePDF(
        res.documents,
        new Date(fromDate),
        new Date(toDate),
        patientName,
        userWeightKg || null,
      )
      const safeName = patientName.trim().replace(/\s+/g, '-') || 'patient'
      const from     = format(new Date(fromDate), 'dd-MM-yyyy')
      const to       = format(new Date(toDate),   'dd-MM-yyyy')
      pdf.save(`wee-diary-${safeName}-${from}-${to}.pdf`)
    } catch (err) {
      alert('Error generating PDF: ' + err.message)
    }
    setGenerating(false)
  }

  return (
    <div className="page fade-in">
      <div className="log-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1>Export for specialist</h1>
      </div>

      <div className="export-form">
        <div className="form-field">
          <label>From</label>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setEntryCount(null) }} />
        </div>
        <div className="form-field">
          <label>To</label>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setEntryCount(null) }} />
        </div>

        <Button variant="secondary" fullWidth onClick={handlePreview}>
          Check entries
        </Button>

        {entryCount !== null && (
          <div className="export-preview card">
            <p><strong>{entryCount}</strong> entries found</p>
            <p className="export-range">{format(new Date(fromDate), 'd MMM yyyy')} – {format(new Date(toDate), 'd MMM yyyy')}</p>
          </div>
        )}

        <Button fullWidth size="lg" onClick={handleGenerate} disabled={generating}>
          <FileDown size={20} />
          {generating ? 'Generating...' : 'Generate PDF'}
        </Button>
      </div>
    </div>
  )
}
