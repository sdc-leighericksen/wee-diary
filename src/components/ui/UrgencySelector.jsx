import './UrgencySelector.css'

const levels = [
  { value: 1, label: 'No rush', color: 'var(--urgency-1)' },
  { value: 2, label: 'Mild', color: 'var(--urgency-2)' },
  { value: 3, label: 'Moderate', color: 'var(--urgency-3)' },
  { value: 4, label: 'Strong', color: 'var(--urgency-4)' },
  { value: 5, label: 'Desperate', color: 'var(--urgency-5)' },
]

export default function UrgencySelector({ value, onChange }) {
  return (
    <div className="urgency-selector">
      <label className="urgency-label">How urgent was it?</label>
      <div className="urgency-options">
        {levels.map(level => (
          <button
            key={level.value}
            type="button"
            className={`urgency-option ${value === level.value ? 'urgency-active' : ''}`}
            onClick={() => onChange(level.value)}
            style={{ '--dot-color': level.color }}
          >
            <div className="urgency-dot" />
            <span className="urgency-value">{level.value}</span>
            <span className="urgency-text">{level.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
