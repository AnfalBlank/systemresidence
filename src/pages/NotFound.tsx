import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-rating-display text-ink">404</p>
      <h1 className="mt-sm text-display-sm text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-xs text-body-md text-muted">
        Halaman yang Anda cari tidak tersedia.
      </p>
      <Link to="/" className="btn-primary mt-lg px-lg">
        <Home className="h-4 w-4" /> Kembali ke Beranda
      </Link>
    </div>
  )
}
