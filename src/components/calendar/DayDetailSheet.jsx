import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import {
  PILLARS_BY_VALUE,
  PLATFORMS_BY_VALUE,
  SCHEDULE_TYPES_BY_VALUE,
  STATUSES_BY_VALUE,
} from '../../lib/constants'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import { STATUS_COLORS } from './PostCard'

function SheetPostRow({ post, onClick }) {
  const pillar = post.pillar ? PILLARS_BY_VALUE[post.pillar] : null
  const status = post.status ? STATUSES_BY_VALUE[post.status] : null
  const pillarColor = pillar?.color ?? '#8E8E93'

  return (
    <button
      type="button"
      onClick={() => onClick?.(post)}
      className="flex min-h-11 w-full items-center gap-3 rounded border border-slate/20 border-l-[3px] bg-cream px-3 py-2 text-left transition hover:bg-charcoal/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
      style={{ borderLeftColor: pillarColor }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-charcoal">{post.title || 'Untitled'}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {pillar && <Badge color={pillar.color}>{pillar.label}</Badge>}
          {status && (
            <Badge color={STATUS_COLORS[post.status] ?? '#8E8E93'}>{status.label}</Badge>
          )}
          {(post.platforms ?? []).map((platform) => (
            <span key={platform} className="text-[10px] font-bold uppercase text-slate">
              {PLATFORMS_BY_VALUE[platform]?.label}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

function SheetEventRow({ event }) {
  const typeMeta = SCHEDULE_TYPES_BY_VALUE[event.type]
  const color = typeMeta?.color ?? '#8E8E93'

  return (
    <div
      className="rounded border border-slate/20 border-l-[3px] bg-cream px-3 py-2"
      style={{ borderLeftColor: color }}
    >
      <p className="font-semibold text-charcoal">{event.title}</p>
      <p className="mt-0.5 text-xs text-slate">
        {typeMeta?.label ?? event.type}
        {event.location && ` · ${event.location}`}
      </p>
    </div>
  )
}

/** Mobile day-detail sheet — lists posts and events; opens PostForm for add/edit. */
export default function DayDetailSheet({
  open,
  onClose,
  date,
  posts = [],
  events = [],
  onPostClick,
  onAddPost,
}) {
  const title = date ? format(date, 'EEEE, MMM d') : ''

  function handleAddPost() {
    if (!date) return
    onAddPost?.(date)
  }

  function handlePostClick(post) {
    onPostClick?.(post)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <Button type="button" className="w-full sm:w-auto" onClick={handleAddPost}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add post
        </Button>
      }
    >
      <div className="space-y-6">
        {events.length > 0 && (
          <section>
            <h3 className="text-xs font-black uppercase tracking-wider text-charcoal">Events</h3>
            <ul className="mt-2 space-y-2">
              {events.map((event) => (
                <li key={event.id}>
                  <SheetEventRow event={event} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-xs font-black uppercase tracking-wider text-charcoal">
            Posts{posts.length > 0 ? ` (${posts.length})` : ''}
          </h3>
          {posts.length === 0 ? (
            <p className="mt-2 text-sm text-slate">No posts scheduled for this day.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <SheetPostRow post={post} onClick={handlePostClick} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate">
            Tap a post to edit or change its scheduled date.
          </p>
        </section>
      </div>
    </Modal>
  )
}
