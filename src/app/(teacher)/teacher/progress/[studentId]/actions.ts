'use server'

import { createClient, getProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveProgressAction(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'teacher') return { error: 'Not authorised.' }

  const studentId   = formData.get('student_id') as string
  const studentType = formData.get('student_type') as 'iqra' | 'quran'

  // Verify student belongs to this teacher
  const { data: student } = await supabase
    .from('students').select('id').eq('id', studentId).eq('teacher_id', user.id).single()
  if (!student) return { error: 'Student not found.' }

  if (studentType === 'iqra') {
    const current_book = parseInt(formData.get('current_book') as string)
    const current_page = parseInt(formData.get('current_page') as string)

    if (!current_book || current_book < 1 || current_book > 6)
      return { error: 'Book must be between 1 and 6.' }
    if (!current_page || current_page < 1)
      return { error: 'Page must be a positive number.' }

    const { error } = await supabase
      .from('iqra_progress')
      .upsert({ student_id: studentId, current_book, current_page, updated_by: user.id, updated_at: new Date().toISOString() },
              { onConflict: 'student_id' })
    if (error) return { error: error.message }

    await supabase.from('progress_snapshots').insert({
      student_id:   studentId,
      student_type: 'iqra',
      data:         { book: current_book, page: current_page },
      recorded_by:  user.id,
    })
  } else {
    const current_surah = parseInt(formData.get('current_surah') as string)
    const current_juz   = parseInt(formData.get('current_juz') as string)
    const current_page  = parseInt(formData.get('current_page') as string)

    if (!current_surah || current_surah < 1 || current_surah > 114)
      return { error: 'Surah must be between 1 and 114.' }
    if (!current_juz || current_juz < 1 || current_juz > 30)
      return { error: 'Juz must be between 1 and 30.' }
    if (!current_page || current_page < 1 || current_page > 604)
      return { error: 'Page must be between 1 and 604.' }

    const { error } = await supabase
      .from('quran_progress')
      .upsert({ student_id: studentId, current_surah, current_juz, current_page, updated_by: user.id, updated_at: new Date().toISOString() },
              { onConflict: 'student_id' })
    if (error) return { error: error.message }

    await supabase.from('progress_snapshots').insert({
      student_id:   studentId,
      student_type: 'quran',
      data:         { surah: current_surah, juz: current_juz, page: current_page },
      recorded_by:  user.id,
    })
  }

  revalidatePath(`/teacher/progress/${studentId}`)
  revalidatePath('/teacher/progress')
  return { success: true }
}

export async function requestAdvanceAction(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'teacher') return { error: 'Not authorised.' }

  const studentId   = formData.get('student_id') as string
  const advanceNote = (formData.get('advance_note') as string | null)?.trim() || null

  const { data: student } = await supabase
    .from('students').select('id').eq('id', studentId).eq('teacher_id', user.id).single()
  if (!student) return { error: 'Student not found.' }

  const { error } = await supabase
    .from('students')
    .update({
      ready_to_advance:     true,
      advance_note:         advanceNote,
      advance_requested_at: new Date().toISOString(),
    })
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath(`/teacher/progress/${studentId}`)
  return { success: true }
}

export async function cancelAdvanceAction(formData: FormData) {
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'teacher') return

  const studentId = formData.get('student_id') as string

  const { data: student } = await supabase
    .from('students').select('id').eq('id', studentId).eq('teacher_id', user.id).single()
  if (!student) return

  await supabase
    .from('students')
    .update({ ready_to_advance: false, advance_note: null, advance_requested_at: null })
    .eq('id', studentId)

  revalidatePath(`/teacher/progress/${studentId}`)
}
