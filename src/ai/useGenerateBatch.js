import { useMutation } from '@tanstack/react-query'
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns'
import { supabase } from '../lib/supabase'

/** Matches the calendar grid — Sunday week start. */
const WEEK_OPTS = { weekStartsOn: 0 }

export function computeRange(rangeType, anchor) {
  const date = anchor instanceof Date ? anchor : parseISO(anchor)

  if (rangeType === 'day') {
    const iso = format(date, 'yyyy-MM-dd')
    return { start: iso, end: iso }
  }

  if (rangeType === 'week') {
    return {
      start: format(startOfWeek(date, WEEK_OPTS), 'yyyy-MM-dd'),
      end: format(endOfWeek(date, WEEK_OPTS), 'yyyy-MM-dd'),
    }
  }

  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

export function rangeTargetCount(cadence, rangeStart, rangeEnd) {
  const days = differenceInCalendarDays(parseISO(rangeEnd), parseISO(rangeStart)) + 1
  return Math.max(1, Math.round((cadence * days) / 7))
}

export function formatPeriodLabel(rangeType, anchor) {
  const date = anchor instanceof Date ? anchor : parseISO(anchor)

  if (rangeType === 'day') {
    return format(date, 'MMM d, yyyy')
  }

  if (rangeType === 'week') {
    const start = startOfWeek(date, WEEK_OPTS)
    const end = endOfWeek(date, WEEK_OPTS)
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM d')}–${format(end, 'd, yyyy')}`
    }
    return `${format(start, 'MMM d')}–${format(end, 'MMM d, yyyy')}`
  }

  return format(date, 'MMMM yyyy')
}

export function shiftAnchor(rangeType, anchor, direction) {
  const date = anchor instanceof Date ? anchor : parseISO(anchor)
  if (rangeType === 'day') {
    return direction < 0 ? subDays(date, 1) : addDays(date, 1)
  }
  if (rangeType === 'week') {
    return direction < 0 ? subWeeks(date, 1) : addWeeks(date, 1)
  }
  return direction < 0 ? subMonths(date, 1) : addMonths(date, 1)
}

/** Last ~30 days of posts, or the most recent ~20 if fewer fall in that window. */
export function selectRecentPosts(posts) {
  const cutoff = subDays(new Date(), 30)

  const dated = (posts ?? [])
    .map((post) => {
      const scheduled_date = post.scheduled_date ?? post.posted_date
      if (!scheduled_date) return null
      return { post, scheduled_date, date: parseISO(scheduled_date) }
    })
    .filter(Boolean)
    .sort((a, b) => b.date - a.date)

  const withinWindow = dated.filter((entry) => entry.date >= cutoff)
  const pool = withinWindow.length >= 20 ? withinWindow.slice(0, 20) : dated.slice(0, 20)

  return pool.map(({ post, scheduled_date }) => ({
    scheduled_date,
    pillar: post.pillar,
    title: post.title ?? '',
    hook: post.hook ?? '',
  }))
}

export function mapScheduleItems(events) {
  return (events ?? []).map((event) => ({
    type: event.type,
    title: event.title,
    start_date: event.start_date,
    end_date: event.end_date,
    location: event.location ?? '',
  }))
}

/** Posts already scheduled within the selected generation range. */
export function selectExistingPosts(posts, rangeStart, rangeEnd) {
  return (posts ?? [])
    .filter(
      (post) =>
        post.scheduled_date &&
        post.scheduled_date >= rangeStart &&
        post.scheduled_date <= rangeEnd,
    )
    .map((post) => ({
      scheduled_date: post.scheduled_date,
      pillar: post.pillar,
      title: post.title ?? '',
    }))
}

async function invokeGenerateBatch({
  start_date,
  end_date,
  target_count,
  recent_posts,
  schedule_items,
  existing_posts,
}) {
  const { data, error } = await supabase.functions.invoke('suggest', {
    body: {
      mode: 'generate_batch',
      start_date,
      end_date,
      target_count,
      recent_posts,
      schedule_items,
      existing_posts,
    },
  })

  if (error) {
    throw new Error(data?.error ?? error.message ?? 'Failed to generate ideas')
  }

  if (data?.error) {
    const err = new Error(data.error)
    err.retryable = true
    err.raw = data.raw
    throw err
  }

  return data.suggestions ?? []
}

/** Generate batch content ideas via the suggest Edge Function (generate_batch mode). */
export function useGenerateBatch() {
  const mutation = useMutation({
    mutationFn: async ({
      rangeType,
      anchorDate,
      cadence,
      recentPosts,
      scheduleItems,
      existingPosts,
    }) => {
      const range = computeRange(rangeType, anchorDate)
      const target_count = rangeTargetCount(cadence, range.start, range.end)

      const suggestions = await invokeGenerateBatch({
        start_date: range.start,
        end_date: range.end,
        target_count,
        recent_posts: recentPosts,
        schedule_items: scheduleItems,
        existing_posts: existingPosts,
      })

      return suggestions.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    },
  })

  return {
    generate: mutation.mutateAsync,
    suggestions: mutation.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  }
}
