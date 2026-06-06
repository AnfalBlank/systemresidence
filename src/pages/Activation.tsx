import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { api, ApiError, setToken } from '@/lib/api'
import { unitToString } from '@/lib/format'
import { showDemoHelpers } from '@/config/env'
import type { Resident } from '@/types'
import Logo from '@/components/layout/Logo'

type Step = 'code' | 'confirm' | 'password'

export default function Activation() {
  const { setUser } = useApp()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resident, setResident] = useState<Resident | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleCheckCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await api.post<Resident>('/auth/lookup-code', {
        code: code.trim(),
      })
      setResident(r)
      setStep('confirm')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Kode undangan tidak ditemukan.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setLoading(true)
    try {
      const result = await api.post<{ token: string; user: Resident }>(
        '/auth/activate',
        { code: code.trim(), password }
      )
      setToken(result.token)
      setUser(result.user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Aktivasi gagal.')
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
          {/* Progress */}
          <div className="mb-xl flex items-center justify-center gap-xs">
            {(['code', 'confirm', 'password'] as Step[]).map((s, i) => {
              const order = ['code', 'confirm', 'password']
              const done = order.indexOf(step) > i
              const active = step === s
              return (
                <div key={s} className="flex items-center gap-xs">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-badge font-semibold transition-colors ${
                      active
                        ? 'bg-primary text-white'
                        : done
                          ? 'bg-ink text-white'
                          : 'bg-surface-strong text-muted'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < 2 && <div className="h-px w-8 bg-hairline" />}
                </div>
              )
            })}
          </div>

          {step === 'code' && (
            <form onSubmit={handleCheckCode}>
              <div className="mb-base flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-display-lg text-ink">Aktivasi Akun</h1>
              <p className="mt-xs text-body-md text-muted">
                Masukkan kode undangan yang Anda terima dari pengelola.
              </p>

              <div className="mt-lg">
                <label htmlFor="code" className="field-label">
                  Kode Undangan
                </label>
                <input
                  id="code"
                  className="field-input text-center font-semibold tracking-widest"
                  placeholder="KSTP-XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              </div>

              {error && <p className="mt-sm text-body-sm text-primary-error">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-lg w-full"
              >
                {loading ? 'Memeriksa…' : (<>Lanjutkan <ArrowRight className="h-4 w-4" /></>)}
              </button>

              <div className="mt-base text-center text-body-sm">
                <span className="text-muted">Sudah punya akun? </span>
                <Link to="/login" className="font-medium text-primary">
                  Masuk
                </Link>
              </div>

              <p className="mt-base text-center text-caption-sm text-muted">
                Tidak ada registrasi bebas. Akun dibuat oleh pengelola terlebih dahulu.
              </p>
              {showDemoHelpers && (
                <p className="mt-xs text-center text-caption-sm text-muted">
                  Coba kode demo: <span className="font-semibold text-ink">KSTP-NEWUSR</span>
                </p>
              )}
            </form>
          )}

          {step === 'confirm' && resident && (
            <div>
              <div className="mb-base flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">
                <ShieldCheck className="h-6 w-6 text-success" />
              </div>
              <h1 className="text-display-lg text-ink">Konfirmasi Data</h1>
              <p className="mt-xs text-body-md text-muted">
                Pastikan data berikut sudah benar.
              </p>

              <dl className="card mt-lg divide-y divide-hairline-soft">
                <Row label="Nama" value={resident.nama} />
                <Row label="Unit" value={unitToString(resident.unit)} />
                <Row label="No HP" value={resident.noHp} />
                <Row label="Status" value={resident.status} />
              </dl>

              <button
                onClick={() => setStep('password')}
                className="btn-primary mt-lg w-full"
              >
                Data Sudah Benar <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setStep('code')}
                className="btn-tertiary mt-md w-full"
              >
                Kembali
              </button>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handleSetPassword}>
              <h1 className="text-display-lg text-ink">Buat Password</h1>
              <p className="mt-xs text-body-md text-muted">
                Langkah terakhir. Buat password untuk mengamankan akun Anda.
              </p>

              <div className="mt-lg space-y-base">
                <div>
                  <label htmlFor="pw" className="field-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="pw"
                      type={showPw ? 'text' : 'password'}
                      className="field-input pr-xl"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                <div>
                  <label htmlFor="pw2" className="field-label">
                    Konfirmasi Password
                  </label>
                  <input
                    id="pw2"
                    type={showPw ? 'text' : 'password'}
                    className="field-input"
                    placeholder="Ulangi password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="mt-sm text-body-sm text-primary-error">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-lg w-full"
              >
                {loading ? 'Mengaktifkan…' : (<>Aktifkan Akun <Check className="h-4 w-4" /></>)}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-base py-md">
      <dt className="text-body-sm text-muted">{label}</dt>
      <dd className="text-title-sm text-ink">{value}</dd>
    </div>
  )
}
