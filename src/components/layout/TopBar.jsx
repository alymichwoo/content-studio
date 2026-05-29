import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

export default function TopBar({ title }) {
  const { user, signOut } = useAuth()

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate/20 bg-cream px-6 py-4">
      <h1 className="text-xl font-black uppercase tracking-tighter text-charcoal md:text-2xl">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {user?.email && (
          <span className="hidden text-sm text-slate sm:inline">{user.email}</span>
        )}
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
