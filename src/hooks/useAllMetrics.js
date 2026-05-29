import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const ALL_METRICS_QUERY_KEY = ['metrics', 'all']

/**
 * All metric rows for the current user, optionally filtered by recorded_at range.
 * Dates are inclusive yyyy-MM-dd strings (start/end of day applied at query time).
 */
const STALE_TIME_MS = 60_000

export function useAllMetrics({ startDate, endDate } = {}) {
  return useQuery({
    queryKey: [...ALL_METRICS_QUERY_KEY, { startDate, endDate }],
    staleTime: STALE_TIME_MS,
    queryFn: async () => {
      let query = supabase
        .from('metrics')
        .select('*')
        .order('recorded_at', { ascending: true })

      if (startDate) {
        query = query.gte('recorded_at', `${startDate}T00:00:00`)
      }
      if (endDate) {
        query = query.lte('recorded_at', `${endDate}T23:59:59.999`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
