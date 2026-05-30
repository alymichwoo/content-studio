import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/** Call the suggest Edge Function and return hook, caption, and hashtags. */
export function useSuggest() {
  const mutation = useMutation({
    mutationFn: async ({ pillar, platform, context }) => {
      const { data, error } = await supabase.functions.invoke('suggest', {
        body: { pillar, platform, context },
      })

      if (error) {
        throw new Error(data?.error ?? error.message ?? 'Failed to generate suggestion')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      return data
    },
  })

  return {
    suggest: mutation.mutateAsync,
    suggestion: mutation.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}
