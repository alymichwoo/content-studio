import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BRAND_STATUSES } from '../../lib/constants'
import { useCreateBrand, useUpdateBrand } from '../../hooks/useBrands'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import { modalFooterClass } from '../ui/iconButtonStyles'

const brandFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['prospect', 'active', 'past']),
  website: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().optional(),
  notes: z.string().optional(),
})

const emptyDefaults = {
  name: '',
  status: 'prospect',
  website: '',
  contact_name: '',
  contact_email: '',
  notes: '',
}

function toFormValues(brand) {
  if (!brand) return emptyDefaults
  return {
    name: brand.name ?? '',
    status: brand.status ?? 'prospect',
    website: brand.website ?? '',
    contact_name: brand.contact_name ?? '',
    contact_email: brand.contact_email ?? '',
    notes: brand.notes ?? '',
  }
}

function toDbPayload(data) {
  return {
    name: data.name.trim(),
    status: data.status,
    website: data.website?.trim() || null,
    contact_name: data.contact_name?.trim() || null,
    contact_email: data.contact_email?.trim() || null,
    notes: data.notes?.trim() || null,
  }
}

export default function BrandForm({ open, onClose, brand }) {
  const isEdit = Boolean(brand?.id)
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(brandFormSchema),
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (open) {
      reset(toFormValues(brand))
    }
  }, [open, brand, reset])

  async function onSubmit(data) {
    const payload = toDbPayload(data)
    try {
      if (isEdit) {
        await updateBrand.mutateAsync({ id: brand.id, ...payload })
      } else {
        await createBrand.mutateAsync(payload)
      }
      onClose()
    } catch {
      // Errors surface via mutation state if needed later
    }
  }

  const mutationError = createBrand.error ?? updateBrand.error

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit brand' : 'New brand'}
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
          id="brand-name"
          label="Name"
          error={errors.name?.message}
          {...register('name')}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              id="brand-status"
              label="Status"
              value={field.value}
              onChange={field.onChange}
              options={BRAND_STATUSES}
              error={errors.status?.message}
            />
          )}
        />

        <Input
          id="brand-website"
          label="Website"
          placeholder="https://"
          error={errors.website?.message}
          {...register('website')}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="brand-contact_name"
            label="Contact name"
            error={errors.contact_name?.message}
            {...register('contact_name')}
          />
          <Input
            id="brand-contact_email"
            label="Contact email"
            type="email"
            error={errors.contact_email?.message}
            {...register('contact_email')}
          />
        </div>

        <Textarea
          id="brand-notes"
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
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create brand'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
