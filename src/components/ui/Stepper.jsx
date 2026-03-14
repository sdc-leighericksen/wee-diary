import { Minus, Plus } from 'lucide-react'
import './Stepper.css'

export default function Stepper({ value, onChange, step = 50, min = 0, max = 2000, label, unit = 'ml' }) {
  const dec = () => onChange(Math.max(min, (value || 0) - step))
  const inc = () => onChange(Math.min(max, (value || 0) + step))

  return (
    <div className="stepper">
      {label && <label className="stepper-label">{label}</label>}
      <div className="stepper-row">
        <button type="button" className="stepper-btn" onClick={dec} disabled={value <= min}>
          <Minus size={20} />
        </button>
        <div className="stepper-value">
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(Math.min(max, Math.max(min, parseInt(e.target.value) || 0)))}
            className="stepper-input"
            placeholder="0"
          />
          <span className="stepper-unit">{unit}</span>
        </div>
        <button type="button" className="stepper-btn" onClick={inc} disabled={value >= max}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}
