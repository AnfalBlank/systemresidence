import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-lg flex items-start justify-between gap-base">
      <div>
        <h1 className="text-display-lg text-ink">{title}</h1>
        {subtitle && <p className="mt-xxs text-body-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
