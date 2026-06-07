import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { PlatformIcon } from '../components/calendar/PostCard'
import { usePosts, useBulkCreatePosts } from '../hooks/usePosts'
import { useEvents } from '../hooks/useEvents'
import {
  computeRange,
  formatPeriodLabel,
  mapScheduleItems,
  selectExistingPosts,
  selectRecentPosts,
  shiftAnchor,
  useGenerateBatch,
} from '../ai/useGenerateBatch'
import { PILLARS_BY_VALUE, PLATFORMS_BY_VALUE, POST_TYPES_BY_VALUE } from '../lib/constants'
import { iconButtonClass } from '../components/ui/iconButtonStyles'

const RANGE_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

function RangeToggle({ value, onChange }) {
  return (
    <div
      className="inline-flex rounded border border-slate/20 bg-white p-1"
      role="group"
      aria-label="Range type"
    >
      {RANGE_OPTIONS.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
              active ? 'bg-charcoal text-cream' : 'text-slate hover:text-charcoal'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function PeriodNavigator({ label, onPrev, onNext, onToday }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        className={`${iconButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral`}
        aria-label="Previous period"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <p className="min-w-[10rem] text-center text-sm font-bold uppercase tracking-wider text-charcoal">
        {label}
      </p>
      <button
        type="button"
        onClick={onNext}
        className={`${iconButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral`}
        aria-label="Next period"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <Button variant="ghost" size="sm" onClick={onToday}>
        Today
      </Button>
    </div>
  )
}

function SuggestionCard({ suggestion, selected, added, onToggle }) {
  const pillar = PILLARS_BY_VALUE[suggestion.pillar]
  const postType = POST_TYPES_BY_VALUE[suggestion.post_type]

  return (
    <article
      className={`rounded-lg border border-slate/20 border-l-4 bg-white p-4 transition ${
        added ? 'opacity-70' : ''
      }`}
      style={{ borderLeftColor: pillar?.color ?? '#8E8E93' }}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          disabled={added}
          onChange={onToggle}
          aria-label={added ? `${suggestion.title} (added)` : `Select ${suggestion.title}`}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate/30 text-coral focus:ring-coral disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {pillar && <Badge color={pillar.color}>{pillar.label}</Badge>}
            {postType && (
              <span className="text-xs font-bold uppercase tracking-wider text-slate">
                {postType.label}
              </span>
            )}
            {added && (
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-charcoal">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Added
              </span>
            )}
            <span className="flex items-center gap-1.5">
              {(suggestion.platforms ?? []).map((platform) => (
                <span
                  key={platform}
                  className="flex h-7 w-7 items-center justify-center rounded border border-slate/20 bg-cream"
                  title={PLATFORMS_BY_VALUE[platform]?.label}
                >
                  <PlatformIcon platform={platform} />
                </span>
              ))}
            </span>
          </div>

          <h4 className="mt-3 text-base font-black uppercase tracking-tight text-charcoal">
            {suggestion.title}
          </h4>

          {suggestion.hook && (
            <p className="mt-2 text-sm font-semibold text-charcoal">{suggestion.hook}</p>
          )}

          {suggestion.caption && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate">{suggestion.caption}</p>
          )}

          {suggestion.notes && (
            <p className="mt-3 rounded border border-slate/15 bg-cream px-3 py-2 text-xs text-slate">
              {suggestion.notes}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Generate() {
  const [rangeType, setRangeType] = useState('week')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [cadence, setCadence] = useState(5)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [addedIds, setAddedIds] = useState(() => new Set())
  const [addSuccess, setAddSuccess] = useState(null)
  const [addError, setAddError] = useState(null)

  const range = useMemo(() => computeRange(rangeType, anchorDate), [rangeType, anchorDate])
  const periodLabel = useMemo(
    () => formatPeriodLabel(rangeType, anchorDate),
    [rangeType, anchorDate],
  )

  const { data: posts = [], isLoading: postsLoading } = usePosts()
  const { data: events = [], isLoading: eventsLoading } = useEvents({
    startDate: range.start,
    endDate: range.end,
  })

  const recentPosts = useMemo(() => selectRecentPosts(posts), [posts])
  const existingPosts = useMemo(
    () => selectExistingPosts(posts, range.start, range.end),
    [posts, range.start, range.end],
  )
  const scheduleItems = useMemo(() => mapScheduleItems(events), [events])

  const { generate, suggestions, isLoading, error, isSuccess, reset } = useGenerateBatch()
  const bulkCreate = useBulkCreatePosts()

  useEffect(() => {
    if (!suggestions?.length) {
      setSelectedIds(new Set())
      setAddedIds(new Set())
      return
    }

    setSelectedIds(new Set(suggestions.map((_, index) => index)))
    setAddedIds(new Set())
    setAddSuccess(null)
    setAddError(null)
  }, [suggestions])

  const groupedSuggestions = useMemo(() => {
    if (!suggestions?.length) return []
    const groups = new Map()
    suggestions.forEach((item, index) => {
      const list = groups.get(item.scheduled_date) ?? []
      list.push({ suggestion: item, index })
      groups.set(item.scheduled_date, list)
    })
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [suggestions])

  const selectableIndices = useMemo(
    () => (suggestions ?? []).map((_, index) => index).filter((index) => !addedIds.has(index)),
    [suggestions, addedIds],
  )

  const selectedCount = useMemo(
    () => selectableIndices.filter((index) => selectedIds.has(index)).length,
    [selectableIndices, selectedIds],
  )

  const allSelectableSelected =
    selectableIndices.length > 0 &&
    selectableIndices.every((index) => selectedIds.has(index))

  const contextLoading = postsLoading || eventsLoading
  const showResults = !isLoading && suggestions?.length > 0

  function toggleSelection(index) {
    if (addedIds.has(index)) return
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(selectableIndices))
  }

  async function handleGenerate() {
    reset()
    setAddSuccess(null)
    setAddError(null)
    await generate({
      rangeType,
      anchorDate,
      cadence,
      recentPosts,
      scheduleItems,
      existingPosts,
    })
  }

  function handleRetry() {
    handleGenerate()
  }

  async function handleAddToCalendar() {
    if (!suggestions?.length || selectedCount === 0) return

    setAddError(null)
    setAddSuccess(null)

    const toAdd = selectableIndices
      .filter((index) => selectedIds.has(index))
      .map((index) => suggestions[index])

    try {
      const created = await bulkCreate.mutateAsync(toAdd)
      const addedIndices = selectableIndices.filter((index) => selectedIds.has(index))

      setAddedIds((current) => {
        const next = new Set(current)
        addedIndices.forEach((index) => next.add(index))
        return next
      })

      setAddSuccess(
        `Added ${created.length} idea${created.length === 1 ? '' : 's'} to your calendar`,
      )
    } catch (err) {
      setAddError(err.message ?? 'Could not add ideas to your calendar. Try again.')
    }
  }

  return (
    <AppShell title="Generate">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-charcoal">
            Generate
          </h2>
          <p className="mt-1 text-sm text-slate">
            AI-powered content ideas grounded in trends and your calendar
          </p>
        </div>
      </div>

      <section className="rounded-lg border border-slate/20 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4">
            <RangeToggle value={rangeType} onChange={setRangeType} />
            <PeriodNavigator
              label={periodLabel}
              onPrev={() => setAnchorDate((current) => shiftAnchor(rangeType, current, -1))}
              onNext={() => setAnchorDate((current) => shiftAnchor(rangeType, current, 1))}
              onToday={() => setAnchorDate(new Date())}
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {rangeType !== 'day' && (
              <Input
                id="cadence"
                label="Ideas per week"
                type="number"
                min={1}
                max={20}
                value={cadence}
                onChange={(e) => setCadence(Math.max(1, Number(e.target.value) || 1))}
                className="w-full sm:w-36"
              />
            )}
            <Button
              onClick={handleGenerate}
              disabled={isLoading || contextLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  Generate ideas
                </>
              )}
            </Button>
          </div>
        </div>

        {rangeType === 'day' && (
          <p className="mt-3 text-xs text-slate">Day view generates about one idea for that date.</p>
        )}
        {rangeType !== 'day' && (
          <p className="mt-3 text-xs text-slate">
            Cadence controls how many ideas to generate per week across the selected period.
          </p>
        )}
      </section>

      {isLoading && (
        <div className="mt-6 flex items-center gap-3 rounded border border-slate/20 bg-white px-4 py-3 text-sm text-slate">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-coral" aria-hidden="true" />
          <p>Generating ideas… This can take 20–40 seconds.</p>
        </div>
      )}

      {error && (
        <div
          className="mt-6 rounded border border-coral/40 bg-coral/10 px-4 py-4 text-sm text-coral"
          role="alert"
        >
          <p className="font-semibold">Couldn&apos;t generate ideas</p>
          <p className="mt-1">{error.message}</p>
          {error.retryable && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={handleRetry}>
              Try again
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && !isSuccess && !showResults && (
        <div className="mt-8 rounded-lg border border-dashed border-slate/30 bg-cream/50 px-6 py-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-slate/60" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-charcoal">
            No ideas yet
          </p>
          <p className="mt-2 text-sm text-slate">
            Choose a period and hit Generate ideas to build a plan for your calendar.
          </p>
        </div>
      )}

      {showResults && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate/20 bg-white p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate">
                {suggestions.length} idea{suggestions.length === 1 ? '' : 's'} · {periodLabel}
              </p>
              <p className="mt-1 text-sm text-slate">
                {selectedCount} selected
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                {allSelectableSelected ? 'Select none' : 'Select all'}
              </Button>
              <Button
                onClick={handleAddToCalendar}
                disabled={selectedCount === 0 || bulkCreate.isPending}
              >
                {bulkCreate.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Adding…
                  </>
                ) : (
                  <>
                    <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Add {selectedCount} to calendar
                  </>
                )}
              </Button>
            </div>
          </div>

          {addSuccess && (
            <div
              className="rounded border border-charcoal/20 bg-charcoal/5 px-4 py-3 text-sm text-charcoal"
              role="status"
            >
              {addSuccess}
            </div>
          )}

          {addError && (
            <div
              className="rounded border border-coral/40 bg-coral/10 px-4 py-4 text-sm text-coral"
              role="alert"
            >
              <p className="font-semibold">Couldn&apos;t add ideas</p>
              <p className="mt-1">{addError}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={handleAddToCalendar}>
                Try again
              </Button>
            </div>
          )}

          <div className="space-y-8">
            {groupedSuggestions.map(([dateKey, items]) => (
              <section key={dateKey}>
                <h3 className="mb-3 text-sm font-black uppercase tracking-tighter text-charcoal">
                  {format(parseISO(dateKey), 'EEEE, MMM d')}
                </h3>
                <ul className="space-y-3">
                  {items.map(({ suggestion, index }) => (
                    <li key={`${dateKey}-${index}`}>
                      <SuggestionCard
                        suggestion={suggestion}
                        selected={selectedIds.has(index)}
                        added={addedIds.has(index)}
                        onToggle={() => toggleSelection(index)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  )
}
