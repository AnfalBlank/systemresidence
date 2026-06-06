import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Wallet,
  MessageCircle,
  CalendarDays,
  Vote,
  HandCoins,
  ShieldAlert,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ApiError } from '@/lib/api'
import { showDemoHelpers } from '@/config/env'
import Logo from '@/components/layout/Logo'

const highlights = [
  { icon: Wallet, label: 'Iuran & Transparansi Keuangan' },
  { icon: MessageCircle, label: 'Chat & Grup Komunitas' },
  { icon: CalendarDays, label: 'Event & Booking Fasilitas' },
  { icon: Vote, label: 'E-Voting Warga' },
  { icon: HandCoins, label: 'Crowdfunding & Bank Sampah' },
  { icon: ShieldAlert, label: 'Panic Button & Visitor Management' },
]

export default function Login() {
  const { login } = useApp()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(identifier.trim(), password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal masuk.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="grid min-h-screen grid-cols-1 desktop:grid-cols-2">
        {/* Left — hero panel with background photo */}
        <div className="relative hidden overflow-hidden bg-ink desktop:block">
          <img
            src="/background.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          {/* Dark gradient scrim for text legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          <div className="relative flex h-full flex-col justify-between p-section text-white">
            <div className="flex items-center gap-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-white">
                <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                  <path d="M16 6 L26 14 V26 H20 V19 H12 V26 H6 V14 Z" />
                </svg>
              </span>
              <div className="leading-none">
                <p className="text-title-md text-white">KSTP Cakung</p>
                <p className="text-body-sm text-white/75">Layanan Warga Digital</p>
              </div>
            </div>

            <div className="max-w-md">
              <h1 className="text-display-xl text-white" style={{ fontSize: '40px', lineHeight: 1.15 }}>
                Satu aplikasi untuk seluruh aktivitas warga.
              </h1>
              <p className="mt-base text-body-md text-white/85">
                Kampung Susun Tumbuh Produktif Cakung. Administrasi, komunikasi,
                ekonomi, dan keamanan — terhubung ke unit hunian Anda yang
                tervalidasi.
              </p>

              <ul className="mt-lg grid grid-cols-2 gap-sm">
                {highlights.map((h) => (
                  <li key={h.label} className="flex items-start gap-sm text-body-sm text-white/90">
                    <span className="mt-xxs flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                      <h.icon className="h-3.5 w-3.5" />
                    </span>
                    <span>{h.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-sm text-caption-sm text-white/70">
              <ShieldCheck className="h-4 w-4" />
              <span>Akun Anda terhubung ke unit terverifikasi · Satu Akun = Satu Warga</span>
            </div>
          </div>
        </div>

        {/* Right — login form */}
        <div className="flex flex-col">
          {/* Mobile hero strip with the photo */}
          <div className="relative h-44 overflow-hidden desktop:hidden">
            <img
              src="/background.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%)',
              }}
            />
            <div className="relative flex h-full flex-col justify-between p-base text-white">
              <Logo compact />
              <div>
                <p className="text-display-sm">KSTP Cakung</p>
                <p className="text-body-sm text-white/85">Layanan Warga Digital</p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-base py-xl desktop:p-section">
            <div className="w-full max-w-md">
              {/* Desktop logo above form */}
              <div className="mb-lg hidden desktop:block">
                <Logo />
              </div>

              <div className="mb-base flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-display-lg text-ink">Masuk ke akun Anda</h1>
              <p className="mt-xs text-body-md text-muted">
                Gunakan username, nomor HP, atau kode undangan beserta password.
              </p>

              <form onSubmit={handleSubmit} className="mt-lg space-y-base">
                <div>
                  <label htmlFor="ident" className="field-label">
                    Username / No HP / Kode Undangan
                  </label>
                  <input
                    id="ident"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="field-input"
                    placeholder="contoh: nama.b0412 atau 08xxxxxxxxxx"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <div className="mb-xs flex items-center justify-between">
                    <label htmlFor="pw" className="field-label mb-0">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="flex items-center gap-xxs text-caption-sm text-muted hover:text-ink"
                    >
                      {showPw ? (
                        <><EyeOff className="h-3.5 w-3.5" /> Sembunyikan</>
                      ) : (
                        <><Eye className="h-3.5 w-3.5" /> Tampilkan</>
                      )}
                    </button>
                  </div>
                  <input
                    id="pw"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input"
                    placeholder="Password Anda"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <p className="rounded-sm bg-primary-disabled/40 p-md text-body-sm text-primary-error">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Memproses…' : (<>Masuk <ArrowRight className="h-4 w-4" /></>)}
                </button>
              </form>

              <div className="mt-lg rounded-md border border-hairline bg-surface-soft p-base">
                <p className="text-title-sm text-ink">Belum punya akun?</p>
                <p className="mt-xxs text-body-sm text-muted">
                  Pendaftaran dilakukan oleh pengelola. Anda akan menerima
                  <strong> kode undangan</strong> via WhatsApp atau SMS untuk
                  mengaktifkan akun.
                </p>
                <Link
                  to="/aktivasi"
                  className="mt-sm inline-flex items-center gap-xs text-button-sm font-medium text-primary"
                >
                  Aktivasi dengan kode undangan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {showDemoHelpers && (
                <details className="mt-base rounded-md border border-hairline-soft bg-canvas p-base text-caption-sm">
                  <summary className="cursor-pointer text-title-sm text-ink">
                    Akun Demo (development only)
                  </summary>
                  <p className="mt-sm text-muted">
                    Password semua akun: <code className="rounded-xs bg-surface-soft px-xs py-xxs font-semibold text-ink">password123</code>
                  </p>
                  <ul className="mt-xs space-y-xxs text-muted">
                    <li>Warga — <code className="text-ink">08123456789</code></li>
                    <li>Pengelola — <code className="text-ink">08111111111</code></li>
                    <li>Petugas Keuangan — <code className="text-ink">08222222222</code></li>
                    <li>Petugas Keamanan — <code className="text-ink">08333333333</code></li>
                    <li>Super Admin — <code className="text-ink">08444444444</code></li>
                  </ul>
                </details>
              )}

              <p className="mt-lg text-center text-caption-sm text-muted-soft">
                © 2026 KSTP Cakung. Versi 1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
