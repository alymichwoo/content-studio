import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { POSTS_QUERY_KEY } from './usePosts'

export const DELIVERABLES_QUERY_KEY = ['deliverables']

function invalidateDeliverables(queryClient) {
  return queryClient.invalidateQueries({ queryKey: DELIVERABLES_QUERY_KEY })
}

export function useDeliverables(campaignId) {
  return useQuery({
    queryKey: [...DELIVERABLES_QUERY_KEY, campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliverables')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data
    },
  })
}

/** All deliverables joined to campaign + brand for dashboard alerts and labels. */
export function useAllDeliverables() {
  return useQuery({
    queryKey: [...DELIVERABLES_QUERY_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliverables')
        .select(
          `
          *,
          campaigns (
            id,
            title,
            disclosure_required,
            brands (
              id,
              name
            )
          )
        `,
        )
        .order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data
    },
  })
}

/** All deliverables with brand + campaign context for the post form selector. */
export function useDeliverableOptions() {
  return useQuery({
    queryKey: [...DELIVERABLES_QUERY_KEY, 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliverables')
        .select(
          `
          *,
          campaigns (
            id,
            title,
            disclosure_required,
            brands (
              id,
              name
            )
          )
        `,
        )
        .order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data
    },
  })
}

/** Linked posts for progress tracking on a campaign's deliverables. */
export function usePostsForDeliverables(deliverableIds) {
  const ids = deliverableIds ?? []

  return useQuery({
    queryKey: [...POSTS_QUERY_KEY, 'by-deliverable', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, deliverable_id, status')
        .in('deliverable_id', ids)
        .eq('archived', false)
      if (error) throw error
      return data
    },
  })
}

export function useCreateDeliverable() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (deliverable) => {
      const { data, error } = await supabase
        .from('deliverables')
        .insert({ ...deliverable, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateDeliverables(queryClient),
  })
}

export function useUpdateDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('deliverables')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateDeliverables(queryClient),
  })
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('deliverables').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateDeliverables(queryClient),
  })
}
