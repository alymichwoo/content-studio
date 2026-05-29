import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import AppShell from '../components/layout/AppShell'
import { PLATFORMS_BY_VALUE } from '../lib/constants'
import {
  computeDashboardAnalytics,
  formatEngagementPercent,
} from '../lib/analytics'
import { useAllMetrics } from '../hooks/useAllMetrics'
import { usePosts } from '../hooks/usePosts'

const RANGE_OPTIONS = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_3_months', label: 'Last 3 months' },
  { id: 'all_time', label: 'All time' },
]

function getDateRange(rangeId) {
  const now = new Date()
  switch (rangeId) {
    case 'last_3_months':
      return {
        startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case 'all_time':
      return { startDate: null, endDate: null }
    case 'this_month':
    default:
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
  }
}

function SummaryCard({ label, value, detail }) {
  return (
    <div className="rounded-lg border border-slate/20 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-charcoal">{value}</p>
      {detail ? <p className="mt-1 truncate text-sm text-slate">{detail}</p> : null}
    </div>
  )
}

function ChartCard({ title, empty, children }) {
  return (
    <div className="rounded-lg border border-slate/20 bg-white p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal">{title}</h3>
      {empty ? (
        <p className="mt-8 text-center text-sm text-slate">No data in this range</p>
      ) : (
        <div className="mt-4 h-64">{children}</div>
      )}
    </div>
  )
}

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-slate/20 bg-cream px-3 py-2 text-sm shadow-sm">
      <p className="font-bold text-charcoal">{label}</p>
      <p className="text-slate">{valueFormatter(payload[0].value)}</p>
    </div>
  )
}

function DashboardHeader({ rangeId, rangeLabel, onRangeChange }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-charcoal">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate">Performance snapshot — {rangeLabel.toLowerCase()}</p>
      </div>

      <div
        className="inline-flex rounded-lg border border-slate/20 bg-white p-1"
        role="group"
        aria-label="Date range"
      >
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onRangeChange(option.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              rangeId === option.id
                ? 'bg-charcoal text-cream'
                : 'text-charcoal hover:bg-cream'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [rangeId, setRangeId] = useState('this_month')
  const { startDate, endDate } = useMemo(() => getDateRange(rangeId), [rangeId])

  const postsQuery = usePosts()
  const metricsQuery = useAllMetrics({ startDate, endDate })

  const posts = postsQuery.data ?? []
  const metrics = metricsQuery.data ?? []

  const isLoading = postsQuery.isPending || metricsQuery.isPending
  const queryError = postsQuery.error ?? metricsQuery.error

  useEffect(() => {
    if (isLoading || queryError) return
    console.log('[Dashboard] fetched data', {
      posts: posts.length,
      metrics: metrics.length,
      dateRange: { startDate, endDate },
      rangeId,
    })
  }, [posts.length, metrics.length, startDate, endDate, rangeId, isLoading, queryError])

  const analytics = useMemo(
    () =>
      computeDashboardAnalytics(posts, metrics, {
        rangeStart: startDate,
        rangeEnd: endDate,
      }),
    [posts, metrics, startDate, endDate],
  )

  const rangeLabel = RANGE_OPTIONS.find((option) => option.id === rangeId)?.label ?? 'This month'
  const isEmpty = !isLoading && !queryError && posts.length === 0 && metrics.length === 0

  const topPostTitle = analytics.topPerformingPost?.post?.title ?? '—'
  const topPostRate = analytics.topPerformingPost
    ? formatEngagementPercent(analytics.topPerformingPost.engagementRate)
    : null

  const bestPlatformLabel = analytics.bestPlatform
    ? PLATFORMS_BY_VALUE[analytics.bestPlatform.platform]?.label ?? analytics.bestPlatform.platform
    : '—'
  const bestPlatformRate = analytics.bestPlatform
    ? formatEngagementPercent(analytics.bestPlatform.engagementRate)
    : null

  const postsPerWeekEmpty = analytics.postsPerWeek.length === 0
  const followsEmpty = analytics.followsGainedOverTime.length === 0
  const engagementTrendEmpty = analytics.avgEngagementOverTime.length === 0
  const pillarEmpty = analytics.engagementByPillar.every((row) => row.avgEngagement === 0)

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <DashboardHeader
          rangeId={rangeId}
          rangeLabel={rangeLabel}
          onRangeChange={setRangeId}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-coral" aria-hidden="true" />
            <p className="text-sm font-bold uppercase tracking-wider text-slate">
              Loading analytics…
            </p>
          </div>
        ) : queryError ? (
          <div
            className="rounded-lg border border-coral/40 bg-coral/10 px-5 py-4"
            role="alert"
          >
            <p className="text-sm font-bold uppercase tracking-wider text-coral">
              Could not load dashboard data
            </p>
            <p className="mt-2 text-sm text-charcoal">{queryError.message}</p>
            {postsQuery.error && metricsQuery.error && postsQuery.error !== metricsQuery.error ? (
              <p className="mt-1 text-sm text-charcoal">{metricsQuery.error.message}</p>
            ) : null}
          </div>
        ) : isEmpty ? (
          <div className="rounded-lg border border-slate/20 bg-white px-5 py-16 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-charcoal">
              No data yet
            </p>
            <p className="mt-2 text-sm text-slate">Log some metrics to see your dashboard.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total posts"
                value={analytics.totalPostsThisMonth}
                detail="Scheduled or posted in range"
              />
              <SummaryCard
                label="Top performing post"
                value={topPostTitle}
                detail={topPostRate ? `${topPostRate} avg engagement` : 'No metrics in range'}
              />
              <SummaryCard
                label="Best platform"
                value={bestPlatformLabel}
                detail={bestPlatformRate ? `${bestPlatformRate} avg engagement` : 'No metrics in range'}
              />
              <SummaryCard
                label="Avg engagement rate"
                value={formatEngagementPercent(analytics.avgEngagementRate)}
                detail="Across all recordings in range"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Posts per week" empty={postsPerWeekEmpty}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.postsPerWeek} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8E8E9333" />
                    <XAxis dataKey="label" tick={{ fill: '#8E8E93', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#8E8E93', fontSize: 12 }} />
                    <Tooltip
                      content={
                        <ChartTooltip valueFormatter={(value) => `${value} post${value === 1 ? '' : 's'}`} />
                      }
                    />
                    <Bar dataKey="count" fill="#378ADD" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Follows gained over time" empty={followsEmpty}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.followsGainedOverTime}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#8E8E9333" />
                    <XAxis dataKey="label" tick={{ fill: '#8E8E93', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#8E8E93', fontSize: 12 }} />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => `${value} follow${value === 1 ? '' : 's'}`}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="followsGained"
                      stroke="#1D9E75"
                      strokeWidth={2}
                      dot={{ fill: '#1D9E75', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Avg engagement rate over time" empty={engagementTrendEmpty}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.avgEngagementOverTime}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#8E8E9333" />
                    <XAxis dataKey="label" tick={{ fill: '#8E8E93', fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                      tick={{ fill: '#8E8E93', fontSize: 12 }}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip valueFormatter={(value) => formatEngagementPercent(value)} />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="avgEngagement"
                      stroke="#FF5733"
                      strokeWidth={2}
                      dot={{ fill: '#FF5733', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Engagement by pillar" empty={pillarEmpty}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.engagementByPillar}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#8E8E9333" />
                    <XAxis dataKey="label" tick={{ fill: '#8E8E93', fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                      tick={{ fill: '#8E8E93', fontSize: 12 }}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip valueFormatter={(value) => formatEngagementPercent(value)} />
                      }
                    />
                    <Bar dataKey="avgEngagement" radius={[4, 4, 0, 0]}>
                      {analytics.engagementByPillar.map((entry) => (
                        <Cell key={entry.pillar} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
