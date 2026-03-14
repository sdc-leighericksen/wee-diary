import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, Bell } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useRemindersStore from '../stores/remindersStore'
import Button from '../components/ui/Button'
import Toggle from '../components/ui/Toggle'
import './RemindersPage.css'

export default function RemindersPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { reminderTimes, enabled, fetch: fetchReminders, save, addTime, removeTime, toggleEnabled } = useRemindersStore()
  const [newTime, setNewTime] = useState('12:00')
  const [showAdd, setShowAdd] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [notifPermission, setNotifPermission] = useState('default')

  useEffect(() => {
    if (user) fetchReminders(user.$id)
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches)
    if ('Notification' in window) setNotifPermission(Notification.permission)
  }, [user])

  const handleToggle = async () => {
    toggleEnabled()
    if (user) await save(user.$id)
  }

  const handleAdd = async () => {
    if (!reminderTimes.includes(newTime)) {
      addTime(newTime)
      if (user) await save(user.$id)
    }
    setShowAdd(false)
  }

  const handleRemove = async (time) => {
    removeTime(time)
    if (user) await save(user.$id)
  }

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setNotifPermission(result)
    }
  }

  const formatTime = (t) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  return (
    <div className="page fade-in">
      <div className="log-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1>Reminders</h1>
      </div>

      {!isPWA && (
        <div className="card ios-prompt">
          <Bell size={20} />
          <div>
            <strong>Get reminders on your phone</strong>
            <p>Tap the share button in Safari and choose "Add to Home Screen" to enable push notifications.</p>
          </div>
        </div>
      )}

      {isPWA && notifPermission !== 'granted' && (
        <Button variant="secondary" fullWidth onClick={requestPermission} style={{ marginBottom: 16 }}>
          <Bell size={18} /> Allow notifications
        </Button>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <Toggle label="Enable reminders" checked={enabled} onChange={handleToggle} />
      </div>

      <div className="reminder-list">
        {reminderTimes.map(time => (
          <div key={time} className="reminder-item">
            <span className="reminder-time">{formatTime(time)}</span>
            <button className="reminder-remove" onClick={() => handleRemove(time)}>
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="add-reminder">
          <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="time-input" />
          <Button size="sm" onClick={handleAdd}>Add</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" fullWidth onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Add reminder
        </Button>
      )}
    </div>
  )
}
