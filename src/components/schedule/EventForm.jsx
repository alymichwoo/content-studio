import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SCHEDULE_TYPES } from '../../lib/constants'
import { useCreateEvent, useUpdateEvent } from '../../hooks/useEvents'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Select from '../ui/Select'
import Modal from '../ui/Modal'

const eventFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['event', 'travel', 'competition', 'launch', 'personal']),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    location: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  })

const emptyDefaults = {
  title: '',
  type: 'event',
  start_date: '',
  end_date: '',
  location: '',
  notes: '',
}

function toFormValues(event) {
  if (!event) return emptyDefaults
  return {
    title: event.title ?? '',
    type: event.type ?? 'event',
    start_date: event.start_date ?? '',
    end_date: event.end_date ?? '',
    location: event.location ?? '',
    notes: event.notes ?? '',
  }
}

function toDbPayload(data) {
  return {
    title: data.title,
    type: data.type,
    start_date: data.start_date,
    end_date: data.end_date,
    location: data.location?.trim() || null,
    notes: data.notes?.trim() || null,
  }
}

export default function EventForm({ open, onClose, event }) {
  const isEdit = Boolean(event?.id)
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (open) {
      reset(toFormValues(event))
    }
  }, [open, event, reset])

  async function onSubmit(data) {
    const payload = toDbPayload(data)
    try {
      if (isEdit) {
        await updateEvent.mutateAsync({ id: event.id, ...payload })
      } else {
        await createEvent.mutateAsync(payload)
      }
      onClose()
    } catch {
      // Errors surface via mutation state if needed later
    }
  }

  const mutationError = createEvent.error ?? updateEvent.error

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit event' : 'New event'}
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

        <Input
          id="event-title"
          label="Title"
          error={errors.title?.message}
          {...register('title')}
        />

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              id="event-type"
              label="Type"
              value={field.value}
              onChange={field.onChange}
              options={SCHEDULE_TYPES}
              error={errors.type?.message}
            />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="event-start_date"
            label="Start date"
            type="date"
            error={errors.start_date?.message}
            {...register('start_date')}
          />

          <Input
            id="event-end_date"
            label="End date"
            type="date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </div>

        <Input
          id="event-location"
          label="Location"
          placeholder="Optional"
          error={errors.location?.message}
          {...register('location')}
        />

        <Textarea
          id="event-notes"
          label="Notes"
          rows={3}
          placeholder="Optional notes"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex justify-end gap-3 border-t border-slate/20 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
