import { useState } from 'react'
import Sidebar from './Sidebar'
import MobileNavDrawer from './MobileNavDrawer'
import TopBar from './TopBar'

export default function AppShell({ title, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream">
      <Sidebar />
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen flex-col md:pl-56">
        <TopBar
          title={title}
          mobileNavOpen={mobileNavOpen}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
