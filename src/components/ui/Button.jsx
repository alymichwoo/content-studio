const variantClasses = {
  primary:
    'bg-coral text-cream hover:bg-coral/90 focus-visible:ring-coral disabled:opacity-60',
  ghost:
    'border border-slate/30 bg-transparent text-charcoal hover:border-charcoal focus-visible:ring-charcoal',
  danger:
    'border border-coral/40 bg-coral/10 text-coral hover:bg-coral/20 focus-visible:ring-coral',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
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
