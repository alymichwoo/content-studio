import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { inputClass } from '../components/ui/fieldStyles'

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = signInSchema.extend({
  display_name: z.string().min(1, 'Display name is required'),
  handle: z
    .string()
    .min(1, 'Handle is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
})

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-coral">{message}</p>
}

export default function Login() {
  const { session, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signIn')
  const [authError, setAuthError] = useState(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const isSignUp = mode === 'signUp'
  const schema = isSignUp ? signUpSchema : signInSchema

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      display_name: '',
      handle: '',
    },
  })

  if (!loading && session) {
    return <Navigate to="/calendar" replace />
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setAuthError(null)
    setSignUpSuccess(false)
    reset()
  }

  async function onSubmit(data) {
    setAuthError(null)
    setSignUpSuccess(false)

    if (isSignUp) {
      const { error } = await signUp(data.email, data.password, {
        display_name: data.display_name,
        handle: data.handle,
      })
      if (error) {
        setAuthError(error.message)
        return
      }
      setSignUpSuccess(true)
      return
    }

    const { error } = await signIn(data.email, data.password)
    if (error) {
      setAuthError(error.message)
    }
  }

  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-lg bg-charcoal p-8 shadow-lg">
        <h1 className="text-center text-2xl font-black uppercase tracking-tighter text-cream md:text-3xl">
          {isSignUp ? 'Create account' : 'Sign in'}
        </h1>
        <div className="mx-auto mt-3 h-1 w-12 bg-coral" aria-hidden="true" />
        <p className="mt-3 text-center text-sm text-slate">
          @alymichwoo Content Studio
        </p>

        {authError && (
          <div
            className="mt-6 rounded border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral"
            role="alert"
          >
            {authError}
          </div>
        )}

        {signUpSuccess && (
          <div
            className="mt-6 rounded border border-pillar-feel/40 bg-pillar-feel/10 px-3 py-2 text-sm text-pillar-feel"
            role="status"
          >
            Account created. Check your email to confirm, then sign in.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          {isSignUp && (
            <>
              <div>
                <label htmlFor="display_name" className="block text-xs font-semibold uppercase tracking-wider text-slate">
                  Display name
                </label>
                <input
                  id="display_name"
                  type="text"
                  autoComplete="name"
                  className={`${inputClass} mt-1`}
                  {...register('display_name')}
                />
                <FieldError message={errors.display_name?.message} />
              </div>
              <div>
                <label htmlFor="handle" className="block text-xs font-semibold uppercase tracking-wider text-slate">
                  Handle
                </label>
                <input
                  id="handle"
                  type="text"
                  autoComplete="username"
                  placeholder="alymichwoo"
                  className={`${inputClass} mt-1`}
                  {...register('handle')}
                />
                <FieldError message={errors.handle?.message} />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`${inputClass} mt-1`}
              {...register('email')}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className={`${inputClass} mt-1`}
              {...register('password')}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-coral px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-cream transition hover:bg-coral/90 disabled:opacity-60"
          >
            {isSubmitting ? 'Working…' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => switchMode(isSignUp ? 'signIn' : 'signUp')}
            className="font-semibold text-coral hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
