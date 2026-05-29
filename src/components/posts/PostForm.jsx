import { useEffect, useMemo } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CAPTION_LIMITS,
  PILLARS,
  PLATFORMS,
  PLATFORMS_BY_VALUE,
  POST_TYPES,
  STATUSES,
} from '../../lib/constants'
import { formatDeliverableLabel } from '../../lib/deliverableUtils'
import { useCreatePost, useUpdatePost } from '../../hooks/usePosts'
import { useDeliverableOptions } from '../../hooks/useDeliverables'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Select from '../ui/Select'
import GroupedSelect from '../ui/GroupedSelect'
import MultiSelect from '../ui/MultiSelect'
import Modal from '../ui/Modal'

const postFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  pillar: z.enum(['train', 'live', 'think', 'feel', 'fuel']).nullable().optional(),
  platforms: z
    .array(z.enum(['tiktok', 'instagram', 'linkedin']))
    .min(1, 'Select at least one platform'),
  post_type: z.enum(['reel', 'carousel', 'story', 'static', 'video']).nullable().optional(),
  status: z.enum(['idea', 'drafting', 'ready', 'scheduled', 'posted']).nullable().optional(),
  scheduled_date: z.string().optional(),
  series: z.string().optional(),
  hook: z.string().optional(),
  caption: z.string().optional(),
  notes: z.string().optional(),
  deliverable_id: z.string().uuid().nullable().optional(),
})

const emptyDefaults = {
  title: '',
  pillar: null,
  platforms: [],
  post_type: null,
  status: 'idea',
  scheduled_date: '',
  series: '',
  hook: '',
  caption: '',
  notes: '',
  deliverable_id: null,
}

function toFormValues(post) {
  if (!post) return emptyDefaults
  return {
    title: post.title ?? '',
    pillar: post.pillar ?? null,
    platforms: post.platforms ?? [],
    post_type: post.post_type ?? null,
    status: post.status ?? 'idea',
    scheduled_date: post.scheduled_date ?? '',
    series: post.series ?? '',
    hook: post.hook ?? '',
    caption: post.caption ?? '',
    notes: post.notes ?? '',
    deliverable_id: post.deliverable_id ?? null,
  }
}

function toDbPayload(data) {
  return {
    title: data.title,
    pillar: data.pillar || null,
    platforms: data.platforms,
    post_type: data.post_type || null,
    status: data.status || null,
    scheduled_date: data.scheduled_date || null,
    series: data.series?.trim() || null,
    hook: data.hook?.trim() || null,
    caption: data.caption?.trim() || null,
    notes: data.notes?.trim() || null,
    deliverable_id: data.deliverable_id || null,
  }
}

function buildDeliverableGroups(deliverables) {
  const groupMap = new Map()

  for (const row of deliverables ?? []) {
    const brandName = row.campaigns?.brands?.name ?? 'Unknown brand'
    const campaignTitle = row.campaigns?.title ?? 'Unknown campaign'
    const groupLabel = `${brandName} — ${campaignTitle}`

    if (!groupMap.has(groupLabel)) {
      groupMap.set(groupLabel, [])
    }
    groupMap.get(groupLabel).push({
      value: row.id,
      label: formatDeliverableLabel(row),
      disclosureRequired: row.campaigns?.disclosure_required ?? false,
    })
  }

  return Array.from(groupMap.entries()).map(([label, options]) => ({ label, options }))
}

export default function PostForm({ open, onClose, post, onSuccess }) {
  const isEdit = Boolean(post?.id)
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const { data: deliverableRows = [] } = useDeliverableOptions()

  const deliverableGroups = useMemo(
    () => buildDeliverableGroups(deliverableRows),
    [deliverableRows],
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(postFormSchema),
    defaultValues: emptyDefaults,
  })

  const caption = useWatch({ control, name: 'caption' }) ?? ''
  const selectedPlatforms = useWatch({ control, name: 'platforms' }) ?? []
  const selectedDeliverableId = useWatch({ control, name: 'deliverable_id' })
  const captionLength = caption.length

  const disclosureRequired = useMemo(() => {
    if (!selectedDeliverableId) return false
    const match = deliverableRows.find((row) => row.id === selectedDeliverableId)
    return match?.campaigns?.disclosure_required ?? false
  }, [selectedDeliverableId, deliverableRows])

  useEffect(() => {
    if (open) {
      reset(toFormValues(post))
    }
  }, [open, post, reset])

  async function onSubmit(data) {
    const payload = toDbPayload(data)
    try {
      let saved
      if (isEdit) {
        saved = await updatePost.mutateAsync({ id: post.id, ...payload })
      } else {
        saved = await createPost.mutateAsync(payload)
      }
      await onSuccess?.(saved)
      onClose()
    } catch {
      // Errors surface via mutation state if needed later
    }
  }

  const mutationError = createPost.error ?? updatePost.error

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit post' : 'New post'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {mutationError && (
          <div
            className="rounded border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral"
            role="alert"
          >
            {mutationError.message}
          </div>
        )}

        <Input
          id="title"
          label="Title"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="pillar"
            control={control}
            render={({ field }) => (
              <Select
                id="pillar"
                label="Pillar"
                value={field.value}
                onChange={field.onChange}
                options={PILLARS}
                placeholder="Select pillar"
                error={errors.pillar?.message}
              />
            )}
          />

          <Controller
            name="platforms"
            control={control}
            render={({ field }) => (
              <MultiSelect
                id="platforms"
                label="Platforms"
                value={field.value}
                onChange={field.onChange}
                options={PLATFORMS}
                error={errors.platforms?.message}
              />
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="post_type"
            control={control}
            render={({ field }) => (
              <Select
                id="post_type"
                label="Post type"
                value={field.value}
                onChange={field.onChange}
                options={POST_TYPES}
                placeholder="Select type"
                error={errors.post_type?.message}
              />
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                id="status"
                label="Status"
                value={field.value}
                onChange={field.onChange}
                options={STATUSES}
                placeholder="Select status"
                error={errors.status?.message}
              />
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="scheduled_date"
            label="Scheduled date"
            type="date"
            error={errors.scheduled_date?.message}
            {...register('scheduled_date')}
          />

          <Input
            id="series"
            label="Series"
            placeholder="Optional series name"
            error={errors.series?.message}
            {...register('series')}
          />
        </div>

        {deliverableGroups.length > 0 && (
          <Controller
            name="deliverable_id"
            control={control}
            render={({ field }) => (
              <GroupedSelect
                id="deliverable_id"
                label="Linked deliverable"
                value={field.value}
                onChange={field.onChange}
                groups={deliverableGroups}
                placeholder="None — not part of a campaign"
                error={errors.deliverable_id?.message}
              />
            )}
          />
        )}

        <Textarea
          id="hook"
          label="Hook"
          rows={2}
          placeholder="Opening line or scroll-stopper"
          error={errors.hook?.message}
          {...register('hook')}
        />

        <div>
          <Textarea
            id="caption"
            label="Caption"
            rows={6}
            placeholder="Plain text caption"
            error={errors.caption?.message}
            {...register('caption')}
          />
          {disclosureRequired && (
            <p className="mt-2 rounded border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-charcoal">
              This campaign requires disclosure — include <strong>#ad</strong> or{' '}
              <strong>#sponsored</strong> in your caption.
            </p>
          )}
          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate">{captionLength} characters</p>
            {selectedPlatforms.length > 0 && (
              <ul className="space-y-0.5">
                {selectedPlatforms.map((platform) => {
                  const limit = CAPTION_LIMITS[platform]
                  const over = captionLength > limit
                  return (
                    <li
                      key={platform}
                      className={`text-xs ${over ? 'font-semibold text-coral' : 'text-slate'}`}
                    >
                      {PLATFORMS_BY_VALUE[platform]?.label}: {captionLength} / {limit}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <Textarea
          id="notes"
          label="Notes"
          rows={3}
          placeholder="Internal notes"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex justify-end gap-3 border-t border-slate/20 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create post'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
