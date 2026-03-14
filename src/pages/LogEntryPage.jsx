import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { GlassWater, Droplet, RefreshCw, ArrowLeft, Check, Trash2 } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useEntriesStore from '../stores/entriesStore'
import useSettingsStore from '../stores/settingsStore'
import Button from '../components/ui/Button'
import ChipSelector from '../components/ui/ChipSelector'
import UrgencySelector from '../components/ui/UrgencySelector'
import Stepper from '../components/ui/Stepper'
import TimePicker from '../components/ui/TimePicker'
import Toggle from '../components/ui/Toggle'
import './LogEntryPage.css'

const FLUID_CATEGORIES = [
  {
    label: 'Drinks',
    options: ['Water', 'Juice', 'Milk', 'Cordial', 'Tea/Coffee', 'Soft drink', 'Other drink'],
  },
  {
    label: 'Soups',
    options: ['Clear broth / bouillon', 'Strained cream soup'],
  },
  {
    label: 'Desserts',
    options: ['Jelly / gelatin', 'Ice cream', 'Sorbet', 'Popsicle / fruit ice'],
  },
  {
    label: 'Dairy & shakes',
    options: ['Yogurt', 'Milkshake', 'Custard'],
  },
  {
    label: 'Supplements',
    options: ['Ensure / liquid supplement', 'Pudding'],
  },
  {
    label: 'Water-rich foods',
    options: ['Watermelon', 'Grapes', 'Cucumber', 'Celery'],
  },
]

const QUICK_AMOUNTS = [
  { label: 'Small glass', ml: 200 },
  { label: 'Cup', ml: 250 },
  { label: 'Large glass', ml: 350 },
  { label: 'Can', ml: 375 },
  { label: 'Bottle', ml: 500 },
  { label: 'Sport bottle', ml: 600 },
  { label: 'Drink bottle', ml: 1000 },
]
const LEAK_SIZES = ['Spot', 'Small', 'Medium', 'Large']
const FULLNESS_LEVELS = ['Dry', 'Slightly damp', 'Damp', 'Wet', 'Soaked']
const CHANGE_REASONS = ['Scheduled', 'Felt wet', 'Leaked', 'Before going out', 'Before bed', 'Other']

function nowLocalISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function LogEntryPage() {
  const { id: editId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { entries, addEntry, editEntry, removeEntry } = useEntriesStore()
  const { continenceProducts = [] } = useSettingsStore()

  const [step, setStep] = useState(editId ? 1 : 0)
  const [entryType, setEntryType] = useState(searchParams.get('type') || '')
  const [timestamp, setTimestamp] = useState(nowLocalISO())
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [fluidType, setFluidType] = useState('')
  const [fluidAmount, setFluidAmount] = useState(0)

  const [urgencyLevel, setUrgencyLevel] = useState(0)
  const [measured, setMeasured] = useState(false)
  const [urineAmount, setUrineAmount] = useState(0)
  const [leaked, setLeaked] = useState(false)
  const [leakSize, setLeakSize] = useState('')
  const [padChanged, setPadChanged] = useState(false)
  const [activityNotes, setActivityNotes] = useState('')

  const [changeFullness, setChangeFullness] = useState('')
  const [changeReason, setChangeReason] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [wetWeightG, setWetWeightG] = useState(0)

  useEffect(() => {
    if (editId) {
      const entry = entries.find(e => e.$id === editId)
      if (entry) {
        setEntryType(entry.entryType)
        const d = new Date(entry.timestamp)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        setTimestamp(d.toISOString().slice(0, 16))
        setFluidType(entry.fluidType || '')
        setFluidAmount(entry.fluidAmount || 0)
        setUrgencyLevel(entry.urgencyLevel || 0)
        setUrineAmount(entry.urineAmount || 0)
        setMeasured(!!entry.urineAmount)
        setLeaked(entry.leaked || false)
        setLeakSize(entry.leakSize || '')
        setPadChanged(entry.padChanged || false)
        setActivityNotes(entry.activityNotes || '')
        setChangeFullness(entry.changeFullness || '')
        setChangeReason(entry.changeReason || '')
        setSelectedProductId(entry.productName
          ? (continenceProducts.find(p => p.name === entry.productName)?.id || '')
          : '')
        setWetWeightG(entry.wetWeightG || 0)
        setStep(1)
      }
    }
  }, [editId, entries])

  useEffect(() => {
    if (searchParams.get('type') && !editId) setStep(1)
  }, [])

  const selectedProduct = continenceProducts.find(p => p.id === selectedProductId) || null
  const padUrineEstimate = selectedProduct && wetWeightG > selectedProduct.dryWeightG
    ? wetWeightG - selectedProduct.dryWeightG
    : null

  const handleTypeSelect = (type) => {
    setEntryType(type)
    setStep(1)
  }

  const handleSave = async () => {
    setSaveError('')
    try {
      const data = {
        userId: user.$id,
        timestamp: new Date(timestamp).toISOString(),
        entryType,
      }
      if (!editId) data.createdAt = new Date().toISOString()

      if (entryType === 'fluid') {
        if (fluidType) data.fluidType = fluidType
        if (fluidAmount > 0) data.fluidAmount = fluidAmount

      } else if (entryType === 'void') {
        if (urgencyLevel > 0) data.urgencyLevel = urgencyLevel
        if (measured && urineAmount > 0) data.urineAmount = urineAmount
        data.leaked = leaked
        data.padChanged = leaked ? padChanged : false
        if (leaked && leakSize) data.leakSize = leakSize
        if (activityNotes) data.activityNotes = activityNotes

      } else if (entryType === 'change') {
        if (changeFullness) data.changeFullness = changeFullness
        if (changeReason)   data.changeReason   = changeReason
        if (activityNotes)  data.activityNotes  = activityNotes
        // Save pre-calculated pad urine in mL so InsightsPage can total it.
        // Requires one optional Integer attribute "padUrineML" in Appwrite.
        if (selectedProduct && wetWeightG > 0) {
          const padMl = Math.max(0, wetWeightG - selectedProduct.dryWeightG)
          if (padMl > 0) data.padUrineML = padMl
        }
      }

      if (editId) {
        await editEntry(editId, data)
      } else {
        await addEntry(data)
      }
      setSaved(true)
      setTimeout(() => navigate('/'), 800)
    } catch (err) {
      setSaveError(err?.message || 'Could not save. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    try {
      await removeEntry(editId)
      navigate('/')
    } catch (err) {
      setSaveError(err?.message || 'Could not delete. Please try again.')
      setConfirmDelete(false)
    }
  }

  if (saved) {
    return (
      <div className="page log-success">
        <div className="success-check">
          <Check size={64} />
        </div>
        <p>Saved!</p>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="log-header">
        <button className="back-btn" onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}>
          <ArrowLeft size={22} />
        </button>
        <h1>{editId ? 'Edit entry' : 'Log something'}</h1>
        {editId && (
          <button
            className={`delete-entry-btn ${confirmDelete ? 'confirm' : ''}`}
            onClick={handleDelete}
            title={confirmDelete ? 'Tap again to confirm delete' : 'Delete entry'}
          >
            <Trash2 size={18} />
            {confirmDelete && <span>Delete?</span>}
          </button>
        )}
      </div>

      {step === 0 && (
        <div className="type-select">
          <p className="type-prompt">What happened?</p>
          <button className="type-btn fluid" onClick={() => handleTypeSelect('fluid')}>
            <GlassWater size={32} />
            <span>I had a drink or food</span>
          </button>
          <button className="type-btn void" onClick={() => handleTypeSelect('void')}>
            <Droplet size={32} />
            <span>I used the loo</span>
          </button>
          <button className="type-btn change" onClick={() => handleTypeSelect('change')}>
            <RefreshCw size={32} />
            <span>I changed my pad/pull-up</span>
          </button>
        </div>
      )}

      {step === 1 && entryType === 'fluid' && (
        <div className="form-section">
          <TimePicker label="When?" value={timestamp} onChange={setTimestamp} />

          <p className="fluid-info-tip">
            Many foods count towards your fluid intake — soups, jelly, ice cream, yogurt and water-rich foods all add up!
          </p>

          <ChipSelector
            label="What did you have?"
            groups={FLUID_CATEGORIES}
            value={fluidType}
            onChange={setFluidType}
          />

          <Stepper label="How much? (ml)" value={fluidAmount} onChange={setFluidAmount} />

          <div className="quick-amounts">
            {QUICK_AMOUNTS.map(q => (
              <button
                key={q.ml}
                type="button"
                className={`quick-btn ${fluidAmount === q.ml ? 'active' : ''}`}
                onClick={() => setFluidAmount(q.ml)}
              >
                {q.label}<br /><strong>{q.ml}ml</strong>
              </button>
            ))}
          </div>

          <Button size="lg" fullWidth onClick={() => setStep(2)}>
            Review
          </Button>
        </div>
      )}

      {step === 1 && entryType === 'void' && (
        <div className="form-section">
          <TimePicker label="When?" value={timestamp} onChange={setTimestamp} />

          <UrgencySelector value={urgencyLevel} onChange={setUrgencyLevel} />

          <Toggle label="Did you measure?" checked={measured} onChange={setMeasured} />
          {measured && <Stepper label="Amount (ml)" value={urineAmount} onChange={setUrineAmount} />}

          <Toggle label="Did you leak?" checked={leaked} onChange={setLeaked} />
          {leaked && (
            <>
              <ChipSelector label="How much?" options={LEAK_SIZES} value={leakSize} onChange={setLeakSize} />
              <Toggle label="Did you need to change?" checked={padChanged} onChange={setPadChanged} />
            </>
          )}

          <div className="form-field">
            <label>What were you doing?</label>
            <textarea
              value={activityNotes}
              onChange={e => setActivityNotes(e.target.value.slice(0, 500))}
              placeholder="e.g. just woke up, coughed, walking to the bathroom..."
              rows={2}
              className="notes-input"
            />
            <span className="char-count">{activityNotes.length}/500</span>
          </div>

          <Button size="lg" fullWidth onClick={() => setStep(2)}>
            Review
          </Button>
        </div>
      )}

      {step === 1 && entryType === 'change' && (
        <div className="form-section">
          <TimePicker label="When?" value={timestamp} onChange={setTimestamp} />

          <ChipSelector
            label="How full was it?"
            options={FULLNESS_LEVELS}
            value={changeFullness}
            onChange={setChangeFullness}
          />

          <ChipSelector
            label="Why did you change?"
            options={CHANGE_REASONS}
            value={changeReason}
            onChange={setChangeReason}
          />

          {continenceProducts.length > 0 && (
            <ChipSelector
              label="Which product?"
              options={continenceProducts.map(p => p.name)}
              value={selectedProduct?.name || ''}
              onChange={name => {
                const p = continenceProducts.find(cp => cp.name === name)
                setSelectedProductId(p ? p.id : '')
              }}
            />
          )}

          <Stepper
            label="Weight when removed (grams)"
            value={wetWeightG}
            onChange={setWetWeightG}
            step={1}
            min={0}
            max={1000}
            unit="g"
          />

          {padUrineEstimate !== null && (
            <p className="pad-urine-estimate">
              ≈ <strong>{padUrineEstimate} ml</strong> urine in pad
              {selectedProduct ? ` (wet ${wetWeightG}g − dry ${selectedProduct.dryWeightG}g)` : ''}
            </p>
          )}

          <div className="form-field">
            <label>Anything else?</label>
            <textarea
              value={activityNotes}
              onChange={e => setActivityNotes(e.target.value.slice(0, 500))}
              placeholder="e.g. noticed it was wet after sport..."
              rows={2}
              className="notes-input"
            />
            <span className="char-count">{activityNotes.length}/500</span>
          </div>

          <Button size="lg" fullWidth onClick={() => setStep(2)} disabled={!changeFullness || !changeReason}>
            Review
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="form-section">
          <h2 className="review-title">All good?</h2>

          <div className="review-card card">
            <div className="review-row">
              <span className="review-label">Type</span>
              <span>{entryType === 'fluid' ? 'Had a drink/food' : entryType === 'change' ? 'Changed pad/pull-up' : 'Used the loo'}</span>
            </div>
            <div className="review-row">
              <span className="review-label">Time</span>
              <span>{format(new Date(timestamp), 'h:mm a, d MMM')}</span>
            </div>

            {entryType === 'fluid' && (
              <>
                {fluidType && (
                  <div className="review-row">
                    <span className="review-label">Drink/food</span>
                    <span>{fluidType}</span>
                  </div>
                )}
                {fluidAmount > 0 && (
                  <div className="review-row">
                    <span className="review-label">Amount</span>
                    <span>{fluidAmount} ml</span>
                  </div>
                )}
              </>
            )}

            {entryType === 'void' && (
              <>
                {urgencyLevel > 0 && (
                  <div className="review-row">
                    <span className="review-label">Urgency</span>
                    <span>{urgencyLevel}/5</span>
                  </div>
                )}
                {measured && urineAmount > 0 && (
                  <div className="review-row">
                    <span className="review-label">Amount</span>
                    <span>{urineAmount} ml</span>
                  </div>
                )}
                <div className="review-row">
                  <span className="review-label">Leaked</span>
                  <span>{leaked ? `Yes${leakSize ? ` (${leakSize})` : ''}` : 'No'}</span>
                </div>
                {leaked && padChanged && (
                  <div className="review-row">
                    <span className="review-label">Changed</span>
                    <span>Yes</span>
                  </div>
                )}
                {activityNotes && (
                  <div className="review-row">
                    <span className="review-label">Activity</span>
                    <span>{activityNotes}</span>
                  </div>
                )}
              </>
            )}

            {entryType === 'change' && (
              <>
                {changeFullness && (
                  <div className="review-row">
                    <span className="review-label">Fullness</span>
                    <span>{changeFullness}</span>
                  </div>
                )}
                {changeReason && (
                  <div className="review-row">
                    <span className="review-label">Reason</span>
                    <span>{changeReason}</span>
                  </div>
                )}
                {selectedProduct && (
                  <div className="review-row">
                    <span className="review-label">Product</span>
                    <span>{selectedProduct.name} (dry: {selectedProduct.dryWeightG}g)</span>
                  </div>
                )}
                {wetWeightG > 0 && (
                  <div className="review-row">
                    <span className="review-label">Wet weight</span>
                    <span>{wetWeightG} g</span>
                  </div>
                )}
                {padUrineEstimate !== null && (
                  <div className="review-row">
                    <span className="review-label">Pad urine</span>
                    <span>≈ {padUrineEstimate} ml</span>
                  </div>
                )}
                {activityNotes && (
                  <div className="review-row">
                    <span className="review-label">Notes</span>
                    <span>{activityNotes}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {saveError && (
            <p className="save-error">{saveError}</p>
          )}

          <Button size="lg" fullWidth onClick={handleSave}>
            {editId ? 'Save changes' : 'Save entry'}
          </Button>
        </div>
      )}
    </div>
  )
}
