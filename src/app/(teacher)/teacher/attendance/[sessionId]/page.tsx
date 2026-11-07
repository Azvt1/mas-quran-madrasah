import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import AttendanceForm from './AttendanceForm'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function AttendanceSessionPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()

  const user = await requireRole('teacher')

  // One round trip: session, this teacher's students (with names via the admin
  // client, since profiles RLS hides them) and existing marks. Attendance rows
  // are RLS-scoped to this teacher's students.
  const adminClient = createAdminClient()
  const [{ data: session }, { data: studentRows }, { data: existing }] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id, session_date, day_of_week, term_id')
      .eq('id', sessionId)
      .single(),
    adminClient
      .from('students')
      .select('id, student_type, profiles:profile_id(full_name)')
      .eq('teacher_id', user.id)
      .eq('is_active', true)
      .order('enrollment_date'),
    supabase
      .from('attendance_records')
      .select('student_id, status, notes')
      .eq('session_id', sessionId),
  ])

  if (!session) notFound()

  const students = (studentRows ?? []).map(s => ({
    id:           s.id,
    student_type: s.student_type,
    full_name:    (s.profiles as any)?.full_name ?? '—',
  }))

  const sessionDate = parseISO(session.session_date)

  return (
    <div className="max-w-2xl space-y-5">
      {/* Back link */}
      <Link
        href="/teacher/attendance"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to attendance
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {format(sessionDate, 'EEEE, d MMMM yyyy')}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5 capitalize">
          {session.day_of_week} class
          {existing && existing.length > 0 && (
            <span className="ml-2 text-teal-600">· Previously marked ({existing.length}/{students.length})</span>
          )}
        </p>
      </div>

      {students.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          You have no students assigned. Ask your admin to enrol students under your name.
        </div>
      ) : (
        <AttendanceForm
          sessionId={sessionId}
          students={students}
          existing={(existing ?? []) as { student_id: string; status: 'present' | 'late' | 'absent'; notes: string | null }[]}
        />
      )}
    </div>
  )
}
