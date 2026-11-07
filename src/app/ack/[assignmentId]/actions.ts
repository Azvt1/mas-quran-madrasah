'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function recordAcknowledgementAction(
  assignmentId: string,
  acknowledged: boolean
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  // Verify assignment exists before updating
  const { data } = await admin
    .from('homework_assignments')
    .select('id')
    .eq('id', assignmentId)
    .single()

  if (!data) return { success: false, error: 'Homework not found.' }

  const { error } = await admin
    .from('homework_assignments')
    .update({ parent_acknowledged: acknowledged })
    .eq('id', assignmentId)

  if (error) return { success: false, error: 'Could not save response.' }

  revalidatePath(`/ack/${assignmentId}`)
  return { success: true }
}
