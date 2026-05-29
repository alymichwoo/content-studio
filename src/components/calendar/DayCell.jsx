import { useDroppable } from '@dnd-kit/core'
import { format, isSameMonth, isToday } from 'date-fns'
import EventBanner from './EventBanner'
import PostCard from './PostCard'

export default function DayCell({
  date,
  currentMonth,
  posts = [],
  events = [],
  onDayClick,
  onPostClick,
}) {
  const dateKey = format(date, 'yyyy-MM-dd')
  const { setNodeRef, isOver } = useDroppable({ id: dateKey })

  const inMonth = isSameMonth(date, currentMonth)
  const today = isToday(date)

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => onDayClick?.(date)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onDayClick?.(date)
        }
      }}
      className={`relative flex min-h-[7.5rem] flex-col border-b border-r border-slate/15 p-1 transition-colors ${
        inMonth ? 'bg-cream' : 'bg-charcoal/[0.02]'
      } ${isOver ? 'bg-coral/5 ring-1 ring-inset ring-coral/40' : ''} cursor-pointer hover:bg-charcoal/[0.02]`}
    >
      <div className="mb-1 flex shrink-0 justify-end">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            today
              ? 'bg-coral text-cream'
              : inMonth
                ? 'text-charcoal'
                : 'text-slate/50'
          }`}
        >
          {format(date, 'd')}
        </span>
      </div>

      {events.length > 0 && (
        <div className="pointer-events-none absolute inset-x-1 top-8 z-0 space-y-0.5">
          {events.map((event) => (
            <EventBanner
              key={event.id}
              event={event}
              showTitle={event.start_date === dateKey}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 mt-5 space-y-1">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onClick={onPostClick} />
        ))}
      </div>
    </div>
  )
}
