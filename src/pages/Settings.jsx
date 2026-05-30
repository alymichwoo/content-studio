import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

function FormAlert({ variant, children }) {
  if (!children) return null
  const isSuccess = variant === 'success'
  return (
    <div
      className={
        isSuccess
          ? 'rounded border border-pillar-feel/40 bg-pillar-feel/10 px-3 py-2 text-sm text-pillar-feel'
          : 'rounded border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral'
      }
      role={isSuccess ? 'status' : 'alert'}
    >
      {children}
    </div>
  )
}

function SettingsSection({ title, description, children }) {
  return (
    <section className="rounded-lg border border-slate/20 bg-white p-5 md:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal">{title}</h2>
      {description ? <p className="mt-2 text-sm text-slate">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function Settings() {
  const { user, updateEmail, updatePassword } = useAuth()

  const [emailSuccess, setEmailSuccess] = useState(null)
  const [emailError, setEmailError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onEmailSubmit({ email }) {
    setEmailSuccess(null)
    setEmailError(null)

    const { error } = await updateEmail(email)
    if (error) {
      setEmailError(error.message)
      return
    }

    setEmailSuccess(
      'Update requested. If email confirmation is enabled in your project, check the new address for a confirmation link.',
    )
    emailForm.reset()
  }

  async function onPasswordSubmit({ password }) {
    setPasswordSuccess(null)
    setPasswordError(null)

    const { error } = await updatePassword(password)
    if (error) {
      setPasswordError(error.message)
      return
    }

    setPasswordSuccess('Password updated. It takes effect immediately.')
    passwordForm.reset()
  }

  return (
    <AppShell title="Account settings">
      <div className="mx-auto max-w-lg space-y-6">
        {user?.email && (
          <p className="text-sm text-slate">
            Signed in as <span className="font-semibold text-charcoal">{user.email}</span>
          </p>
        )}

        <SettingsSection
          title="Change email"
          description="Use a real address you can access. Your sign-in email updates after you confirm the new one (when confirmation is enabled)."
        >
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4" noValidate>
            <FormAlert variant="error">{emailError}</FormAlert>
            <FormAlert variant="success">{emailSuccess}</FormAlert>

            <Input
              id="new-email"
              label="New email"
              type="email"
              autoComplete="email"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register('email')}
            />

            <Button type="submit" size="sm" disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting ? 'Saving…' : 'Update email'}
            </Button>
          </form>
        </SettingsSection>

        <SettingsSection
          title="Change password"
          description="Choose a new password (at least 8 characters). This applies immediately — no confirmation email."
        >
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormAlert variant="error">{passwordError}</FormAlert>
            <FormAlert variant="success">{passwordSuccess}</FormAlert>

            <Input
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.password?.message}
              {...passwordForm.register('password')}
            />

            <Input
              id="confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />

            <Button type="submit" size="sm" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </SettingsSection>
      </div>
    </AppShell>
  )
}
