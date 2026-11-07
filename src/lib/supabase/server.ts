import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Profile, UserRole } from '@/lib/types/app.types'

// Use in Server Components, Server Actions, and Route Handlers.
// Memoised per request so layouts and pages share one client.
export const createClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(
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
            // Called from a Server Component — proxy handles session refresh
          }
        },
      },
    }
  )
})

/**
 * Current signed-in user, or null.
 * getClaims() verifies the JWT locally against the project's public signing
 * key (ES256), so unlike getUser() it doesn't make a round trip to Supabase
 * Auth. Memoised per request: layout + page share one check.
 */
export const getUser = cache(async (): Promise<{ id: string; email?: string } | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null
  return { id: claims.sub, email: claims.email as string | undefined }
})

/** Current user's profile row, or null. Memoised per request. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return (data as Profile | null) ?? null
})

export function dashboardFor(role: UserRole): string {
  if (role === 'admin')   return '/admin/dashboard'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/student/dashboard'
}

/**
 * Auth + role guard for pages and server actions in a role's route group.
 * Layouts don't re-render on client navigation, so every page/action must
 * check for itself. Shares the memoised profile with the layout, so on a
 * full page load this costs nothing extra.
 */
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== role) redirect(dashboardFor(profile.role))
  return profile
}
