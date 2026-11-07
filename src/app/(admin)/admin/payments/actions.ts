'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function togglePaymentAction(formData: FormData) {
  const studentId = formData.get('studentId') as string
  const termId    = formData.get('termId') as string
  const paid      = formData.get('paid') === 'true'

  const supabase = await createClient()

  await supabase
    .from('term_payments')
    .upsert(
      {
        student_id: studentId,
        term_id:    termId,
        paid:       !paid,
        paid_at:    !paid ? new Date().toISOString() : null,
      },
      { onConflict: 'student_id,term_id' }
    )

  revalidatePath('/admin/payments')
}
