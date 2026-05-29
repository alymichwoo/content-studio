import { Pencil, Trash2 } from 'lucide-react'
import { formatDeliverableLabel, computeDeliverableProgress } from '../../lib/deliverableUtils'
import { PLATFORMS_BY_VALUE, POST_TYPES_BY_VALUE } from '../../lib/constants'

const iconButtonClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate transition hover:bg-charcoal/5 hover:text-charcoal'

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

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        progress.isOverdue ? 'border-coral/50 bg-coral/5' : 'border-slate/20 bg-cream'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
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
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className={iconButtonClass}
              aria-label="Edit deliverable"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className={`${iconButtonClass} hover:bg-coral/10 hover:text-coral`}
              aria-label="Delete deliverable"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
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
