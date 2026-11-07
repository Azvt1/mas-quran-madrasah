import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import EditHomeworkForm from './EditHomeworkForm'

// Parse "Surah Al-Fatihah, Ayah 1–7" → { ayahFrom: '1', ayahTo: '7' }
function parseAyahsFromTitle(title: string): { ayahFrom: string; ayahTo: string } {
  const match = title.match(/Ayah (\d+)(?:[–-](\d+))?/)
  if (!match) return { ayahFrom: '', ayahTo: '' }
  return { ayahFrom: match[1] ?? '', ayahTo: match[2] ?? '' }
}

// Parse "Page 5" → '5'
function parsePageFromRef(ref: string | null): string {
  if (!ref) return ''
  const match = ref.match(/Page (\d+)/)
  return match ? match[1] : ''
}

export default async function EditHomeworkPage({
  params,
}: {
  params: Promise<{ studentId: string; assignmentId: string }>
}) {
  const { studentId, assignmentId } = await params
  const supabase = await createClient()
  const user = await requireRole('teacher')

  // Ownership check + assignment in parallel (the assignment is only used if
  // both the student and the homework belong to this teacher)
  const admin = createAdminClient()
  const [{ data: student }, { data: assignment }] = await Promise.all([
    supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('teacher_id', user.id)
      .single(),
    admin
      .from('homework_assignments')
      .select('id, homework:homework_id(id, title, due_date, book_reference, surah_number, instructions, teacher_id)')
      .eq('id', assignmentId)
      .single(),
  ])

  if (!student) redirect('/teacher/homework')

  const hw = assignment?.homework as any
  if (!assignment || !hw || hw.teacher_id !== user.id) redirect(`/teacher/homework/student/${studentId}`)

  const { ayahFrom, ayahTo } = parseAyahsFromTitle(hw.title ?? '')
  const page = parsePageFromRef(hw.book_reference)

  return (
    <EditHomeworkForm
      assignmentId={assignmentId}
      studentId={studentId}
      homeworkId={hw.id}
      initialSurahNum={hw.surah_number ?? null}
      initialAyahFrom={ayahFrom}
      initialAyahTo={ayahTo}
      initialPage={page}
      initialDueDate={hw.due_date ?? ''}
      initialInstructions={hw.instructions ?? ''}
    />
  )
}
