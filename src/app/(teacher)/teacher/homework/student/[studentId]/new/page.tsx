import { createClient, requireRole } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewHomeworkForm from './NewHomeworkForm'

export default async function NewHomeworkPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const supabase = await createClient()
  const user = await requireRole('teacher')

  const [{ data: student }, { data: progress }] = await Promise.all([
    supabase
      .from('students')
      .select('id, student_type')
      .eq('id', studentId)
      .eq('teacher_id', user.id)
      .single(),
    supabase
      .from('iqra_progress')
      .select('current_book')
      .eq('student_id', studentId)
      .maybeSingle(),
  ])

  if (!student) redirect('/teacher/homework')

  const currentBook = student.student_type === 'iqra' && progress?.current_book ? progress.current_book : 1

  return (
    <NewHomeworkForm
      studentId={studentId}
      studentType={student.student_type as 'iqra' | 'quran'}
      currentBook={currentBook}
    />
  )
}
