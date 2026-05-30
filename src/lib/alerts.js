import { differenceInCalendarDays, parseISO, startOfToday } from 'date-fns'
import {
  avgEngagementOverTime,
  engagementByPillar,
  metricEngagementRate,
  safeMean,
} from './analytics'
import { PILLARS_BY_VALUE } from './constants'
import { computeDeliverableProgress, formatDeliverableLabel } from './deliverableUtils'

/** Minimum weekly buckets: one recent + enough trailing history to compare. */
const MIN_WEEKS_FOR_TREND = 3

/** Relative change vs trailing average before emitting an engagement trend alert. */
const TREND_RELATIVE_THRESHOLD = 0.15

/** Minimum metric rows per pillar before comparing to the overall average. */
const MIN_PILLAR_METRICS = 2

/** Relative difference from overall pillar average before alerting. */
const PILLAR_RELATIVE_THRESHOLD = 0.2

/** Deliverable due dates within this many days (inclusive) trigger a warning. */
const DELIVERABLE_DUE_WINDOW_DAYS = 7

function formatPercentChange(relativeChange) {
  return `${Math.abs(Math.round(relativeChange * 100))}%`
}

/**
 * Compare the most recent week's average engagement to the trailing weekly average.
 * Requires at least MIN_WEEKS_FOR_TREND weeks with computable rates.
 */
export function engagementTrendAlerts(metrics) {
  const weekly = avgEngagementOverTime(metrics, null, null).filter(
    (row) => row.avgEngagement > 0,
  )

  if (weekly.length < MIN_WEEKS_FOR_TREND) return []

  const recent = weekly[weekly.length - 1].avgEngagement
  const trailing = safeMean(weekly.slice(0, -1).map((row) => row.avgEngagement))

  if (trailing <= 0 || recent <= 0) return []

  const relativeChange = (recent - trailing) / trailing
  if (Math.abs(relativeChange) < TREND_RELATIVE_THRESHOLD) return []

  const pct = formatPercentChange(relativeChange)

  if (relativeChange > 0) {
    return [
      {
        id: 'engagement-trend-up',
        severity: 'positive',
        message: `Engagement is up ${pct} vs your recent weekly average`,
      },
    ]
  }

  return [
    {
      id: 'engagement-trend-down',
      severity: 'warn',
      message: `Engagement is down ${pct} vs your recent weekly average`,
    },
  ]
}

/** Count computable metric rows per pillar (posts must carry pillar). */
function pillarMetricCounts(posts, metrics) {
  const postsById = Object.fromEntries((posts ?? []).map((post) => [post.id, post]))
  const counts = {}

  for (const metric of metrics ?? []) {
    const pillar = postsById[metric.post_id]?.pillar
    if (!pillar) continue
    const rate = metricEngagementRate(metric)
    if (rate == null) continue
    counts[pillar] = (counts[pillar] ?? 0) + 1
  }

  return counts
}

/**
 * Flag pillars whose average engagement notably beats or trails the overall average.
 * Skips pillars with sparse data or when there is no meaningful overall baseline.
 */
export function pillarPerformanceAlerts(posts, metrics) {
  if (!metrics?.length || !posts?.length) return []

  const pillarRows = engagementByPillar(posts, metrics, null, null).filter(
    (row) => row.avgEngagement > 0,
  )
  if (pillarRows.length < 2) return []

  const overall = safeMean(pillarRows.map((row) => row.avgEngagement))
  if (overall <= 0) return []

  const sampleCounts = pillarMetricCounts(posts, metrics)
  const alerts = []

  for (const row of pillarRows) {
    if ((sampleCounts[row.pillar] ?? 0) < MIN_PILLAR_METRICS) continue

    const relativeDiff = (row.avgEngagement - overall) / overall
    if (Math.abs(relativeDiff) < PILLAR_RELATIVE_THRESHOLD) continue

    const label = PILLARS_BY_VALUE[row.pillar]?.label ?? row.label
    const pct = formatPercentChange(relativeDiff)

    if (relativeDiff > 0) {
      alerts.push({
        id: `pillar-outperform-${row.pillar}`,
        severity: 'positive',
        message: `${label} is outperforming your average by ${pct}`,
      })
    } else {
      alerts.push({
        id: `pillar-underperform-${row.pillar}`,
        severity: 'warn',
        message: `${label} is underperforming your average by ${pct}`,
      })
    }
  }

  return alerts
}

function postsByDeliverableId(posts) {
  const map = {}
  for (const post of posts ?? []) {
    if (!post.deliverable_id) continue
    if (!map[post.deliverable_id]) map[post.deliverable_id] = []
    map[post.deliverable_id].push(post)
  }
  return map
}

function brandNameFromDeliverable(deliverable) {
  return deliverable?.campaigns?.brands?.name ?? 'Brand'
}

/**
 * Warn on open deliverables that are due soon or already overdue.
 * Progress counts linked posts with status "posted" as delivered.
 */
export function deliverableAlerts(posts, deliverables) {
  if (!deliverables?.length) return []

  const linkedByDeliverable = postsByDeliverableId(posts)
  const today = startOfToday()
  const alerts = []

  for (const deliverable of deliverables) {
    const linked = linkedByDeliverable[deliverable.id] ?? []
    const { required, delivered } = computeDeliverableProgress(deliverable, linked)

    if (required <= 0 || delivered >= required || !deliverable.due_date) continue

    const dueDate = parseISO(deliverable.due_date)
    const daysUntilDue = differenceInCalendarDays(dueDate, today)
    const label = formatDeliverableLabel(deliverable)
    const brand = brandNameFromDeliverable(deliverable)
    const progress = `${delivered} of ${required} done`

    if (daysUntilDue < 0) {
      const daysOverdue = Math.abs(daysUntilDue)
      alerts.push({
        id: `deliverable-overdue-${deliverable.id}`,
        severity: 'warn',
        message: `${label} for ${brand} is ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue — ${progress}`,
      })
      continue
    }

    if (daysUntilDue <= DELIVERABLE_DUE_WINDOW_DAYS) {
      const dueLabel =
        daysUntilDue === 0
          ? 'due today'
          : `due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
      alerts.push({
        id: `deliverable-due-${deliverable.id}`,
        severity: 'warn',
        message: `${label} for ${brand} ${dueLabel} — ${progress}`,
      })
    }
  }

  return alerts
}

/**
 * Build all trend alerts from existing posts, metrics, and deliverable rows.
 * Returns [] when inputs are too sparse to draw meaningful conclusions.
 */
export function computeTrendAlerts(posts, metrics, deliverables) {
  if (!posts?.length && !metrics?.length && !deliverables?.length) return []

  return [
    ...engagementTrendAlerts(metrics ?? []),
    ...pillarPerformanceAlerts(posts ?? [], metrics ?? []),
    ...deliverableAlerts(posts ?? [], deliverables ?? []),
  ]
}
