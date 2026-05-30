import { format, isSameMonth, isToday } from 'date-fns'
import { PILLARS_BY_VALUE, SCHEDULE_TYPES_BY_VALUE } from '../../lib/constants'
import { countPostsByPillar } from './calendarUtils'

const NO_PILLAR_COLOR = '#8E8E93'

export default function CompactDayCell({
  date,
  currentMonth,
  posts = [],
  events = [],
  onSelect,
}) {
  const inMonth = isSameMonth(date, currentMonth)
  const today = isToday(date)
  const pillarCounts = countPostsByPillar(posts)
  const postCount = posts.length

  return (
    <button
      type="button"
      onClick={() => onSelect?.(date)}
      aria-label={`${format(date, 'MMMM d, yyyy')}${postCount ? `, ${postCount} post${postCount !== 1 ? 's' : ''}` : ''}${events.length ? `, ${events.length} event${events.length !== 1 ? 's' : ''}` : ''}`}
      className={`relative flex aspect-square min-h-[2.75rem] flex-col items-center border-b border-r border-slate/15 p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral ${
        inMonth ? 'bg-cream' : 'bg-charcoal/[0.02]'
      } active:bg-charcoal/[0.04]`}
    >
      {events.length > 0 && (
        <div className="absolute inset-x-0 top-0 flex flex-col gap-px">
          {events.slice(0, 3).map((event) => {
            const color = SCHEDULE_TYPES_BY_VALUE[event.type]?.color ?? NO_PILLAR_COLOR
            return (
              <div
                key={event.id}
                className="h-0.5 w-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
            )
          })}
        </div>
      )}

      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          today
            ? 'bg-coral text-cream'
            : inMonth
              ? 'text-charcoal'
              : 'text-slate/50'
        }`}
      >
        {format(date, 'd')}
      </span>

      {pillarCounts.length > 0 && (
        <div className="mt-auto flex max-w-full flex-wrap items-center justify-center gap-x-1 gap-y-0.5 px-0.5 pb-0.5">
          {pillarCounts.map(([pillar, count]) => {
            const color =
              pillar === 'none' ? NO_PILLAR_COLOR : PILLARS_BY_VALUE[pillar]?.color ?? NO_PILLAR_COLOR
            return (
              <span
                key={pillar}
                className="inline-flex items-center gap-0.5"
                title={`${count} post${count !== 1 ? 's' : ''}`}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {count > 1 && (
                  <span className="text-[9px] font-bold leading-none text-slate">{count}</span>
                )}
              </span>
            )
          })}
        </div>
      )}
    </button>
  )
}
