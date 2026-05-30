import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const WEEKDAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function getCalendarDays(currentMonth) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}

export function getEventsForDay(dayKey, events) {
  return events.filter((event) => event.start_date <= dayKey && event.end_date >= dayKey)
}

export function buildPostsByDate(posts) {
  const map = {}
  for (const post of posts) {
    if (!post.scheduled_date) continue
    const key = post.scheduled_date
    if (!map[key]) map[key] = []
    map[key].push(post)
  }
  return map
}

export function countPostsByPillar(posts) {
  const counts = new Map()
  for (const post of posts) {
    const pillar = post.pillar ?? 'none'
    counts.set(pillar, (counts.get(pillar) ?? 0) + 1)
  }
  return Array.from(counts.entries())
}

export function toDayKey(date) {
  return format(date, 'yyyy-MM-dd')
}
