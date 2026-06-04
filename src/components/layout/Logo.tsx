import { Link } from 'react-router-dom'

interface LogoProps {
  compact?: boolean
}

export default function Logo({ compact = false }: LogoProps) {
  return (
    <Link to="/" className="flex items-center gap-sm" aria-label="KSTP Cakung beranda">
      <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-white">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M16 6 L26 14 V26 H20 V19 H12 V26 H6 V14 Z" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-title-md text-ink">KSTP Cakung</span>
          <span className="text-caption-sm text-muted">Layanan Warga</span>
        </span>
      )}
    </Link>
  )
}
