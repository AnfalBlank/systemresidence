import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-hairline px-base py-section text-center">
      <div className="mb-base flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft">
        <Icon className="h-6 w-6 text-muted" />
      </div>
      <p className="text-title-md text-ink">{title}</p>
      {description && <p className="mt-xs max-w-xs text-body-sm text-muted">{description}</p>}
    </div>
  )
}
