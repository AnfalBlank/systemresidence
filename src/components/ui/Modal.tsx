import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Scrim — black at 50% */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-lg bg-canvas shadow-float-lg sm:max-w-lg sm:rounded-lg"
      >
        <div className="flex items-center justify-between border-b border-hairline-soft px-lg py-base">
          <h2 className="text-title-md text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft"
          >
            <X className="h-5 w-5 text-ink" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-lg py-base">{children}</div>
        {footer && (
          <div className="border-t border-hairline-soft px-lg py-base">{footer}</div>
        )}
      </div>
    </div>
  )
}
