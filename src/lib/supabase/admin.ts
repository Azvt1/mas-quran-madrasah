import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client — uses the service role key, bypasses Row Level Security.
 * SERVER-ONLY. Never import this in client components.
 * Singleton: one instance per server process to avoid reconnection overhead.
 */
let _adminClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _adminClient
}
