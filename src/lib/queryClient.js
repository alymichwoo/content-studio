import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { isAuthError, redirectToLogin, refreshSessionOnce } from './supabase'

const RETRY_DELAY_MS = 500
const recoveringQueries = new Set()

async function recoverSessionAndRetryQuery(query) {
  if (recoveringQueries.has(query.queryHash)) return

  recoveringQueries.add(query.queryHash)
  try {
    const { data, error: refreshError } = await refreshSessionOnce()

    if (refreshError || !data?.session) {
      redirectToLogin()
      return
    }

    await query.fetch()

    if (query.state.error && isAuthError(query.state.error)) {
      redirectToLogin()
    }
  } finally {
    recoveringQueries.delete(query.queryHash)
  }
}

async function recoverSessionOnMutationError(error) {
  if (!isAuthError(error)) return

  const { data, error: refreshError } = await refreshSessionOnce()

  if (refreshError || !data?.session) {
    redirectToLogin()
  }
}

function shouldRetry(failureCount, error) {
  if (isAuthError(error)) return false
  return failureCount < 1
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isAuthError(error)) {
        void recoverSessionAndRetryQuery(query)
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      void recoverSessionOnMutationError(error)
    },
  }),
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay: RETRY_DELAY_MS,
    },
    mutations: {
      retry: shouldRetry,
      retryDelay: RETRY_DELAY_MS,
    },
  },
})
