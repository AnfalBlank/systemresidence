import {
  Home,
  Megaphone,
  Wallet,
  ShoppingBag,
  MessageCircle,
  ShieldAlert,
  FileWarning,
  PieChart,
  HeartHandshake,
  Users,
  Wrench,
  CalendarDays,
  CalendarCheck,
  Vote,
  HandCoins,
  Recycle,
  DoorOpen,
  Newspaper,
  Store,
  LayoutGrid,
  Radio,
  ShieldCheck,
  UserCog,
  ReceiptText,
  FileBarChart,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  primary?: boolean // appears in the mobile bottom tab bar
}

export interface NavSection {
  title: string
  items: NavItem[]
}

// Organised into sections for the desktop sidebar.
export const navSections: NavSection[] = [
  {
    title: 'Utama',
    items: [
      { to: '/', label: 'Beranda', icon: Home, primary: true },
      { to: '/feed', label: 'Community Feed', icon: Newspaper },
      { to: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
      { to: '/berita-duka', label: 'Berita Duka', icon: HeartHandshake },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      { to: '/iuran', label: 'Iuran', icon: Wallet, primary: true },
      { to: '/keuangan', label: 'Transparansi', icon: PieChart },
      { to: '/crowdfunding', label: 'Crowdfunding', icon: HandCoins },
      { to: '/bank-sampah', label: 'Bank Sampah', icon: Recycle },
    ],
  },
  {
    title: 'Ekonomi Warga',
    items: [
      { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, primary: true },
      { to: '/skill', label: 'Skill Directory', icon: Wrench },
      { to: '/umkm', label: 'Iklan UMKM', icon: Store },
    ],
  },
  {
    title: 'Komunitas',
    items: [
      { to: '/chat', label: 'Chat', icon: MessageCircle, primary: true },
      { to: '/komunitas', label: 'Grup Komunitas', icon: Users },
      { to: '/event', label: 'Event', icon: CalendarDays },
      { to: '/booking', label: 'Booking Fasilitas', icon: CalendarCheck },
      { to: '/voting', label: 'E-Voting', icon: Vote },
    ],
  },
  {
    title: 'Layanan & Keamanan',
    items: [
      { to: '/pengaduan', label: 'Pengaduan', icon: FileWarning },
      { to: '/tamu', label: 'Visitor Management', icon: DoorOpen },
      { to: '/panic', label: 'Panic Button', icon: ShieldAlert },
      { to: '/keamanan', label: 'Dashboard Keamanan', icon: ShieldCheck },
      { to: '/broadcast', label: 'Broadcast Center', icon: Radio },
    ],
  },
  {
    title: 'Admin',
    items: [
      { to: '/warga', label: 'Manajemen Warga', icon: UserCog },
      { to: '/verifikasi', label: 'Verifikasi Pembayaran', icon: ReceiptText },
      { to: '/laporan-pembayaran', label: 'Laporan Pembayaran', icon: FileBarChart },
      { to: '/pengaturan', label: 'Pengaturan', icon: SettingsIcon },
    ],
  },
]

// Flat list for convenience
export const navItems: NavItem[] = navSections.flatMap((s) => s.items)

// Bottom tab bar: 4 primary items + a "Menu" entry handled separately
export const primaryNavItems: NavItem[] = navItems.filter((n) => n.primary)

export const moreNavItem: NavItem = {
  to: '/menu',
  label: 'Menu',
  icon: LayoutGrid,
}
