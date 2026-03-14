import './TimePicker.css'

export default function TimePicker({ value, onChange, label }) {
  return (
    <div className="time-picker">
      {label && <label className="time-picker-label">{label}</label>}
      <input
        type="datetime-local"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="time-picker-input"
      />
    </div>
  )
}
