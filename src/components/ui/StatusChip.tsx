interface StatusChipProps {
  label: string
  tone?: 'success' | 'warning' | 'info' | 'danger' | 'neutral'
  className?: string
}

const toneMap: Record<string, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  danger: 'bg-primary-disabled text-primary-error',
  neutral: 'bg-surface-strong text-muted',
}

export default function StatusChip({
  label,
  tone = 'neutral',
  className = '',
}: StatusChipProps) {
  return <span className={`chip ${toneMap[tone]} ${className}`}>{label}</span>
}
