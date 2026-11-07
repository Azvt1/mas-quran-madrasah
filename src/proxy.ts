import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/types/app.types'

function dashboardFor(role: UserRole): string {
  if (role === 'admin')   return '/admin/dashboard'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/student/dashboard'
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Public routes — auth flow pages, the parent acknowledgement page and
  // the privacy policy (linked from the app store listings)
  if (pathname.startsWith('/auth/') || pathname.startsWith('/ack/') || pathname === '/privacy') return supabaseResponse

  // getClaims() verifies the JWT locally (no round trip to Supabase Auth)
  // and refreshes an expired session via the cookie handlers above.
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    if (pathname === '/login') return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Only the entry points need the role. Role-specific route groups are
  // guarded by their layouts, so normal navigation skips this query.
  if (pathname === '/login' || pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const role = profile?.role as UserRole | undefined
    if (!role) return pathname === '/login' ? supabaseResponse : NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.redirect(new URL(dashboardFor(role), request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
