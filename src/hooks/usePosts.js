import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const POSTS_QUERY_KEY = ['posts']

const STALE_TIME_MS = 60_000

function invalidatePosts(queryClient) {
  return queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY })
}

/** List current user's posts, newest first, with optional filters. */
export function usePosts({ platform, pillar, includeArchived = false } = {}) {
  return useQuery({
    queryKey: [...POSTS_QUERY_KEY, { platform, pillar, includeArchived }],
    staleTime: STALE_TIME_MS,
    queryFn: async () => {
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false })

      if (!includeArchived) {
        query = query.eq('archived', false)
      }
      if (platform) {
        query = query.contains('platforms', [platform])
      }
      if (pillar) {
        query = query.eq('pillar', pillar)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (post) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({ ...post, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidatePosts(queryClient),
  })
}

/** Map generated suggestions to posts and insert in one request. */
export function useBulkCreatePosts() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (suggestions) => {
      const rows = suggestions.map((suggestion) => ({
        user_id: user.id,
        title: suggestion.title,
        hook: suggestion.hook,
        caption: suggestion.caption,
        notes: suggestion.notes,
        pillar: suggestion.pillar,
        platforms: suggestion.platforms,
        post_type: suggestion.post_type,
        scheduled_date: suggestion.scheduled_date,
        status: 'idea',
        series: null,
        deliverable_id: null,
        archived: false,
      }))

      const { data, error } = await supabase.from('posts').insert(rows).select()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidatePosts(queryClient),
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: POSTS_QUERY_KEY })
      const snapshots = queryClient.getQueriesData({ queryKey: POSTS_QUERY_KEY })
      queryClient.setQueriesData({ queryKey: POSTS_QUERY_KEY }, (old) => {
        if (!Array.isArray(old)) return old
        return old.map((post) => (post.id === id ? { ...post, ...updates } : post))
      })
      return { snapshots }
    },
    onError: (_err, _vars, context) => {
      context?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => invalidatePosts(queryClient),
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidatePosts(queryClient),
  })
}

export function useArchivePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ archived: true })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidatePosts(queryClient),
  })
}

/** Copy a post as a new draft for cross-posting. */
export function useDuplicatePost() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (post) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: post.title ? `${post.title} (copy)` : 'Untitled (copy)',
          caption: post.caption,
          hook: post.hook,
          notes: post.notes,
          platforms: post.platforms ?? [],
          pillar: post.pillar,
          post_type: post.post_type,
          series: post.series,
          status: 'drafting',
          archived: false,
          scheduled_date: null,
          posted_date: null,
          deliverable_id: null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidatePosts(queryClient),
  })
}
