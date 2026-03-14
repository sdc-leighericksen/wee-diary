import './Toggle.css'

export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-wrapper">
      {label && <span className="toggle-label">{label}</span>}
      <div className={`toggle ${checked ? 'toggle-on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="toggle-knob" />
      </div>
    </label>
  )
}
