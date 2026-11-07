'use server'

import { createClient, getProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AttendanceRecord {
  studentId: string
  status: 'present' | 'late' | 'absent'
  notes?: string
}

export async function saveAttendanceAction(
  sessionId: string,
  records: AttendanceRecord[]
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const user = await getProfile()
  if (user?.role !== 'teacher') return { error: 'Not authorised.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'teacher'].includes(profile.role)) {
    return { error: 'Forbidden.' }
  }

  if (records.length === 0) return { error: 'No records to save.' }

  const { error } = await supabase
    .from('attendance_records')
    .upsert(
      records.map(r => ({
        session_id:  sessionId,
        student_id:  r.studentId,
        status:      r.status,
        notes:       r.notes?.trim() || null,
        recorded_at: new Date().toISOString(),
      })),
      { onConflict: 'session_id,student_id' }
    )

  if (error) return { error: error.message }

  revalidatePath('/teacher/attendance')
  revalidatePath(`/teacher/attendance/${sessionId}`)
  return { success: true }
}
