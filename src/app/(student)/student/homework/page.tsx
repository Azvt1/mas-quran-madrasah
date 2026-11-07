import { createClient, requireRole } from '@/lib/supabase/server'
import { format, parseISO, isPast } from 'date-fns'
import { CheckCircle2, Clock, BookOpen } from 'lucide-react'

export default async function StudentHomeworkPage() {
  const supabase = await createClient()
  const user = await requireRole('student')

  // Student record + assignments together (RLS only returns this student's rows)
  const [{ data: student }, { data: assignments }] = await Promise.all([
    supabase.from('students').select('id').eq('profile_id', user.id).single(),
    supabase
      .from('homework_assignments')
      .select('id, is_completed, completed_at, assigned_at, homework:homework_id(id, title, instructions, due_date, book_reference)')
      .order('assigned_at', { ascending: false }),
  ])

  if (!student) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Homework</h1>
        <p className="text-sm text-slate-500">No student record found. Contact your admin.</p>
      </div>
    )
  }

  const pending   = (assignments ?? []).filter(a => !a.is_completed)
  const completed = (assignments ?? []).filter(a => a.is_completed)

  type Assignment = NonNullable<typeof assignments>[number]
  function HomeworkCard({ a, done }: { a: Assignment; done: boolean }) {
    const hw = (Array.isArray(a.homework) ? a.homework[0] : a.homework) as unknown as { id: string; title: string; instructions: string | null; due_date: string | null; book_reference: string | null }
    const isOverdue = hw.due_date && isPast(parseISO(hw.due_date)) && !done

    return (
      <div className={`px-4 py-4 ${done ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {done
                ? <CheckCircle2 size={15} className="text-teal-500 shrink-0 mt-0.5" />
                : <Clock size={15} className={`shrink-0 mt-0.5 ${isOverdue ? 'text-red-400' : 'text-amber-400'}`} />
              }
              <p className={`text-sm font-medium ${done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                {hw.title}
              </p>
            </div>

            <div className="ml-[23px] space-y-1 mt-1">
              {hw.instructions && (
                <p className="text-xs text-slate-500">{hw.instructions}</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {hw.book_reference && (
                  <p className="text-xs text-slate-400">📖 {hw.book_reference}</p>
                )}
                {hw.due_date && (
                  <p className={`text-xs ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                    {isOverdue ? 'Overdue · ' : 'Due '}
                    {format(parseISO(hw.due_date), 'd MMM yyyy')}
                  </p>
                )}
                {done && a.completed_at && (
                  <p className="text-xs text-teal-500">
                    Completed {format(parseISO(a.completed_at), 'd MMM')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
            done
              ? 'bg-teal-50 text-teal-600'
              : isOverdue
              ? 'bg-red-50 text-red-500'
              : 'bg-amber-50 text-amber-600'
          }`}>
            {done ? 'Done' : isOverdue ? 'Overdue' : 'Pending'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Homework</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {pending.length} pending · {completed.length} completed
        </p>
      </div>

      {assignments?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
            <BookOpen size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No homework yet</p>
          <p className="text-xs text-slate-400 mt-1">Your teacher hasn't assigned anything yet</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Pending</h2>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                {pending.map(a => <HomeworkCard key={a.id} a={a} done={false} />)}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Completed</h2>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                {completed.map(a => <HomeworkCard key={a.id} a={a} done={true} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
