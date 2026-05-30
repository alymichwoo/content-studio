import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const EVENTS_QUERY_KEY = ['events']

function invalidateEvents(queryClient) {
  return queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY })
}

/** List current user's schedule items, optionally overlapping a date range. */
export function useEvents({ startDate, endDate, enabled = true } = {}) {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, { startDate, endDate }],
    enabled,
    queryFn: async () => {
      let query = supabase.from('schedule_items').select('*').order('start_date', { ascending: true })

      if (startDate) {
        query = query.gte('end_date', startDate)
      }
      if (endDate) {
        query = query.lte('start_date', endDate)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (event) => {
      const { data, error } = await supabase
        .from('schedule_items')
        .insert({ ...event, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateEvents(queryClient),
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('schedule_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateEvents(queryClient),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('schedule_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateEvents(queryClient),
  })
}
