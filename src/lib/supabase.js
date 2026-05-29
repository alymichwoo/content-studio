import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.warn('Missing VITE_SUPABASE_URL — add it to .env.local')
}

if (!supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_ANON_KEY — add it to .env.local')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Deduped refresh so concurrent 401s share one network call. */
let refreshInFlight = null

export function refreshSessionOnce() {
  if (!refreshInFlight) {
    refreshInFlight = supabase.auth.refreshSession().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/** True for expired/invalid JWT and other auth failures from PostgREST or Supabase Auth. */
export function isAuthError(error) {
  if (!error) return false

  const message = String(error.message ?? '').toLowerCase()
  const code = String(error.code ?? '')
  const status = error.status ?? error.statusCode

  return (
    status === 401 ||
    code === 'PGRST301' ||
    code === 'PGRST303' ||
    message.includes('jwt expired') ||
    message.includes('invalid jwt') ||
    message.includes('not authenticated')
  )
}

export function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

/**
 * Run a Supabase call ({ data, error }), refresh the session once on auth failure,
 * retry once, then redirect to login if still unauthorized.
 */
export async function supabaseQuery(executor) {
  let result = await executor()

  if (!result.error) {
    return result.data
  }

  if (!isAuthError(result.error)) {
    throw result.error
  }

  const { data: refreshData, error: refreshError } = await refreshSessionOnce()

  if (refreshError || !refreshData?.session) {
    redirectToLogin()
    throw refreshError ?? result.error
  }

  result = await executor()

  if (result.error) {
    if (isAuthError(result.error)) {
      redirectToLogin()
    }
    throw result.error
  }

  return result.data
}
