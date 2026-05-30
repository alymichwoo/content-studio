import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

export default function TopBar({ title, mobileNavOpen = false, onMenuClick }) {
  const { user, signOut } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!userMenuOpen) return

    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  function closeUserMenu() {
    setUserMenuOpen(false)
  }

  function handleSignOut() {
    closeUserMenu()
    signOut()
  }

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate/20 bg-cream px-4 py-3 md:px-6 md:py-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded text-charcoal transition hover:bg-charcoal/5 md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          aria-controls="mobile-nav-drawer"
          aria-expanded={mobileNavOpen}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="truncate text-xl font-black uppercase tracking-tighter text-charcoal md:text-2xl">
          {title}
        </h1>
      </div>

      <div className="hidden items-center gap-4 md:flex">
        {user?.email && <span className="text-sm text-slate">{user.email}</span>}
        <Link
          to="/settings"
          className="inline-flex min-h-11 items-center justify-center rounded border border-slate/30 bg-transparent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-charcoal transition hover:border-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 md:min-h-0"
        >
          Settings
        </Link>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>

      <div className="relative md:hidden" ref={userMenuRef}>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-slate/30 text-charcoal transition hover:border-charcoal"
          onClick={() => setUserMenuOpen((open) => !open)}
          aria-label="User menu"
          aria-expanded={userMenuOpen}
        >
          <User className="h-5 w-5" aria-hidden="true" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded border border-slate/20 bg-cream py-1 shadow-lg">
            {user?.email && (
              <p className="border-b border-slate/20 px-4 py-3 text-sm text-slate">{user.email}</p>
            )}
            <Link
              to="/settings"
              className="flex min-h-11 w-full items-center px-4 text-left text-sm font-bold uppercase tracking-wider text-charcoal transition hover:bg-charcoal/5"
              onClick={closeUserMenu}
            >
              Settings
            </Link>
            <button
              type="button"
              className="flex min-h-11 w-full items-center px-4 text-left text-sm font-bold uppercase tracking-wider text-charcoal transition hover:bg-charcoal/5"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
