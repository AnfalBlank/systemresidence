import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-base">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-sm rounded-lg bg-canvas p-lg text-center shadow-float-lg"
      >
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            danger ? 'bg-primary-disabled' : 'bg-surface-soft'
          }`}
        >
          <AlertTriangle className={`h-7 w-7 ${danger ? 'text-primary-error' : 'text-ink'}`} />
        </div>
        <h2 className="mt-base text-display-sm text-ink">{title}</h2>
        <p className="mt-xs text-body-sm text-muted">{message}</p>
        <button
          onClick={onConfirm}
          className={`mt-lg w-full rounded-sm px-lg text-button-md text-white ${
            danger ? 'bg-primary active:bg-primary-active' : 'bg-ink'
          }`}
          style={{ minHeight: '48px', fontWeight: 500 }}
        >
          {confirmLabel}
        </button>
        <button onClick={onCancel} className="btn-tertiary mt-md w-full">
          Batal
        </button>
      </div>
    </div>
  )
}
