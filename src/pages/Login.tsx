import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ApiError } from '@/lib/api'
import Logo from '@/components/layout/Logo'

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
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center px-base desktop:h-20 desktop:px-lg">
        <Logo />
      </header>

      <div className="flex flex-1 items-center justify-center px-base py-xl">
        <div className="w-full max-w-md">
          <div className="mb-base flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-display-lg text-ink">Masuk</h1>
          <p className="mt-xs text-body-md text-muted">
            Masukkan nomor HP atau kode undangan beserta password Anda.
          </p>

          <form onSubmit={handleSubmit} className="mt-lg space-y-base">
            <div>
              <label htmlFor="ident" className="field-label">
                No HP atau Kode Undangan
              </label>
              <input
                id="ident"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="field-input"
                placeholder="08123456789 atau KSTP-XXXXXX"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="pw" className="field-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input pr-xl"
                  placeholder="Password Anda"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-md top-1/2 -translate-y-1/2 text-muted"
                  aria-label={showPw ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-body-sm text-primary-error">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Memproses…' : (
                <>
                  Masuk <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-base text-center text-body-sm">
            <span className="text-muted">Belum aktivasi akun? </span>
            <Link to="/aktivasi" className="font-medium text-primary">
              Aktivasi dengan kode undangan
            </Link>
          </div>

          <div className="mt-lg rounded-md bg-surface-soft p-base text-caption-sm text-muted">
            <p className="font-semibold text-ink">Akun Demo (password: password123)</p>
            <ul className="mt-xs space-y-xxs">
              <li>Warga — 08123456789</li>
              <li>Pengelola — 08111111111</li>
              <li>Petugas Keuangan — 08222222222</li>
              <li>Petugas Keamanan — 08333333333</li>
              <li>Super Admin — 08444444444</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
