import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO, startOfDay } from 'date-fns'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft, Plus, Pencil } from 'lucide-react'
import HomeworkFeedbackForm from './HomeworkFeedbackForm'
import DeleteHomeworkButton from './DeleteHomeworkButton'
import WhatsAppButton from '@/components/shared/WhatsAppButton'
import HomeworkWhatsAppButton from '@/components/shared/HomeworkWhatsAppButton'

export default async function StudentHomeworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ term?: string }>
}) {
  const { studentId } = await params
  const { term: termParam } = await searchParams
  const supabase = await createClient()
  const user = await requireRole('teacher')

  // One round trip: ownership check, name, terms and assignments in parallel.
  // Assignments are RLS-scoped to this teacher, so fetching them before the
  // ownership check resolves leaks nothing.
  const admin = createAdminClient()
  const [{ data: student }, { data: nameRow }, { data: allTerms }, { data: assignments }] = await Promise.all([
    supabase
      .from('students')
      .select('id, student_type, profile_id, parent_phone')
      .eq('id', studentId)
      .eq('teacher_id', user.id)
      .single(),
    admin
      .from('students')
      .select('profiles:profile_id(full_name)')
      .eq('id', studentId)
      .single(),
    supabase
      .from('terms')
      .select('id, name, is_active')
      .order('start_date', { ascending: false }),
    supabase
      .from('homework_assignments')
      .select('id, is_completed, completed_at, assigned_at, behavior_satisfactory, teacher_feedback, homework:homework_id(id, title, due_date, book_reference, surah_number, term_id)')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false }),
  ])

  if (!student) redirect('/teacher/homework')

  const studentName = (nameRow?.profiles as any)?.full_name ?? '—'

  const activeTerm   = allTerms?.find(t => t.is_active)
  const selectedTerm = termParam
    ? allTerms?.find(t => t.id === termParam) ?? activeTerm
    : activeTerm

  // Filter to selected term
  const termAssignments = selectedTerm
    ? (assignments ?? []).filter(a => (a.homework as any)?.term_id === selectedTerm.id)
    : (assignments ?? [])

  const today = startOfDay(new Date())
  // pending = no feedback given yet (behavior_satisfactory still null)
  // notCompleted = teacher assessed but student didn't pass
  // completed = student passed
  const pending      = termAssignments.filter(a => !a.is_completed && a.behavior_satisfactory === null)
  const notCompleted = termAssignments.filter(a => !a.is_completed && a.behavior_satisfactory !== null)
  const completed    = termAssignments.filter(a => a.is_completed)

  const assessed     = completed.length + notCompleted.length
  const passRate     = assessed > 0 ? Math.round((completed.length / assessed) * 100) : null

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <Link
          href="/teacher/homework"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          All students
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{studentName}</h1>
            <p className="text-sm text-slate-400 capitalize mt-0.5">{student.student_type} student</p>
          </div>
          <Link
            href={`/teacher/homework/student/${studentId}/new`}
            className={buttonVariants({ size: 'sm', className: 'bg-teal-600 hover:bg-teal-700' })}
          >
            <Plus size={14} className="mr-1.5" />
            Assign homework
          </Link>
        </div>
        {/* Term tabs */}
        {allTerms && allTerms.length > 1 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {allTerms.map(t => (
              <Link
                key={t.id}
                href={`/teacher/homework/student/${studentId}?term=${t.id}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  t.id === selectedTerm?.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {t.name}
                {t.is_active && t.id !== selectedTerm?.id && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 inline-block align-middle" />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* WhatsApp parent contact */}
        <div className="mt-4">
          <WhatsAppButton
            parentPhone={(student as any).parent_phone ?? null}
            studentName={studentName}
          />
        </div>
      </div>

      {/* Stats card */}
      {termAssignments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Term summary</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-slate-800">{termAssignments.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total</p>
            </div>
            <div>
              <p className="text-xl font-bold text-teal-600">{completed.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Passed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">{notCompleted.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Not passed</p>
            </div>
            <div>
              {passRate !== null ? (
                <>
                  <p className={`text-xl font-bold ${passRate >= 80 ? 'text-teal-600' : passRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {passRate}%
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Pass rate</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-slate-300">—</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pass rate</p>
                </>
              )}
            </div>
          </div>
          {pending.length > 0 && (
            <p className="text-xs text-amber-600 mt-3 pt-3 border-t border-slate-100">
              {pending.length} homework{pending.length !== 1 ? 's' : ''} awaiting assessment
            </p>
          )}
        </div>
      )}

      {/* Pending */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">No pending homework — all caught up!</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {pending.map(a => {
              const hw = a.homework as any
              const isOverdue = hw.due_date
                ? startOfDay(parseISO(hw.due_date)) < today
                : false
              const upcomingHomework = pending
                .filter(p => p.id !== a.id && (p.homework as any).due_date && startOfDay(parseISO((p.homework as any).due_date)) > today)
                .map(p => (p.homework as any).title)
              return (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{hw.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {hw.due_date && (
                          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            {isOverdue ? 'Overdue · ' : 'Due '}
                            {format(parseISO(hw.due_date), 'd MMM yyyy')}
                          </span>
                        )}
                        {hw.book_reference && (
                          <span className="text-xs text-slate-300">· {hw.book_reference}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <HomeworkWhatsAppButton
                        parentPhone={(student as any).parent_phone ?? null}
                        studentName={studentName}
                        homeworkTitle={hw.title}
                        isCompleted={a.is_completed}
                        behaviorSatisfactory={a.behavior_satisfactory ?? null}
                        teacherFeedback={a.teacher_feedback ?? null}
                        upcomingHomework={upcomingHomework}
                      />
                      <Link
                        href={`/teacher/homework/student/${studentId}/${a.id}/edit`}
                        title="Edit homework"
                        className="p-1.5 text-slate-300 hover:text-teal-500 transition-colors rounded"
                      >
                        <Pencil size={14} />
                      </Link>
                      <DeleteHomeworkButton assignmentId={a.id} studentId={studentId} />
                    </div>
                  </div>
                  {/* Feedback form */}
                  <div className="mt-3">
                    <HomeworkFeedbackForm
                      assignmentId={a.id}
                      studentId={studentId}
                      isCompleted={false}
                      existingFeedback={{
                        behavior_satisfactory: a.behavior_satisfactory ?? null,
                        teacher_feedback: a.teacher_feedback ?? null,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Not Completed */}
      {notCompleted.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Not Completed ({notCompleted.length})
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {notCompleted.map(a => {
              const hw = a.homework as any
              const upcomingHomework = pending
                .filter(p => (p.homework as any).due_date && startOfDay(parseISO((p.homework as any).due_date)) > today)
                .map(p => (p.homework as any).title)
              return (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-700 truncate">{hw.title}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {hw.book_reference && (
                          <p className="text-xs text-slate-400">{hw.book_reference}</p>
                        )}
                        <span className="text-xs text-red-400 font-medium">Not passed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <HomeworkWhatsAppButton
                        parentPhone={(student as any).parent_phone ?? null}
                        studentName={studentName}
                        homeworkTitle={hw.title}
                        isCompleted={a.is_completed}
                        behaviorSatisfactory={a.behavior_satisfactory ?? null}
                        teacherFeedback={a.teacher_feedback ?? null}
                        upcomingHomework={upcomingHomework}
                      />
                      <Link
                        href={`/teacher/homework/student/${studentId}/${a.id}/edit`}
                        title="Edit homework"
                        className="p-1.5 text-slate-300 hover:text-teal-500 transition-colors rounded"
                      >
                        <Pencil size={14} />
                      </Link>
                      <DeleteHomeworkButton assignmentId={a.id} studentId={studentId} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <HomeworkFeedbackForm
                      assignmentId={a.id}
                      studentId={studentId}
                      isCompleted={false}
                      existingFeedback={{
                        behavior_satisfactory: a.behavior_satisfactory ?? null,
                        teacher_feedback: a.teacher_feedback ?? null,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Completed ({completed.length})
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {completed.map(a => {
              const hw = a.homework as any
              const upcomingHomework = pending
                .filter(p => (p.homework as any).due_date && startOfDay(parseISO((p.homework as any).due_date)) > today)
                .map(p => (p.homework as any).title)
              return (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-400 line-through truncate">{hw.title}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {hw.book_reference && (
                          <p className="text-xs text-slate-300">{hw.book_reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <HomeworkWhatsAppButton
                        parentPhone={(student as any).parent_phone ?? null}
                        studentName={studentName}
                        homeworkTitle={hw.title}
                        isCompleted={a.is_completed}
                        behaviorSatisfactory={a.behavior_satisfactory ?? null}
                        teacherFeedback={a.teacher_feedback ?? null}
                        upcomingHomework={upcomingHomework}
                      />
                      <Link
                        href={`/teacher/homework/student/${studentId}/${a.id}/edit`}
                        title="Edit homework"
                        className="p-1.5 text-slate-300 hover:text-teal-500 transition-colors rounded"
                      >
                        <Pencil size={14} />
                      </Link>
                      <DeleteHomeworkButton assignmentId={a.id} studentId={studentId} />
                    </div>
                  </div>
                  {/* Feedback form — shows as "Completed" chip with expand */}
                  <div className="mt-2">
                    <HomeworkFeedbackForm
                      assignmentId={a.id}
                      studentId={studentId}
                      isCompleted={true}
                      existingFeedback={{
                        behavior_satisfactory: a.behavior_satisfactory ?? null,
                        teacher_feedback: a.teacher_feedback ?? null,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {termAssignments.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">
          No homework assigned for {selectedTerm?.name ?? 'this term'} yet.
        </p>
      )}
    </div>
  )
}
