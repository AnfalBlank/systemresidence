import { initials } from '@/lib/format'

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8 text-badge',
  md: 'h-10 w-10 text-caption',
  lg: 'h-14 w-14 text-title-md',
}

export default function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-strong font-semibold text-ink ${sizeMap[size]} ${className}`}
      aria-hidden={!src}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}
