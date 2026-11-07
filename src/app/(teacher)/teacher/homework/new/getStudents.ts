'use server'

import { createClient, getProfile } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface StudentOption {
  id: string
  full_name: string
  student_type: 'iqra' | 'quran'
}

export async function getMyStudents(): Promise<StudentOption[]> {
  const supabase = await createClient()
  const user = await getProfile()
  if (user?.role !== 'teacher') return []

  const { data: studentRows } = await supabase
    .from('students')
    .select('id, student_type, profile_id')
    .eq('teacher_id', user.id)
    .eq('is_active', true)
    .order('enrollment_date')

  if (!studentRows || studentRows.length === 0) return []

  const admin = createAdminClient()
  const profileIds = studentRows.map(s => s.profile_id)
  const { data: profileRows } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', profileIds)

  const profileMap = new Map((profileRows ?? []).map(p => [p.id, p.full_name]))

  return studentRows.map(s => ({
    id:           s.id,
    full_name:    profileMap.get(s.profile_id) ?? '—',
    student_type: s.student_type,
  }))
}
