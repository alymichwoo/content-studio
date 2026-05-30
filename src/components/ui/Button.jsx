const variantClasses = {
  primary:
    'bg-coral text-cream hover:bg-coral/90 focus-visible:ring-coral disabled:opacity-60',
  ghost:
    'border border-slate/30 bg-transparent text-charcoal hover:border-charcoal focus-visible:ring-charcoal',
  danger:
    'border border-coral/40 bg-coral/10 text-coral hover:bg-coral/20 focus-visible:ring-coral',
}

const sizeClasses = {
  sm: 'min-h-11 px-3 py-2 text-xs md:min-h-0 md:py-1.5',
  md: 'min-h-11 px-4 py-2.5 text-sm md:min-h-0 md:py-2',
  lg: 'min-h-11 px-5 py-3 text-base md:min-h-0 md:py-2.5',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
