import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import CalendarHeader from './CalendarHeader'
import DayCell from './DayCell'
import PostCard, { PostCardPreview } from './PostCard'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getEventsForDay(dayKey, events) {
  return events.filter((event) => event.start_date <= dayKey && event.end_date >= dayKey)
}

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
  const [activePost, setActivePost] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [currentMonth])

  const postsByDate = useMemo(() => {
    const map = {}
    for (const post of posts) {
      if (!post.scheduled_date) continue
      const key = post.scheduled_date
      if (!map[key]) map[key] = []
      map[key].push(post)
    }
    return map
  }, [posts])

  function handlePrev() {
    onMonthChange(subMonths(currentMonth, 1))
  }

  function handleNext() {
    onMonthChange(addMonths(currentMonth, 1))
  }

  function handleToday() {
    onMonthChange(new Date())
  }

  function handleDragStart(event) {
    setActivePost(event.active.data.current?.post ?? null)
  }

  function handleDragEnd(event) {
    setActivePost(null)
    const { active, over } = event
    if (!over) return

    const post = active.data.current?.post
    const newDate = over.id
    if (!post || !newDate || post.scheduled_date === newDate) return

    onPostDrop?.(post, newDate)
  }

  function handleDragCancel() {
    setActivePost(null)
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="overflow-hidden rounded-lg border border-slate/20">
          <div className="grid grid-cols-7 border-b border-slate/20 bg-charcoal/[0.03]">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="border-r border-slate/15 px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              return (
                <DayCell
                  key={dayKey}
                  date={day}
                  currentMonth={currentMonth}
                  posts={postsByDate[dayKey] ?? []}
                  events={getEventsForDay(dayKey, events)}
                  onDayClick={onDayClick}
                  onPostClick={onPostClick}
                />
              )
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activePost ? (
            <div className="w-48">
              <PostCardPreview post={activePost} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
