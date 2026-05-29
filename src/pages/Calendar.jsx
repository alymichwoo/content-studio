import { useMemo, useState } from 'react'
import { format, endOfMonth, startOfMonth } from 'date-fns'
import AppShell from '../components/layout/AppShell'
import PostForm from '../components/posts/PostForm'
import EventForm from '../components/schedule/EventForm'
import CalendarFilterBar from '../components/calendar/CalendarFilterBar'
import MonthGrid from '../components/calendar/MonthGrid'
import { usePosts, useUpdatePost } from '../hooks/usePosts'
import { useEvents } from '../hooks/useEvents'

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [platform, setPlatform] = useState(null)
  const [pillar, setPillar] = useState(null)

  const [postFormOpen, setPostFormOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)

  const rangeStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const rangeEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const { data: posts = [], isLoading: postsLoading, error: postsError } = usePosts({
    platform: platform ?? undefined,
    pillar: pillar ?? undefined,
  })

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useEvents({
    startDate: rangeStart,
    endDate: rangeEnd,
  })

  const updatePost = useUpdatePost()

  const scheduledPosts = useMemo(
    () => posts.filter((post) => post.scheduled_date),
    [posts],
  )

  function openCreatePost(date) {
    setEditingPost({ scheduled_date: format(date, 'yyyy-MM-dd') })
    setPostFormOpen(true)
  }

  function openEditPost(post) {
    setEditingPost(post)
    setPostFormOpen(true)
  }

  function closePostForm() {
    setPostFormOpen(false)
    setEditingPost(null)
  }

  function openCreateEvent() {
    setEditingEvent(null)
    setEventFormOpen(true)
  }

  function closeEventForm() {
    setEventFormOpen(false)
    setEditingEvent(null)
  }

  function handlePostDrop(post, newDate) {
    updatePost.mutate({ id: post.id, scheduled_date: newDate })
  }

  const isLoading = postsLoading || eventsLoading
  const error = postsError ?? eventsError

  return (
    <AppShell title="Calendar">
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-charcoal">Calendar</h2>
        <p className="mt-1 text-sm text-slate">Plan posts and track events month by month</p>
      </div>

      <div className="mb-4">
        <CalendarFilterBar
          platform={platform}
          pillar={pillar}
          onPlatformChange={setPlatform}
          onPillarChange={setPillar}
        />
      </div>

      {isLoading && <p className="text-sm text-slate">Loading calendar…</p>}

      {error && (
        <div
          className="rounded border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral"
          role="alert"
        >
          {error.message}
        </div>
      )}

      {!isLoading && !error && (
        <MonthGrid
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          posts={scheduledPosts}
          events={events}
          onPostClick={openEditPost}
          onDayClick={openCreatePost}
          onPostDrop={handlePostDrop}
          onAddEvent={openCreateEvent}
        />
      )}

      <PostForm open={postFormOpen} onClose={closePostForm} post={editingPost} />
      <EventForm open={eventFormOpen} onClose={closeEventForm} event={editingEvent} />
    </AppShell>
  )
}
