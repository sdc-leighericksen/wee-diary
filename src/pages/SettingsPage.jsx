import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, FileDown, LogOut, Plus, Trash2 } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useSettingsStore from '../stores/settingsStore'
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

  const handleLogout = async () => {
    await logout()
    navigate('/login')
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
