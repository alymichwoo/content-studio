import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import FieldError from './FieldError'
import { labelClass } from './fieldStyles'

export default function Select({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  error,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selected = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label && (
        <label id={`${id}-label`} className={labelClass}>
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${id}-label` : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className={`mt-1 flex w-full items-center justify-between rounded border border-slate/30 bg-cream px-3 py-2 text-left text-sm text-charcoal focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral ${!selected ? 'text-slate/60' : ''}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.color && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selected.color }}
              aria-hidden="true"
            />
          )}
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate" aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-slate/30 bg-cream py-1 shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-charcoal/5 ${opt.value === value ? 'bg-charcoal/5 font-semibold' : ''}`}
              >
                {opt.color && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: opt.color }}
                    aria-hidden="true"
                  />
                )}
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <FieldError message={error} />
    </div>
  )
}
