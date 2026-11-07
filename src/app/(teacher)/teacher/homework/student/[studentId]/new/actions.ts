'use server'

import { createClient, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createHomeworkAction(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'teacher') return { error: 'Not authorised.' }

  const studentId     = formData.get('student_id') as string
  const title         = (formData.get('title') as string).trim()
  const instructions  = (formData.get('instructions') as string | null)?.trim() || null
  const due_date      = (formData.get('due_date') as string | null) || null
  const book_reference = (formData.get('book_reference') as string | null)?.trim() || null
  const surah_number  = formData.get('surah_number') ? parseInt(formData.get('surah_number') as string) : null

  if (!title) return { error: 'Title is required.' }

  // Verify student belongs to this teacher
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('teacher_id', user.id)
    .single()

  if (!student) return { error: 'Student not found.' }

  // Get active term
  const { data: activeTerm } = await supabase
    .from('terms')
    .select('id')
    .eq('is_active', true)
    .single()

  const { data: hw, error: hwError } = await supabase
    .from('homework')
    .insert({ teacher_id: user.id, title, instructions, due_date, book_reference, surah_number, term_id: activeTerm?.id ?? null })
    .select('id')
    .single()

  if (hwError || !hw) return { error: 'Failed to create homework. Please try again.' }

  await supabase
    .from('homework_assignments')
    .insert({ homework_id: hw.id, student_id: studentId })

  redirect(`/teacher/homework/student/${studentId}`)
}
