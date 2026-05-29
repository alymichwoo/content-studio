import { forwardRef } from 'react'
import FieldError from './FieldError'
import { labelClass, textareaClass } from './fieldStyles'

const Textarea = forwardRef(function Textarea(
  {
    id,
    label,
    error,
    className = '',
    rows = 4,
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
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`${textareaClass} ${label ? 'mt-1' : ''}`}
        {...props}
      />
      <FieldError message={error} />
    </div>
  )
})

export default Textarea
