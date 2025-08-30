import { User } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'

async function fetchUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) throw error
  return user
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth failures
  })
}
