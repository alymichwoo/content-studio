import { NavLink } from 'react-router-dom'
import {
  Calendar,
  FileText,
  Lightbulb,
  Handshake,
  LayoutDashboard,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export const navItems = [
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/posts', label: 'Posts', icon: FileText },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb },
  { to: '/partnerships', label: 'Partnerships', icon: Handshake },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/generate', label: 'Generate', icon: Sparkles },
  { to: '/report', label: 'Report', icon: BarChart3 },
]

export function navLinkClass({ isActive }, variant = 'desktop') {
  const sizing = variant === 'mobile' ? 'min-h-11 py-3' : 'py-2.5'
  const base = `flex items-center gap-3 border-l-2 px-4 ${sizing} text-sm font-semibold uppercase tracking-wider transition`
  if (isActive) {
    return `${base} border-coral text-coral`
  }
  return `${base} border-transparent text-slate hover:text-cream`
}

export function SidebarBrand() {
  const { handle, displayName } = useAuth()
  const shownHandle = handle ? `@${handle}` : '@alymichwoo'

  return (
    <div className="border-b border-white/10 px-4 py-6">
      <p className="text-sm font-bold uppercase tracking-wider text-cream">{shownHandle}</p>
      {displayName && (
        <p className="mt-1 truncate text-xs text-slate">{displayName}</p>
      )}
    </div>
  )
}

export function SidebarNav({ variant = 'desktop', onLinkClick }) {
  return (
    <nav className="flex-1 space-y-1 py-4">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={(props) => navLinkClass(props, variant)}
          onClick={onLinkClick}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Fixed vertical sidebar — visible at md breakpoint and above only. */
export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-charcoal md:flex">
      <SidebarBrand />
      <SidebarNav />
    </aside>
  )
}
