import { useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { format, parseISO } from 'date-fns'
import { Download, Loader2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useAllMetrics } from '../hooks/useAllMetrics'
import { usePosts } from '../hooks/usePosts'
import {
  computeMonthlyReportAnalytics,
  formatEngagementPercent,
  getMonthDateRange,
} from '../lib/analytics'
import { PILLARS_BY_VALUE } from '../lib/constants'

// TODO: Public shareable WIP report view — needs anonymous RLS-safe design (no auth token in URL).

const PDF_MARGIN_MM = 10

function ReportTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-slate/20 bg-cream px-3 py-2 text-sm shadow-sm">
      <p className="font-bold text-charcoal">{label}</p>
      <p className="text-slate">{formatEngagementPercent(payload[0].value)}</p>
    </div>
  )
}

async function exportElementToPdf(element, filename) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#FAF9F6',
    logging: false,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - PDF_MARGIN_MM * 2
  const contentHeight = pageHeight - PDF_MARGIN_MM * 2
  const imgWidth = contentWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL('image/png')

  let heightLeft = imgHeight
  let position = PDF_MARGIN_MM

  pdf.addImage(imgData, 'PNG', PDF_MARGIN_MM, position, imgWidth, imgHeight)
  heightLeft -= contentHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + PDF_MARGIN_MM
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', PDF_MARGIN_MM, position, imgWidth, imgHeight)
    heightLeft -= contentHeight
  }

  pdf.save(filename)
}

function PillarBreakdown({ rows }) {
  const maxRate = Math.max(...rows.map((row) => row.avgEngagement), 0.0001)
  const hasData = rows.some((row) => row.avgEngagement > 0)

  if (!hasData) {
    return <p className="mt-4 text-sm text-slate">No pillar engagement data this month.</p>
  }

  return (
    <div className="mt-4 space-y-4">
      {rows.map(({ pillar, label, color, avgEngagement }) => (
        <div key={pillar}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-bold text-charcoal">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {label}
            </span>
            <span className="shrink-0 font-bold text-charcoal">
              {formatEngagementPercent(avgEngagement)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate/15">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((avgEngagement / maxRate) * 100, avgEngagement > 0 ? 4 : 0)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ReportSheet({ monthLabel, handle, analytics, reportRef }) {
  const {
    postedCount,
    postedByPlatform,
    topPosts,
    platformBreakdown,
    engagementByPillar,
    totalFollowsGained,
    engagementTrend,
  } = analytics

  return (
    <article
      ref={reportRef}
      className="mx-auto max-w-3xl bg-cream p-10 shadow-sm ring-1 ring-slate/15"
    >
      <header className="border-b-2 border-charcoal pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-coral">
              Unfiltered Athlete
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tighter text-charcoal">
              Work In Progress
            </h1>
            <p className="mt-1 text-sm font-bold uppercase tracking-wider text-slate">
              {monthLabel}
            </p>
          </div>
          <p className="text-right text-sm font-bold text-charcoal">{handle}</p>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-charcoal">
          Posts posted
        </h2>
        <p className="mt-3 text-5xl font-black tracking-tight text-charcoal">{postedCount}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {postedByPlatform.map(({ platform, label, count }) => (
            <div
              key={platform}
              className="rounded border border-slate/20 bg-white px-4 py-2 text-center"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate">{label}</p>
              <p className="mt-0.5 text-xl font-black text-charcoal">{count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-charcoal">
          Top performing posts
        </h2>
        {topPosts.length === 0 ? (
          <p className="mt-4 text-sm text-slate">No engagement data for posted posts this month.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {topPosts.map(({ post, engagementRate }, index) => {
              const pillar = PILLARS_BY_VALUE[post.pillar]
              const pillarColor = pillar?.color ?? '#8E8E93'

              return (
                <li
                  key={post.id}
                  className="flex items-center gap-4 rounded border border-slate/20 border-l-4 bg-white p-4"
                  style={{ borderLeftColor: pillarColor }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal text-sm font-black text-cream">
                    {index + 1}
                  </span>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: pillarColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-charcoal">{post.title || 'Untitled'}</p>
                    <p className="text-xs uppercase tracking-wider text-slate">
                      {pillar?.label ?? post.pillar ?? 'No pillar'}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-black text-coral">
                    {formatEngagementPercent(engagementRate)}
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-charcoal">
          Pillar breakdown
        </h2>
        <div className="mt-4 rounded border border-slate/20 bg-white p-5">
          <PillarBreakdown rows={engagementByPillar} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-charcoal">
          Platform breakdown
        </h2>
        <div className="mt-4 overflow-x-auto rounded border border-slate/20 bg-white">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate/20 bg-charcoal/5">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate">
                  Platform
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate">
                  Posted
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate">
                  Avg engagement
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate">
                  Follows gained
                </th>
              </tr>
            </thead>
            <tbody>
              {platformBreakdown.map((row) => (
                <tr key={row.platform} className="border-b border-slate/10 last:border-0">
                  <td className="px-4 py-3 font-bold text-charcoal">{row.label}</td>
                  <td className="px-4 py-3 text-charcoal">{row.postedCount}</td>
                  <td className="px-4 py-3 text-charcoal">
                    {row.avgEngagement > 0 ? formatEngagementPercent(row.avgEngagement) : '—'}
                  </td>
                  <td className="px-4 py-3 text-charcoal">{row.followsGained}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="rounded border border-slate/20 bg-white p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-charcoal">
            Follower growth
          </h2>
          <p className="mt-3 text-4xl font-black tracking-tight text-charcoal">
            {totalFollowsGained.toLocaleString()}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-slate">Total follows gained</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-charcoal">
          Engagement trend
        </h2>
        {engagementTrend.length === 0 ? (
          <p className="mt-4 text-sm text-slate">No daily engagement data this month.</p>
        ) : (
          <div className="mt-4 h-56 rounded border border-slate/20 bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8E8E9333" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#8E8E93', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                  tick={{ fill: '#8E8E93', fontSize: 10 }}
                  width={42}
                />
                <Tooltip content={<ReportTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avgEngagement"
                  stroke="#FF5733"
                  strokeWidth={2}
                  dot={{ fill: '#FF5733', r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <footer className="mt-10 border-t border-slate/20 pt-4 text-center text-xs uppercase tracking-wider text-slate">
        Content Studio · {monthLabel}
      </footer>
    </article>
  )
}

export default function Report() {
  const { handle: authHandle } = useAuth()
  const reportHandle = authHandle ? `@${authHandle.replace(/^@/, '')}` : '@alymichwoo'

  const [monthValue, setMonthValue] = useState(() => format(new Date(), 'yyyy-MM'))
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef(null)

  const { rangeStart, rangeEnd } = useMemo(() => {
    const [year, month] = monthValue.split('-').map(Number)
    return getMonthDateRange(year, month)
  }, [monthValue])

  const monthLabel = useMemo(
    () => format(parseISO(`${monthValue}-01`), 'MMMM yyyy'),
    [monthValue],
  )

  const postsQuery = usePosts()
  const metricsQuery = useAllMetrics({ startDate: rangeStart, endDate: rangeEnd })

  const posts = postsQuery.data ?? []
  const metrics = metricsQuery.data ?? []

  const analytics = useMemo(
    () => computeMonthlyReportAnalytics(posts, metrics, { rangeStart, rangeEnd }),
    [posts, metrics, rangeStart, rangeEnd],
  )

  const isLoading = postsQuery.isPending || metricsQuery.isPending
  const queryError = postsQuery.error ?? metricsQuery.error
  const isEmpty =
    !isLoading && !queryError && analytics.postedCount === 0 && metrics.length === 0

  const pdfFilename = `wip-report-${monthValue}.pdf`

  async function handleDownloadPdf() {
    if (!reportRef.current || exporting) return
    setExporting(true)
    try {
      await exportElementToPdf(reportRef.current, pdfFilename)
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppShell title="Report">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-charcoal">
              Work In Progress
            </h2>
            <p className="mt-1 text-sm text-slate">
              Monthly performance report — export as PDF for partners or your own records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate">Month</span>
              <input
                type="month"
                value={monthValue}
                onChange={(event) => setMonthValue(event.target.value)}
                className="rounded border border-slate/30 bg-white px-3 py-2 text-sm font-bold text-charcoal focus:border-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
              />
            </label>

            <Button
              type="button"
              variant="primary"
              className="mt-5"
              disabled={isLoading || !!queryError || isEmpty || exporting}
              onClick={handleDownloadPdf}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Download PDF
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-coral" aria-hidden="true" />
            <p className="text-sm font-bold uppercase tracking-wider text-slate">
              Loading report…
            </p>
          </div>
        ) : queryError ? (
          <div
            className="rounded-lg border border-coral/40 bg-coral/10 px-5 py-4"
            role="alert"
          >
            <p className="text-sm font-bold uppercase tracking-wider text-coral">
              Could not load report data
            </p>
            <p className="mt-2 text-sm text-charcoal">{queryError.message}</p>
          </div>
        ) : isEmpty ? (
          <div className="rounded-lg border border-slate/20 bg-white px-5 py-16 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-charcoal">
              No data for {monthLabel}
            </p>
            <p className="mt-2 text-sm text-slate">
              Mark posts as posted and log metrics this month to generate your WIP report.
            </p>
          </div>
        ) : (
          <ReportSheet
            monthLabel={monthLabel}
            handle={reportHandle}
            analytics={analytics}
            reportRef={reportRef}
          />
        )}
      </div>
    </AppShell>
  )
}
