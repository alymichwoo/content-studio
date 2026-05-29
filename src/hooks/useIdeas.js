import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const IDEAS_QUERY_KEY = ['ideas']

function invalidateIdeas(queryClient) {
  return queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY })
}

/** List current user's ideas with optional filters and sort order. */
export function useIdeas({ status, platform, sortOrder = 'newest' } = {}) {
  return useQuery({
    queryKey: [...IDEAS_QUERY_KEY, { status, platform, sortOrder }],
    queryFn: async () => {
      let query = supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'oldest' })

      if (status) {
        query = query.eq('status', status)
      }
      if (platform) {
        query = query.contains('platforms', [platform])
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateIdea() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (idea) => {
      const { data, error } = await supabase
        .from('ideas')
        .insert({ ...idea, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateIdeas(queryClient),
  })
}

export function useUpdateIdea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateIdeas(queryClient),
  })
}

export function useDeleteIdea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('ideas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateIdeas(queryClient),
  })
}
