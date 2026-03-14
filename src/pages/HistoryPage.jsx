import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays, startOfDay, endOfDay, isSameDay } from 'date-fns'
import { GlassWater, Droplet, RefreshCw, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useEntriesStore from '../stores/entriesStore'
import Button from '../components/ui/Button'
import './HistoryPage.css'

export default function HistoryPage() {
  const user = useAuthStore(s => s.user)
  const { entries, fetchEntries, removeEntry, loading } = useEntriesStore()
  const navigate = useNavigate()
  const [expandedDay, setExpandedDay] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (user) {
      fetchEntries(user.$id, subDays(new Date(), 30), endOfDay(new Date()))
    }
  }, [user])

  const grouped = entries.reduce((acc, entry) => {
    const d = new Date(entry.timestamp)
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!acc[day]) acc[day] = []
    acc[day].push(entry)
    return acc
  }, {})

  const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (deleting === id) {
      await removeEntry(id)
      setDeleting(null)
    } else {
      setDeleting(id)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  return (
    <div className="page fade-in">
      <div className="history-top">
        <h1 className="page-title">History</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/export')}>
          <FileText size={16} /> Export
        </Button>
      </div>

      {loading && <p className="empty-state">Loading...</p>}
      {!loading && sortedDays.length === 0 && (
        <p className="empty-state">No entries in the last 30 days.</p>
      )}

      <div className="day-list">
        {sortedDays.map(day => {
          const dayEntries = grouped[day].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          const isExpanded = expandedDay === day
          const fluids = dayEntries.filter(e => e.entryType === 'fluid')
          const voids = dayEntries.filter(e => e.entryType === 'void')
          const changes = dayEntries.filter(e => e.entryType === 'change')
          const leaks = voids.filter(e => e.leaked)
          const totalFluid    = fluids.reduce((s, e) => s + (e.fluidAmount || 0), 0)
          const totalUrine    = voids.reduce((s, e) => s + (e.urineAmount || 0), 0)
          const totalPadUrine = changes.reduce((s, e) => s + (e.padUrineML || 0), 0)
          const totalOut      = totalUrine + totalPadUrine
          const isToday = isSameDay(new Date(day), new Date())

          return (
            <div key={day} className="day-group">
              <button className="day-header" onClick={() => setExpandedDay(isExpanded ? null : day)}>
                <div className="day-info">
                  <span className="day-date">
                    {isToday ? 'Today' : format(new Date(day + 'T00:00:00'), 'EEE, d MMM')}
                  </span>
                  <div className="day-stats">
                    <span>{totalFluid}ml in</span>
                    <span className="dot">·</span>
                    <span>{totalOut > 0 ? `${totalOut}ml out` : `${voids.length} voids`}</span>
                    {changes.length > 0 && (
                      <>
                        <span className="dot">·</span>
                        <span>{changes.length} change{changes.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                    {leaks.length > 0 && (
                      <>
                        <span className="dot">·</span>
                        <span className="leak-badge">{leaks.length} leak{leaks.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isExpanded && (
                <div className="day-entries">
                  {dayEntries.map(entry => {
                    const { entryType } = entry
                    const icon = entryType === 'fluid' ? <GlassWater size={16} />
                      : entryType === 'change' ? <RefreshCw size={16} />
                      : <Droplet size={16} />
                    const iconClass = entryType === 'change' ? 'change' : entryType === 'fluid' ? 'fluid' : 'void'
                    let label
                    if (entryType === 'fluid') {
                      label = `${entry.fluidType || 'Drink/food'}${entry.fluidAmount ? ` — ${entry.fluidAmount}ml` : ''}`
                    } else if (entryType === 'change') {
                      label = `Changed${entry.changeFullness ? ` — ${entry.changeFullness}` : ''}${entry.padUrineML ? ` — ${entry.padUrineML}ml` : ''}`
                    } else {
                      label = `Void${entry.urgencyLevel ? ` (${entry.urgencyLevel}/5)` : ''}${entry.urineAmount ? ` — ${entry.urineAmount}ml` : ''}`
                    }
                    return (
                      <div key={entry.$id} className="history-entry">
                        <div className={`entry-icon ${iconClass}`}>
                          {icon}
                        </div>
                        <div className="entry-info" onClick={() => navigate(`/log/${entry.$id}`)}>
                          <span className="entry-main">{label}</span>
                          {entry.leaked && <span className="entry-leak">Leaked{entry.leakSize ? ` (${entry.leakSize})` : ''}</span>}
                          {entry.changeReason && <span className="entry-notes">{entry.changeReason}</span>}
                        </div>
                        <span className="entry-time">{format(new Date(entry.timestamp), 'h:mm a')}</span>
                        <button
                          className={`delete-btn ${deleting === entry.$id ? 'confirm' : ''}`}
                          onClick={(e) => handleDelete(e, entry.$id)}
                          title={deleting === entry.$id ? 'Tap again to delete' : 'Delete'}
                        >
                          <Trash2 size={14} />
                          {deleting === entry.$id && <span>Delete?</span>}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
