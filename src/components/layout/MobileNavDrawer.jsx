import { useEffect } from 'react'
import { SidebarBrand, SidebarNav } from './Sidebar'

export default function MobileNavDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-40 md:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-charcoal/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col bg-charcoal transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarBrand />
        <SidebarNav variant="mobile" onLinkClick={onClose} />
      </aside>
    </div>
  )
}
