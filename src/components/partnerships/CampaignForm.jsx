import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CAMPAIGN_STATUSES, PAYMENT_STATUSES_BY_VALUE } from '../../lib/constants'
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/useCampaigns'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import { modalFooterClass } from '../ui/iconButtonStyles'

const campaignFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    status: z.enum(['pitching', 'negotiating', 'active', 'delivered', 'wrapped']),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    brief: z.string().optional(),
    compensation: z.string().optional(),
    payment_status: z.enum(['unpaid', 'paid']),
    disclosure_required: z.boolean(),
  })
  .refine(
    (data) => !data.start_date || !data.end_date || data.end_date >= data.start_date,
    { message: 'End date must be on or after start date', path: ['end_date'] },
  )

const emptyDefaults = {
  title: '',
  status: 'pitching',
  start_date: '',
  end_date: '',
  brief: '',
  compensation: '',
  payment_status: 'unpaid',
  disclosure_required: false,
}

function toFormValues(campaign) {
  if (!campaign) return emptyDefaults
  return {
    title: campaign.title ?? '',
    status: campaign.status ?? 'pitching',
    start_date: campaign.start_date ?? '',
    end_date: campaign.end_date ?? '',
    brief: campaign.brief ?? '',
    compensation: campaign.compensation ?? '',
    payment_status: campaign.payment_status ?? 'unpaid',
    disclosure_required: campaign.disclosure_required ?? false,
  }
}

function toDbPayload(data) {
  return {
    title: data.title.trim(),
    status: data.status,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    brief: data.brief?.trim() || null,
    compensation: data.compensation?.trim() || null,
    payment_status: data.payment_status,
    disclosure_required: data.disclosure_required,
  }
}

export default function CampaignForm({ open, onClose, campaign, brandId }) {
  const isEdit = Boolean(campaign?.id)
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: emptyDefaults,
  })

  const paymentStatus = watch('payment_status')

  useEffect(() => {
    if (open) {
      reset(toFormValues(campaign))
    }
  }, [open, campaign, reset])

  async function onSubmit(data) {
    const payload = toDbPayload(data)
    try {
      if (isEdit) {
        await updateCampaign.mutateAsync({ id: campaign.id, ...payload })
      } else {
        await createCampaign.mutateAsync({ ...payload, brand_id: brandId })
      }
      onClose()
    } catch {
      // Errors surface via mutation state if needed later
    }
  }

  const mutationError = createCampaign.error ?? updateCampaign.error

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit campaign' : 'New campaign'}
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
          id="campaign-title"
          label="Title"
          error={errors.title?.message}
          {...register('title')}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              id="campaign-status"
              label="Status"
              value={field.value}
              onChange={field.onChange}
              options={CAMPAIGN_STATUSES}
              error={errors.status?.message}
            />
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="campaign-start_date"
            label="Start date"
            type="date"
            error={errors.start_date?.message}
            {...register('start_date')}
          />
          <Input
            id="campaign-end_date"
            label="End date"
            type="date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </div>

        <Textarea
          id="campaign-brief"
          label="Brief"
          rows={4}
          placeholder="Campaign goals, talking points, deliverable expectations…"
          error={errors.brief?.message}
          {...register('brief')}
        />

        <Input
          id="campaign-compensation"
          label="Compensation"
          placeholder="e.g. $2,500 + product"
          error={errors.compensation?.message}
          {...register('compensation')}
        />

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate">Payment</p>
            <div className="mt-2 inline-flex rounded border border-slate/30">
              {['unpaid', 'paid'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setValue('payment_status', status)}
                  className={`min-h-11 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition first:rounded-l last:rounded-r md:min-h-0 md:py-2 ${
                    paymentStatus === status
                      ? 'bg-charcoal text-cream'
                      : 'bg-cream text-charcoal hover:bg-charcoal/5'
                  }`}
                >
                  {PAYMENT_STATUSES_BY_VALUE[status]?.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 pt-5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate/30 text-coral focus:ring-coral"
              {...register('disclosure_required')}
            />
            <span className="text-sm text-charcoal">Disclosure required (#ad / #sponsored)</span>
          </label>
        </div>

        <div className={modalFooterClass}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create campaign'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
