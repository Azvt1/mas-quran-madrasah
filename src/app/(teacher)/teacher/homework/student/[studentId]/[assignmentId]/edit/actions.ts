'use server'

import { getProfile } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateHomeworkAction(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const user = await getProfile()
  if (user?.role !== 'teacher') return { error: 'Not authorised.' }

  const assignmentId  = formData.get('assignment_id') as string
  const studentId     = formData.get('student_id') as string
  const homeworkId    = formData.get('homework_id') as string
  const title         = (formData.get('title') as string).trim()
  const instructions  = (formData.get('instructions') as string | null)?.trim() || null
  const due_date      = (formData.get('due_date') as string | null) || null
  const book_reference = (formData.get('book_reference') as string | null)?.trim() || null
  const surah_number  = formData.get('surah_number') ? parseInt(formData.get('surah_number') as string) : null

  if (!title) return { error: 'Title is required.' }

  const admin = createAdminClient()

  // Verify teacher owns this homework
  const { data: hw } = await admin
    .from('homework')
    .select('teacher_id')
    .eq('id', homeworkId)
    .single()

  if (!hw || hw.teacher_id !== user.id) return { error: 'Not authorized.' }

  const { error: updateError } = await admin
    .from('homework')
    .update({ title, instructions, due_date, book_reference, surah_number })
    .eq('id', homeworkId)

  if (updateError) return { error: 'Failed to update homework. Please try again.' }

  revalidatePath(`/teacher/homework/student/${studentId}`)
  redirect(`/teacher/homework/student/${studentId}`)
}
