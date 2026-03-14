import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { GlassWater, Droplet, AlertCircle, RefreshCw, X, Trash2 } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useEntriesStore from '../stores/entriesStore'
import useSettingsStore from '../stores/settingsStore'
import useStampsStore, { MILESTONES } from '../stores/stampsStore'
import { calculateStreak } from '../lib/streakCalculator'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import './DashboardPage.css'

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const displayName = useSettingsStore(s => s.displayName)
  const dailyTarget = useSettingsStore(s => s.dailyFluidTarget)
  const smartReminderEnabled = useSettingsStore(s => s.smartReminderEnabled)
  const smartReminderHour = useSettingsStore(s => s.smartReminderHour)
  const { entries, fetchToday, fetchStreakEntries, getTodaySummary, getTodayEntries, removeEntry } = useEntriesStore()
  const { currentStreak, collectedStamps, newStamp, checkAndUpdateStreak, clearNewStamp } = useStampsStore()
  const navigate = useNavigate()

  const [reminderVisible, setReminderVisible] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchToday(user.$id)

    fetchStreakEntries(user.$id, 120).then(streakEntries => {
      const streak = calculateStreak(streakEntries)
      checkAndUpdateStreak(streak)
    })
  }, [user])

  useEffect(() => {
    const todayEntries = getTodayEntries()
    if (
      smartReminderEnabled &&
      new Date().getHours() >= smartReminderHour &&
      todayEntries.length === 0
    ) {
      setReminderVisible(true)

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Wee Diary reminder', {
          body: "Don't forget to log today! Tap to open the app.",
          icon: '/pwa-192x192.png',
        })
      }
    }
  }, [entries, smartReminderEnabled, smartReminderHour])

  const summary = getTodaySummary()
  const todayEntries = getTodayEntries()
  const fullName  = displayName || user?.name || 'there'
  const firstName = fullName.split(' ')[0]

  const hour = new Date().getHours()
  const greeting = hour >= 5 && hour < 12 ? 'Morning'
    : hour >= 12 && hour < 17 ? 'Afternoon'
    : hour >= 17 && hour < 21 ? 'Evening'
    : 'Good night'
  const greetingEmoji = hour >= 5 && hour < 12 ? '\u2600\uFE0F'   // ☀️
    : hour >= 12 && hour < 17 ? '\uD83C\uDF24\uFE0F'              // 🌤️
    : hour >= 17 && hour < 21 ? '\uD83C\uDF07'                    // 🌆
    : '\uD83C\uDF19'                                               // 🌙

  return (
    <div className="page fade-in dash-page">
      {/* Stamp celebration overlay */}
      {newStamp && (
        <div className="stamp-celebration" onClick={clearNewStamp}>
          <div className="stamp-celebration-inner">
            <div className="stamp-celebration-emoji">{newStamp.emoji}</div>
            <h2>New stamp!</h2>
            <p>You've reached <strong>{newStamp.label}</strong> in a row!</p>
            <Button onClick={clearNewStamp}>Awesome!</Button>
          </div>
        </div>
      )}

      {/* Greeting — above the white card, yellow bg visible */}
      <div className="dash-greeting">
        <Logo width={160} />
        <p className="dash-hello">{greeting}, {firstName}! {greetingEmoji}</p>
        <p className="dash-subdate">{format(new Date(), 'EEEE, d MMMM')}</p>
      </div>

      {/* White card containing all content */}
      <div className="dash-card">

        {/* Smart reminder banner */}
        {reminderVisible && (
          <div className="reminder-banner">
            <span>Nothing logged yet today — don't forget to track!</span>
            <button className="reminder-close" onClick={() => setReminderVisible(false)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stat tiles */}
        <div className="dash-summary">
          <div className="summary-card">
            <GlassWater size={20} className="summary-icon" />
            <span className="summary-num">{summary.drinkCount}</span>
            <span className="summary-label">drinks/foods</span>
          </div>
          <div className="summary-card">
            <Droplet size={20} className="summary-icon" />
            <span className="summary-num">{summary.voidCount}</span>
            <span className="summary-label">voids</span>
          </div>
          <div className="summary-card">
            <RefreshCw size={20} className="summary-icon" />
            <span className="summary-num">{summary.changeCount}</span>
            <span className="summary-label">changes</span>
          </div>
          <div className="summary-card">
            <AlertCircle size={20} className="summary-icon" />
            <span className="summary-num">{summary.leakCount}</span>
            <span className="summary-label">leaks</span>
          </div>
        </div>

        {/* Fluid progress */}
        {dailyTarget > 0 && (
          <div className="fluid-progress">
            <div className="fluid-progress-bar">
              <div
                className="fluid-progress-fill"
                style={{ width: `${Math.min(100, (summary.totalFluid / dailyTarget) * 100)}%` }}
              />
            </div>
            <span className="fluid-progress-text">
              {summary.totalFluid} / {dailyTarget} ml today
            </span>
          </div>
        )}

        {/* Quick actions */}
        <div className="dash-quick-actions">
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/log?type=void')}>
            <Droplet size={20} /> Used the loo
          </Button>
          <div className="dash-quick-secondary">
            <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/log?type=fluid')}>
              <GlassWater size={20} /> Had a drink/food
            </Button>
            <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/log?type=change')}>
              <RefreshCw size={20} /> Changed
            </Button>
          </div>
        </div>

        {/* Streak */}
        {currentStreak > 0 && (
          <Card className="streak-card">
            You've logged for <strong>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</strong> in a row! 🔥
          </Card>
        )}

        {/* Stamps */}
        <div className="stamps-section">
          <h2 className="section-title">Stamps</h2>
          <div className="stamps-grid">
            {MILESTONES.map(m => {
              const earned = collectedStamps.includes(m.days)
              return (
                <div key={m.days} className={`stamp ${earned ? 'stamp-earned' : 'stamp-locked'}`}>
                  <span className="stamp-emoji">{earned ? m.emoji : '🔒'}</span>
                  <span className="stamp-label">{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Today's entries */}
        <div className="dash-entries">
          <h2 className="section-title">Today's entries</h2>
          {todayEntries.length === 0 ? (
            <p className="empty-state">No entries yet today. Tap a button above to log something!</p>
          ) : (
            <div className="entry-list">
              {todayEntries
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map(entry => (
                  <EntryRow
                    key={entry.$id}
                    entry={entry}
                    onEdit={() => navigate(`/log/${entry.$id}`)}
                    onDelete={() => removeEntry(entry.$id)}
                  />
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function EntryRow({ entry, onEdit, onDelete }) {
  const time = format(new Date(entry.timestamp), 'h:mm a')
  const { entryType } = entry
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const holdTimer = useRef(null)

  const icon = entryType === 'fluid' ? <GlassWater size={18} />
    : entryType === 'change' ? <RefreshCw size={18} />
    : <Droplet size={18} />

  let label
  if (entryType === 'fluid') {
    label = `${entry.fluidType || 'Drink/food'}${entry.fluidAmount ? ` — ${entry.fluidAmount}ml` : ''}`
  } else if (entryType === 'change') {
    label = `Changed${entry.changeFullness ? ` — ${entry.changeFullness}` : ''}`
  } else {
    label = `Void${entry.urgencyLevel ? ` — urgency ${entry.urgencyLevel}/5` : ''}`
  }

  const handlePointerDown = useCallback(() => {
    holdTimer.current = setTimeout(() => setDeleteConfirm(true), 600)
  }, [])

  const handlePointerUp = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
  }, [])

  const handleClick = useCallback(() => {
    if (!deleteConfirm) onEdit()
  }, [deleteConfirm, onEdit])

  if (deleteConfirm) {
    return (
      <div className="entry-row entry-row-confirm">
        <span className="entry-confirm-msg">Delete this entry?</span>
        <div className="entry-confirm-actions">
          <button className="entry-confirm-yes" onClick={(e) => { e.stopPropagation(); onDelete() }}>
            <Trash2 size={14} /> Delete
          </button>
          <button className="entry-confirm-no" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(false) }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="entry-row"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="entry-icon">
        {icon}
      </div>
      <div className="entry-info">
        <span className="entry-main">{label}</span>
        {entry.leaked && <span className="entry-leak">Leak{entry.leakSize ? ` (${entry.leakSize})` : ''}</span>}
        {entry.activityNotes && <span className="entry-notes">{entry.activityNotes}</span>}
        {entry.changeReason && <span className="entry-notes">{entry.changeReason}</span>}
      </div>
      <span className="entry-time">{time}</span>
    </div>
  )
}
