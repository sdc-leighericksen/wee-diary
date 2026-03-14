import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, FileDown, LogOut, Plus, Trash2, KeyRound } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useSettingsStore from '../stores/settingsStore'
import { updatePassword } from '../lib/appwrite'
import Button from '../components/ui/Button'
import Stepper from '../components/ui/Stepper'
import Toggle from '../components/ui/Toggle'
import './SettingsPage.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const {
    displayName, setDisplayName,
    dailyFluidTarget, setDailyFluidTarget,
    smartReminderEnabled, setSmartReminderEnabled,
    smartReminderHour, setSmartReminderHour,
    userWeightKg, setUserWeightKg,
    continenceProducts, addContinenceProduct, removeContinenceProduct,
  } = useSettingsStore()

  const [newProductName, setNewProductName] = useState('')
  const [newProductWeight, setNewProductWeight] = useState(0)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState(null) // 'success' | 'error'
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handlePasswordUpdate = async () => {
    setPasswordError('')
    setPasswordStatus(null)
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    setPasswordLoading(true)
    try {
      await updatePassword(newPassword, currentPassword)
      setPasswordStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message || 'Password update failed. Check your current password.')
      setPasswordStatus('error')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAddProduct = () => {
    if (!newProductName.trim()) return
    addContinenceProduct({ name: newProductName.trim(), dryWeightG: newProductWeight })
    setNewProductName('')
    setNewProductWeight(0)
  }

  return (
    <div className="page fade-in">
      <h1 className="page-title">Settings</h1>

      <div className="settings-section">

        {/* Display name */}
        <div className="card settings-card">
          <div className="form-field">
            <label>Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        {/* Daily fluid target */}
        <div className="card settings-card">
          <Stepper
            label="Daily fluid target (ml)"
            value={dailyFluidTarget}
            onChange={setDailyFluidTarget}
            step={100}
            min={500}
            max={5000}
          />
        </div>

        {/* User weight */}
        <div className="card settings-card">
          <Stepper
            label="Your weight (kg)"
            value={userWeightKg || 0}
            onChange={val => setUserWeightKg(val > 0 ? val : null)}
            step={1}
            min={0}
            max={200}
            unit="kg"
          />
          <p className="settings-hint">Used to estimate expected daily urine output in Insights.</p>
        </div>

        {/* Smart reminder */}
        <div className="card settings-card">
          <Toggle
            label="Smart morning reminder"
            checked={smartReminderEnabled}
            onChange={setSmartReminderEnabled}
          />
          <p className="settings-hint">Shows a banner if nothing is logged by the hour below.</p>
          {smartReminderEnabled && (
            <Stepper
              label="Remind me after (hour, 24h)"
              value={smartReminderHour}
              onChange={setSmartReminderHour}
              step={1}
              min={6}
              max={23}
              unit=":00"
            />
          )}
        </div>

        {/* Continence Products */}
        <div className="card settings-card">
          <h3 className="settings-section-title">Continence products</h3>
          <p className="settings-hint">
            Enter the dry (empty) weight of each product. When logging a change you can select a product to automatically calculate urine output from the weight difference.
          </p>

          {continenceProducts.length > 0 && (
            <div className="product-list">
              {continenceProducts.map(p => (
                <div key={p.id} className="product-row">
                  <div className="product-info">
                    <span className="product-name">{p.name}</span>
                    <span className="product-weight">{p.dryWeightG}g dry</span>
                  </div>
                  <button
                    className="product-remove"
                    onClick={() => removeContinenceProduct(p.id)}
                    aria-label={`Remove ${p.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="product-add-form">
            <div className="form-field">
              <label>Product name</label>
              <input
                type="text"
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                placeholder="e.g. Pull-up, Pad, Nappy"
              />
            </div>
            <Stepper
              label="Empty / dry weight (grams)"
              value={newProductWeight}
              onChange={setNewProductWeight}
              step={1}
              min={0}
              unit="g"
              max={500}
            />
            <Button
              variant="secondary"
              fullWidth
              onClick={handleAddProduct}
              disabled={!newProductName.trim()}
            >
              <Plus size={16} /> Add product
            </Button>
          </div>
        </div>

        {/* Change password */}
        <div className="card settings-card">
          <h3 className="settings-section-title">
            <KeyRound size={16} /> Change password
          </h3>

          {passwordStatus === 'success' && (
            <p className="password-success">Password updated successfully.</p>
          )}
          {passwordError && (
            <p className="password-error">{passwordError}</p>
          )}

          <div className="form-field">
            <label>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => { setCurrentPassword(e.target.value); setPasswordStatus(null); setPasswordError('') }}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>
          <div className="form-field">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPasswordStatus(null); setPasswordError('') }}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="form-field">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPasswordStatus(null); setPasswordError('') }}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          <Button
            variant="secondary"
            fullWidth
            onClick={handlePasswordUpdate}
            disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
          >
            {passwordLoading ? 'Updating…' : 'Update password'}
          </Button>
        </div>

        {/* Links */}
        <div className="settings-links">
          <button className="settings-link" onClick={() => navigate('/reminders')}>
            <Bell size={18} />
            <span>Reminders</span>
          </button>
          <button className="settings-link" onClick={() => navigate('/export')}>
            <FileDown size={18} />
            <span>Export for specialist</span>
          </button>
        </div>

        <Button variant="outline" fullWidth onClick={handleLogout}>
          <LogOut size={18} /> Log out
        </Button>

        <p className="app-version">Wee Diary v1.0</p>
      </div>
    </div>
  )
}
