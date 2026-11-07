'use server'

import { createClient, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function reassignStudentAction(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'admin') return { error: 'Not authorised.' }

  const studentId   = formData.get('student_id')   as string
  const teacherId   = formData.get('teacher_id')   as string
  const studentType = formData.get('student_type') as 'iqra' | 'quran'

  if (!teacherId) return { error: 'Please select a teacher.' }

  const { error } = await supabase
    .from('students')
    .update({
      teacher_id:           teacherId,
      student_type:         studentType,
      ready_to_advance:     false,
      advance_note:         null,
      advance_requested_at: null,
    })
    .eq('id', studentId)

  if (error) return { error: error.message }

  redirect('/admin/dashboard')
}
