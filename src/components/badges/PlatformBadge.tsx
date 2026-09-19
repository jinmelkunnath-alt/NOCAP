import { Camera, Globe, MessageCircle, Newspaper, Send } from 'lucide-react'
import type { Platform } from '../../types'
import { cn } from '../../utils/cn'

interface PlatformBadgeProps {
  platform: Platform
  className?: string
}

const icons: Record<Platform, typeof Globe> = {
  WhatsApp: MessageCircle,
  X: Newspaper,
  Instagram: Camera,
  Reddit: Send,
  Other: Globe,
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const Icon = icons[platform]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-line bg-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mute',
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {platform}
    </span>
  )
}
