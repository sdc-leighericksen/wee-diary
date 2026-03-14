import './ChipSelector.css'

/**
 * ChipSelector supports two modes:
 * - Simple: pass `options` (string[]) for a flat list
 * - Grouped: pass `groups` ({ label: string, options: string[] }[]) for sectioned display
 */
export default function ChipSelector({ options, groups, value, onChange, label }) {
  const renderChips = (opts) =>
    opts.map(opt => (
      <button
        key={opt}
        type="button"
        className={`chip ${value === opt ? 'chip-active' : ''}`}
        onClick={() => onChange(opt)}
      >
        {opt}
      </button>
    ))

  return (
    <div className="chip-selector">
      {label && <label className="chip-label">{label}</label>}

      {groups ? (
        groups.map(group => (
          <div key={group.label} className="chip-group">
            <span className="chip-group-label">{group.label}</span>
            <div className="chip-grid">
              {renderChips(group.options)}
            </div>
          </div>
        ))
      ) : (
        <div className="chip-grid">
          {renderChips(options || [])}
        </div>
      )}
    </div>
  )
}
