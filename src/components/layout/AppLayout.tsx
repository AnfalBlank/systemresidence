import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="desktop:pl-64">
        <TopBar />
        <main className="mx-auto w-full max-w-content px-base pb-28 pt-base desktop:px-lg desktop:pb-section desktop:pt-lg">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
