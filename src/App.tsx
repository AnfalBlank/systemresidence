import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import AppLayout from '@/components/layout/AppLayout'
import Activation from '@/pages/Activation'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Feed from '@/pages/Feed'
import Announcements from '@/pages/Announcements'
import Obituaries from '@/pages/Obituaries'
import Dues from '@/pages/Dues'
import Finance from '@/pages/Finance'
import Crowdfunding from '@/pages/Crowdfunding'
import WasteBank from '@/pages/WasteBank'
import Marketplace from '@/pages/Marketplace'
import Skills from '@/pages/Skills'
import Umkm from '@/pages/Umkm'
import Chat from '@/pages/Chat'
import Community from '@/pages/Community'
import Events from '@/pages/Events'
import Booking from '@/pages/Booking'
import Voting from '@/pages/Voting'
import Complaints from '@/pages/Complaints'
import Visitors from '@/pages/Visitors'
import Panic from '@/pages/Panic'
import Profile from '@/pages/Profile'
import Menu from '@/pages/Menu'
import Broadcast from '@/pages/Broadcast'
import SecurityDashboard from '@/pages/SecurityDashboard'
import ResidentManagement from '@/pages/ResidentManagement'
import PaymentVerification from '@/pages/PaymentVerification'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

export default function App() {
  const { isAuthenticated, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-hairline border-t-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/aktivasi" element={<Activation />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/pengumuman" element={<Announcements />} />
        <Route path="/berita-duka" element={<Obituaries />} />
        <Route path="/iuran" element={<Dues />} />
        <Route path="/keuangan" element={<Finance />} />
        <Route path="/crowdfunding" element={<Crowdfunding />} />
        <Route path="/bank-sampah" element={<WasteBank />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/skill" element={<Skills />} />
        <Route path="/umkm" element={<Umkm />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/komunitas" element={<Community />} />
        <Route path="/event" element={<Events />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/voting" element={<Voting />} />
        <Route path="/pengaduan" element={<Complaints />} />
        <Route path="/tamu" element={<Visitors />} />
        <Route path="/panic" element={<Panic />} />
        <Route path="/keamanan" element={<SecurityDashboard />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/warga" element={<ResidentManagement />} />
        <Route path="/verifikasi" element={<PaymentVerification />} />
        <Route path="/pengaturan" element={<Settings />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/aktivasi" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
