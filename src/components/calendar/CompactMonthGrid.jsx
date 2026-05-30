import { useMemo } from 'react'
import {
  WEEKDAY_LABELS_SHORT,
  buildPostsByDate,
  getCalendarDays,
  getEventsForDay,
  toDayKey,
} from './calendarUtils'
import CompactDayCell from './CompactDayCell'

/** Compact month grid for mobile — dots/counts only, no post chips or drag-and-drop. */
export default function CompactMonthGrid({ currentMonth, posts = [], events = [], onDaySelect }) {
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth])

  const postsByDate = useMemo(() => buildPostsByDate(posts), [posts])

  return (
    <div className="overflow-hidden rounded-lg border border-slate/20">
      <div className="grid grid-cols-7 border-b border-slate/20 bg-charcoal/[0.03]">
        {WEEKDAY_LABELS_SHORT.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="border-r border-slate/15 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dayKey = toDayKey(day)
          return (
            <CompactDayCell
              key={dayKey}
              date={day}
              currentMonth={currentMonth}
              posts={postsByDate[dayKey] ?? []}
              events={getEventsForDay(dayKey, events)}
              onSelect={onDaySelect}
            />
          )
        })}
      </div>
    </div>
  )
}
