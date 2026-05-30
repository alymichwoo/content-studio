import FieldError from './FieldError'
import { labelClass } from './fieldStyles'

export default function MultiSelect({
  id,
  label,
  value = [],
  onChange,
  options = [],
  error,
  className = '',
}) {
  function toggle(optionValue) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div className={className}>
      {label && (
        <span id={`${id}-label`} className={labelClass}>
          {label}
        </span>
      )}
      <div
        role="group"
        aria-labelledby={label ? `${id}-label` : undefined}
        className={`flex flex-wrap gap-2 ${label ? 'mt-1' : ''}`}
      >
        {options.map((opt) => {
          const selected = value.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(opt.value)}
              className={`min-h-11 rounded border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 md:min-h-0 md:py-1.5 ${
                selected
                  ? 'border-charcoal bg-charcoal text-cream'
                  : 'border-slate/30 bg-cream text-charcoal hover:border-charcoal'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <FieldError message={error} />
    </div>
  )
}
