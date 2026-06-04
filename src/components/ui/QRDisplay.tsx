import { QRCodeSVG } from 'qrcode.react'

interface QRDisplayProps {
  value: string
  size?: number
  label?: string
  sublabel?: string
}

/**
 * Renders a real scannable QR code using qrcode.react.
 * Falls back gracefully if value is empty.
 */
export default function QRDisplay({
  value,
  size = 180,
  label,
  sublabel,
}: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-md">
      <div className="rounded-md border border-hairline bg-white p-md shadow-float">
        <QRCodeSVG
          value={value || 'KSTP-PLACEHOLDER'}
          size={size}
          bgColor="#ffffff"
          fgColor="#222222"
          level="M"
          includeMargin={false}
        />
      </div>
      {label && <p className="text-title-sm text-ink">{label}</p>}
      {sublabel && <p className="text-caption-sm text-muted">{sublabel}</p>}
    </div>
  )
}
