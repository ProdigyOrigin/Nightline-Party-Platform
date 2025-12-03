import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'
import { type Database } from '@/database.types';

// Create a normal SSR anon client tied to cookies (for typical RLS-aware queries)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored in server components
          }
        },
      },
    }
  )
}

// Add a dedicated service-role client for privileged operations (no cookies, no user session merged)
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Do nothing: we do not attach any session to service client
        },
      },
    }
  )
}
