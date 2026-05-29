import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Video, Share2, Globe } from 'lucide-react'
import { PILLARS_BY_VALUE, PLATFORMS_BY_VALUE } from '../../lib/constants'

const STATUS_COLORS = {
  idea: '#8E8E93',
  drafting: '#378ADD',
  ready: '#1D9E75',
  scheduled: '#7F77DD',
  posted: '#1C1C1E',
}

function PlatformIcon({ platform }) {
  const className = 'h-3 w-3 text-charcoal/80'
  switch (platform) {
    case 'instagram':
      return <Share2 className={className} aria-hidden="true" />
    case 'linkedin':
      return <Globe className={className} aria-hidden="true" />
    case 'tiktok':
      return <Video className={className} aria-hidden="true" />
    default:
      return null
  }
}

function PostCardContent({ post, style, className = '' }) {
  const pillarColor = post.pillar ? PILLARS_BY_VALUE[post.pillar]?.color : '#8E8E93'
  const statusColor = STATUS_COLORS[post.status] ?? '#8E8E93'

  return (
    <div
      style={{ borderLeftColor: pillarColor, ...style }}
      className={`flex w-full items-center gap-1.5 rounded border border-slate/20 border-l-[3px] bg-cream px-1.5 py-1 text-left shadow-sm ${className}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: statusColor }}
        title={post.status}
        aria-label={`Status: ${post.status}`}
      />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-charcoal">
        {post.title || 'Untitled'}
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        {(post.platforms ?? []).map((platform) => (
          <span key={platform} title={PLATFORMS_BY_VALUE[platform]?.label}>
            <PlatformIcon platform={platform} />
          </span>
        ))}
      </span>
    </div>
  )
}

export default function PostCard({ post, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      className="w-full transition hover:bg-charcoal/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(post)
      }}
      {...listeners}
      {...attributes}
    >
      <PostCardContent post={post} />
    </button>
  )
}

export function PostCardPreview({ post }) {
  return <PostCardContent post={post} className="opacity-90 shadow-lg" />
}

export { PlatformIcon, STATUS_COLORS }
