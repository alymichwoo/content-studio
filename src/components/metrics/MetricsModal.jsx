import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import {
  ENGAGEMENT_FORMULAS,
  PLATFORMS_BY_VALUE,
} from '../../lib/constants'
import {
  useCreateMetric,
  useDeleteMetric,
  useMetrics,
  useUpdateMetric,
} from '../../hooks/useMetrics'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import Select from '../ui/Select'

const PLATFORM_FIELDS = {
  tiktok: [
    { key: 'views', label: 'Views' },
    { key: 'likes', label: 'Likes' },
    { key: 'comments', label: 'Comments' },
    { key: 'shares', label: 'Shares' },
    { key: 'follows_gained', label: 'Follows gained' },
  ],
  instagram: [
    { key: 'reach', label: 'Reach' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'likes', label: 'Likes' },
    { key: 'comments', label: 'Comments' },
    { key: 'saves', label: 'Saves' },
    { key: 'follows_gained', label: 'Follows gained' },
  ],
  linkedin: [
    { key: 'impressions', label: 'Impressions' },
    { key: 'reactions', label: 'Reactions' },
    { key: 'comments', label: 'Comments' },
    { key: 'reposts', label: 'Reposts' },
    { key: 'profile_visits', label: 'Profile visits' },
  ],
}

const ALL_METRIC_KEYS = [
  'views',
  'likes',
  'comments',
  'shares',
  'saves',
  'impressions',
  'reach',
  'reactions',
  'reposts',
  'follows_gained',
  'profile_visits',
]

function todayDateString() {
  return format(new Date(), 'yyyy-MM-dd')
}

function toDateInputValue(recordedAt) {
  if (!recordedAt) return todayDateString()
  return format(parseISO(recordedAt), 'yyyy-MM-dd')
}

function emptyFieldValues(platform) {
  const values = {}
  for (const { key } of PLATFORM_FIELDS[platform] ?? []) {
    values[key] = ''
  }
  return values
}

function metricToFieldValues(metric) {
  const values = emptyFieldValues(metric.platform)
  for (const key of Object.keys(values)) {
    values[key] = metric[key] != null ? String(metric[key]) : ''
  }
  return values
}

function parseFieldValues(platform, fieldValues) {
  const payload = { platform }
  for (const { key } of PLATFORM_FIELDS[platform] ?? []) {
    const raw = fieldValues[key]?.trim()
    payload[key] = raw === '' ? null : Number.parseInt(raw, 10)
  }
  for (const key of ALL_METRIC_KEYS) {
    if (!(key in payload)) payload[key] = null
  }
  return payload
}

function formatEngagementRate(platform, metric) {
  const formula = ENGAGEMENT_FORMULAS[platform]
  if (!formula) return null
  const rate = formula(metric)
  if (rate == null) return null
  return `${(rate * 100).toFixed(2)}%`
}

function groupMetricsByPlatformAndDate(metrics) {
  const grouped = {}
  for (const metric of metrics) {
    const { platform } = metric
    const dateKey = toDateInputValue(metric.recorded_at)
    if (!grouped[platform]) grouped[platform] = {}
    if (!grouped[platform][dateKey]) grouped[platform][dateKey] = []
    grouped[platform][dateKey].push(metric)
  }
  return grouped
}

export default function MetricsModal({ open, onClose, post }) {
  const postId = post?.id
  const postPlatforms = post?.platforms ?? []

  const { data: metrics = [], isLoading, error } = useMetrics(postId)
  const createMetric = useCreateMetric()
  const updateMetric = useUpdateMetric()
  const deleteMetric = useDeleteMetric()

  const [platform, setPlatform] = useState(null)
  const [recordedAt, setRecordedAt] = useState(todayDateString())
  const [fieldValues, setFieldValues] = useState({})
  const [editingMetric, setEditingMetric] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const platformOptions = useMemo(
    () =>
      postPlatforms.map((value) => ({
        value,
        label: PLATFORMS_BY_VALUE[value]?.label ?? value,
      })),
    [postPlatforms],
  )

  const groupedMetrics = useMemo(() => groupMetricsByPlatformAndDate(metrics), [metrics])

  const isEditing = Boolean(editingMetric)
  const isSaving = createMetric.isPending || updateMetric.isPending

  const platformsKey = postPlatforms.join(',')

  useEffect(() => {
    if (!open) return
    const initialPlatform = postPlatforms[0] ?? null
    setPlatform(initialPlatform)
    setRecordedAt(todayDateString())
    setFieldValues(initialPlatform ? emptyFieldValues(initialPlatform) : {})
    setEditingMetric(null)
    setDeleteTarget(null)
  }, [open, postId, platformsKey])

  useEffect(() => {
    if (!platform || isEditing) return
    setFieldValues(emptyFieldValues(platform))
  }, [platform, isEditing])

  function handlePlatformChange(nextPlatform) {
    setPlatform(nextPlatform)
    if (!isEditing) {
      setFieldValues(emptyFieldValues(nextPlatform))
    }
  }

  function handleFieldChange(key, value) {
    setFieldValues((prev) => ({ ...prev, [key]: value }))
  }

  function startEdit(metric) {
    setEditingMetric(metric)
    setPlatform(metric.platform)
    setRecordedAt(toDateInputValue(metric.recorded_at))
    setFieldValues(metricToFieldValues(metric))
  }

  function cancelEdit() {
    setEditingMetric(null)
    setRecordedAt(todayDateString())
    if (platform) {
      setFieldValues(emptyFieldValues(platform))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!postId || !platform) return

    const payload = {
      ...parseFieldValues(platform, fieldValues),
      recorded_at: new Date(`${recordedAt}T12:00:00`).toISOString(),
    }

    if (isEditing) {
      await updateMetric.mutateAsync({
        id: editingMetric.id,
        post_id: postId,
        ...payload,
      })
      cancelEdit()
    } else {
      await createMetric.mutateAsync({ post_id: postId, ...payload })
      setRecordedAt(todayDateString())
      setFieldValues(emptyFieldValues(platform))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteMetric.mutateAsync({ id: deleteTarget.id, post_id: postId })
    if (editingMetric?.id === deleteTarget.id) cancelEdit()
    setDeleteTarget(null)
  }

  const fields = platform ? PLATFORM_FIELDS[platform] ?? [] : []

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Metrics — ${post?.title || 'Untitled'}`}
        size="lg"
      >
        {postPlatforms.length === 0 ? (
          <p className="text-sm text-slate">Add platforms to this post before logging metrics.</p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isEditing && (
                <p className="rounded border border-slate/20 bg-charcoal/5 px-3 py-2 text-xs text-charcoal">
                  Editing recording from{' '}
                  {format(parseISO(editingMetric.recorded_at), 'MMM d, yyyy')}
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="ml-2 font-semibold text-coral hover:underline"
                  >
                    Cancel
                  </button>
                </p>
              )}

              <Select
                id="metric-platform"
                label="Platform"
                value={platform}
                onChange={handlePlatformChange}
                options={platformOptions}
              />

              {platform && (
                <>
                  <Input
                    id="metric-recorded-at"
                    label="Recorded date"
                    type="date"
                    value={recordedAt}
                    onChange={(e) => setRecordedAt(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {fields.map(({ key, label }) => (
                      <Input
                        key={key}
                        id={`metric-${key}`}
                        label={label}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={fieldValues[key] ?? ''}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="submit" disabled={!platform || isSaving}>
                  {isSaving
                    ? 'Saving…'
                    : isEditing
                      ? 'Update recording'
                      : 'Save recording'}
                </Button>
              </div>
            </form>

            <div className="mt-8 border-t border-slate/20 pt-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-charcoal">
                Recordings
              </h3>

              {isLoading && (
                <p className="mt-3 text-sm text-slate">Loading metrics…</p>
              )}

              {error && (
                <p className="mt-3 text-sm text-coral" role="alert">
                  {error.message}
                </p>
              )}

              {!isLoading && !error && metrics.length === 0 && (
                <p className="mt-3 text-sm text-slate">No recordings yet.</p>
              )}

              {!isLoading && metrics.length > 0 && (
                <div className="mt-4 space-y-6">
                  {Object.entries(groupedMetrics)
                    .sort(([a], [b]) =>
                      (PLATFORMS_BY_VALUE[a]?.label ?? a).localeCompare(
                        PLATFORMS_BY_VALUE[b]?.label ?? b,
                      ),
                    )
                    .map(([platformKey, dates]) => (
                      <div key={platformKey}>
                        <h4 className="text-sm font-bold text-charcoal">
                          {PLATFORMS_BY_VALUE[platformKey]?.label ?? platformKey}
                        </h4>
                        <ul className="mt-2 space-y-3">
                          {Object.entries(dates)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .map(([dateKey, dateMetrics]) => (
                              <li key={dateKey}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                                  {format(parseISO(`${dateKey}T12:00:00`), 'MMM d, yyyy')}
                                </p>
                                <ul className="mt-1 divide-y divide-slate/10 rounded border border-slate/20">
                                  {dateMetrics.map((metric) => {
                                    const engagement = formatEngagementRate(
                                      metric.platform,
                                      metric,
                                    )
                                    return (
                                      <li
                                        key={metric.id}
                                        className="flex items-center justify-between gap-3 px-3 py-2"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-semibold text-charcoal">
                                            {engagement ?? '—'}{' '}
                                            <span className="font-normal text-slate">
                                              engagement
                                            </span>
                                          </p>
                                          <p className="truncate text-xs text-slate">
                                            {(PLATFORM_FIELDS[metric.platform] ?? [])
                                              .filter(({ key }) => metric[key] != null)
                                              .map(({ key, label }) => `${label}: ${metric[key]}`)
                                              .join(' · ') || 'No values logged'}
                                          </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => startEdit(metric)}
                                            className="rounded p-1.5 text-slate transition hover:bg-charcoal/5 hover:text-charcoal"
                                            aria-label="Edit recording"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteTarget(metric)}
                                            className="rounded p-1.5 text-slate transition hover:bg-coral/10 hover:text-coral"
                                            aria-label="Delete recording"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete recording"
        size="sm"
      >
        <p className="text-sm text-charcoal">
          Delete this metrics recording? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMetric.isPending}
          >
            {deleteMetric.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
