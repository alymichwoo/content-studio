import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const METRICS_QUERY_KEY = ['metrics']

export function metricsQueryKey(postId) {
  return [...METRICS_QUERY_KEY, postId]
}

function invalidateMetrics(queryClient, postId) {
  return queryClient.invalidateQueries({ queryKey: metricsQueryKey(postId) })
}

/** All metric rows for a post, newest recorded_at first. */
export function useMetrics(postId) {
  return useQuery({
    queryKey: metricsQueryKey(postId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('post_id', postId)
        .order('recorded_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: Boolean(postId),
  })
}

export function useCreateMetric() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ post_id, ...metric }) => {
      const { data, error } = await supabase
        .from('metrics')
        .insert({ ...metric, user_id: user.id, post_id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => invalidateMetrics(queryClient, variables.post_id),
  })
}

export function useUpdateMetric() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, post_id, ...updates }) => {
      const { data, error } = await supabase
        .from('metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { ...data, post_id }
    },
    onSuccess: (data) => invalidateMetrics(queryClient, data.post_id),
  })
}

export function useDeleteMetric() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, post_id }) => {
      const { error } = await supabase.from('metrics').delete().eq('id', id)
      if (error) throw error
      return { post_id }
    },
    onSuccess: (data) => invalidateMetrics(queryClient, data.post_id),
  })
}
