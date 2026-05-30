import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import {
  WEEKDAY_LABELS,
  buildPostsByDate,
  getCalendarDays,
  getEventsForDay,
  toDayKey,
} from './calendarUtils'
import DayCell from './DayCell'
import PostCard, { PostCardPreview } from './PostCard'

/** Full month grid with post chips, event banners, and drag-and-drop — md+ only. */
export default function DesktopMonthGrid({
  currentMonth,
  posts = [],
  events = [],
  onPostClick,
  onDayClick,
  onPostDrop,
}) {
  const [activePost, setActivePost] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth])
  const postsByDate = useMemo(() => buildPostsByDate(posts), [posts])

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
            const dayKey = toDayKey(day)
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
  )
}
