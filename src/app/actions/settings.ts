'use server'

import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateEmailAction(newEmail: string): Promise<{ error?: string; success?: boolean }> {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  // Use admin API so the "invalid current email domain" check is bypassed.
  // email_confirm: true sets the new email immediately without a confirmation link.
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true,
  })

  if (error) return { error: error.message }
  return { success: true }
}
