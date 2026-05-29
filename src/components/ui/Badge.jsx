export default function Badge({ children, color = '#8E8E93', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-cream ${className}`}
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  )
}
