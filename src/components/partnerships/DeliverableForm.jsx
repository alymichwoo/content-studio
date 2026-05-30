import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PLATFORMS, POST_TYPES } from '../../lib/constants'
import { useCreateDeliverable, useUpdateDeliverable } from '../../hooks/useDeliverables'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import { modalFooterClass } from '../ui/iconButtonStyles'

const deliverableFormSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'linkedin']),
  post_type: z.enum(['reel', 'carousel', 'story', 'static', 'video']),
  quantity_required: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

const emptyDefaults = {
  platform: 'instagram',
  post_type: 'reel',
  quantity_required: 1,
  due_date: '',
  notes: '',
}

function toFormValues(deliverable) {
  if (!deliverable) return emptyDefaults
  return {
    platform: deliverable.platform ?? 'instagram',
    post_type: deliverable.post_type ?? 'reel',
    quantity_required: deliverable.quantity_required ?? 1,
    due_date: deliverable.due_date ?? '',
    notes: deliverable.notes ?? '',
  }
}

function toDbPayload(data) {
  return {
    platform: data.platform,
    post_type: data.post_type,
    quantity_required: data.quantity_required,
    due_date: data.due_date || null,
    notes: data.notes?.trim() || null,
  }
}

export default function DeliverableForm({ open, onClose, deliverable, campaignId }) {
  const isEdit = Boolean(deliverable?.id)
  const createDeliverable = useCreateDeliverable()
  const updateDeliverable = useUpdateDeliverable()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(deliverableFormSchema),
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (open) {
      reset(toFormValues(deliverable))
    }
  }, [open, deliverable, reset])

  async function onSubmit(data) {
    const payload = toDbPayload(data)
    try {
      if (isEdit) {
        await updateDeliverable.mutateAsync({ id: deliverable.id, ...payload })
      } else {
        await createDeliverable.mutateAsync({ ...payload, campaign_id: campaignId })
      }
      onClose()
    } catch {
      // Errors surface via mutation state if needed later
    }
  }

  const mutationError = createDeliverable.error ?? updateDeliverable.error

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit deliverable' : 'New deliverable'}
      size="md"
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

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="platform"
            control={control}
            render={({ field }) => (
              <Select
                id="deliverable-platform"
                label="Platform"
                value={field.value}
                onChange={field.onChange}
                options={PLATFORMS}
                error={errors.platform?.message}
              />
            )}
          />

          <Controller
            name="post_type"
            control={control}
            render={({ field }) => (
              <Select
                id="deliverable-post_type"
                label="Post type"
                value={field.value}
                onChange={field.onChange}
                options={POST_TYPES}
                error={errors.post_type?.message}
              />
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="deliverable-quantity_required"
            label="Quantity required"
            type="number"
            min={1}
            error={errors.quantity_required?.message}
            {...register('quantity_required')}
          />

          <Input
            id="deliverable-due_date"
            label="Due date"
            type="date"
            error={errors.due_date?.message}
            {...register('due_date')}
          />
        </div>

        <Textarea
          id="deliverable-notes"
          label="Notes"
          rows={3}
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className={modalFooterClass}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add deliverable'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
