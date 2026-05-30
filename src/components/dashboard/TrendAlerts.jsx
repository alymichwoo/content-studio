import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { computeTrendAlerts } from '../../lib/alerts'

const SEVERITY_STYLES = {
  warn: 'border-coral/40 bg-coral/10',
  positive: 'border-pillar-feel/40 bg-pillar-feel/10',
  info: 'border-slate/30 bg-slate/5',
}

export default function TrendAlerts({ posts = [], metrics = [], deliverables = [] }) {
  const [dismissed, setDismissed] = useState(() => new Set())

  const alerts = useMemo(
    () => computeTrendAlerts(posts, metrics, deliverables),
    [posts, metrics, deliverables],
  )

  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.id))

  function dismiss(id) {
    setDismissed((prev) => new Set(prev).add(id))
  }

  if (visibleAlerts.length === 0) {
    return (
      <p className="text-sm text-slate">You&apos;re all caught up</p>
    )
  }

  return (
    <ul className="space-y-2" aria-label="Trend alerts">
      {visibleAlerts.map((alert) => (
        <li
          key={alert.id}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info}`}
        >
          <p className="text-sm text-charcoal">{alert.message}</p>
          <button
            type="button"
            onClick={() => dismiss(alert.id)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate transition hover:bg-charcoal/5 hover:text-charcoal"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
