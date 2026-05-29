import {
  format,
  isValid,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { ENGAGEMENT_FORMULAS, PILLARS } from './constants'

/**
 * Engagement rate for a single metric row using per-platform formulas.
 * Returns null when the denominator is zero or the platform is unknown.
 */
export function metricEngagementRate(metric) {
  const formula = ENGAGEMENT_FORMULAS[metric?.platform]
  if (!formula) return null
  const rate = formula(metric)
  if (rate == null || Number.isNaN(rate)) return null
  return rate
}

/** Mean of finite numbers; returns 0 when there is nothing to average. */
export function safeMean(values) {
  const valid = (values ?? []).filter((v) => v != null && !Number.isNaN(v))
  if (valid.length === 0) return 0
  return valid.reduce((sum, v) => sum + v, 0) / valid.length
}

function parseDate(value) {
  if (!value) return null
  const date = typeof value === 'string' ? parseISO(value) : value
  return isValid(date) ? date : null
}

/** Normalize any date/timestamp to yyyy-MM-dd for inclusive range checks. */
function toDateKey(value) {
  const date = parseDate(value)
  if (!date) return null
  return format(date, 'yyyy-MM-dd')
}

function isInRange(value, rangeStart, rangeEnd) {
  const key = toDateKey(value)
  if (!key) return false
  // All time — no date bounds when both range edges are null/undefined.
  if (!rangeStart && !rangeEnd) return true
  if (rangeStart && key < rangeStart) return false
  if (rangeEnd && key > rangeEnd) return false
  return true
}

/** scheduled_date first, then posted_date — used for post counts and weekly buckets. */
export function postEffectiveDate(post) {
  return post?.scheduled_date ?? post?.posted_date ?? null
}

/** Metric rows whose recorded_at falls within the range (inclusive). All time passes all rows. */
export function filterMetricsInRange(metrics, rangeStart, rangeEnd) {
  if (!metrics?.length) return []
  if (!rangeStart && !rangeEnd) return metrics
  return metrics.filter((metric) => isInRange(metric.recorded_at, rangeStart, rangeEnd))
}

/** Posts whose effective date (scheduled_date → posted_date) falls within the range. */
export function filterPostsByScheduledDate(posts, rangeStart, rangeEnd) {
  if (!posts?.length) return []
  return posts.filter((post) => {
    const date = postEffectiveDate(post)
    return date && isInRange(date, rangeStart, rangeEnd)
  })
}

/** Count of posts scheduled within the range. */
export function totalPostsThisMonth(posts, rangeStart, rangeEnd) {
  return filterPostsByScheduledDate(posts, rangeStart, rangeEnd).length
}

/**
 * Post with the highest average engagement rate across its metric rows in range.
 * Returns { post, engagementRate } or null when no computable metrics exist.
 */
export function topPerformingPost(posts, metrics, rangeStart, rangeEnd) {
  const filteredMetrics = filterMetricsInRange(metrics, rangeStart, rangeEnd)
  if (!filteredMetrics.length || !posts?.length) return null

  const postsById = Object.fromEntries(posts.map((post) => [post.id, post]))
  const ratesByPost = {}

  for (const metric of filteredMetrics) {
    const rate = metricEngagementRate(metric)
    if (rate == null) continue
    if (!ratesByPost[metric.post_id]) ratesByPost[metric.post_id] = []
    ratesByPost[metric.post_id].push(rate)
  }

  let best = null
  let bestRate = -1

  for (const [postId, rates] of Object.entries(ratesByPost)) {
    const avg = safeMean(rates)
    if (avg > bestRate) {
      bestRate = avg
      best = { post: postsById[postId] ?? null, engagementRate: avg }
    }
  }

  return best?.post ? best : null
}

/**
 * Platform with the highest average engagement rate in range.
 * Returns { platform, engagementRate } or null.
 */
export function bestPlatform(metrics, rangeStart, rangeEnd) {
  const filteredMetrics = filterMetricsInRange(metrics, rangeStart, rangeEnd)
  if (!filteredMetrics.length) return null

  const ratesByPlatform = {}

  for (const metric of filteredMetrics) {
    const rate = metricEngagementRate(metric)
    if (rate == null) continue
    if (!ratesByPlatform[metric.platform]) ratesByPlatform[metric.platform] = []
    ratesByPlatform[metric.platform].push(rate)
  }

  let best = null
  let bestRate = -1

  for (const [platform, rates] of Object.entries(ratesByPlatform)) {
    const avg = safeMean(rates)
    if (avg > bestRate) {
      bestRate = avg
      best = { platform, engagementRate: avg }
    }
  }

  return best
}

/** Mean engagement rate across all computable metric rows in range. */
export function avgEngagementRate(metrics, rangeStart, rangeEnd) {
  const filteredMetrics = filterMetricsInRange(metrics, rangeStart, rangeEnd)
  const rates = filteredMetrics
    .map(metricEngagementRate)
    .filter((rate) => rate != null)
  return safeMean(rates)
}

function weekBucket(dateValue) {
  const date = parseDate(dateValue)
  if (!date) return null
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  return format(weekStart, 'yyyy-MM-dd')
}

/**
 * Weekly post counts based on scheduled_date.
 * Returns [{ weekStart, label, count }] sorted chronologically.
 */
export function postsPerWeek(posts, rangeStart, rangeEnd) {
  const filteredPosts = filterPostsByScheduledDate(posts, rangeStart, rangeEnd)
  const countsByWeek = {}

  for (const post of filteredPosts) {
    const weekStart = weekBucket(postEffectiveDate(post))
    if (!weekStart) continue
    countsByWeek[weekStart] = (countsByWeek[weekStart] ?? 0) + 1
  }

  return Object.entries(countsByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, count]) => ({
      weekStart,
      label: format(parseISO(weekStart), 'MMM d'),
      count,
    }))
}

/**
 * Sum of follows_gained grouped by week of recorded_at.
 * Returns [{ weekStart, label, followsGained }] sorted chronologically.
 */
export function followsGainedOverTime(metrics, rangeStart, rangeEnd) {
  const filteredMetrics = filterMetricsInRange(metrics, rangeStart, rangeEnd)
  const totalsByWeek = {}

  for (const metric of filteredMetrics) {
    const weekStart = weekBucket(metric.recorded_at)
    if (!weekStart) continue
    totalsByWeek[weekStart] = (totalsByWeek[weekStart] ?? 0) + (metric.follows_gained ?? 0)
  }

  return Object.entries(totalsByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, followsGained]) => ({
      weekStart,
      label: format(parseISO(weekStart), 'MMM d'),
      followsGained,
    }))
}

/**
 * Average engagement rate grouped by week of recorded_at.
 * Returns [{ weekStart, label, avgEngagement }] sorted chronologically.
 */
export function avgEngagementOverTime(metrics, rangeStart, rangeEnd) {
  const filteredMetrics = filterMetricsInRange(metrics, rangeStart, rangeEnd)
  const ratesByWeek = {}

  for (const metric of filteredMetrics) {
    const rate = metricEngagementRate(metric)
    if (rate == null) continue
    const weekStart = weekBucket(metric.recorded_at)
    if (!weekStart) continue
    if (!ratesByWeek[weekStart]) ratesByWeek[weekStart] = []
    ratesByWeek[weekStart].push(rate)
  }

  return Object.entries(ratesByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, rates]) => ({
      weekStart,
      label: format(parseISO(weekStart), 'MMM d'),
      avgEngagement: safeMean(rates),
    }))
}

/**
 * Average engagement rate per content pillar (all pillars returned for charting).
 * Returns [{ pillar, label, color, avgEngagement }] in pillar order.
 */
export function engagementByPillar(posts, metrics, rangeStart, rangeEnd) {
  const postsById = Object.fromEntries((posts ?? []).map((post) => [post.id, post]))
  const filteredMetrics = filterMetricsInRange(metrics, rangeStart, rangeEnd)
  const ratesByPillar = {}

  for (const metric of filteredMetrics) {
    const post = postsById[metric.post_id]
    if (!post?.pillar) continue
    const rate = metricEngagementRate(metric)
    if (rate == null) continue
    if (!ratesByPillar[post.pillar]) ratesByPillar[post.pillar] = []
    ratesByPillar[post.pillar].push(rate)
  }

  return PILLARS.map(({ value, label, color }) => ({
    pillar: value,
    label,
    color,
    avgEngagement: safeMean(ratesByPillar[value] ?? []),
  }))
}

/** Convenience bundle for dashboard and report views. */
export function computeDashboardAnalytics(posts, metrics, { rangeStart, rangeEnd } = {}) {
  return {
    totalPostsThisMonth: totalPostsThisMonth(posts, rangeStart, rangeEnd),
    topPerformingPost: topPerformingPost(posts, metrics, rangeStart, rangeEnd),
    bestPlatform: bestPlatform(metrics, rangeStart, rangeEnd),
    avgEngagementRate: avgEngagementRate(metrics, rangeStart, rangeEnd),
    postsPerWeek: postsPerWeek(posts, rangeStart, rangeEnd),
    followsGainedOverTime: followsGainedOverTime(metrics, rangeStart, rangeEnd),
    avgEngagementOverTime: avgEngagementOverTime(metrics, rangeStart, rangeEnd),
    engagementByPillar: engagementByPillar(posts, metrics, rangeStart, rangeEnd),
  }
}

/** Format a 0–1 engagement rate as a percentage string. */
export function formatEngagementPercent(rate) {
  if (rate == null || Number.isNaN(rate)) return '—'
  return `${(rate * 100).toFixed(2)}%`
}
