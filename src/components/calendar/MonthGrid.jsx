import { useMemo, useState } from 'react'
import { addMonths, subMonths } from 'date-fns'
import CalendarHeader from './CalendarHeader'
import CompactMonthGrid from './CompactMonthGrid'
import DesktopMonthGrid from './DesktopMonthGrid'
import DayDetailSheet from './DayDetailSheet'
import { buildPostsByDate, getEventsForDay, toDayKey } from './calendarUtils'

export default function MonthGrid({
  currentMonth,
  onMonthChange,
  posts = [],
  events = [],
  onPostClick,
  onDayClick,
  onPostDrop,
  onAddEvent,
}) {
  const [selectedDay, setSelectedDay] = useState(null)

  const postsByDate = useMemo(() => buildPostsByDate(posts), [posts])

  const selectedDayKey = selectedDay ? toDayKey(selectedDay) : null
  const selectedDayPosts = selectedDayKey ? postsByDate[selectedDayKey] ?? [] : []
  const selectedDayEvents = selectedDayKey ? getEventsForDay(selectedDayKey, events) : []

  function handlePrev() {
    onMonthChange(subMonths(currentMonth, 1))
  }

  function handleNext() {
    onMonthChange(addMonths(currentMonth, 1))
  }

  function handleToday() {
    onMonthChange(new Date())
  }

  function handleMobileDaySelect(date) {
    setSelectedDay(date)
  }

  function handleMobilePostClick(post) {
    setSelectedDay(null)
    onPostClick?.(post)
  }

  function handleMobileAddPost(date) {
    setSelectedDay(null)
    onDayClick?.(date)
  }

  function closeDaySheet() {
    setSelectedDay(null)
  }

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentMonth={currentMonth}
        onPrev={handlePrev}
        onToday={handleToday}
        onNext={handleNext}
        onAddEvent={onAddEvent}
      />

      {/* Mobile: compact dot grid + day-detail sheet (no drag-and-drop) */}
      <div className="md:hidden">
        <CompactMonthGrid
          currentMonth={currentMonth}
          posts={posts}
          events={events}
          onDaySelect={handleMobileDaySelect}
        />
      </div>

      {/* Desktop: full grid with chips, banners, and @dnd-kit reschedule */}
      <div className="hidden md:block">
        <DesktopMonthGrid
          currentMonth={currentMonth}
          posts={posts}
          events={events}
          onPostClick={onPostClick}
          onDayClick={onDayClick}
          onPostDrop={onPostDrop}
        />
      </div>

      <DayDetailSheet
        open={Boolean(selectedDay)}
        onClose={closeDaySheet}
        date={selectedDay}
        posts={selectedDayPosts}
        events={selectedDayEvents}
        onPostClick={handleMobilePostClick}
        onAddPost={handleMobileAddPost}
      />
    </div>
  )
}
