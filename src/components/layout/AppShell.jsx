import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({ title, children }) {
  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <div className="flex min-h-screen flex-col pl-56">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
