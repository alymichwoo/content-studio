import { forwardRef } from 'react'
import FieldError from './FieldError'
import { inputClass, labelClass } from './fieldStyles'

const Input = forwardRef(function Input(
  {
    id,
    label,
    error,
    className = '',
    ...props
  },
  ref,
) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <input ref={ref} id={id} className={`${inputClass} ${label ? 'mt-1' : ''}`} {...props} />
      <FieldError message={error} />
    </div>
  )
})

export default Input
