import { Pencil, Trash2 } from 'lucide-react'
import { formatDeliverableLabel, computeDeliverableProgress } from '../../lib/deliverableUtils'
import { PLATFORMS_BY_VALUE, POST_TYPES_BY_VALUE } from '../../lib/constants'
import { iconButtonClass, iconButtonDangerClass } from '../ui/iconButtonStyles'

function CardField({ label, children }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export default function DeliverableProgress({
  deliverable,
  linkedPosts = [],
  onEdit,
  onDelete,
}) {
  const progress = computeDeliverableProgress(deliverable, linkedPosts)
  const pct =
    progress.required > 0
      ? Math.min(100, Math.round((progress.delivered / progress.required) * 100))
      : 0

  const label = formatDeliverableLabel(deliverable)
  const platformLabel = PLATFORMS_BY_VALUE[deliverable.platform]?.label
  const typeLabel = POST_TYPES_BY_VALUE[deliverable.post_type]?.label

  const actionButtons = (
    <>
      {onEdit && (
        <button type="button" onClick={onEdit} className={iconButtonClass} aria-label="Edit deliverable">
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={iconButtonDangerClass}
          aria-label="Delete deliverable"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </>
  )

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        progress.isOverdue ? 'border-coral/50 bg-coral/5' : 'border-slate/20 bg-cream'
      }`}
    >
      {/* Mobile: stacked label/value card */}
      <div className="space-y-3 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <CardField label="Deliverable">
            <p className="font-semibold text-charcoal">{label}</p>
          </CardField>
          <div className="flex shrink-0 items-center gap-1">{actionButtons}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CardField label="Platform">
            <p className="text-sm text-charcoal">{platformLabel}</p>
          </CardField>
          <CardField label="Type">
            <p className="text-sm text-charcoal">{typeLabel}</p>
          </CardField>
        </div>
        {deliverable.due_date && (
          <CardField label="Due date">
            <p className="text-sm text-charcoal">
              {deliverable.due_date}
              {progress.isOverdue && (
                <span className="ml-1 font-bold uppercase text-coral">Overdue</span>
              )}
            </p>
          </CardField>
        )}
        <CardField label="Progress">
          <p className="text-sm font-semibold text-charcoal">
            {progress.delivered} of {progress.required} delivered
          </p>
        </CardField>
      </div>

      {/* Desktop: horizontal summary row */}
      <div className="hidden items-center justify-between gap-3 md:flex">
        <div className="min-w-0">
          <p className="font-semibold text-charcoal">{label}</p>
          <p className="mt-0.5 text-xs text-slate">
            {platformLabel} · {typeLabel}
            {deliverable.due_date && (
              <>
                {' '}
                · Due {deliverable.due_date}
                {progress.isOverdue && (
                  <span className="ml-1 font-bold uppercase text-coral">Overdue</span>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="whitespace-nowrap text-sm font-semibold text-charcoal">
            {progress.delivered} of {progress.required} delivered
          </p>
          {actionButtons}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate/20">
        <div
          className={`h-full rounded-full transition-all ${
            progress.isOverdue ? 'bg-coral' : 'bg-charcoal'
          }`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={progress.delivered}
          aria-valuemin={0}
          aria-valuemax={progress.required}
          aria-label={`${progress.delivered} of ${progress.required} delivered`}
        />
      </div>

      {progress.pending > 0 && (
        <p className="mt-2 text-xs text-slate">
          {progress.pending} linked post{progress.pending !== 1 ? 's' : ''} not yet posted
        </p>
      )}

      {deliverable.notes && (
        <p className="mt-2 text-xs text-slate">{deliverable.notes}</p>
      )}
    </div>
  )
}
