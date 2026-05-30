/* eslint-disable react-refresh/only-export-components -- provider + hook live together */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setLoading(false)

      if (event === 'TOKEN_REFRESHED' && nextSession) {
        queryClient.invalidateQueries()
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  const value = useMemo(() => {
    const user = session?.user ?? null
    return {
      session,
      user,
      displayName: user?.user_metadata?.display_name ?? null,
      handle: user?.user_metadata?.handle ?? null,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error }
      },
      async signUp(email, password, { display_name, handle }) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name, handle },
          },
        })
        return { error }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        return { error }
      },
      async updateEmail(email) {
        const { error } = await supabase.auth.updateUser({ email })
        return { error }
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password })
        return { error }
      },
    }
  }, [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
